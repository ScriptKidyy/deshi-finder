import { useState, useEffect } from "react";
import { Plus, Database, Filter, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadProducts, Product } from "@/lib/productData";

const ManageProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery);
    
    const matchesCategory = categoryFilter === "all" || 
      product.category.toLowerCase() === categoryFilter.toLowerCase();
    
    const matchesOrigin = originFilter === "all" ||
      (originFilter === "indian" && product.is_indian) ||
      (originFilter === "foreign" && !product.is_indian);
    
    return matchesSearch && matchesCategory && matchesOrigin;
  });

  const indianCount = products.filter(p => p.is_indian).length;
  const totalCount = products.length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-8 py-12 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-5xl font-bold tracking-tight">Manage Products</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Add and manage your product database
              </p>
            </div>
            <Button 
              size="lg" 
              className="h-14 px-8 gap-2 bg-gradient-accent hover:opacity-90 transition-opacity rounded-2xl shadow-soft font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        {/* Search & Filters */}
        <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-6 space-y-4 shadow-soft">
          <div className="flex gap-3 flex-wrap">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-12 bg-background/50 border-border/50 rounded-xl px-4"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-52 h-12 bg-background/50 border-border/50 rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="personal-care">Personal Care</SelectItem>
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-52 h-12 bg-background/50 border-border/50 rounded-xl">
                <SelectValue placeholder="All Origins" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Origins</SelectItem>
                <SelectItem value="indian">Indian Only</SelectItem>
                <SelectItem value="foreign">Foreign Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-6 text-center space-y-3 shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <div className="text-4xl font-bold text-foreground">{loading ? "..." : totalCount}</div>
            <div className="text-sm text-muted-foreground font-medium">Total Products</div>
          </div>
          <div className="bg-gradient-card backdrop-blur-glass border border-indian/30 rounded-3xl p-6 text-center space-y-3 shadow-soft ring-2 ring-indian/20">
            <div className="text-4xl mx-auto">🇮🇳</div>
            <div className="text-4xl font-bold text-indian">{loading ? "..." : indianCount}</div>
            <div className="text-sm text-muted-foreground font-medium">Indian Products</div>
          </div>
          <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-6 text-center space-y-3 shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto flex items-center justify-center">
              <Filter className="h-8 w-8 text-accent" />
            </div>
            <div className="text-4xl font-bold text-foreground">{loading ? "..." : filteredProducts.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Filtered Results</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-gradient-card rounded-3xl border border-border/30">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg text-foreground font-medium">Loading products...</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`
                  bg-gradient-card backdrop-blur-glass border rounded-3xl p-6 space-y-4 
                  hover:shadow-elevated transition-all
                  ${product.is_indian ? "border-indian/30 ring-2 ring-indian/10" : "border-border/50"}
                `}
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{product.brand}</p>
                  <p className="text-xs text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded-lg inline-block">
                    {product.barcode}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {product.is_indian && (
                    <Badge className="bg-indian/20 text-indian border border-indian/30 font-semibold rounded-full">
                      🇮🇳 India
                    </Badge>
                  )}
                  <Badge variant="secondary" className="rounded-full bg-background/50">
                    {product.category}
                  </Badge>
                </div>

                <div className="pt-3 space-y-3 border-t border-border/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Price:</span>
                    <span className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                      ₹{product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Rating:</span>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{product.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Status:</span>
                    <Badge variant="outline" className="capitalize rounded-full bg-background/50">
                      {product.availability.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
