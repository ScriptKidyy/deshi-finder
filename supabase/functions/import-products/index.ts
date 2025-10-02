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
    // Verify user is authenticated and has admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      console.warn(`Non-admin user ${user.id} attempted import`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin user ${user.id} starting product import...`);

    const { products, alternatives } = await req.json();

    // Input validation
    if (!products && !alternatives) {
      return new Response(
        JSON.stringify({ error: 'No data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (products && !Array.isArray(products)) {
      return new Response(
        JSON.stringify({ error: 'Products must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (alternatives && !Array.isArray(alternatives)) {
      return new Response(
        JSON.stringify({ error: 'Alternatives must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      JSON.stringify({ error: 'Failed to import data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});