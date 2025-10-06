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
      setLoading(true);
      try {
        // First check if alternatives already exist
        const { data: existingAlts } = await supabase
          .from('alternatives')
          .select(`
            *,
            indian_product:products!alternatives_indian_product_id_fkey(*)
          `)
          .eq('original_product_id', product.id);

        if (existingAlts && existingAlts.length > 0) {
          setAlternatives(existingAlts);
        } else {
          // No alternatives exist, call AI to suggest them
          toast.info("Finding Indian alternatives...");
          
          const { data: suggestionData, error: suggestionError } = await supabase.functions.invoke('suggest-alternatives', {
            body: {
              productId: product.id,
              productName: product.name,
              productCategory: product.category,
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (suggestionError) throw suggestionError;

          // Now fetch the newly created alternatives
          const { data: newAlts } = await supabase
            .from('alternatives')
            .select(`
              *,
              indian_product:products!alternatives_indian_product_id_fkey(*)
            `)
            .eq('original_product_id', product.id);

          setAlternatives(newAlts || []);
          
          if (newAlts && newAlts.length > 0) {
            toast.success(`Found ${newAlts.length} Indian alternative(s)!`);
          } else {
            toast.info("No Indian alternatives found at this time.");
          }
        }
      } catch (error) {
        console.error('Failed to load alternatives:', error);
        toast.error("Failed to find alternatives. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Search Products
          </h1>
          <p className="text-muted-foreground text-lg">
            Find any product and discover Indian alternatives
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-elevated p-6 mb-8">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Search for any product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-12 text-base rounded-xl border-border"
              />
              <Button 
                onClick={handleSearch} 
                className="h-12 px-6 bg-primary hover:bg-primary/90 rounded-xl"
                disabled={loading}
              >
                <SearchIcon className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48 h-11 rounded-xl border-border">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
                className={`h-11 gap-2 rounded-xl ${indianOnly ? 'bg-primary' : ''}`}
              >
                <Filter className="h-4 w-4" />
                🇮🇳 Indian Only
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">

          {!searched && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-soft">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-4">
                <Package className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Start Your Search</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter a product name above to find details and Indian alternatives
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-soft">
              <div className="inline-flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-foreground font-medium">Searching products...</p>
              </div>
            </div>
          )}

          {searched && !loading && results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Found {results.length} results</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {results.map((product) => (
                  <div 
                    key={product.id} 
                    className={`
                      bg-white rounded-2xl p-5 space-y-4 shadow-soft hover:shadow-elevated transition-shadow
                      ${product.is_indian ? 'border-2 border-indian/30' : 'border border-border'}
                    `}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                          <p className="text-muted-foreground text-sm">{product.brand}</p>
                        </div>
                        <Badge 
                          className={`
                            text-xs px-2.5 py-0.5 rounded-full font-semibold
                            ${product.is_indian ? 'bg-indian/15 text-indian border border-indian/30' : 'bg-muted text-foreground'}
                          `}
                        >
                          {product.is_indian ? "🇮🇳 Indian" : product.country_of_origin}
                        </Badge>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="outline" className="gap-1 rounded-full text-xs">
                          <Package className="h-3 w-3" />
                          {product.category}
                        </Badge>
                        <Badge variant="outline" className="gap-1 rounded-full text-xs">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {product.rating}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Price:</span>
                        <span className="text-xl font-bold text-primary">
                          ₹{product.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {product.availability.replace(/_/g, ' ')}
                      </p>
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1.5">Available at:</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(Array.isArray(product.where_to_buy) 
                            ? product.where_to_buy 
                            : JSON.parse(product.where_to_buy || '[]')
                          ).slice(0, 3).map((store: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="rounded-full text-xs">
                              {store}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {!product.is_indian && (
                      <Button 
                        className="w-full h-11 bg-primary hover:bg-primary/90 rounded-xl font-semibold" 
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
            <div className="bg-white rounded-2xl p-6 space-y-5 shadow-elevated border-2 border-indian/20">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indian/10 rounded-xl mb-2">
                  <ShoppingBag className="h-7 w-7 text-indian" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Indian Alternatives for {selectedProduct.name}
                </h3>
                <p className="text-muted-foreground">Support local brands with these alternatives</p>
              </div>
              <div className="space-y-4">
                {alternatives.filter((alt: any) => alt.indian_product).map((alt: any) => (
                  <div 
                    key={alt.id} 
                    className="bg-muted/30 border border-indian/20 rounded-xl p-5 space-y-3 hover:shadow-soft transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-lg text-foreground">{alt.indian_product?.name || 'Unknown'}</h4>
                        <p className="text-muted-foreground text-sm">{alt.indian_product?.brand || 'Unknown'}</p>
                      </div>
                      <Badge className="bg-indian/15 text-indian border border-indian/30 px-2.5 py-0.5 text-xs font-bold rounded-full">
                        {alt.match_score}% Match
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{alt.reason}</p>
                    <div className="grid grid-cols-2 gap-3 py-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-sm">{alt.indian_product?.rating || 0}/5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="font-medium text-xs">{alt.indian_product?.category || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize rounded-full text-xs">
                        {alt.price_comparison?.replace(/_/g, ' ') || 'Similar'}
                      </Badge>
                      <Badge variant="outline" className="capitalize rounded-full text-xs">
                        {alt.quality_comparison || 'similar'} quality
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <p className="text-2xl font-bold text-primary">
                        ₹{alt.indian_product?.price?.toFixed(2) || '0.00'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(alt.indian_product?.where_to_buy)
                          ? alt.indian_product.where_to_buy
                          : JSON.parse(alt.indian_product?.where_to_buy || '[]')
                        ).slice(0, 2).map((store: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs rounded-full">
                            {store}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full h-11 rounded-xl font-semibold" 
                onClick={() => { setSelectedProduct(null); setAlternatives([]); }}
              >
                Close
              </Button>
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-soft">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-xl">
                  <SearchIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Products Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try a different search term or browse categories
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
