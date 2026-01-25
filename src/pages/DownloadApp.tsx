import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Smartphone, 
  Download, 
  CheckCircle, 
  Zap, 
  Bell, 
  Shield, 
  ArrowRight,
  Star,
  Users,
  ShoppingBag
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/mycampuskart-logo.png';

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();

  // SEO meta tags
  useEffect(() => {
    document.title = 'Download MyCampusKart App - Buy & Sell on Campus | Free PWA';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Download the MyCampusKart app for free. Buy and sell second-hand items on your college campus. Fast, secure, and works offline. Available on all devices.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Download the MyCampusKart app for free. Buy and sell second-hand items on your college campus. Fast, secure, and works offline. Available on all devices.';
      document.head.appendChild(meta);
    }

    // Add keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const keywords = document.createElement('meta');
      keywords.name = 'keywords';
      keywords.content = 'MyCampusKart, campus marketplace, college buy sell, student marketplace, second hand college, PWA app, download app, campus app';
      document.head.appendChild(keywords);
    }

    return () => {
      document.title = 'MyCampusKart';
    };
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant loading with native app performance'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Never miss a message or deal'
    },
    {
      icon: Shield,
      title: 'Secure & Verified',
      description: 'KYC verified students only'
    },
    {
      icon: Download,
      title: 'Works Offline',
      description: 'Browse listings even without internet'
    }
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Students' },
    { icon: ShoppingBag, value: '50,000+', label: 'Items Listed' },
    { icon: Star, value: '4.8', label: 'App Rating' }
  ];

  const installSteps = [
    {
      step: 1,
      title: 'Click Install',
      description: 'Tap the install button below or use browser menu'
    },
    {
      step: 2,
      title: 'Add to Home Screen',
      description: 'Follow the prompt to add app to your device'
    },
    {
      step: 3,
      title: 'Start Trading!',
      description: 'Open the app and buy or sell instantly'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <nav className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} alt="MyCampusKart" className="h-10 w-auto" />
              <span className="font-bold text-xl text-foreground">MyCampusKart</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Open in Browser
            </Button>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Download the
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> MyCampusKart </span>
                  App
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  The #1 student marketplace app for buying and selling second-hand items on your college campus. Free, fast, and secure.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {canInstall ? (
                  <Button size="lg" className="gap-2 text-lg px-8 py-6" onClick={installApp}>
                    <Download className="h-5 w-5" />
                    Install App Now
                  </Button>
                ) : (
                  <Button size="lg" className="gap-2 text-lg px-8 py-6" onClick={() => navigate('/dashboard')}>
                    <Smartphone className="h-5 w-5" />
                    Open Web App
                  </Button>
                )}
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6" onClick={() => navigate('/auth')}>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                      <stat.icon className="h-5 w-5" />
                      {stat.value}
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-72 h-[580px] bg-gradient-to-br from-card to-muted rounded-[3rem] border-8 border-foreground/10 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-8 bg-foreground/5 flex items-center justify-center">
                    <div className="w-20 h-5 bg-foreground/10 rounded-full" />
                  </div>
                  <div className="pt-10 px-4 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
                      <img src={logo} alt="Logo" className="h-10 w-10" />
                      <div>
                        <p className="font-semibold text-sm">MyCampusKart</p>
                        <p className="text-xs text-muted-foreground">Campus Marketplace</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-muted rounded-xl p-3 animate-pulse">
                          <div className="h-24 bg-muted-foreground/10 rounded-lg mb-2" />
                          <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                          <div className="h-3 bg-muted-foreground/10 rounded w-1/2 mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Use the App?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get the best experience with our Progressive Web App - all the benefits of a native app without the app store download.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-card">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Install Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How to Install</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Installing MyCampusKart is quick and easy. Follow these simple steps:
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {installSteps.map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                  {item.step < 3 && (
                    <ArrowRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Browser-specific instructions */}
          <div className="mt-16 max-w-3xl mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Manual Installation Instructions
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-medium mb-2">Chrome / Edge:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        Look for install icon in address bar
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        Or click menu → "Install App"
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Safari (iOS):</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        Tap Share button at bottom
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        Select "Add to Home Screen"
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of students already using MyCampusKart to buy and sell on campus.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {canInstall ? (
              <Button size="lg" className="gap-2 px-8" onClick={installApp}>
                <Download className="h-5 w-5" />
                Install App
              </Button>
            ) : (
              <Button size="lg" className="gap-2 px-8" onClick={() => navigate('/dashboard')}>
                <Smartphone className="h-5 w-5" />
                Open Web App
              </Button>
            )}
            <Button size="lg" variant="outline" className="gap-2 px-8" onClick={() => navigate('/auth')}>
              Sign Up Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="MyCampusKart" className="h-8 w-auto" />
              <span className="font-semibold">MyCampusKart</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/about" className="hover:text-primary transition-colors">About</a>
              <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
              <a href="/help" className="hover:text-primary transition-colors">Help</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MyCampusKart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DownloadApp;
