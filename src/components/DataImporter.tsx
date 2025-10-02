import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Database, Upload } from "lucide-react";

export const DataImporter = () => {
  const { session, isAdmin } = useAuth();
  const [importing, setImporting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    checkDataLoaded();
  }, []);

  const checkDataLoaded = async () => {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    setDataLoaded((count || 0) > 0);
  };

  const importCSVData = async () => {
    setImporting(true);
    toast.info("Starting data import...");

    try {
      // Fetch products CSV
      const productsResponse = await fetch('/data/products.csv');
      const productsText = await productsResponse.text();
      const productsLines = productsText.split('\n').filter(line => line.trim());
      
      const products = [];
      for (let i = 1; i < productsLines.length && i < 101; i++) { // Import first 100 products
        const line = productsLines[i];
        const values = parseCSVLine(line);
        
        if (values.length >= 13) {
          products.push({
            id: values[0],
            barcode: values[1],
            name: values[2],
            brand: values[3],
            category: values[4],
            country_of_origin: values[5],
            is_indian: values[6].toLowerCase() === 'true',
            description: values[7],
            image_url: values[8],
            price: parseFloat(values[9]) || 0,
            availability: values[10],
            where_to_buy: values[11],
            rating: parseFloat(values[12]) || 0,
          });
        }
      }

      // Fetch alternatives CSV
      const alternativesResponse = await fetch('/data/alternatives.csv');
      const alternativesText = await alternativesResponse.text();
      const alternativesLines = alternativesText.split('\n').filter(line => line.trim());
      
      const alternatives = [];
      for (let i = 1; i < alternativesLines.length && i < 101; i++) { // Import first 100 alternatives
        const line = alternativesLines[i];
        const values = parseCSVLine(line);
        
        if (values.length >= 7) {
          alternatives.push({
            id: values[0],
            original_product_id: values[1],
            indian_product_id: values[2],
            match_score: parseInt(values[3]) || 0,
            reason: values[4],
            price_comparison: values[5],
            quality_comparison: values[6],
          });
        }
      }

      console.log(`Prepared ${products.length} products and ${alternatives.length} alternatives`);

      // Call import edge function
      const { data, error } = await supabase.functions.invoke('import-products', {
        body: { products, alternatives },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast.success(`Successfully imported ${products.length} products!`);
      setDataLoaded(true);
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Failed to import data: " + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let inBrackets = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === '[') {
        inBrackets = true;
        current += char;
      } else if (char === ']') {
        inBrackets = false;
        current += char;
      } else if (char === ',' && !inQuotes && !inBrackets) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  if (!isAdmin) {
    return null;
  }

  if (dataLoaded) {
    return (
      <Card className="border-indian-green/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indian-green" />
            Data Loaded
          </CardTitle>
          <CardDescription>
            Product database is ready to use
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Product Data
        </CardTitle>
        <CardDescription>
          Load product data from CSV files into the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={importCSVData} 
          disabled={importing}
          className="w-full"
        >
          {importing ? "Importing..." : "Import Data"}
        </Button>
      </CardContent>
    </Card>
  );
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let inBrackets = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '[') {
      inBrackets = true;
      current += char;
    } else if (char === ']') {
      inBrackets = false;
      current += char;
    } else if (char === ',' && !inQuotes && !inBrackets) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}