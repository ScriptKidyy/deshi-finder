import { DataImporter } from "@/components/DataImporter";
import { Scan, Search, Package, Sparkles, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Large and Dramatic */}
      <div className="relative overflow-hidden bg-gradient-hero min-h-[85vh] flex items-center justify-center">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center space-y-8">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/90 backdrop-blur-sm rounded-3xl mb-6 shadow-dramatic">
              <span className="text-5xl">🇮🇳</span>
            </div>
            
            {/* Main heading */}
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight">
              <span className="bg-gradient-accent bg-clip-text text-transparent">VocalKart</span>
            </h1>
            
            {/* Tagline */}
            <p className="text-xl md:text-3xl text-foreground/70 max-w-3xl mx-auto font-light leading-relaxed">
              Discover authentic Indian alternatives<br />for every product you love
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/scanner">
                <button className="group px-8 py-4 bg-foreground text-background rounded-2xl font-semibold text-lg hover:scale-105 transition-transform shadow-elevated">
                  Start Scanning
                  <Sparkles className="inline-block ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </Link>
              <Link to="/search">
                <button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-foreground rounded-2xl font-semibold text-lg hover:scale-105 transition-transform border border-border">
                  Explore Products
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-20 relative z-20">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-dramatic p-8 md:p-12 border border-border/50">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">10K+</div>
              <div className="text-muted-foreground font-medium">Products Scanned</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">5K+</div>
              <div className="text-muted-foreground font-medium">Indian Alternatives</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">98%</div>
              <div className="text-muted-foreground font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Importer */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <DataImporter />
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to discover and support Indian brands
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Scanner */}
          <div className="group bg-white rounded-3xl p-10 hover:shadow-dramatic transition-all duration-300 border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Smart Scanner</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Scan any product barcode to instantly identify it and find authentic Indian alternatives
            </p>
            <Link to="/scanner" className="text-primary font-semibold hover:underline">
              Try Scanner →
            </Link>
          </div>

          {/* Search */}
          <div className="group bg-white rounded-3xl p-10 hover:shadow-dramatic transition-all duration-300 border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Quick Search</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Search products by name and discover high-quality local alternatives instantly
            </p>
            <Link to="/search" className="text-primary font-semibold hover:underline">
              Start Searching →
            </Link>
          </div>

          {/* Manage */}
          <div className="group bg-white rounded-3xl p-10 hover:shadow-dramatic transition-all duration-300 border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Product Database</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Browse and manage thousands of products with detailed information and insights
            </p>
            <Link to="/manage-products" className="text-primary font-semibold hover:underline">
              View Database →
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-dark text-white py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Why Choose VocalKart?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Supporting local brands has never been easier
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <Shield className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-2xl font-bold mb-3">AI-Powered Verification</h3>
              <p className="text-white/70 leading-relaxed">
                Advanced AI validates product origins and suggests the best Indian alternatives with confidence scores
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <TrendingUp className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-2xl font-bold mb-3">Smart Matching</h3>
              <p className="text-white/70 leading-relaxed">
                Our algorithm finds alternatives based on nutrition, category, and quality to ensure perfect matches
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <Sparkles className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-2xl font-bold mb-3">Always Growing</h3>
              <p className="text-white/70 leading-relaxed">
                Our database expands daily with new products and alternatives, powered by community and AI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="bg-gradient-hero rounded-3xl p-12 md:p-20 text-center shadow-dramatic">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to support Indian brands?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start discovering authentic alternatives today
          </p>
          <Link to="/scanner">
            <button className="px-10 py-5 bg-foreground text-background rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-elevated">
              Get Started Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
