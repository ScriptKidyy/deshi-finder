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
    console.log('Starting product import...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { products, alternatives } = await req.json();

    // Import products
    if (products && products.length > 0) {
      console.log(`Importing ${products.length} products...`);
      
      const { data: insertedProducts, error: productsError } = await supabase
        .from('products')
        .upsert(products, { onConflict: 'barcode', ignoreDuplicates: false });

      if (productsError) {
        console.error('Error importing products:', productsError);
        throw productsError;
      }
      
      console.log(`Successfully imported ${products.length} products`);
    }

    // Import alternatives
    if (alternatives && alternatives.length > 0) {
      console.log(`Importing ${alternatives.length} alternatives...`);
      
      const { data: insertedAlternatives, error: alternativesError } = await supabase
        .from('alternatives')
        .insert(alternatives);

      if (alternativesError) {
        console.error('Error importing alternatives:', alternativesError);
        throw alternativesError;
      }
      
      console.log(`Successfully imported ${alternatives.length} alternatives`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Imported ${products?.length || 0} products and ${alternatives?.length || 0} alternatives` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});