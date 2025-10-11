import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to compute nutrition distance for ranking alternatives
function computeNutritionDistance(a: any = {}, b: any = {}): number {
  const getVal = (obj: any, key: string) => {
    if (!obj) return 0;
    const val = obj[key] ?? obj[key.replace('-', '_')];
    return typeof val === 'object' ? 0 : Number(val || 0);
  };
  
  const aEnergy = getVal(a, 'energy-kcal_100g') || getVal(a, 'energy_100g') || 0;
  const bEnergy = getVal(b, 'energy-kcal_100g') || getVal(b, 'energy_100g') || 0;
  const aSugar = getVal(a, 'sugars_100g') || 0;
  const bSugar = getVal(b, 'sugars_100g') || 0;
  const aFat = getVal(a, 'fat_100g') || 0;
  const bFat = getVal(b, 'fat_100g') || 0;
  
  // Weighted distance: energy (60%), sugar (30%), fat (10%)
  return 0.6 * Math.abs(aEnergy - bEnergy) + 0.3 * Math.abs(aSugar - bSugar) + 0.1 * Math.abs(aFat - bFat);
}

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

    const { productId, productName, productCategory } = await req.json();
    
    // Input validation
    if (!productId || !productName || !productCategory) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Suggesting alternatives for: ${productName} (${productCategory})`);

    // Step 1: Find candidate alternatives from DB (nutrition-based)
    const categoryTerm = productCategory?.split(',')[0]?.trim() || productCategory || '';
    console.log('Searching for Indian alternatives in category:', categoryTerm);
    
    const { data: candidates, error: candidatesError } = await supabase
      .from('products')
      .select('*')
      .eq('is_indian', true)
      .ilike('category', `%${categoryTerm}%`)
      .limit(200);

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError);
    }

    let rankedCandidates: any[] = [];
    
    if (candidates && candidates.length > 0) {
      console.log(`Found ${candidates.length} candidate alternatives`);
      
      // Compute nutrition distance and rank
      const productNutriments = typeof product.off_raw === 'object' && product.off_raw !== null
        ? (product.off_raw as any).nutriments || {}
        : {};
      
      rankedCandidates = candidates.map(candidate => {
        const candidateNutriments = typeof candidate.off_raw === 'object' && candidate.off_raw !== null
          ? (candidate.off_raw as any).nutriments || {}
          : {};
        const distance = computeNutritionDistance(productNutriments, candidateNutriments);
        return { ...candidate, nutrition_distance: distance };
      }).sort((a, b) => a.nutrition_distance - b.nutrition_distance).slice(0, 10);
      
      console.log('Top candidates by nutrition:', rankedCandidates.map(c => c.name).slice(0, 3));
    } else {
      console.log('No candidates found in DB, will use AI to generate suggestions');
    }

    // Step 2: Use AI to rank/validate top candidates OR generate new ones
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let aiPrompt = '';
    if (rankedCandidates.length > 0) {
      // AI ranks existing candidates
      aiPrompt = `You are an Indian product alternatives expert. Rank and validate these Indian product alternatives for "${productName}" (${productCategory}).

Candidates:
${rankedCandidates.slice(0, 5).map((c, i) => `${i+1}. ${c.name} by ${c.brand} - ${c.category} - Rs ${c.price}`).join('\n')}

Original product price: Rs ${product.price || 'Unknown'}

Return JSON array with top 3 alternatives. Each should have:
{
  "name": "<exact name from candidates>",
  "brand": "<exact brand from candidates>",
  "match_score": <1-100>,
  "reason": "<why it's a good alternative in 1-2 sentences>",
  "quality_comparison": "better" | "similar" | "good",
  "price_comparison": "cheaper" | "similar" | "more_expensive",
  "reason_tags": ["same_category", "nutrition_similar", "popular_brand"],
  "confidence": "low|medium|high"
}

CRITICAL: price_comparison must be EXACTLY one of: "cheaper", "similar", "more_expensive"
CRITICAL: quality_comparison must be EXACTLY one of: "better", "similar", "good"`;
    } else {
      // AI generates new suggestions
      aiPrompt = `You are an Indian product alternatives expert. The foreign product "${productName}" by ${product.brand || 'Unknown'} in category ${productCategory} (Rs ${product.price || 'Unknown'}) needs Indian alternatives.

Generate 3 authentic Indian alternatives. Return JSON array with each having:
{
  "name": "<product name>",
  "brand": "<Indian brand>",
  "category": "<category>",
  "price": <estimated INR as number>,
  "match_score": <1-100>,
  "reason": "<why it's a good alternative in 1-2 sentences>",
  "quality_comparison": "better" | "similar" | "good",
  "price_comparison": "cheaper" | "similar" | "more_expensive",
  "reason_tags": ["same_category", "similar_use"],
  "confidence": "medium"
}

CRITICAL: price_comparison must be EXACTLY one of: "cheaper", "similar", "more_expensive"
CRITICAL: quality_comparison must be EXACTLY one of: "better", "similar", "good"

Only suggest well-known, authentic Indian brands.`;
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
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to suggest alternatives' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to parse alternatives' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const alternatives = JSON.parse(jsonMatch[0]);
    console.log(`Received ${alternatives.length} alternatives from AI`);

    // Save alternatives to database
    const savedAlternatives = [];
    
    for (const alt of alternatives) {
      let indianProductId: string | null = null;
      
      // If we have ranked candidates, match by name
      if (rankedCandidates.length > 0) {
        const matchedCandidate = rankedCandidates.find(c => 
          c.name.toLowerCase().includes(alt.name.toLowerCase()) || 
          alt.name.toLowerCase().includes(c.name.toLowerCase())
        );
        
        if (matchedCandidate) {
          indianProductId = matchedCandidate.id;
          console.log('Matched candidate:', matchedCandidate.name);
        }
      }
      
      // If no match, check if product exists in DB
      if (!indianProductId) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('name', alt.name)
          .eq('brand', alt.brand)
          .maybeSingle();

        indianProductId = existingProduct?.id || null;
      }

      // Create new product if it doesn't exist
      if (!indianProductId) {
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: alt.name,
            brand: alt.brand,
            category: alt.category || productCategory,
            price: alt.price || 0,
            is_indian: true,
            country_of_origin: 'India',
            description: alt.reason || 'Indian alternative product',
            availability: 'widely_available',
            where_to_buy: JSON.stringify(['Local Stores', 'Amazon.in', 'Flipkart']),
            rating: 4,
            barcode: `ALT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: 'LLM',
            confidence: alt.confidence || 'medium',
            verified: false
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error creating alternative product:', insertError);
          continue;
        }

        indianProductId = newProduct.id;
      }

      // Normalize comparison values to match database constraints
      const normalizeQuality = (val: string): string => {
        const v = (val || '').toLowerCase();
        if (v.includes('better') || v.includes('superior')) return 'better';
        if (v.includes('good') || v.includes('decent')) return 'good';
        return 'similar';
      };

      const normalizePrice = (val: string): string => {
        const v = (val || '').toLowerCase();
        if (v.includes('cheap') || v.includes('lower') || v.includes('affordable') || v.includes('less')) return 'cheaper';
        if (v.includes('expensive') || v.includes('higher') || v.includes('more')) return 'more_expensive';
        return 'similar';
      };

      // Save alternative relationship with enhanced data
      const { data: altData, error: altError } = await supabase
        .from('alternatives')
        .insert({
          original_product_id: productId,
          indian_product_id: indianProductId,
          match_score: alt.match_score || 85,
          reason: alt.reason || 'Similar product category and quality',
          quality_comparison: normalizeQuality(alt.quality_comparison),
          price_comparison: normalizePrice(alt.price_comparison),
          reason_tags: alt.reason_tags || ['same_category'],
          confidence: alt.confidence || 'medium',
          source_urls: alt.source_urls || []
        })
        .select()
        .single();

      if (altError) {
        console.error('Error saving alternative:', altError);
      } else {
        savedAlternatives.push(altData);
      }
    }

    console.log(`Successfully saved ${savedAlternatives.length} alternatives`);

    return new Response(
      JSON.stringify({ alternatives: savedAlternatives }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Alternative suggestion error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to suggest alternatives' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});