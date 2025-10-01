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
    const { productId, productName, productCategory } = await req.json();
    console.log('Suggesting alternatives for:', productName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Lovable AI to suggest alternatives
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
            content: `You are an assistant that suggests Indian product alternatives. Given a foreign product, suggest 2-3 quality Indian alternatives. For each alternative, return:
- name: Product name
- brand: Indian brand name
- category: Same category as original
- price: Estimated price in INR
- description: Brief description highlighting Indian origin
- image_url: Use placeholder "https://example.com/images/ALT_[timestamp]_[random].jpg"
- availability: One of "widely_available", "online_only", "limited_availability"
- where_to_buy: Array of Indian stores
- rating: Rating 3-5
- match_score: How well it matches (60-95)
- reason: Why this is a good alternative (1 sentence)
- price_comparison: "cheaper", "similar", or "more_expensive"
- quality_comparison: "better", "similar", or "good"

Search the internet for accurate Indian alternatives.`
          },
          {
            role: 'user',
            content: `Suggest Indian alternatives for: ${productName} (Category: ${productCategory})`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_alternatives",
            description: "Return Indian product alternatives",
            parameters: {
              type: "object",
              properties: {
                alternatives: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      brand: { type: "string" },
                      category: { type: "string" },
                      price: { type: "number" },
                      description: { type: "string" },
                      image_url: { type: "string" },
                      availability: { type: "string" },
                      where_to_buy: { type: "array", items: { type: "string" } },
                      rating: { type: "number" },
                      match_score: { type: "number" },
                      reason: { type: "string" },
                      price_comparison: { type: "string", enum: ["cheaper", "similar", "more_expensive"] },
                      quality_comparison: { type: "string", enum: ["better", "similar", "good"] }
                    }
                  }
                }
              },
              required: ["alternatives"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_alternatives" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const { alternatives } = JSON.parse(toolCall.function.arguments);
    console.log(`Received ${alternatives.length} alternatives from AI`);

    // Save Indian products and create alternative links
    const savedAlternatives = [];

    for (const alt of alternatives) {
      // Save the Indian product
      const indianProduct = {
        barcode: `IND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: alt.name,
        brand: alt.brand,
        category: alt.category,
        country_of_origin: 'India',
        is_indian: true,
        description: alt.description,
        image_url: alt.image_url,
        price: alt.price,
        availability: alt.availability,
        where_to_buy: JSON.stringify(alt.where_to_buy),
        rating: alt.rating
      };

      const { data: savedProduct, error: productError } = await supabase
        .from('products')
        .insert([indianProduct])
        .select()
        .single();

      if (productError) {
        console.error('Error saving Indian product:', productError);
        continue;
      }

      // Create alternative link
      const alternativeLink = {
        original_product_id: productId,
        indian_product_id: savedProduct.id,
        match_score: alt.match_score,
        reason: alt.reason,
        price_comparison: alt.price_comparison,
        quality_comparison: alt.quality_comparison
      };

      const { data: savedLink, error: linkError } = await supabase
        .from('alternatives')
        .insert([alternativeLink])
        .select()
        .single();

      if (linkError) {
        console.error('Error saving alternative link:', linkError);
        continue;
      }

      savedAlternatives.push({
        alternative: savedLink,
        product: savedProduct
      });
    }

    console.log(`Successfully saved ${savedAlternatives.length} alternatives`);

    return new Response(
      JSON.stringify({ alternatives: savedAlternatives }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Alternative suggestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});