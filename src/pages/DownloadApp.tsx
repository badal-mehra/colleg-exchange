import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, Download, CheckCircle, Zap, 
  Bell, Shield, ArrowRight, Star, Users, 
  ShoppingBag, Monitor, SmartphoneNfc, Globe,
  MousePointerClick, Sparkles, Laugh, Coffee, Rocket,
  Pizza, Trash2, IndianRupee, Timer
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
      emoji: "🤡",
      setup: "Buying a brand new Lab Coat for one semester:",
      punchline: "MyCampusKart: 'Get a used one for ₹150 and spend the rest on Maggi.'"
    },
    {
      emoji: "🏃‍♂️",
      setup: "POV: You're graduating in 2 days and still have a cycle to sell.",
      punchline: "Post it in 30 seconds. Sell it before your convocation."
    },
    {
      emoji: "📉",
      setup: "Your bank account on the 20th of the month:",
      punchline: "Time to sell that 'aesthetic' lamp you never turn on."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-primary/20">
      {/* --- Minimalist Nav --- */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="MyCampusKart" className="h-9 w-auto" />
            <span className="font-black text-xl tracking-tighter">MyCampusKart</span>
          </div>
          <Badge variant="outline" className="hidden sm:flex border-primary/20 text-primary animate-pulse">
            v2.0 LIVE
          </Badge>
        </div>
      </nav>

      {/* --- HERO: The Big Hook --- */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                No App Store. No Storage. No Bull.
              </div>
              
              <h1 className="text-6xl lg:text-8xl font-[900] tracking-tight leading-[0.85] text-slate-900">
                The App Your <br />
                <span className="text-primary italic">Wallet Needs.</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                The only place where "Broke College Student" isn't a personality trait—it's a business opportunity.
              </p>

              {/* THE ULTRA-GIGA INSTALL BUTTON */}
              <div className="relative group max-w-md mx-auto lg:mx-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[2.2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <Button 
                  size="lg" 
                  className="relative w-full h-28 rounded-[2rem] text-2xl font-black shadow-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 overflow-hidden"
                  onClick={canInstall ? installApp : () => navigate('/dashboard')}
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-8 w-8" />
                    <span>GET THE APP</span>
                  </div>
                  <span className="text-xs font-normal opacity-70 tracking-[0.2em]">WORKS ON {platform.toUpperCase()} INSTANTLY</span>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 text-slate-400 font-bold text-sm uppercase tracking-widest">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Secure</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Fast</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Free</div>
              </div>
            </div>

            {/* Interactive Phone Mockup */}
            <div className="flex-1 relative hidden lg:block">
              <div className="relative mx-auto w-[340px] h-[680px] bg-slate-950 rounded-[4rem] border-[14px] border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.02] duration-500">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-slate-900 rounded-b-[2rem] z-20" />
                <div className="absolute inset-0 m-1.5 bg-white rounded-[3.2rem] overflow-hidden flex flex-col">
                   {/* App UI Simulation */}
                   <div className="p-6 pt-12 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-32 bg-slate-100 rounded-full" />
                        <div className="w-8 h-8 bg-primary/10 rounded-full" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-48 bg-slate-100 rounded-3xl flex items-center justify-center">
                          <IndianRupee className="h-12 w-12 text-slate-300" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                          <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-blue-50 rounded-2xl border border-blue-100" />
                        <div className="h-20 bg-orange-50 rounded-2xl border border-orange-100" />
                      </div>
                   </div>
                </div>
              </div>
              {/* Floating Stat Card */}
              <div className="absolute -left-12 bottom-20 bg-white p-6 rounded-[2rem] shadow-2xl border-t border-slate-50 flex items-center gap-4 animate-float">
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white font-bold">₹</div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Avg. Student Savings</p>
                  <p className="text-xl font-black">₹4,200 / Sem</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- THE PIZZA INDEX (Savings Hook) --- */}
      <section className="py-24 bg-primary text-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-6xl font-black leading-none italic">
                The "Pizza Index" <br />
                Savings Calculator
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                We calculated it. By using MyCampusKart instead of buying new, the average student saves enough to buy:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                  <Pizza className="h-8 w-8 mb-4 text-orange-300" />
                  <p className="text-3xl font-black">12</p>
                  <p className="text-sm opacity-70 uppercase font-bold tracking-tighter">Large Pizzas</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                  <Coffee className="h-8 w-8 mb-4 text-blue-200" />
                  <p className="text-3xl font-black">45</p>
                  <p className="text-sm opacity-70 uppercase font-bold tracking-tighter">Iced Coffees</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="p-8 bg-white rounded-[3rem] shadow-2xl text-slate-900">
                <h4 className="font-black text-2xl mb-6">Why Students ❤️ It:</h4>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-1">✓</div>
                    <p className="font-medium"><strong>Skip the Shipping:</strong> Meet at the library, canteen, or hostel gate.</p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-1">✓</div>
                    <p className="font-medium"><strong>Verified Seniors:</strong> Buy from people you actually see on campus.</p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-1">✓</div>
                    <p className="font-medium"><strong>Zero Trash:</strong> Give your old cooler a second life instead of the bin.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MEME GRID --- */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-16 uppercase tracking-tighter">Real Talk Only</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {memes.map((meme, i) => (
              <div key={i} className="group p-10 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 text-left">
                <span className="text-5xl block mb-6 transform group-hover:scale-110 transition-transform">{meme.emoji}</span>
                <p className="text-slate-400 font-bold text-sm mb-4 uppercase tracking-widest">{meme.setup}</p>
                <p className="text-xl font-black text-slate-800 leading-snug">{meme.punchline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SUPER SIMPLE STEPS --- */}
      <section className="py-24 bg-slate-950 text-white rounded-t-[4rem]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">How to Get It <br /><span className="text-primary">(In 15 Seconds)</span></h2>
              <p className="text-slate-400">Seriously, it's that fast.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-2xl font-black shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">1</div>
                <h4 className="font-bold">Open Site</h4>
                <p className="text-slate-500 text-sm">You're already here. Good job.</p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">2</div>
                <h4 className="font-bold">{platform === 'ios' ? 'Tap Share' : 'Tap Menu'}</h4>
                <p className="text-slate-500 text-sm">{platform === 'ios' ? 'Look for the square icon with an arrow.' : 'Click the 3 dots in the corner.'}</p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">3</div>
                <h4 className="font-bold italic">Add to Home</h4>
                <p className="text-slate-500 text-sm">The icon appears on your phone. Done.</p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="mt-12 h-20 px-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xl"
              onClick={canInstall ? installApp : () => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              LET'S DO THIS
            </Button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-slate-950 text-slate-600 text-center border-t border-white/5">
        <p className="font-bold tracking-widest uppercase text-xs mb-4">No App Store • No Data Selling • Just Campus Love</p>
        <p className="text-xs opacity-50">© 2026 MyCampusKart. Built by students who were tired of being overcharged.</p>
      </footer>
    </div>
  );
};

export default DownloadApp;
