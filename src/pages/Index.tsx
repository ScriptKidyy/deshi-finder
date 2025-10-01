import { DataImporter } from "@/components/DataImporter";

const Index = () => {
  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            🇮🇳 Welcome to VocalKart
          </h1>
          <p className="text-lg text-muted-foreground">
            Scan products and discover Indian alternatives
          </p>
        </div>

        <DataImporter />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="h-12 w-12 rounded-full bg-indian-saffron/20 flex items-center justify-center">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-xl font-semibold">Scanner</h3>
            <p className="text-muted-foreground">
              Scan product barcodes to identify products and find Indian alternatives
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="h-12 w-12 rounded-full bg-indian-green/20 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold">Search</h3>
            <p className="text-muted-foreground">
              Search for products by name and discover local alternatives
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold">Manage</h3>
            <p className="text-muted-foreground">
              Browse and manage the complete product database
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
