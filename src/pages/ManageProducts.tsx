import { useState } from "react";
import { Plus, Database, Filter, Star } from "lucide-react";
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

const mockProducts = [
  {
    id: "1",
    name: "Nivea Whitening Smooth Skin Roll-On",
    brand: "Nivea",
    barcode: "ALT_175931596328_d6z97jax5",
    category: "Personal Care",
    price: 250,
    rating: 4.2,
    availability: "widely available",
    isIndian: true,
  },
  {
    id: "2",
    name: "Pears Soft & Fresh Roll-On",
    brand: "Pears",
    barcode: "ALT_175931596455_m96mnrru",
    category: "Personal Care",
    price: 150,
    rating: 4,
    availability: "widely available",
    isIndian: true,
  },
  {
    id: "3",
    name: "Nivea Fresh Natural Roll-On",
    brand: "Nivea",
    barcode: "ALT_175931596373_buxaqkkwf",
    category: "Personal Care",
    price: 250,
    rating: 4.2,
    availability: "widely available",
    isIndian: true,
  },
];

const ManageProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");

  const indianCount = mockProducts.filter((p) => p.isIndian).length;
  const filteredCount = mockProducts.length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              Manage Products
            </h1>
            <p className="text-lg text-muted-foreground">
              Add and manage your product database
            </p>
          </div>
          <Button size="lg" className="bg-accent hover:bg-accent/90 gap-2">
            <Plus className="h-5 w-5" />
            Add Product
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-background border-border"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="personal-care">Personal Care</SelectItem>
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue placeholder="All Origins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Origins</SelectItem>
                <SelectItem value="indian">Indian Only</SelectItem>
                <SelectItem value="foreign">Foreign Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
            <Database className="h-10 w-10 mx-auto text-primary" />
            <div className="text-3xl font-bold">{mockProducts.length}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </div>
          <div className="bg-card border border-accent rounded-xl p-6 text-center space-y-2">
            <div className="text-2xl mx-auto">🇮🇳</div>
            <div className="text-3xl font-bold text-accent">{indianCount}</div>
            <div className="text-sm text-muted-foreground">Indian Products</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
            <Filter className="h-10 w-10 mx-auto text-primary" />
            <div className="text-3xl font-bold">{filteredCount}</div>
            <div className="text-sm text-muted-foreground">Filtered Results</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-card border ${
                product.isIndian ? "border-accent" : "border-border"
              } rounded-xl p-6 space-y-3 hover:shadow-lg transition-shadow`}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {product.isIndian && (
                  <Badge className="bg-indian text-white">🇮🇳 India</Badge>
                )}
                <Badge variant="secondary">{product.category}</Badge>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold text-accent">₹{product.price}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {product.availability}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;
