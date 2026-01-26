import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, Download, CheckCircle, Zap, 
  Sparkles, Coffee, Pizza, IndianRupee, 
  ArrowRight, Share, PlusSquare, MoreVertical,
  ShieldCheck, Rocket, Heart
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import logo from '@/assets/mycampuskart-logo.png';

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) setPlatform('ios');
    else if (/android/.test(userAgent)) setPlatform('android');
    else setPlatform('desktop');

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-primary/30 selection:text-primary-foreground font-sans antialiased">
      {/* --- Magnetic Nav --- */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'py-3 bg-white/70 backdrop-blur-md border-b' : 'py-6 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => navigate('/')}
          >
            <div className="relative">
                <img src={logo} alt="Logo" className="h-10 w-auto group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
            </div>
            <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                MyCampusKart
            </span>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden md:flex bg-primary/5 text-primary border-none font-bold px-3 py-1">
              v2.0 LIGHTNING FAST
            </Badge>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex-1 text-center lg:text-left space-y-8"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3 text-yellow-400" />
                The Future is PWA
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl lg:text-[100px] font-[1000] tracking-tight leading-[0.8] text-slate-900">
                Less Bloat. <br />
                <span className="text-primary relative">
                    More Cash.
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 25 0 50 5 T 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                    </svg>
                </span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                No App Store middlemen. No 200MB downloads. Just the best campus marketplace, living right on your home screen.
              </motion.p>

              <motion.div variants={itemVariants} className="relative group max-w-md mx-auto lg:mx-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-blue-600 rounded-[2.2rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <Button 
                  size="lg" 
                  className="relative w-full h-24 rounded-[2rem] text-xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/90"
                  onClick={canInstall ? installApp : () => navigate('/dashboard')}
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-6 w-6" />
                    <span>{canInstall ? 'INSTALL INSTANTLY' : 'OPEN DASHBOARD'}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-60 tracking-[0.3em]">
                    {platform === 'desktop' ? 'OPTIMIZED FOR CHROME/EDGE' : `PERFECT FOR YOUR ${platform.toUpperCase()}`}
                  </span>
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-8">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-tighter">
                    <ShieldCheck className="h-5 w-5 text-primary" /> End-to-End Encryption
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-tighter">
                    <Zap className="h-5 w-5 text-primary" /> 0.5s Load Time
                </div>
              </motion.div>
            </motion.div>

            {/* --- THE PHONE MOCKUP (Framer Enhanced) --- */}
            <motion.div 
              initial={{ x: 100, opacity: 0, rotate: 5 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 relative hidden lg:block"
            >
              <div className="relative mx-auto w-[320px] h-[640px] bg-slate-950 rounded-[3.5rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden">
                {/* Screen Content */}
                <div className="absolute inset-0 bg-white p-4 pt-10">
                    <div className="flex justify-between items-center mb-8">
                        <div className="h-4 w-24 bg-slate-100 rounded-full" />
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Heart className="h-4 w-4 text-primary fill-primary" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center">
                            <img src={logo} className="h-20 w-auto opacity-20 grayscale" alt="" />
                        </div>
                        <div className="h-6 w-2/3 bg-slate-100 rounded-lg animate-pulse" />
                        <div className="h-12 w-full bg-primary/5 rounded-2xl flex items-center px-4 justify-between">
                            <div className="h-4 w-20 bg-primary/20 rounded-full" />
                            <div className="h-6 w-12 bg-primary rounded-lg" />
                        </div>
                    </div>
                </div>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20" />
              </div>
              
              {/* Floating Notifications */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -right-8 top-20 bg-white p-4 rounded-2xl shadow-xl border flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                    <Rocket className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Sold in 5 mins!</p>
                    <p className="text-sm font-bold">Physics Lab Manual</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- THE PIZZA INDEX --- */}
      <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tighter">
                Stop Paying <br /> <span className="text-primary italic">The "New" Tax.</span>
              </h2>
              <p className="text-slate-400 text-xl font-medium">
                Why buy a brand-new calculator for $40 when the senior down the hall is selling theirs for $5? Use that extra cash for things that actually matter.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary transition-colors">
                    <Pizza className="h-10 w-10 text-primary mb-4" />
                    <p className="text-4xl font-black">12+</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Free Pizzas / Sem</p>
                </div>
                <div className="flex-1 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary transition-colors">
                    <Coffee className="h-10 w-10 text-blue-400 mb-4" />
                    <p className="text-4xl font-black">45</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Iced Lattes Saved</p>
                </div>
              </div>
            </div>
            
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-3xl group-hover:bg-primary/30 transition-all" />
                <Card className="relative bg-white border-none p-10 rounded-[3rem] shadow-2xl">
                    <ul className="space-y-8">
                        {[
                            { icon: <MapPin className="text-red-500" />, title: "Library Meetups", desc: "No shipping fees. No strangers. Meet at your favorite campus spot." },
                            { icon: <Users className="text-blue-500" />, title: "Student Verified", desc: "Every user has a valid campus identity. Total peace of mind." },
                            { icon: <Trash2 className="text-green-500" />, title: "Eco Friendly", desc: "Keep gear in the campus ecosystem, not the landfill." }
                        ].map((feat, i) => (
                            <li key={i} className="flex gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                    {feat.icon}
                                </div>
                                <div>
                                    <h4 className="font-black text-lg">{feat.title}</h4>
                                    <p className="text-slate-500 font-medium">{feat.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
          </div>
        </div>
      </section>

      {/* --- PLATFORM SPECIFIC STEPS --- */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">How to Install</h2>
            <p className="text-slate-500">Wait, no App Store? Nope. Just 3 taps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {platform === 'ios' ? (
                <>
                    <StepCard step="1" title="Tap Share" desc="Tap the 'Share' icon in Safari's bottom toolbar." icon={<Share className="h-6 w-6" />} />
                    <StepCard step="2" title="Scroll Down" desc="Select 'Add to Home Screen' from the menu." icon={<PlusSquare className="h-6 w-6" />} />
                    <StepCard step="3" title="Confirm" desc="Tap 'Add' and watch the magic happen." icon={<CheckCircle className="h-6 w-6" />} />
                </>
            ) : (
                <>
                    <StepCard step="1" title="Tap Menu" desc="Tap the 3-dots in Chrome's top right corner." icon={<MoreVertical className="h-6 w-6" />} />
                    <StepCard step="2" title="Install" desc="Find and tap 'Install App' or 'Add to Home'." icon={<Download className="h-6 w-6" />} />
                    <StepCard step="3" title="Launch" desc="Open it from your home screen like any other app." icon={<Rocket className="h-6 w-6" />} />
                </>
            )}
          </div>
        </div>
      </section>

      <footer className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
            <img src={logo} alt="" className="h-12 w-auto mx-auto mb-6 grayscale opacity-50" />
            <p className="font-black text-xs uppercase tracking-[0.4em] text-slate-400 mb-8">
                Built for students • By students
            </p>
            <div className="flex justify-center gap-8 mb-8 text-slate-400">
                <a href="#" className="hover:text-primary transition-colors font-bold text-sm">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors font-bold text-sm">Terms</a>
                <a href="#" className="hover:text-primary transition-colors font-bold text-sm">Support</a>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">© 2026 MyCampusKart. Not affiliated with any App Store. Powered by PWA technology.</p>
        </div>
      </footer>
    </div>
  );
};

// Reusable Component for Steps
const StepCard = ({ step, title, desc, icon }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-4"
    >
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary relative">
            <span className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-white text-[10px] font-black rounded-lg flex items-center justify-center">{step}</span>
            {icon}
        </div>
        <h4 className="font-black text-xl uppercase tracking-tighter">{title}</h4>
        <p className="text-slate-500 font-medium text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

const MapPin = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

export default DownloadApp;
