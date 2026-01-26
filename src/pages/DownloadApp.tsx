import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, Download, CheckCircle, Zap, 
  Bell, Shield, ArrowRight, Star, Users, 
  ShoppingBag, Monitor, SmartphoneNfc, Globe,
  MousePointerClick, Sparkles, Laugh, Coffee, Rocket
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import logo from '@/assets/mycampuskart-logo.png';

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) setPlatform('ios');
    else if (/android/.test(userAgent)) setPlatform('android');
    else setPlatform('desktop');
  }, []);

  const memes = [
    {
      emoji: "💸",
      setup: "Me looking at the ₹3,000 textbook I'll use for 4 months:",
      punchline: "MyCampusKart: 'I got you for ₹400, fam.'"
    },
    {
      emoji: "📦",
      setup: "POV: It's moving day and you have 4 years of junk.",
      punchline: "Sell it all in 2 minutes on the app before your mom sees the mess."
    },
    {
      emoji: "🍕",
      setup: "Bank balance: ₹42.00",
      punchline: "Sell that old kettle you never used and buy a pizza tonight."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/10">
      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="MyCampusKart" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-tight">MyCampusKart</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-primary">
            Browse Guest Mode
          </Button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left space-y-10">
              <Badge className="bg-orange-100 text-orange-700 border-none px-4 py-1.5 text-sm animate-bounce">
                🚀 100% Student-First Marketplace
              </Badge>
              
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
                Ditch the <br />
                <span className="text-primary italic">Retail Scams.</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                The unofficial official app for students who prefer pizza money over expensive textbooks.
              </p>

              {/* ULTRA BIG INSTALL BUTTON */}
              <div className="space-y-6">
                <Button 
                  size="lg" 
                  className="w-full lg:w-auto h-24 px-12 rounded-[2rem] text-2xl font-black shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.4)] hover:translate-y-[-4px] hover:shadow-[0_30px_60px_-10px_rgba(var(--primary-rgb),0.5)] transition-all active:scale-95 group"
                  onClick={canInstall ? installApp : () => navigate('/dashboard')}
                >
                  {canInstall ? (
                    <div className="flex flex-col items-center sm:flex-row gap-4">
                      <Download className="h-8 w-8 animate-pulse" />
                      <div className="text-left">
                        <span className="block">INSTALL APP NOW</span>
                        <span className="text-sm font-normal opacity-80 uppercase tracking-widest text-center sm:text-left">0MB Download • Works Instantly</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Rocket className="h-8 w-8" />
                      <span>LAUNCH MARKETPLACE</span>
                    </div>
                  )}
                </Button>
                
                <p className="text-sm text-slate-400 flex items-center justify-center lg:justify-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Verified for your college campus
                </p>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="flex-1 relative hidden md:block">
              <div className="relative mx-auto w-[320px] h-[640px] bg-slate-900 rounded-[3.5rem] border-[12px] border-slate-800 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-20" />
                <div className="absolute inset-0 m-1 bg-slate-50 rounded-[2.8rem] overflow-hidden flex flex-col">
                   <div className="p-6 pt-12 space-y-4">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg" />
                        <div className="h-8 flex-1 bg-white rounded-lg border" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3 border">
                        <div className="w-full aspect-square bg-slate-100 rounded-xl" />
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                        <div className="flex justify-between items-center">
                          <span className="font-bold">₹499</span>
                          <div className="h-6 w-12 bg-green-100 rounded" />
                        </div>
                      </div>
                   </div>
                   <div className="mt-auto p-4 bg-white border-t flex justify-around">
                      <div className="h-8 w-8 bg-slate-100 rounded-full" />
                      <div className="h-8 w-8 bg-primary/20 rounded-full" />
                      <div className="h-8 w-8 bg-slate-100 rounded-full" />
                   </div>
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -right-8 top-1/4 bg-white p-4 rounded-2xl shadow-xl border rotate-12 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-xl">🤝</div>
                <div>
                  <p className="text-xs font-bold">Deal Closed!</p>
                  <p className="text-[10px] text-slate-400">Saved ₹1,200 today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MEME / RELATABILITY SECTION --- */}
      <section className="py-24 bg-slate-50 border-y">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 text-primary font-bold">
              <Laugh className="h-5 w-5" />
              <span>Student Realities</span>
            </div>
            <h2 className="text-4xl font-black">Why you actually need this app</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {memes.map((meme, i) => (
              <Card key={i} className="border-none shadow-none bg-white p-8 rounded-[2rem] hover:rotate-1 transition-transform cursor-default group">
                <span className="text-4xl mb-6 block">{meme.emoji}</span>
                <p className="text-slate-500 font-medium mb-4 italic group-hover:text-slate-900 transition-colors">
                  "{meme.setup}"
                </p>
                <div className="h-px w-12 bg-primary/20 mb-4" />
                <p className="font-bold text-lg text-primary">
                  {meme.punchline}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- SERVICE HOOKS --- */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden">
             <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold">Installation for Procrastinators</h3>
                  <p className="text-slate-400">Takes less time than deciding what to order for dinner.</p>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">1</div>
                      <p>Open this site in {platform === 'ios' ? 'Safari' : 'Chrome'}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">2</div>
                      <p>Tap {platform === 'ios' ? '"Add to Home Screen"' : '"Install App"'}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">3</div>
                      <p>Start saving for your next {platform === 'desktop' ? 'trip' : 'night out'}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-6">
                  <div className="w-32 h-32 bg-white rounded-[2rem] mx-auto flex items-center justify-center">
                    <SmartphoneNfc className="h-16 w-16 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-xl">PWA Power</p>
                    <p className="text-slate-400 text-sm">No storage space used. No manual updates. No app store tracking.</p>
                  </div>
                </div>
             </div>
             {/* Abstract background light */}
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/30 blur-[120px]" />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 text-center text-slate-400 text-sm">
        <div className="flex justify-center gap-6 mb-6">
          <Coffee className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
          <Globe className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
          <Users className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
        </div>
        <p>Built with ❤️ and a lot of caffeine for the student community.</p>
        <p className="mt-2 opacity-50">© 2026 MyCampusKart. Not affiliated with any university, just helping you save.</p>
      </footer>
    </div>
  );
};

export default DownloadApp;
