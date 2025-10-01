import { useState } from "react";
import { Scan, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Scanner = () => {
  const [barcode, setBarcode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const handleScan = () => {
    if (barcode.trim()) {
      console.log("Scanning barcode:", barcode);
      // TODO: Implement barcode lookup
    }
  };

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

        <div className="bg-card border border-border rounded-2xl p-8 aspect-video flex items-center justify-center">
          {!cameraActive ? (
            <div className="text-center space-y-4">
              <CameraOff className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-lg text-muted-foreground">Camera is off</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Camera active - scanning...</p>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Or enter barcode manually..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1 bg-background border-border"
            />
            <Button onClick={handleScan} size="lg" className="bg-primary hover:bg-primary/90">
              Search
            </Button>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Press Enter or click Search after typing the barcode
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => setCameraActive(!cameraActive)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
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
