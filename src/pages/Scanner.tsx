import { useState, useEffect, useRef } from "react";
import { Scan, CameraOff, Package, Star, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['products']['Row'];

const Scanner = () => {
  const [barcode, setBarcode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "barcode-scanner";

  const handleScan = async (scannedCode: string) => {
    if (!scannedCode.trim()) return;
    
    setBarcode(scannedCode);
    setLoading(true);
    
    try {
      // Search in database first
      const { data: foundProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', scannedCode)
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
        // Product not found, use AI to identify
        toast.info("Product not in database, identifying with AI...");
        
        const { data: aiProduct, error: aiError } = await supabase.functions.invoke('identify-product', {
          body: { barcode: scannedCode }
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
            }
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

  const startScanner = async () => {
    try {
      setScanning(true);
      
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setScanning(false);
        return;
      }

      setCameraActive(true);
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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">🇮🇳 VocalKart Scanner</h1>
          <p className="text-lg text-muted-foreground">
            Scan products to discover Indian alternatives
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-8 aspect-video flex items-center justify-center">
          {!cameraActive ? (
            <div className="text-center space-y-4">
              <CameraOff className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Camera is off</p>
            </div>
          ) : (
            <div id={scannerDivId} className="w-full h-full flex items-center justify-center" />
          )}
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Or enter barcode manually..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan(barcode)}
              className="flex-1"
            />
            <Button 
              onClick={() => handleScan(barcode)} 
              disabled={!barcode || loading}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Press Enter or click Search
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={toggleScanner}
            size="lg"
            disabled={scanning && !cameraActive}
            className="gap-2"
          >
            <Scan className="h-5 w-5" />
            {cameraActive ? "Stop Scanner" : "Start Scanner"}
          </Button>
        </div>

        {product && (
          <div className="bg-card border rounded-2xl p-6 space-y-6 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{product.name}</h2>
                <p className="text-lg text-muted-foreground">{product.brand}</p>
              </div>
              <Badge variant={product.is_indian ? "default" : "secondary"}>
                {product.is_indian ? "🇮🇳 Indian" : product.country_of_origin}
              </Badge>
            </div>
            
            <p className="text-muted-foreground">{product.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span>{product.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{product.rating}/5</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-3xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {product.availability.replace(/_/g, ' ')}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Available at:
              </p>
              <div className="flex flex-wrap gap-2">
                {parseWhereToBuy(product.where_to_buy).map((store: string, idx: number) => (
                  <Badge key={idx} variant="outline">{store}</Badge>
                ))}
              </div>
            </div>

            {!product.is_indian && alternatives.length > 0 && (
              <div className="pt-6 border-t space-y-4">
                <h3 className="text-xl font-semibold text-primary">🇮🇳 Indian Alternatives</h3>
                {alternatives.map((alt: any) => (
                  <div key={alt.id} className="bg-background border border-indian-saffron/30 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{alt.indian_product.name}</h4>
                        <p className="text-sm text-muted-foreground">{alt.indian_product.brand}</p>
                      </div>
                      <Badge className="bg-indian-green text-white">
                        {alt.match_score}% Match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alt.reason}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {alt.price_comparison.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {alt.quality_comparison} quality
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-indian-green">₹{alt.indian_product.price}</p>
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