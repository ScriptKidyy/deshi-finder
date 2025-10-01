import { useState } from "react";
import { Search as SearchIcon, Filter, MapPin, Star } from "lucide-react";
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

const mockProducts = [
  {
    id: "1",
    name: "iPhone 17 Pro Max",
    brand: "Apple",
    country: "China, India",
    category: "Smartphone",
    rating: 4.5,
    price: 110000,
    availability: "widely available",
    stores: ["Apple Store", "Amazon India", "Flipkart"],
    isIndian: false,
  },
  {
    id: "2",
    name: "iPhone 17 Pro",
    brand: "Apple",
    country: "China, India",
    category: "Smartphone",
    rating: 4.5,
    price: 95000,
    availability: "widely available",
    stores: ["Apple Store", "Amazon India", "Flipkart"],
    isIndian: false,
  },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [indianOnly, setIndianOnly] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const filtered = mockProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (!indianOnly || p.isIndian)
      );
      setResults(filtered);
      setSearched(true);
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
            <Button onClick={handleSearch} size="lg" className="bg-primary hover:bg-primary/90">
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

        {searched && results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results ({results.length})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {results.map((product) => (
                <div key={product.id} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <p className="text-muted-foreground">{product.brand}</p>
                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {product.country}
                      </Badge>
                      <Badge variant="secondary">{product.category}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {product.rating}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="font-bold text-accent">₹{product.price.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Available at:</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {product.stores.map((store) => (
                          <Badge key={store} variant="outline">{store}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!product.isIndian && (
                    <Button className="w-full bg-accent hover:bg-accent/90" size="lg">
                      Find Indian Alternatives
                    </Button>
                  )}
                </div>
              ))}
            </div>
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
