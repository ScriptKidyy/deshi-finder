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
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"></div>
        <div className="max-w-6xl mx-auto px-8 py-16 relative">
          <div className="text-center space-y-6 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <SearchIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
              Discover Products
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Search any product and find authentic Indian alternatives
            </p>
          </div>

          {/* Glass Search Card */}
          <div className="bg-card/80 backdrop-blur-glass border border-border/50 rounded-3xl p-8 shadow-elevated space-y-6">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Search for any product (e.g., iPhone, Maggi noodles...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-14 text-lg bg-background/50 border-border/50 rounded-2xl px-6 focus:bg-background transition-colors"
              />
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="h-14 px-8 bg-gradient-accent hover:opacity-90 transition-opacity rounded-2xl shadow-soft"
                disabled={loading}
              >
                <SearchIcon className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex gap-4 items-center flex-wrap">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-52 h-12 bg-background/50 border-border/50 rounded-xl">
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
                className={`h-12 gap-2 rounded-xl ${indianOnly ? 'bg-gradient-accent' : 'bg-background/50 border-border/50'}`}
              >
                <Filter className="h-4 w-4" />
                🇮🇳 Indian Only
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-8 py-12 space-y-8">

        {!searched && (
          <div className="text-center py-20 space-y-6 bg-gradient-card rounded-3xl p-12 border border-border/30">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-3xl mx-auto">
              <Package className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Start Your Search</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-lg">
                Enter a product name above to find detailed information and discover Indian alternatives
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 bg-gradient-card rounded-3xl border border-border/30">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg text-foreground font-medium">Searching products...</p>
            </div>
          </div>
        )}

        {searched && !loading && results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Search Results ({results.length})</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {results.map((product) => (
                <div 
                  key={product.id} 
                  className={`
                    bg-gradient-card backdrop-blur-glass 
                    border ${product.is_indian ? 'border-indian/30' : 'border-border/50'} 
                    rounded-3xl p-6 space-y-5 shadow-soft hover:shadow-elevated transition-all
                    ${product.is_indian ? 'ring-2 ring-indian/20' : ''}
                  `}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                        <p className="text-muted-foreground font-medium">{product.brand}</p>
                      </div>
                      <Badge 
                        variant={product.is_indian ? "default" : "secondary"}
                        className={`
                          text-xs px-3 py-1 rounded-full font-semibold
                          ${product.is_indian ? 'bg-indian/20 text-indian border border-indian/30' : 'bg-muted'}
                        `}
                      >
                        {product.is_indian ? "🇮🇳 Indian" : product.country_of_origin}
                      </Badge>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge variant="outline" className="gap-1.5 rounded-full bg-background/50">
                        <Package className="h-3 w-3" />
                        {product.category}
                      </Badge>
                      <Badge variant="outline" className="gap-1.5 rounded-full bg-background/50">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {product.rating}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground font-medium">Price:</span>
                      <span className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                        ₹{product.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {product.availability.replace(/_/g, ' ')}
                    </p>
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-2 font-medium">Available at:</p>
                      <div className="flex gap-2 flex-wrap">
                        {(Array.isArray(product.where_to_buy) 
                          ? product.where_to_buy 
                          : JSON.parse(product.where_to_buy || '[]')
                        ).slice(0, 3).map((store: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="rounded-full bg-background/50">
                            {store}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!product.is_indian && (
                    <Button 
                      className="w-full h-12 bg-gradient-accent hover:opacity-90 transition-opacity rounded-xl shadow-soft font-semibold text-base" 
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
          <div className="bg-gradient-card backdrop-blur-glass border border-indian/30 rounded-3xl p-8 space-y-6 shadow-elevated">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indian/10 rounded-2xl mb-3">
                <ShoppingBag className="h-8 w-8 text-indian" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">
                Indian Alternatives for {selectedProduct.name}
              </h3>
              <p className="text-muted-foreground text-lg">Support local brands with these quality alternatives</p>
            </div>
            <div className="space-y-5">
              {alternatives.filter((alt: any) => alt.indian_product).map((alt: any) => (
                <div 
                  key={alt.id} 
                  className="bg-background/70 backdrop-blur-sm border border-indian/20 rounded-2xl p-6 space-y-4 hover:shadow-soft transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="font-bold text-xl text-foreground">{alt.indian_product?.name || 'Unknown'}</h4>
                      <p className="text-muted-foreground font-medium">{alt.indian_product?.brand || 'Unknown'}</p>
                    </div>
                    <Badge className="bg-indian/20 text-indian border border-indian/30 px-3 py-1 text-sm font-bold rounded-full">
                      {alt.match_score}% Match
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{alt.reason}</p>
                  <div className="grid grid-cols-2 gap-4 py-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{alt.indian_product?.rating || 0}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">{alt.indian_product?.category || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize rounded-full bg-background/50">
                      {alt.price_comparison?.replace(/_/g, ' ') || 'Similar'}
                    </Badge>
                    <Badge variant="outline" className="capitalize rounded-full bg-background/50">
                      {alt.quality_comparison || 'similar'} quality
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/30">
                    <p className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                      ₹{alt.indian_product?.price?.toFixed(2) || '0.00'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(alt.indian_product?.where_to_buy)
                        ? alt.indian_product.where_to_buy
                        : JSON.parse(alt.indian_product?.where_to_buy || '[]')
                      ).slice(0, 2).map((store: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs rounded-full bg-background/50">
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
              className="w-full h-12 rounded-xl font-semibold" 
              onClick={() => { setSelectedProduct(null); setAlternatives([]); }}
            >
              Close
            </Button>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-20 bg-gradient-card rounded-3xl border border-border/30">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-2xl mx-auto">
                <SearchIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">No Products Found</h3>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Try a different search term or browse our categories
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
