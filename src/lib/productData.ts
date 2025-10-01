export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  country_of_origin: string;
  is_indian: boolean;
  description: string;
  image_url: string;
  price: number;
  availability: string;
  where_to_buy: string[];
  rating: number;
}

export interface Alternative {
  id: string;
  original_product_id: string;
  indian_product_id: string;
  match_score: number;
  reason: string;
  price_comparison: string;
  quality_comparison: string;
}

let productsCache: Product[] | null = null;
let alternativesCache: Alternative[] | null = null;

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

export async function loadProducts(): Promise<Product[]> {
  if (productsCache) return productsCache;

  try {
    const response = await fetch('/data/products.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const products: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
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
          where_to_buy: JSON.parse(values[11].replace(/'/g, '"')),
          rating: parseFloat(values[12]) || 0,
        });
      }
    }
    
    productsCache = products;
    return products;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export async function loadAlternatives(): Promise<Alternative[]> {
  if (alternativesCache) return alternativesCache;

  try {
    const response = await fetch('/data/alternatives.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const alternatives: Alternative[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
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
    
    alternativesCache = alternatives;
    return alternatives;
  } catch (error) {
    console.error('Error loading alternatives:', error);
    return [];
  }
}

export async function searchProductByBarcode(barcode: string): Promise<Product | null> {
  const products = await loadProducts();
  return products.find(p => p.barcode === barcode) || null;
}

export async function searchProducts(query: string, indianOnly: boolean = false, category: string = 'all'): Promise<Product[]> {
  const products = await loadProducts();
  
  return products.filter(product => {
    const matchesQuery = !query || 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase()) ||
      product.barcode.includes(query);
    
    const matchesIndian = !indianOnly || product.is_indian;
    const matchesCategory = category === 'all' || product.category.toLowerCase() === category.toLowerCase();
    
    return matchesQuery && matchesIndian && matchesCategory;
  });
}

export async function getAlternativesForProduct(productId: string): Promise<{ alternative: Alternative; product: Product }[]> {
  const alternatives = await loadAlternatives();
  const products = await loadProducts();
  
  const productAlternatives = alternatives.filter(alt => alt.original_product_id === productId);
  
  return productAlternatives.map(alt => {
    const product = products.find(p => p.id === alt.indian_product_id);
    return { alternative: alt, product: product! };
  }).filter(item => item.product);
}
