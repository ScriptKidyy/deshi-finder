import { useState, useEffect, useRef } from "react";
import { Scan, CameraOff, Package, Star, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { searchProductByBarcode, getAlternativesForProduct, Product } from "@/lib/productData";

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
    
    const foundProduct = await searchProductByBarcode(scannedCode);
    
    if (foundProduct) {
      setProduct(foundProduct);
      toast.success(`Product Found: ${foundProduct.name}`);
      
      if (!foundProduct.is_indian) {
        const alts = await getAlternativesForProduct(foundProduct.id);
        setAlternatives(alts);
      } else {
        setAlternatives([]);
      }
    } else {
      setProduct(null);
      setAlternatives([]);
      toast.error(`No product found with barcode: ${scannedCode}`);
    }
    
    setLoading(false);
    stopScanner();
  };

  const checkCameraPermission = async () => {
    // Check if site is secure
    if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
      toast.error("Camera requires HTTPS or localhost. Please use a secure connection.");
      return false;
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access is not supported in this browser.");
      return false;
    }

    try {
      // Request camera permission explicitly first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately after checking permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      console.error("Camera permission error:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error("Camera access denied. Please enable camera permissions in your browser settings.", {
          duration: 5000,
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error("No camera found. Please connect a camera device.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error("Camera is already in use by another application. Please close other apps using the camera.", {
          duration: 5000,
        });
      } else if (err.name === 'OverconstrainedError') {
        toast.error("Camera constraints not supported. Try a different device.");
      } else {
        toast.error(`Camera error: ${err.message || 'Unknown error'}`, {
          duration: 5000,
        });
      }
      return false;
    }
  };

  const startScanner = async () => {
    try {
      setScanning(true);
      
      // Check permission before starting scanner
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setScanning(false);
        return;
      }

      setCameraActive(true);
      html5QrCodeRef.current = new Html5Qrcode(scannerDivId);
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore errors during scanning (happens frequently)
        }
      );
      
      toast.success("Camera started! Point at a barcode to scan.");
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      
      if (err.message && err.message.includes("Permission")) {
        toast.error("Camera permission denied. Click the lock icon 🔒 in the address bar and allow camera access.", {
          duration: 6000,
        });
      } else if (err.message && err.message.includes("NotFound")) {
        toast.error("No camera device found.");
      } else {
        toast.error("Failed to start camera scanner. Please try again or enter barcode manually.", {
          duration: 5000,
        });
      }
      
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
        console.error("Error stopping scanner:", err);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            🇮🇳 VocalKart Scanner
          </h1>
          <p className="text-lg text-muted-foreground">
            Scan any product to discover amazing Indian alternatives
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 aspect-video flex items-center justify-center overflow-hidden">
          {!cameraActive ? (
            <div className="text-center space-y-4">
              <CameraOff className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-lg text-muted-foreground">Camera is off</p>
            </div>
          ) : (
            <div id={scannerDivId} className="w-full h-full flex items-center justify-center" />
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Or enter barcode manually..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan(barcode)}
              className="flex-1 bg-background border-border"
            />
            <Button 
              onClick={() => handleScan(barcode)} 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
              disabled={!barcode || loading}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Press Enter or click Search after typing the barcode
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={toggleScanner}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            disabled={scanning && !cameraActive}
          >
            <Scan className="h-5 w-5" />
            {cameraActive ? "Stop Scanner" : "Start Scanner"}
          </Button>
        </div>

        {/* Product Details */}
        {product && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
                <p className="text-lg text-muted-foreground">{product.brand}</p>
              </div>
              <Badge variant={product.is_indian ? "default" : "secondary"} className="text-sm px-3 py-1">
                {product.is_indian ? "🇮🇳 Indian" : `${product.country_of_origin}`}
              </Badge>
            </div>
            
            <p className="text-muted-foreground">{product.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{product.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{product.rating}/5</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-3xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {product.availability.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Available at:
              </p>
              <div className="flex flex-wrap gap-2">
                {product.where_to_buy.map((store, idx) => (
                  <Badge key={idx} variant="outline">{store}</Badge>
                ))}
              </div>
            </div>

            {!product.is_indian && alternatives.length > 0 && (
              <div className="pt-6 border-t space-y-4">
                <h3 className="text-xl font-semibold text-primary">🇮🇳 Indian Alternatives</h3>
                <div className="space-y-4">
                  {alternatives.slice(0, 3).map(({ alternative, product: altProduct }) => (
                    <div key={alternative.id} className="bg-background border border-indian-saffron/30 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{altProduct.name}</h4>
                          <p className="text-sm text-muted-foreground">{altProduct.brand}</p>
                        </div>
                        <Badge className="bg-indian-green text-white">
                          {alternative.match_score}% Match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alternative.reason}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize">
                          {alternative.price_comparison.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {alternative.quality_comparison} quality
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-indian-green">₹{altProduct.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
