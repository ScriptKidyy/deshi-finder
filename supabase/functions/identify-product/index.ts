import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to check if product is Indian based on tags
function isIndianByTags(countriesTags: string[] = [], countryRaw: string = ''): boolean {
  const tags = (countriesTags || []).map(t => String(t).toLowerCase());
  if (tags.some(t => t.includes('india') || t === 'in' || t === 'en:india')) return true;
  if ((countryRaw || '').toLowerCase().includes('india')) return true;
  return false;
}

// Estimate price using AI
async function estimatePriceWithAI(productName: string, brand: string, category: string, quantity: string): Promise<number> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not available for price estimation');
    return 50;
  }

  const prompt = `Estimate a realistic market price in Indian Rupees (INR) for this product:
Product: ${productName}
Brand: ${brand}
Category: ${category}
Weight/Quantity: ${quantity || 'unknown'}

Return ONLY a number representing the price in INR. No currency symbols, no text, just the number.
Example: 45`;

  try {
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI price estimation failed:', aiResponse.status);
      return 50;
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Extract number from response
    const priceMatch = content.match(/\d+/);
    if (priceMatch) {
      const estimatedPrice = parseInt(priceMatch[0]);
      return estimatedPrice < 5 ? 50 : estimatedPrice;
    }
    return 50;
  } catch (error) {
    console.error('AI price estimation error:', error);
    return 50;
  }
}

// Estimate price based on product details
function estimatePrice(product: any, brand: string, category: string, isIndian: boolean): number {
  // Base price estimation by category
  const categoryLower = (category || '').toLowerCase();
  let basePrice = 50;
  
  if (categoryLower.includes('beverage') || categoryLower.includes('drink') || categoryLower.includes('soda')) {
    basePrice = isIndian ? 30 : 120;
  } else if (categoryLower.includes('snack') || categoryLower.includes('chip') || categoryLower.includes('crisp')) {
    basePrice = isIndian ? 20 : 150;
  } else if (categoryLower.includes('chocolate') || categoryLower.includes('candy') || categoryLower.includes('sweet')) {
    basePrice = isIndian ? 40 : 200;
  } else if (categoryLower.includes('dairy') || categoryLower.includes('milk') || categoryLower.includes('yogurt')) {
    basePrice = isIndian ? 50 : 180;
  } else if (categoryLower.includes('cereal') || categoryLower.includes('breakfast')) {
    basePrice = isIndian ? 80 : 300;
  } else if (categoryLower.includes('sauce') || categoryLower.includes('condiment')) {
    basePrice = isIndian ? 60 : 250;
  }
  
  // Adjust by brand recognition
  const brandLower = (brand || '').toLowerCase();
  const premiumBrands = ['coca-cola', 'pepsi', 'nestle', 'unilever', 'kellogs', 'lays', 'doritos'];
  if (premiumBrands.some(b => brandLower.includes(b))) {
    basePrice *= 1.5;
  }
  
  // Check if product has quantity/weight info
  const productName = (product?.product_name || '').toLowerCase();
  if (productName.match(/\d+\s*(ml|l|g|kg)/)) {
    const quantityMatch = productName.match(/(\d+)\s*(ml|l|g|kg)/);
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1]);
      const unit = quantityMatch[2];
      
      if (unit === 'l' || unit === 'kg') {
        basePrice *= quantity;
      } else if (unit === 'ml' && quantity >= 500) {
        basePrice *= 1.5;
      } else if (unit === 'g' && quantity >= 500) {
        basePrice *= 1.5;
      }
    }
  }
  
  return Math.round(basePrice);
}

// Call Lovable AI as validator for OFF data
async function validateProductWithAI(offData: any): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `You are a strict product data validator. Analyze the OpenFoodFacts product JSON and return ONLY valid JSON with these exact keys:
{
  "barcode": "<string>",
  "name": "<string>",
  "brand": "<string>",
  "categories": "<string>",
  "countries": "<comma separated countries>",
  "is_indian": "true|false|unknown",
  "reason": "<short explanation>",
  "confidence": "low|medium|high",
  "source_urls": ["<url1>", "<url2>"]
}

Rules:
- is_indian should be "true" if product is manufactured in India OR brand is Indian-owned
- is_indian should be "false" if brand is foreign-owned (even if manufactured in India)
- confidence should be "high" only if you're certain based on the data
- Include source_urls if you have references

OpenFoodFacts Data:
${JSON.stringify(offData, null, 2)}`;

  try {
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI validation failed:', aiResponse.status);
      return null;
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response (handle code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI validation error:', error);
    return null;
  }
}

// Call Lovable AI as retriever when OFF fails
async function retrieveProductWithAI(barcode: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `You are a product retriever. Search for product with barcode "${barcode}". Return ONLY valid JSON:
{
  "barcode": "${barcode}",
  "name": "<product name>",
  "brand": "<brand name>",
  "categories": "<categories>",
  "countries": "<countries>",
  "is_indian": "true|false|unknown",
  "confidence": "low|medium|high",
  "source_urls": ["<authoritative url1>", "<url2>"]
}

IMPORTANT: Only return confidence "high" if you found authoritative sources (manufacturer website, major retailer). Include source_urls. If you can't find reliable information, return confidence "low".`;

  try {
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI retrieval failed:', aiResponse.status);
      return null;
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI retrieval error:', error);
    return null;
  }
}

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

    const sanitizedBarcode = barcode?.trim();
    console.log('Identifying product for authenticated user, barcode:', sanitizedBarcode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let product: any = null;
    let validationResult: any = null;
    let source = 'OFF';
    let confidence = 'medium';
    let verified = false;

    // Try OpenFoodFacts API first if we have a barcode
    if (sanitizedBarcode) {
      console.log('Querying OpenFoodFacts API for barcode:', sanitizedBarcode);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        
        const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${sanitizedBarcode}.json`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const offData = await offResponse.json();

        console.log('OpenFoodFacts response status:', offData.status);

        if (offData.status === 1 && offData.product) {
          const offProduct = offData.product;
          console.log('Product found in OpenFoodFacts:', offProduct.product_name);

          // Validate with AI
          console.log('Validating product with AI...');
          validationResult = await validateProductWithAI(offData);
          
          if (validationResult) {
            console.log('AI validation result:', validationResult);
            confidence = validationResult.confidence || 'medium';
            verified = confidence === 'high';
          }

          // Build description with ingredients and nutriments
          let description = offProduct.ingredients_text || offProduct.generic_name || 'No description available';
          
          // Add energy information if available
          if (offProduct.nutriments && offProduct.nutriments['energy-kcal_100g']) {
            description += ` Energy: ${offProduct.nutriments['energy-kcal_100g']} kcal per 100g.`;
          }

          // Determine is_indian from both OFF tags and AI validation
          const offIsIndian = isIndianByTags(offProduct.countries_tags, offProduct.countries);
          const aiIsIndian = validationResult?.is_indian === 'true' || validationResult?.is_indian === true;
          const finalIsIndian = aiIsIndian || offIsIndian;

          let estimatedPrice = estimatePrice(
            offProduct,
            offProduct.brands || 'Unknown Brand',
            offProduct.categories?.split(',')[0]?.trim() || 'Food',
            finalIsIndian
          );

          // If price is still 0 or very low, use AI estimation
          if (estimatedPrice <= 10) {
            console.log('Using AI for better price estimation');
            estimatedPrice = await estimatePriceWithAI(
              offProduct.product_name || 'Unknown Product',
              offProduct.brands || 'Unknown Brand',
              offProduct.categories?.split(',')[0]?.trim() || 'Food',
              offProduct.quantity || ''
            );
          }

          product = {
            barcode: offData.code,
            name: offProduct.product_name || 'Unknown Product',
            brand: offProduct.brands || 'Unknown Brand',
            category: offProduct.categories?.split(',')[0]?.trim() || 'Food',
            country_of_origin: offProduct.countries_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') || 'Unknown',
            is_indian: finalIsIndian,
            description: description,
            image_url: offProduct.image_url || offProduct.image_front_url || `https://example.com/images/${sanitizedBarcode}.jpg`,
            price: estimatedPrice,
            availability: 'unknown',
            where_to_buy: JSON.stringify(['Local Stores', 'Online Retailers']),
            rating: 0,
            source: 'OFF',
            verified: verified,
            confidence: confidence,
            off_raw: offProduct
          };

          console.log('Product mapped from OpenFoodFacts with validation');
        } else {
          console.log('OpenFoodFacts returned status 0 - product not found');
        }
      } catch (offError) {
        console.error('OpenFoodFacts API error:', offError);
      }
    }

    // If OFF didn't work, fall back to AI retrieval
    if (!product && sanitizedBarcode) {
      console.log('Falling back to AI retrieval for barcode:', sanitizedBarcode);
      
      const retrievalResult = await retrieveProductWithAI(sanitizedBarcode);
      
      if (retrievalResult && retrievalResult.confidence !== 'low' && (retrievalResult.source_urls || []).length > 0) {
        console.log('AI retrieval successful:', retrievalResult);
        
        const isIndian = retrievalResult.is_indian === 'true' || retrievalResult.is_indian === true;
        let estimatedPrice = estimatePrice(
          { product_name: retrievalResult.name },
          retrievalResult.brand || 'Unknown Brand',
          retrievalResult.categories || 'Unknown',
          isIndian
        );

        // If price is still 0 or very low, use AI estimation
        if (estimatedPrice <= 10) {
          console.log('Using AI for better price estimation (AI retrieval path)');
          estimatedPrice = await estimatePriceWithAI(
            retrievalResult.name || 'Unknown Product',
            retrievalResult.brand || 'Unknown Brand',
            retrievalResult.categories || 'Unknown',
            ''
          );
        }

        product = {
          barcode: sanitizedBarcode,
          name: retrievalResult.name || 'Unknown Product',
          brand: retrievalResult.brand || 'Unknown Brand',
          category: retrievalResult.categories || 'Unknown',
          country_of_origin: retrievalResult.countries || 'Unknown',
          is_indian: isIndian,
          description: retrievalResult.description || 'No description available',
          image_url: retrievalResult.image_url || `https://example.com/images/${sanitizedBarcode}.jpg`,
          price: estimatedPrice,
          availability: 'unknown',
          where_to_buy: JSON.stringify(['Online Stores']),
          rating: 0,
          source: 'LLM',
          verified: retrievalResult.confidence === 'high',
          confidence: retrievalResult.confidence || 'low',
          off_raw: {}
        };
      } else {
        console.log('AI retrieval returned low confidence or no sources');
      }
    }

    if (!product) {
      console.log('No product found through any method');
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Saving product to database:', product.name, 'confidence:', product.confidence);

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

    console.log('Product saved successfully with source:', savedProduct.source);

    return new Response(
      JSON.stringify({ 
        product: savedProduct,
        validation: validationResult 
      }),
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