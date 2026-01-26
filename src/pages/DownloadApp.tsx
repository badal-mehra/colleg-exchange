import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, Download, CheckCircle, Zap, 
  Bell, Shield, ArrowRight, Star, Users, 
  ShoppingBag, Monitor, ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import logo from '@/assets/mycampuskart-logo.png';

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();

  // Optimized SEO Management
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Download MyCampusKart | The College Marketplace App';
    
    return () => { document.title = originalTitle; };
  }, []);

  const features = [
    { icon: Zap, title: 'Native Speed', desc: 'Zero lag, instant transitions.' },
    { icon: Bell, title: 'Smart Alerts', desc: 'Real-time price drop alerts.' },
    { icon: Shield, title: 'Verified Only', desc: 'Exclusively for college students.' },
    { icon: Download, title: 'Offline Access', desc: 'Browse saved items without data.' }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/10">
      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="MyCampusKart" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-tight">MyCampusKart</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-muted-foreground">
            Launch Web Version
          </Button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <Badge variant="secondary" className="px-3 py-1 text-primary bg-primary/5 border-primary/10">
                Now available as a PWA
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900">
                Your Campus <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                  In Your Pocket
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience the fastest way to buy and sell textbooks, electronics, and dorm essentials with your fellow students.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="h-14 px-8 text-md font-semibold shadow-xl shadow-primary/20 transition-all hover:scale-105" onClick={canInstall ? installApp : () => navigate('/dashboard')}>
                  {canInstall ? <Download className="mr-2 h-5 w-5" /> : <Smartphone className="mr-2 h-5 w-5" />}
                  {canInstall ? 'Install to Home Screen' : 'Get Started Now'}
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-md border-slate-200" onClick={() => navigate('/auth')}>
                  Sign Up Free
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-4 border-t border-slate-100">
                <div className="text-center lg:text-left">
                  <div className="flex items-center gap-1 font-bold text-2xl">
                    <Users className="h-5 w-5 text-primary" /> 10k+
                  </div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Active Students</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="flex items-center gap-1 font-bold text-2xl">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 4.9
                  </div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">App Rating</p>
                </div>
              </div>
            </div>

            {/* Realistic Phone Mockup */}
            <div className="flex-1 relative">
              <div className="relative mx-auto w-[280px] h-[580px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                {/* Screen Content */}
                <div className="absolute inset-0 m-1 bg-slate-50 rounded-[2.5rem] overflow-hidden">
                  <div className="p-4 pt-10">
                    <div className="h-6 w-24 bg-slate-200 rounded mb-6" />
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                          <div className="aspect-square w-full bg-slate-100 rounded-xl mb-3" />
                          <div className="h-3 w-2/3 bg-slate-200 rounded mb-2" />
                          <div className="h-3 w-1/3 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative Blobs */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Built for the Modern Campus</h2>
            <p className="text-slate-600">No App Store fees. No storage issues. Just a powerful Progressive Web App that works everywhere.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="bg-white border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- Installation Guide --- */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-slate-900 rounded-[2rem] p-8 md:p-16 text-white overflow-hidden relative">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Simple 3-Step Setup</h2>
                <div className="space-y-4">
                  {[
                    'Open MyCampusKart in your mobile browser',
                    'Tap the "Share" or "Menu" icon',
                    'Select "Add to Home Screen"'
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-sm font-bold group-hover:bg-primary transition-colors">
                        {i + 1}
                      </span>
                      <p className="text-slate-300 font-medium">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Monitor className="h-4 w-4" /> Works on Desktop
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Smartphone className="h-4 w-4" /> iOS & Android
                  </div>
                </div>
              </div>
              <div className="hidden lg:block w-px h-48 bg-white/10" />
              <div className="text-center md:text-left">
                <p className="text-slate-400 mb-6 text-sm">Scan to open on your phone</p>
                <div className="w-32 h-32 bg-white rounded-2xl p-2 mx-auto md:mx-0">
                  {/* Placeholder for QR Code */}
                  <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
          </div>
        </div>
      </section>

      {/* --- Simple Footer --- */}
      <footer className="py-12 border-t border-slate-100">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
            <img src={logo} alt="Logo" className="h-6" />
            <span className="font-bold">MyCampusKart</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-primary transition-colors">Safety</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
          <p className="text-sm text-slate-400">© 2026 MyCampusKart Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default DownloadApp;
