import { useState, useEffect } from "react";
import { Search as SearchIcon, Filter, MapPin, Star, Package, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  country_of_origin: string;
  is_indian: boolean;
  price: number;
  rating: number;
  availability: string;
  where_to_buy: any;
};

const Search = () => {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [indianOnly, setIndianOnly] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-products', {
        body: { searchQuery, category, indianOnly },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      
      setResults(data?.products || []);
      
      if (data?.products?.length === 0) {
        toast.info("No products found. Try a different search term.");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAlternatives = async (product: Product) => {
    setSelectedProduct(product);
    if (!product.is_indian) {
      try {
        const { data: altsData } = await supabase
          .from('alternatives')
          .select(`
            *,
            indian_product:products!alternatives_indian_product_id_fkey(*)
          `)
          .eq('original_product_id', product.id);

        setAlternatives(altsData || []);
      } catch (error) {
        console.error('Failed to load alternatives:', error);
      }
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <SearchIcon className="h-8 w-8 text-primary" />
            Smart Product Search
          </h1>
          <p className="text-lg text-muted-foreground">
            Find any product and discover Indian alternatives
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for any product (e.g., iPhone, Maggi noodles, Nike shoes...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-background border-border"
            />
            <Button 
              onClick={handleSearch} 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-4 items-center">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="cosmetics">Personal Care</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={indianOnly ? "default" : "outline"}
              onClick={() => setIndianOnly(!indianOnly)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              🇮🇳 Indian Only
            </Button>
          </div>
        </div>

        {!searched && (
          <div className="text-center py-20 space-y-4">
            <SearchIcon className="h-20 w-20 mx-auto text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Discover Amazing Products</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search for any product to find detailed information and discover Indian alternatives
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Searching products...</p>
          </div>
        )}

        {searched && !loading && results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results ({results.length})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {results.map((product) => (
                <div key={product.id} className={`bg-card border ${product.is_indian ? 'border-indian-green/30' : 'border-border'} rounded-xl p-6 space-y-4`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <p className="text-muted-foreground">{product.brand}</p>
                      </div>
                      <Badge variant={product.is_indian ? "default" : "secondary"}>
                        {product.is_indian ? "🇮🇳" : product.country_of_origin}
                      </Badge>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge variant="outline" className="gap-1">
                        <Package className="h-3 w-3" />
                        {product.category}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {product.rating}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="font-bold text-primary">₹{product.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {product.availability.replace(/_/g, ' ')}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-1">Available at:</p>
                      <div className="flex gap-2 flex-wrap">
                        {(Array.isArray(product.where_to_buy) 
                          ? product.where_to_buy 
                          : JSON.parse(product.where_to_buy || '[]')
                        ).slice(0, 3).map((store: string, idx: number) => (
                          <Badge key={idx} variant="outline">{store}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!product.is_indian && (
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90" 
                      size="lg"
                      onClick={() => handleViewAlternatives(product)}
                    >
                      Find Indian Alternatives
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProduct && alternatives.length > 0 && (
          <div className="bg-card border border-indian-saffron/50 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-primary">Indian Alternatives for {selectedProduct.name}</h3>
              <p className="text-muted-foreground mt-1">Support local brands with these quality alternatives</p>
            </div>
            <div className="space-y-4">
              {alternatives.filter((alt: any) => alt.indian_product).map((alt: any) => (
                <div key={alt.id} className="bg-background border border-indian-green/30 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{alt.indian_product?.name || 'Unknown'}</h4>
                      <p className="text-sm text-muted-foreground">{alt.indian_product?.brand || 'Unknown'}</p>
                    </div>
                    <Badge className="bg-indian-green text-white">
                      {alt.match_score}% Match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alt.reason}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">{alt.indian_product?.rating || 0}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">{alt.indian_product?.category || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {alt.price_comparison?.replace(/_/g, ' ') || 'Similar'}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {alt.quality_comparison || 'similar'} quality
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-2xl font-bold text-indian-green">
                      ₹{alt.indian_product?.price?.toFixed(2) || '0.00'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(alt.indian_product?.where_to_buy)
                        ? alt.indian_product.where_to_buy
                        : JSON.parse(alt.indian_product?.where_to_buy || '[]')
                      ).slice(0, 2).map((store: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{store}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => { setSelectedProduct(null); setAlternatives([]); }}
            >
              Close
            </Button>
          </div>
        )}

        {searched && results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No products found. Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
