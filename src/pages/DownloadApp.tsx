import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Smartphone, CheckCircle, Sparkles, 
  Laugh, Copy, Check, Users, ShoppingBag, 
  Zap, ShieldCheck, Pizza, Coffee, ArrowRight,
  IndianRupee, Rocket
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import logo from '@/assets/mycampuskart-logo.png';

// --- Internal Sub-Components for Clean Architecture ---

const TrustBar = () => (
  <div className="bg-white border-y py-8">
    <div className="container mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        { icon: Users, val: "10k+", label: "Verified Students" },
        { icon: ShoppingBag, val: "₹5L+", label: "Total Savings" },
        { icon: Zap, val: "Instant", label: "PWA Setup" },
        { icon: ShieldCheck, val: "Secure", label: "Campus Only" }
      ].map((s, i) => (
        <div key={i} className="text-center space-y-1">
          <s.icon className="h-5 w-5 mx-auto text-primary mb-2" />
          <p className="text-2xl font-black">{s.val}</p>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{s.label}</p>
        </div>
      ))}
    </div>
  </div>
);

const MemeSection = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const memes = [
    { emoji: "🤡", setup: "Buying a new Lab Coat for one semester:", punchline: "Get a used one for ₹150 on MyCampusKart and spend the rest on Maggi." },
    { emoji: "🏃‍♂️", setup: "POV: Graduating in 2 days with a cycle to sell:", punchline: "Post in 30s. Sell before your convocation. Move out rich." },
    { emoji: "📉", setup: "Your bank account on the 20th of the month:", punchline: "Time to sell that 'aesthetic' lamp you never turn on." }
  ];

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-black mb-12 text-center uppercase tracking-tighter italic text-slate-400">Student Real Talk</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {memes.map((meme, i) => (
            <Card key={i} className="p-8 rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all group bg-white">
              <span className="text-5xl block mb-6">{meme.emoji}</span>
              <p className="text-slate-400 font-bold text-xs mb-3 uppercase">{meme.setup}</p>
              <p className="text-xl font-black mb-8 leading-snug text-slate-800">{meme.punchline}</p>
              <button 
                onClick={() => handleCopy(`${meme.setup} ${meme.punchline}`, i)}
                className="flex items-center gap-2 text-[10px] font-black tracking-widest text-primary hover:opacity-70 uppercase"
              >
                {copiedIndex === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedIndex === i ? "Copied to Clipboard" : "Share to Group Chat"}
              </button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Main Page Component ---

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    document.title = "Install MyCampusKart | The Student Marketplace";
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) setPlatform('ios');
    else if (/android/.test(userAgent)) setPlatform('android');
    else setPlatform('desktop');
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/20 overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="MyCampusKart" className="h-9 w-auto" />
            <span className="font-black text-xl tracking-tighter">MyCampusKart</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="font-bold text-slate-500 hover:text-primary">
            Launch Web Version
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-28 lg:pb-36">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left space-y-10">
              <Badge className="bg-primary/10 text-primary border-none px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3 mr-2 inline" />
                Now in 20+ Campuses
              </Badge>
              
              <h1 className="text-6xl lg:text-8xl font-[900] tracking-tighter leading-[0.85] text-slate-950">
                Buy. Sell. <br />
                <span className="text-primary italic">Actually Save.</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                The only student app that pays for your weekend pizza by selling the junk you don't need.
              </p>

              {/* THE MASSIVE CTA */}
              <div className="relative group max-w-md mx-auto lg:mx-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-[2.2rem] blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                <Button 
                  size="lg" 
                  className="relative w-full h-28 rounded-[2rem] text-2xl font-black shadow-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                  onClick={canInstall ? installApp : () => navigate('/dashboard')}
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-8 w-8" />
                    <span>{canInstall ? "INSTALL NOW" : "GET STARTED"}</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-70 tracking-[0.3em] uppercase">
                    No App Store • No Space Needed
                  </span>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                 <div className="text-center">
                    <p className="text-2xl font-black">4.9</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Rating</p>
                 </div>
                 <div className="h-10 w-px bg-slate-100" />
                 <div className="text-center">
                    <p className="text-2xl font-black">50k+</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Items Sold</p>
                 </div>
              </div>
            </div>

            {/* Scrolling Phone Mockup */}
            <div className="flex-1 relative hidden md:block">
              <div className="relative mx-auto w-[320px] h-[640px] bg-slate-950 rounded-[3.5rem] border-[12px] border-slate-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-20" />
                <div className="absolute inset-0 m-1 bg-white rounded-[2.8rem] overflow-hidden flex flex-col">
                  {/* Fake UI Header */}
                  <div className="p-4 pt-10 border-b flex justify-between items-center">
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                    <div className="w-6 h-6 bg-primary/20 rounded-full" />
                  </div>
                  {/* Scrolling Feed Container */}
                  <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-x-0 space-y-4 p-4 animate-vertical-scroll">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border space-y-3">
                          <div className="aspect-square bg-slate-50 rounded-xl flex items-center justify-center">
                             <IndianRupee className="text-slate-200 h-10 w-10" />
                          </div>
                          <div className="h-4 w-2/3 bg-slate-100 rounded" />
                          <div className="h-4 w-1/3 bg-primary/10 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustBar />

      {/* Pizza Index Section */}
      <section className="py-24 bg-primary text-white overflow-hidden">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl font-[900] leading-none italic uppercase">
              The "Pizza Index" <br />
              Savings
            </h2>
            <p className="text-primary-foreground/80 text-lg font-medium">
              We did the math. By trading on campus instead of buying new, you save enough to buy:
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
               <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
                  <Pizza className="h-8 w-8 mb-4 text-orange-300" />
                  <p className="text-4xl font-black">12</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">Large Pizzas</p>
               </div>
               <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
                  <Coffee className="h-8 w-8 mb-4 text-blue-200" />
                  <p className="text-4xl font-black">45</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">Iced Coffees</p>
               </div>
            </div>
          </div>
          <div className="relative p-8 md:p-12 bg-white rounded-[3rem] text-slate-900 shadow-2xl">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-2">
              <Rocket className="text-primary" />
              Why it's better:
            </h3>
            <ul className="space-y-6 font-bold text-slate-600">
               <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-green-600" /></div>
                  <p>ZERO Shipping Fees. Just meet at the library.</p>
               </li>
               <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-green-600" /></div>
                  <p>Verified Seniors. Real students, real gear.</p>
               </li>
               <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-green-600" /></div>
                  <p>Instant Cash. No waiting for 7-day bank transfers.</p>
               </li>
            </ul>
          </div>
        </div>
      </section>

      <MemeSection />

      {/* Installation Guide */}
      <section className="py-24 bg-slate-950 text-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-black mb-16 italic tracking-tighter">Installation for Procrastinators</h2>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="absolute top-8 left-0 right-0 h-px bg-white/10 hidden md:block" />
            {[
              { step: 1, title: "Open in Browser", desc: `Use Safari or Chrome on your phone` },
              { step: 2, title: platform === 'ios' ? "Tap 'Share'" : "Tap 'Menu'", desc: "Look for the share icon or 3-dots" },
              { step: 3, title: "Add to Home", desc: "Select 'Add to Home Screen' and done." }
            ].map((item, i) => (
              <div key={i} className="relative space-y-6">
                <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-2xl font-black shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] z-10 relative">
                  {item.step}
                </div>
                <h4 className="font-bold text-xl">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <Button 
            size="lg" 
            className="mt-20 h-20 px-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xl"
            onClick={canInstall ? installApp : () => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            LET'S DO THIS <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 bg-slate-950 text-slate-600 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-40">
           <img src={logo} alt="Logo" className="h-5 grayscale" />
           <span className="font-bold text-xs uppercase tracking-widest">MyCampusKart Marketplace</span>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Made by students • No App Store needed • v2.0</p>
      </footer>

      {/* Animation Styles */}
      <style>{`
        @keyframes vertical-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-vertical-scroll {
          animation: vertical-scroll 10s linear infinite;
        }
        .animate-vertical-scroll:hover {
          animation-play-state: paused;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default DownloadApp;
