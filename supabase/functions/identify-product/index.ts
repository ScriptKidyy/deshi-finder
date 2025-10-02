import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { barcode, query } = await req.json();
    
    // Input validation
    if (!barcode && !query) {
      return new Response(
        JSON.stringify({ error: 'Either barcode or query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (barcode && (typeof barcode !== 'string' || barcode.length > 50)) {
      return new Response(
        JSON.stringify({ error: 'Invalid barcode format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (query && (typeof query !== 'string' || query.length > 200)) {
      return new Response(
        JSON.stringify({ error: 'Query too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Identifying product for authenticated user');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let product: any = null;

    // Try OpenFoodFacts API first if we have a barcode
    if (barcode) {
      console.log('Trying OpenFoodFacts API for barcode:', barcode);
      try {
        const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const offData = await offResponse.json();

        if (offData.status === 1 && offData.product) {
          const offProduct = offData.product;
          console.log('Product found in OpenFoodFacts:', offProduct.product_name);

          product = {
            barcode: offData.code,
            name: offProduct.product_name || 'Unknown Product',
            brand: offProduct.brands || 'Unknown Brand',
            category: offProduct.categories?.split(',')[0] || 'Food',
            country_of_origin: offProduct.countries_tags?.[0]?.replace('en:', '') || 'Unknown',
            is_indian: offProduct.countries_tags?.some((tag: string) => tag.includes('india') || tag.includes('in:')) || false,
            description: offProduct.ingredients_text || offProduct.generic_name || 'No description available',
            image_url: offProduct.image_url || `https://example.com/images/${barcode}.jpg`,
            price: 0, // OFF doesn't provide price
            availability: 'unknown',
            where_to_buy: JSON.stringify(['Local Stores', 'Online Retailers']),
            rating: 0
          };
        }
      } catch (offError) {
        console.log('OpenFoodFacts API failed, will try AI:', offError);
      }
    }

    // If OFF didn't work, fall back to AI
    if (!product) {
      console.log('Falling back to AI for product identification');
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a product identification assistant. Given a barcode or product query, identify the product and return structured JSON with these fields:
- name: Product name
- brand: Brand name
- country_of_origin: Country where it's made
- category: Product category (Food, Electronics, Cosmetics, Fashion, Household, etc.)
- price: Estimated price in INR (number)
- description: Brief product description
- image_url: Use placeholder URL "https://example.com/images/[barcode].jpg"
- availability: One of "widely_available", "online_only", "limited_availability", "out_of_stock"
- where_to_buy: Array of store names like ["Amazon.in", "Flipkart", "Local Grocery"]
- rating: Rating from 1-5 (number)

Search the internet for accurate product information.`
          },
          {
            role: 'user',
            content: barcode ? `Identify product with barcode: ${barcode}` : `Identify product: ${query}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "identify_product",
            description: "Return product identification details",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                brand: { type: "string" },
                country_of_origin: { type: "string" },
                category: { type: "string" },
                price: { type: "number" },
                description: { type: "string" },
                image_url: { type: "string" },
                availability: { type: "string", enum: ["widely_available", "online_only", "limited_availability", "out_of_stock"] },
                where_to_buy: { type: "array", items: { type: "string" } },
                rating: { type: "number", minimum: 0, maximum: 5 }
              },
              required: ["name", "brand", "country_of_origin", "category", "price", "description", "availability", "where_to_buy", "rating"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "identify_product" } }
      }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to identify product' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aiData = await aiResponse.json();
      console.log('AI response received');

      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('No tool call in AI response');
      }

      const productData = JSON.parse(toolCall.function.arguments);
      
      // Add barcode and compute is_indian
      product = {
        ...productData,
        barcode: barcode || `UNKNOWN_${Date.now()}`,
        is_indian: productData.country_of_origin.toLowerCase().includes('india'),
        where_to_buy: JSON.stringify(productData.where_to_buy)
      };
    }

    console.log('Saving product to database:', product.name);

    // Save to database
    const { data: savedProduct, error: saveError } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (saveError) {
      console.error('Error saving product:', saveError);
      throw saveError;
    }

    console.log('Product saved successfully');

    return new Response(
      JSON.stringify({ product: savedProduct }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Product identification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to identify product' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});