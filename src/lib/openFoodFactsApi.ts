/**
 * OpenFoodFacts API Integration
 * Base URL: https://world.openfoodfacts.org
 * No authentication required
 */

const BASE_URL = "https://world.openfoodfacts.org";

export interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  categories?: string;
  countries_tags?: string[];
  image_url?: string;
  nutriments?: Record<string, any>;
  [key: string]: any;
}

export interface ProductResponse {
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

export interface SearchResponse {
  count: number;
  page: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

/**
 * Get product details by barcode
 * @param barcode - Product barcode number
 * @returns Product details
 */
export async function getProductByBarcode(barcode: string): Promise<ProductResponse> {
  const response = await fetch(`${BASE_URL}/api/v0/product/${barcode}.json`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Search products by name or keywords
 * @param searchTerms - Product name or keyword to search for
 * @returns Search results with matching products
 */
export async function searchProducts(searchTerms: string): Promise<SearchResponse> {
  const params = new URLSearchParams({
    search_terms: searchTerms,
    search_simple: "1",
    action: "process",
    json: "1",
  });
  
  const response = await fetch(`${BASE_URL}/cgi/search.pl?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to search products: ${response.statusText}`);
  }
  
  return response.json();
}
