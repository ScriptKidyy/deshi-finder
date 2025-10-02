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

    const { searchQuery, category, indianOnly } = await req.json();
    
    // Input validation
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid search query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching products for:', searchQuery);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First check database
    let query = supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchQuery}%`);

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    if (indianOnly) {
      query = query.eq('is_indian', true);
    }

    const { data: dbResults, error: dbError } = await query.limit(10);

    if (dbError) {
      console.error('Database search error:', dbError);
    }

    if (dbResults && dbResults.length > 0) {
      console.log(`Found ${dbResults.length} products in database`);
      return new Response(
        JSON.stringify({ products: dbResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try OpenFoodFacts API
    console.log('Trying OpenFoodFacts search API');
    const products: any[] = [];
    
    try {
      const offUrl = new URL('https://world.openfoodfacts.org/cgi/search.pl');
      offUrl.searchParams.set('search_terms', searchQuery);
      offUrl.searchParams.set('search_simple', '1');
      offUrl.searchParams.set('action', 'process');
      offUrl.searchParams.set('json', '1');
      offUrl.searchParams.set('page_size', '10');

      const offResponse = await fetch(offUrl.toString());
      const offData = await offResponse.json();

      if (offData.products && offData.products.length > 0) {
        console.log(`Found ${offData.products.length} products in OpenFoodFacts`);

        for (const offProduct of offData.products.slice(0, 5)) {
          const isIndian = offProduct.countries_tags?.some((tag: string) => 
            tag.includes('india') || tag.includes('in:')
          ) || false;

          if (indianOnly && !isIndian) continue;

          const product = {
            barcode: offProduct.code || `OFF_${Date.now()}_${Math.random()}`,
            name: offProduct.product_name || 'Unknown Product',
            brand: offProduct.brands || 'Unknown Brand',
            category: offProduct.categories?.split(',')[0] || 'Food',
            country_of_origin: offProduct.countries_tags?.[0]?.replace('en:', '') || 'Unknown',
            is_indian: isIndian,
            description: offProduct.ingredients_text || offProduct.generic_name || 'No description available',
            image_url: offProduct.image_url || `https://example.com/images/${offProduct.code}.jpg`,
            price: 0,
            availability: 'unknown',
            where_to_buy: JSON.stringify(['Local Stores', 'Online Retailers']),
            rating: 0
          };

          // Save to database
          const { data: saved } = await supabase
            .from('products')
            .upsert([product], { onConflict: 'barcode' })
            .select()
            .single();

          if (saved) products.push(saved);
        }
      }
    } catch (offError) {
      console.log('OpenFoodFacts search failed:', offError);
    }

    // If we found products from OFF, return them
    if (products.length > 0) {
      return new Response(
        JSON.stringify({ products }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Final fallback to AI
    console.log('Falling back to AI for product search');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ products: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
            content: `You are a product search assistant. Search the internet for products matching the user's query and return up to 5 results as structured JSON.`
          },
          {
            role: 'user',
            content: `Search for products: ${searchQuery}${category && category !== 'all' ? ` in category ${category}` : ''}${indianOnly ? ' (Indian products only)' : ''}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_products",
            description: "Return search results",
            parameters: {
              type: "object",
              properties: {
                products: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      brand: { type: "string" },
                      country_of_origin: { type: "string" },
                      category: { type: "string" },
                      price: { type: "number" },
                      description: { type: "string" },
                      availability: { type: "string" },
                      where_to_buy: { type: "array", items: { type: "string" } },
                      rating: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_products" } }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI search failed');
      return new Response(
        JSON.stringify({ products: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      const searchResults = JSON.parse(toolCall.function.arguments);
      
      for (const productData of searchResults.products || []) {
        const product = {
          ...productData,
          barcode: `AI_${Date.now()}_${Math.random()}`,
          is_indian: productData.country_of_origin.toLowerCase().includes('india'),
          where_to_buy: JSON.stringify(productData.where_to_buy),
          image_url: `https://example.com/images/${productData.name.replace(/\s+/g, '_')}.jpg`
        };

        const { data: saved } = await supabase
          .from('products')
          .insert([product])
          .select()
          .single();

        if (saved) products.push(saved);
      }
    }

    return new Response(
      JSON.stringify({ products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ products: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
