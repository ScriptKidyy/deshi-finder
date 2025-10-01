import { useState, useEffect, useRef } from "react";
import { Scan, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

const Scanner = () => {
  const [barcode, setBarcode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "barcode-scanner";

  const handleScan = (scannedCode: string) => {
    if (scannedCode.trim()) {
      toast.success(`Barcode scanned: ${scannedCode}`);
      console.log("Scanning barcode:", scannedCode);
      setBarcode(scannedCode);
      // TODO: Implement barcode lookup
    }
  };

  const startScanner = async () => {
    try {
      setScanning(true);
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
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Failed to start camera. Please check permissions.");
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
            <Button onClick={() => handleScan(barcode)} size="lg" className="bg-primary hover:bg-primary/90">
              Search
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
      </div>
    </div>
  );
};

export default Scanner;
