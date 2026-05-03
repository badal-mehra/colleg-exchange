import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, CheckCircle, Sparkles, IndianRupee,
  Flame, AlertTriangle, TrendingDown, ArrowRight,
  Clock, MapPin, ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import logo from '@/assets/mycampuskart-logo.png';

/* ── scroll-reveal hook ── */
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, vis };
}

/* ── animated number ── */
function Count({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(0);
  const { ref, vis } = useFadeUp();
  useEffect(() => {
    if (!vis) return;
    let n = 0; const step = Math.max(1, Math.ceil(to / 55));
    const id = setInterval(() => { n = Math.min(n + step, to); setV(n); if (n >= to) clearInterval(id); }, 16);
    return () => clearInterval(id);
  }, [vis, to]);
  return <span ref={ref}>{prefix}{v.toLocaleString('en-IN')}{suffix}</span>;
}

/* ── live ticker ── */
const TICKS = [
  "🔴 LIVE  Someone in Hostel-6 just listed a lab coat for ₹90",
  "💀  Your attendance is 74.9%. At least make your wallet healthy.",
  "🔴 LIVE  Cycle sold in 11 minutes — Block-32 to Block-40",
  "📉  CGPA: 6.8. Lab coat savings: ₹510. One of these is fixable today.",
  "🔴 LIVE  BTech final-year just dumped their entire room. Go check.",
  "🤡  Your parents think that ₹650 lab coat was 'unavoidable'. It wasn't.",
  "🔴 LIVE  Scientific calculator listed — ₹160 — Near LPU Canteen",
  "👻  Mess food exists. New textbooks don't have to.",
  "🔴 LIVE  3 people bought stuff in the last hour while you were on Instagram",
];
function Ticker() {
  const items = [...TICKS, ...TICKS];
  return (
    <div className="overflow-hidden bg-primary py-2.5 border-y border-primary/20">
      <div className="flex gap-14 whitespace-nowrap" style={{ animation: 'tick 35s linear infinite' }}>
        {items.map((t, i) => (
          <span key={i} className="text-[11px] font-bold tracking-wide text-primary-foreground/90">{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── meme data ── */
const MEMES = [
  {
    situation: "You bought a new lab coat at the store.",
    truth: "Your dad sent ₹5,000 for 'college expenses'. ₹650 of it died for a coat you'll wear exactly 14 times and spill HCl on twice.",
    tag: "Chemistry Semester",
    emoji: "🧪",
    color: "bg-orange-50 border-orange-200",
    tagColor: "bg-orange-100 text-orange-700",
  },
  {
    situation: "CGPA: 6.8. Attendance: 75.1% (survived by 2 lectures).",
    truth: "Two things are struggling this semester. Your grades and your savings. We can't fix the first one. We can absolutely fix the second.",
    tag: "Every LPU Student Ever",
    emoji: "📉",
    color: "bg-red-50 border-red-200",
    tagColor: "bg-red-100 text-red-700",
  },
  {
    situation: "Graduating senior listed their entire room for ₹800.",
    truth: "Mattress topper. Cooler. Calculator. Lab coat. 3 textbooks. They're not sad about selling it. They're sad about everything else. Your gain either way.",
    tag: "Final Year Energy",
    emoji: "🎓",
    color: "bg-blue-50 border-blue-200",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    situation: "Hostel mess served 'sabzi' again. Third time this week.",
    truth: "Mess food is already in your fees. The ₹2,800 you'll save on books and equipment? Spend it on Hunger Point. You've earned it.",
    tag: "Mess Lunch Reality",
    emoji: "🍛",
    color: "bg-yellow-50 border-yellow-200",
    tagColor: "bg-yellow-100 text-yellow-700",
  },
  {
    situation: "Viva is tomorrow. You need a lab coat. It's 9 PM.",
    truth: "Store is closed. Amazon delivery is 2 days. A senior 400m from your hostel has one for ₹110. This app is the only reason that story has a happy ending.",
    tag: "Pre-Viva Speedrun",
    emoji: "⏰",
    color: "bg-purple-50 border-purple-200",
    tagColor: "bg-purple-100 text-purple-700",
  },
  {
    situation: "You're graduating. Cycle, cooler, 4 years of textbooks.",
    truth: "Your parents are coming in 3 days. No space in the car. No space in your new life. Post everything. Right now. Before DSW catches you leaving.",
    tag: "Graduation Countdown",
    emoji: "🚨",
    color: "bg-green-50 border-green-200",
    tagColor: "bg-green-100 text-green-700",
  },
];

/* ── price comparison ── */
const COMPARE = [
  { item: "Lab Coat", store: "₹650", kart: "₹90–₹150", saved: "₹500" },
  { item: "Scientific Calc", store: "₹850", kart: "₹150–₹250", saved: "₹600" },
  { item: "Cycle (Hero)", store: "₹7,500", kart: "₹1,800–₹2,800", saved: "₹4,700" },
  { item: "DSA Book", store: "₹560", kart: "₹80–₹120", saved: "₹440" },
  { item: "Mattress Topper", store: "₹1,200", kart: "₹200–₹400", saved: "₹800" },
];

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [count, setCount] = useState(47);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');
    const id = setInterval(() => setCount(c => c + Math.floor(Math.random() * 2)), 8000);
    return () => clearInterval(id);
  }, []);

  const { ref: s1, vis: v1 } = useFadeUp();
  const { ref: s2, vis: v2 } = useFadeUp();
  const { ref: s3, vis: v3 } = useFadeUp();
  const { ref: s4, vis: v4 } = useFadeUp();

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] text-slate-900 overflow-x-hidden selection:bg-primary/20"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-ring {
          0%{box-shadow:0 0 0 0 hsl(var(--primary)/0.35)}
          70%{box-shadow:0 0 0 16px hsl(var(--primary)/0)}
          100%{box-shadow:0 0 0 0 hsl(var(--primary)/0)}
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .fade-up { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) both; }
        .float-a { animation: floatY 5s ease-in-out infinite; }
        .float-b { animation: floatY 5s ease-in-out 1.8s infinite; }
        .pulse-cta { animation: pulse-ring 2.4s ease-in-out infinite; }
        .live-dot { animation: blink 1.2s ease-in-out infinite; }
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        .row-hover:hover { background: hsl(var(--primary)/0.04); }
        .meme-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.07); }
      `}</style>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="MyCampusKart" className="h-8 w-auto" />
            <span className="font-extrabold text-[17px] tracking-tight text-slate-900">MyCampusKart</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-primary">
            <span className="live-dot w-2 h-2 rounded-full bg-primary inline-block" />
            LPU Only
          </div>
        </div>
      </nav>

      <Ticker />

      {/* ── HERO ── */}
      <section className="relative pt-14 pb-20 overflow-hidden">
        <div className="absolute -top-32 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />

        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-[1fr_420px] gap-12 items-center">

          {/* LEFT */}
          <div className="space-y-7 z-10">
            <div className="fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" /> For LPU Students Only
            </div>

            <h1 className="fade-up text-[58px] lg:text-[72px] font-extrabold leading-[0.92] tracking-tight"
              style={{ animationDelay: '0.08s' }}>
              Buy Used.<br />
              <span className="serif italic" style={{ color: 'hsl(var(--primary))' }}>Stay Alive.</span><br />
              <span className="text-slate-400 font-light">Financially.</span>
            </h1>

            <p className="fade-up text-[17px] text-slate-500 max-w-lg leading-relaxed" style={{ animationDelay: '0.16s' }}>
              MyCampusKart is the marketplace your seniors use to dump their stuff — and your chance to stop paying full price for things you'll use for one semester and hate.
            </p>

            {/* live fomo */}
            <div className="fade-up flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200"
              style={{ animationDelay: '0.22s' }}>
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-800 font-semibold">
                <strong>{count} students</strong> have saved money on campus today. You have not.{' '}
                <span className="text-amber-600 font-bold">That changes now.</span>
              </p>
            </div>

            {/* CTA */}
            <div className="fade-up" style={{ animationDelay: '0.3s' }}>
              <button
                className="pulse-cta group relative w-full max-w-[380px] h-[72px] rounded-2xl font-extrabold text-xl text-primary-foreground flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.98] hover:opacity-95"
                style={{ background: 'hsl(var(--primary))' }}
                onClick={canInstall ? installApp : () => navigate('/dashboard')}
              >
                <span className="flex items-center gap-2.5">
                  <Download className="h-5 w-5" />
                  {canInstall ? 'INSTALL THE APP — FREE' : 'OPEN THE APP — FREE'}
                </span>
                <span className="text-[10px] font-medium opacity-70 tracking-[0.18em] uppercase">
                  Works on {platform} • No App Store
                </span>
              </button>
              <div className="flex items-center gap-5 mt-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                <span className="flex gap-1.5 items-center"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Free Forever</span>
                <span className="flex gap-1.5 items-center"><CheckCircle className="h-3.5 w-3.5 text-green-500" />LPU Verified Students</span>
                <span className="flex gap-1.5 items-center"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Zero Commission</span>
              </div>
            </div>
          </div>

          {/* RIGHT PHONE */}
          <div className="hidden lg:block relative">
            <div className="float-a relative mx-auto w-[300px]">
              <div className="absolute inset-x-12 inset-y-8 rounded-full blur-3xl opacity-20"
                style={{ background: 'hsl(var(--primary))' }} />
              <div className="relative bg-slate-900 rounded-[44px] border-[9px] border-slate-800 shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
                <div className="bg-[#FAFAFA] rounded-[36px] overflow-hidden" style={{ minHeight: '580px' }}>
                  <div className="flex justify-between px-5 pt-9 pb-2 text-[9px] text-slate-400 font-semibold font-mono">
                    <span>9:41</span><span>LPU ● 4G</span>
                  </div>
                  <div className="px-4 pb-6 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Nearby Listings</p>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block live-dot" />LIVE
                      </span>
                    </div>
                    {[
                      { name: "Lab Coat (M)", price: "₹110", loc: "Hostel-6, Block-34", ago: "4 min ago" },
                      { name: "Sci. Calculator", price: "₹170", loc: "Near Canteen, G3", ago: "18 min ago" },
                      { name: "Hero Cycle", price: "₹2,200", loc: "Ground Floor, B-12", ago: "31 min ago" },
                      { name: "DSA + DBMS Books", price: "₹150", loc: "Library Lawn", ago: "1 hr ago" },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-100 px-3.5 py-3 flex items-center gap-3 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <IndianRupee className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.loc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-extrabold text-primary">{item.price}</p>
                          <p className="text-[9px] text-slate-300">{item.ago}</p>
                        </div>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-primary/15 px-4 py-3 text-center" style={{ background: 'hsl(var(--primary)/0.07)' }}>
                      <p className="text-[11px] font-extrabold text-primary">🔥 {count + 8} more listings today</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* badges */}
              <div className="float-b absolute -right-14 top-16 bg-white border border-slate-100 shadow-xl rounded-2xl px-4 py-3">
                <p className="text-[10px] text-slate-400 font-bold">Avg. saved / sem</p>
                <p className="text-2xl font-extrabold text-slate-900">₹3,800</p>
              </div>
              <div className="float-a absolute -left-14 bottom-24 bg-white border border-slate-100 shadow-xl rounded-2xl px-4 py-3">
                <p className="text-[10px] text-slate-400 font-bold">Avg. sell time</p>
                <p className="text-xl font-extrabold text-slate-900">23 min</p>
                <p className="text-[10px] font-bold text-primary">↑ faster than viva prep</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="border-y border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: 500, suf: '+', label: 'LPU Students' },
            { n: 1000, suf: '+', label: 'Items Sold' },
            { n: 87, suf: '%', label: 'Sell in <24 hrs' },
            { n: 3800, pre: '₹', label: 'Avg Saved / Sem' },
          ].map(({ n, suf, pre, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-4xl font-extrabold text-slate-900 tabular-nums">
                <Count to={n} prefix={pre} suffix={suf} />
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICE COMPARISON ── */}
      <section className="py-20 bg-white">
        <div
          ref={s1}
          className={`max-w-4xl mx-auto px-5 transition-all duration-700 ${v1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="text-center mb-12 space-y-2">
            <p className="text-[11px] font-extrabold text-primary uppercase tracking-[0.25em]">The Evidence</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Your parents would cry</h2>
            <p className="text-slate-400 text-base">if they knew what everything actually costs new vs. here.</p>
          </div>

          <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 bg-slate-50 px-6 py-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <span>Item</span>
              <span className="text-center">Store Price</span>
              <span className="text-center">MyCampusKart</span>
              <span className="text-right text-green-600">You Save</span>
            </div>
            {COMPARE.map(({ item, store, kart, saved }, i) => (
              <div
                key={i}
                className={`row-hover grid grid-cols-4 px-6 py-4 items-center transition-colors ${i < COMPARE.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <span className="font-semibold text-sm text-slate-700">{item}</span>
                <span className="text-center text-sm text-slate-400 line-through">{store}</span>
                <span className="text-center text-sm font-bold text-slate-800">{kart}</span>
                <span className="text-right text-sm font-extrabold text-green-600">{saved}</span>
              </div>
            ))}
            <div className="px-6 py-4 flex justify-between items-center border-t border-slate-100"
              style={{ background: 'hsl(var(--primary)/0.05)' }}>
              <span className="text-sm font-extrabold text-slate-700">Full kit (new student)</span>
              <span className="text-base font-extrabold text-green-600">Save up to ₹7,040 total</span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-300 mt-3 italic">
            *₹7,040 is also 22 days of edible food outside the mess. Just saying.
          </p>
        </div>
      </section>

      {/* ── MEME GRID ── */}
      <section className="py-20 bg-[#FAFAFA]">
        <div
          ref={s2}
          className={`max-w-6xl mx-auto px-5 transition-all duration-700 ${v2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="text-center mb-12 space-y-2">
            <p className="text-[11px] font-extrabold text-primary uppercase tracking-[0.25em]">No Cap</p>
            <h2 className="text-4xl font-extrabold tracking-tight">LPU told on itself</h2>
            <p className="text-slate-400 text-base">Six situations. One app that fixes the financial part.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MEMES.map((m, i) => (
              <div
                key={i}
                className={`meme-card group relative rounded-3xl border p-6 transition-all duration-300 cursor-default ${m.color}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${m.tagColor}`}>
                    {m.tag}
                  </span>
                  <span className="text-3xl">{m.emoji}</span>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-relaxed border-l-2 border-slate-300 pl-3">
                    {m.situation}
                  </p>
                  <p className="text-[15px] font-bold text-slate-800 leading-snug">{m.truth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK TRUTH ── */}
      <section className="py-20 bg-slate-900 text-white">
        <div
          ref={s3}
          className={`max-w-4xl mx-auto px-5 text-center transition-all duration-700 ${v3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] mb-6 text-primary">Real Talk</p>
          <h2 className="text-5xl font-extrabold leading-tight mb-6">
            Your placement package is{' '}
            <span className="serif italic text-slate-400">pending.</span><br />
            Your lab coat bill{' '}
            <span className="serif italic text-primary">is not.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-12">
            You're paying ₹1.4L+ in fees per year. The least LPU can do is have a secondhand marketplace. It doesn't. We built one. Use it.
          </p>

          <div className="grid md:grid-cols-3 gap-5 text-left">
            {[
              { icon: MapPin, title: "Meet in 200m", body: "Your seller lives in the next hostel block. No delivery. No waiting. No 'out for delivery since yesterday'.", color: "text-blue-400" },
              { icon: ShieldCheck, title: "LPU Students Only", body: "Everyone on here has a student ID. You know where they live. They know where you live. It's safe.", color: "text-green-400" },
              { icon: Zap, title: "Sell in Under 30 min", body: "A graduating senior listed a cycle at 11 AM. It was gone by 11:23. Your stuff can move that fast too.", color: "text-yellow-400" },
            ].map(({ icon: Icon, title, body, color }) => (
              <div key={title} className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-3">
                <Icon className={`h-6 w-6 ${color}`} />
                <p className="font-extrabold text-white text-base">{title}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO INSTALL ── */}
      <section className="py-20 bg-white">
        <div
          ref={s4}
          className={`max-w-3xl mx-auto px-5 text-center transition-all duration-700 ${v4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-[11px] font-extrabold text-primary uppercase tracking-[0.25em] mb-3">How to Install</p>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">15 seconds. No app store.</h2>
          <p className="text-slate-400 mb-12">Genuinely faster than checking your attendance on UniConnect.</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                n: "01",
                title: "You're Already Here",
                body: "Congratulations. You've completed the hardest step.",
                sub: "Seriously."
              },
              {
                n: "02",
                title: platform === 'ios' ? "Tap Share → Add to Home Screen" : "Tap ⋮ → Add to Home Screen",
                body: platform === 'ios'
                  ? "That box with an arrow pointing up. Then 'Add to Home Screen'."
                  : "3 dots in your browser corner. You've pressed them for worse reasons.",
                sub: "Takes 4 seconds."
              },
              {
                n: "03",
                title: "App is on your phone",
                body: "No 200MB download. No 'storage almost full'. No app store rating prompt.",
                sub: "You're done."
              },
            ].map(({ n, title, body, sub }) => (
              <div key={n} className="text-left p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3 hover:shadow-md transition-shadow">
                <p className="text-5xl font-extrabold text-primary/20 leading-none">{n}</p>
                <p className="font-extrabold text-slate-900 text-base leading-snug">{title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">{sub}</p>
              </div>
            ))}
          </div>

          <button
            className="group mx-auto h-[68px] px-12 rounded-2xl font-extrabold text-xl text-primary-foreground flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'hsl(var(--primary))' }}
            onClick={canInstall ? installApp : () => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Flame className="h-5 w-5" />
            Do It. Right Now.
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ── FINAL FOMO ── */}
      <section className="py-24 bg-[#FAFAFA] border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-5 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-extrabold uppercase tracking-widest">
            <TrendingDown className="h-3.5 w-3.5" /> Your savings are actively declining
          </div>

          <h2 className="text-[56px] font-extrabold leading-[0.9] tracking-tight text-slate-900">
            Someone just saved<br />
            <span className="serif italic" style={{ color: 'hsl(var(--primary))' }}>₹500 on a lab coat</span><br />
            <span className="text-slate-400 font-light">while you read this page.</span>
          </h2>

          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            500+ LPU students are already on here. The ₹3,800 semester average isn't a number we made up. It's what your batchmates are saving. Every semester you don't use this is money gone.
          </p>

          <button
            className="pulse-cta mx-auto h-[76px] px-16 rounded-2xl font-extrabold text-2xl text-primary-foreground flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: 'hsl(var(--primary))' }}
            onClick={canInstall ? installApp : () => navigate('/dashboard')}
          >
            <Download className="h-6 w-6" />
            Get The App. It's Free.
          </button>

          <p className="text-slate-300 text-xs">
            No signup wall. No credit card. No selling your data. Just a marketplace that saves you money.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-slate-100 bg-white text-center space-y-3">
        <div className="flex items-center justify-center gap-2.5">
          <img src={logo} alt="MyCampusKart" className="h-6 w-auto opacity-60" />
          <span className="text-slate-400 font-bold text-sm tracking-tight">MyCampusKart</span>
        </div>
        <p className="text-slate-300 text-[11px] font-bold uppercase tracking-widest">
          No App Store • No Commission • No Data Selling • No Nonsense
        </p>
        <p className="text-slate-300 text-xs">
          © 2026 MyCampusKart — Built by students who paid full price in Year 1 and swore to fix it.
        </p>
      </footer>

    </div>
  );
};

export default DownloadApp;
