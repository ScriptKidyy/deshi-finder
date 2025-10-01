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
