import { useState, useEffect, useRef } from "react";
import { Scan, CameraOff, Package, Star, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type Product = Database['public']['Tables']['products']['Row'];

const Scanner = () => {
  const { session } = useAuth();
  const [barcode, setBarcode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "barcode-scanner";

  const handleScan = async (scannedCode: string) => {
    const trimmedCode = scannedCode.trim();
    if (!trimmedCode) return;
    
    setBarcode(trimmedCode);
    setLoading(true);
    
    try {
      // Search in database first
      const { data: foundProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', trimmedCode)
        .maybeSingle();

      if (error) throw error;

      if (foundProduct) {
        setProduct(foundProduct);
        toast.success(`Product Found: ${foundProduct.name}`);
        
        if (!foundProduct.is_indian) {
          // Fetch alternatives
          const { data: altsData } = await supabase
            .from('alternatives')
            .select(`
              *,
              indian_product:products!alternatives_indian_product_id_fkey(*)
            `)
            .eq('original_product_id', foundProduct.id);

          setAlternatives(altsData || []);
        } else {
          setAlternatives([]);
        }
      } else {
        // Product not found in DB, try OpenFoodFacts then AI fallback
        toast.info("Searching OpenFoodFacts database...");
        
        const { data: aiProduct, error: aiError } = await supabase.functions.invoke('identify-product', {
          body: { barcode: trimmedCode },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (aiError) throw aiError;

        setProduct(aiProduct.product);
        toast.success(`Product identified: ${aiProduct.product.name}`);

        // If foreign, suggest alternatives
        if (!aiProduct.product.is_indian) {
          const { data: altsData, error: altsError } = await supabase.functions.invoke('suggest-alternatives', {
            body: {
              productId: aiProduct.product.id,
              productName: aiProduct.product.name,
              productCategory: aiProduct.product.category
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (!altsError) {
            setAlternatives(altsData.alternatives || []);
          }
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error("Failed to identify product: " + (error as Error).message);
      setProduct(null);
      setAlternatives([]);
    } finally {
      setLoading(false);
      stopScanner();
    }
  };

  const checkCameraPermission = async () => {
    if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
      toast.error("Camera requires HTTPS or localhost");
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera not supported in this browser");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error("Camera access denied. Please allow camera permissions");
      } else if (err.name === 'NotReadableError') {
        toast.error("Camera is already in use");
      } else {
        toast.error("Camera error: " + err.message);
      }
      return false;
    }
  };

  const waitForElement = async (id: string, timeout = 1500) => {
    const start = performance.now();
    return await new Promise<boolean>((resolve) => {
      function check() {
        if (document.getElementById(id)) return resolve(true);
        if (performance.now() - start > timeout) return resolve(false);
        requestAnimationFrame(check);
      }
      requestAnimationFrame(check);
    });
  };

  const startScanner = async () => {
    try {
      setScanning(true);
      
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setScanning(false);
        return;
      }

      setCameraActive(true);
      const ready = await waitForElement(scannerDivId);
      if (!ready) {
        throw new Error(`Scanner container (#${scannerDivId}) not found`);
      }

      html5QrCodeRef.current = new Html5Qrcode(scannerDivId);
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScan(decodedText);
          stopScanner();
        },
        () => {}
      );
      
      toast.success("Camera started! Point at a barcode");
    } catch (err: any) {
      console.error("Scanner error:", err);
      toast.error("Failed to start scanner");
      setCameraActive(false);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error("Stop error:", err);
      }
    }
    setCameraActive(false);
    setScanning(false);
  };

  const toggleScanner = () => {
    if (cameraActive) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        stopScanner();
      }
    };
  }, []);

  const parseWhereToBuy = (where: any) => {
    if (Array.isArray(where)) return where;
    if (typeof where === 'string') {
      try {
        return JSON.parse(where.replace(/'/g, '"'));
      } catch {
        return [];
      }
    }
    return [];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-8 py-12 relative">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-3">
              <Scan className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Barcode Scanner</h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Scan any product to instantly discover Indian alternatives
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-8">
        {/* Scanner Display */}
        <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-6 shadow-elevated overflow-hidden">
          <div className="aspect-video relative rounded-2xl overflow-hidden bg-background/50">
            <div id={scannerDivId} className="w-full h-full flex items-center justify-center" />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background/80 to-muted/60 backdrop-blur-md">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <CameraOff className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Camera is off</p>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-6 space-y-4 shadow-soft">
          <h3 className="font-semibold text-lg text-foreground">Manual Entry</h3>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter barcode manually..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan(barcode)}
              className="flex-1 h-12 bg-background/50 border-border/50 rounded-xl px-4"
            />
            <Button 
              onClick={() => handleScan(barcode)} 
              disabled={!barcode || loading}
              className="h-12 px-6 bg-gradient-accent hover:opacity-90 transition-opacity rounded-xl"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Press Enter or click Search
          </p>
        </div>

        {/* Scanner Toggle */}
        <div className="flex justify-center">
          <Button
            onClick={toggleScanner}
            size="lg"
            disabled={scanning && !cameraActive}
            className="h-14 px-8 gap-2 bg-gradient-accent hover:opacity-90 transition-opacity rounded-2xl shadow-soft font-semibold"
          >
            <Scan className="h-5 w-5" />
            {cameraActive ? "Stop Scanner" : "Start Scanner"}
          </Button>
        </div>

        {/* Product Details */}
        {product && (
          <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-8 space-y-6 shadow-elevated animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-3xl font-bold text-foreground">{product.name}</h2>
                  {product.confidence && (
                    <Badge 
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        product.confidence === 'high' 
                          ? 'bg-indian/20 text-indian border border-indian/30' 
                          : product.confidence === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30'
                          : 'bg-destructive/20 text-destructive border border-destructive/30'
                      }`}
                    >
                      {product.confidence === 'high' ? '✓ Verified' : product.confidence === 'medium' ? '~ Medium' : '? Low'}
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground font-medium">{product.brand}</p>
              </div>
              <Badge 
                variant={product.is_indian ? "default" : "secondary"}
                className={`px-4 py-2 text-sm font-bold rounded-full ${
                  product.is_indian ? 'bg-indian/20 text-indian border border-indian/30' : 'bg-muted'
                }`}
              >
                {product.is_indian ? "🇮🇳 Indian" : product.country_of_origin}
              </Badge>
            </div>
            
            {product.source && (
              <p className="text-xs text-muted-foreground font-medium">
                Source: {product.source === 'OFF' ? 'OpenFoodFacts' : product.source === 'LLM' ? 'AI Identified' : product.source}
                {product.verified && ' • Verified'}
              </p>
            )}
            
            {product.confidence === 'low' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-foreground">
                ⚠️ This product is not confidently identified. Information may be incomplete.
              </div>
            )}
            
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            
            <div className="grid grid-cols-2 gap-4 py-3">
              <div className="flex items-center gap-3 bg-background/50 rounded-xl p-3">
                <Package className="h-6 w-6 text-primary" />
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-xl p-3">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                <span className="font-bold">{product.rating}/5</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/30">
              <p className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                ₹{product.price.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground capitalize mt-2">
                {product.availability.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Available at:
              </p>
              <div className="flex flex-wrap gap-2">
                {parseWhereToBuy(product.where_to_buy).map((store: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="rounded-full bg-background/50">{store}</Badge>
                ))}
              </div>
            </div>

            {/* Indian Alternatives Section */}
            {!product.is_indian && alternatives.length > 0 && (
              <div className="pt-6 border-t border-indian/20 space-y-5">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-indian/10 rounded-2xl">
                    <ShoppingBag className="h-7 w-7 text-indian" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Indian Alternatives</h3>
                  <p className="text-muted-foreground">Support local brands</p>
                </div>
                {alternatives.filter((alt: any) => alt.indian_product).map((alt: any) => (
                  <div key={alt.id} className="bg-background/70 backdrop-blur-sm border border-indian/20 rounded-2xl p-5 space-y-4 hover:shadow-soft transition-shadow">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-xl text-foreground">{alt.indian_product?.name || 'Unknown'}</h4>
                        <p className="text-muted-foreground font-medium">{alt.indian_product?.brand || 'Unknown'}</p>
                      </div>
                      <Badge className="bg-indian/20 text-indian border border-indian/30 px-3 py-1 text-sm font-bold rounded-full">
                        {alt.match_score}% Match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{alt.reason}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize rounded-full bg-background/50">
                        {alt.price_comparison?.replace(/_/g, ' ') || 'Similar'}
                      </Badge>
                      <Badge variant="outline" className="capitalize rounded-full bg-background/50">
                        {alt.quality_comparison || 'similar'} quality
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                      ₹{alt.indian_product?.price || 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;