import { DataImporter } from "@/components/DataImporter";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"></div>
        <div className="max-w-6xl mx-auto px-8 py-20 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-4">
              <span className="text-4xl">🇮🇳</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-gradient-accent bg-clip-text text-transparent">
              VocalKart
            </h1>
            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
              Discover authentic Indian alternatives for every product
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-16 space-y-12">
        <DataImporter />

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-8 space-y-4 hover:shadow-elevated transition-all">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">📸</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Scanner</h3>
            <p className="text-muted-foreground leading-relaxed">
              Scan product barcodes to identify products and find Indian alternatives instantly
            </p>
          </div>

          <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-8 space-y-4 hover:shadow-elevated transition-all">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Search</h3>
            <p className="text-muted-foreground leading-relaxed">
              Search for products by name and discover high-quality local alternatives
            </p>
          </div>

          <div className="bg-gradient-card backdrop-blur-glass border border-border/50 rounded-3xl p-8 space-y-4 hover:shadow-elevated transition-all">
            <div className="w-16 h-16 rounded-2xl bg-indian/10 flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Manage</h3>
            <p className="text-muted-foreground leading-relaxed">
              Browse and manage the complete product database with ease
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
