import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, Download, CheckCircle, Zap, 
  Bell, Shield, ArrowRight, Star, Users, 
  ShoppingBag, Monitor, SmartphoneNfc, Globe,
  MousePointerClick, Sparkles
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall'; // Ensure this hook handles 'beforeinstallprompt'
import logo from '@/assets/mycampuskart-logo.png';

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  // Logic to detect platform for personalized "Hooks"
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) setPlatform('ios');
    else if (/android/.test(userAgent)) setPlatform('android');
    else setPlatform('desktop');
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/10">
      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="MyCampusKart" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-tight">MyCampusKart</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>Marketplace</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/safety')}>Safety</Button>
            <Button size="sm" className="rounded-full px-5" onClick={() => navigate('/auth')}>Login</Button>
          </div>
        </div>
      </nav>

      {/* --- The "Hook" Hero --- */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>The Future of Campus Trading is Here</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Stop Browsing, <br />
                <span className="text-primary italic">Start Dealing.</span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Join 10,000+ students. Buy a textbook in the morning, sell your old mini-fridge by the afternoon. <strong>No App Store required.</strong>
              </p>

              {/* Dynamic Action Area */}
              <div className="p-2 bg-slate-50 rounded-3xl border border-slate-100 inline-block w-full max-w-md shadow-inner">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    size="lg" 
                    className="flex-1 h-16 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25 hover:translate-y-[-2px] transition-all"
                    onClick={canInstall ? installApp : () => navigate('/dashboard')}
                  >
                    {canInstall ? (
                      <><Download className="mr-2 h-6 w-6" /> Install App</>
                    ) : (
                      <><Smartphone className="mr-2 h-6 w-6" /> Open Web App</>
                    )}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1 h-16 rounded-2xl text-lg font-semibold border-slate-200 bg-white"
                    onClick={() => navigate('/auth')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>

              {/* Detailed Trust Hook */}
              <div className="grid grid-cols-3 gap-4 pt-6 max-w-sm mx-auto lg:mx-0">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">50k+</p>
                  <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Listings</p>
                </div>
                <div className="space-y-1 border-x border-slate-100">
                  <p className="text-2xl font-bold text-green-600">Free</p>
                  <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">For Students</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">4.9/5</p>
                  <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Avg. Rating</p>
                </div>
              </div>
            </div>

            {/* Mockup with "Live" Feel */}
            <div className="flex-1 relative perspective-1000">
              <div className="relative mx-auto w-[300px] h-[600px] bg-slate-900 rounded-[3.5rem] border-[12px] border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] transform lg:rotate-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-20" />
                <div className="absolute inset-0 m-1 bg-white rounded-[2.8rem] overflow-hidden">
                  <div className="bg-primary h-24 p-6 text-white">
                    <div className="flex justify-between items-center mt-4">
                      <div className="h-2 w-12 bg-white/30 rounded" />
                      <Bell className="h-5 w-5 opacity-80" />
                    </div>
                  </div>
                  <div className="p-4 space-y-4 -mt-6">
                    <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-50 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">A</div>
                        <div>
                          <p className="text-xs font-bold">Aryan (Verification Pending)</p>
                          <p className="text-[10px] text-slate-400">IIT Delhi Campus</p>
                        </div>
                      </div>
                      <div className="h-32 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-300">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                      <div className="h-4 w-3/4 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- The "PWA Benefit" Section (Detailed Hook) --- */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                No Store, No Hassle. <br />
                Just Instant Access.
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Zero Storage', desc: 'Takes up less than 1MB of space compared to 100MB+ native apps.', icon: SmartphoneNfc },
                  { title: 'Privacy First', desc: 'No tracking through app store accounts. Just secure campus trading.', icon: Shield },
                  { title: 'Works Offline', desc: 'Check your saved chats and listings even when campus Wi-Fi drops.', icon: Globe }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <item.icon className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 md:p-12">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <MousePointerClick className="text-primary" />
                How to Download
              </h3>
              
              <div className="space-y-8 relative">
                {/* Visual Connector Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary to-transparent" />
                
                <div className="relative flex gap-6 group">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 z-10">1</div>
                  <div>
                    <h5 className="font-bold mb-1">Visit MyCampusKart.com</h5>
                    <p className="text-slate-400 text-sm">Open this page in Chrome or Safari.</p>
                  </div>
                </div>

                <div className="relative flex gap-6 group">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 z-10">2</div>
                  <div>
                    <h5 className="font-bold mb-1">Tap {platform === 'ios' ? '"Share"' : '"Install"'}</h5>
                    <p className="text-slate-400 text-sm">
                      {platform === 'ios' 
                        ? 'Look for the share icon at the bottom of Safari.' 
                        : 'Look for the install prompt or click the menu dots.'}
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-6 group">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 z-10">3</div>
                  <div>
                    <h5 className="font-bold mb-1">Add to Home Screen</h5>
                    <p className="text-slate-400 text-sm">Tap the plus icon and the app will appear on your phone instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Final CTA --- */}
      <section className="py-24 text-center">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-4xl font-black mb-6">Ready to save your pocket money?</h2>
          <p className="text-slate-500 mb-10 text-lg">
            Stop paying retail prices for things you'll only use for a semester. Join your campus marketplace today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button size="lg" className="px-10 py-7 text-lg rounded-2xl shadow-2xl shadow-primary/30" onClick={canInstall ? installApp : () => navigate('/dashboard')}>
                Download the App
             </Button>
             <Button size="lg" variant="ghost" className="px-10 py-7 text-lg rounded-2xl" onClick={() => navigate('/faq')}>
                How it works
                <ArrowRight className="ml-2 h-5 w-5" />
             </Button>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-60">
            <img src={logo} alt="Logo" className="h-6" />
            <span className="font-bold">MyCampusKart</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
          </div>
          <p className="text-sm text-slate-400 font-medium">© 2026 Built for Students, by Students.</p>
        </div>
      </footer>
    </div>
  );
};

export default DownloadApp;
