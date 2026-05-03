import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, CheckCircle, Sparkles,
  IndianRupee, Pizza, Coffee, Flame,
  TrendingUp, Skull, Ghost, Zap, AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import logo from '@/assets/mycampuskart-logo.png';

/* ─── tiny hook: intersection observer ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── animated counter ─── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [visible, to]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

/* ─── ticker ─── */
const tickerItems = [
  "🔥 3 SENIORS JUST LISTED THEIR CYCLES",
  "😭 SOMEONE SOLD A LAB COAT 30 MINS BEFORE VIVA",
  "💀 BUY USED. YOUR PARENTS' EMI CAN'T TELL THE DIFF",
  "🤡 FRESH ITEM: UNOPENED DSA BOOK (RIP TO WHOEVER BOUGHT IT NEW)",
  "📉 YOUR CGPA & YOUR SAVINGS BOTH NEED SAVING",
  "🚨 GIRL IN BLOCK 32 SOLD HER ENTIRE SEM-1 KIT IN 4 HRS",
  "👻 MESS FOOD IS FREE. EVERYTHING ELSE ISN'T. WE GOT YOU.",
  "💸 ₹200 SAVED = 2 MAGGI + 1 AMUL KULFI. JUST SAYING",
];

function Ticker() {
  return (
    <div className="overflow-hidden bg-[#0aff6c] text-black py-3 border-y-2 border-black">
      <div
        className="flex gap-16 whitespace-nowrap"
        style={{ animation: 'ticker 28s linear infinite' }}
      >
        {[...tickerItems, ...tickerItems].map((t, i) => (
          <span key={i} className="text-xs font-black tracking-widest uppercase">{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── meme cards ─── */
const memes = [
  {
    tag: "HOSTEL REALNESS",
    emoji: "🪣",
    setup: "Buying a new bucket, mug & mattress every year",
    punch: "bro the senior in Block C has ALL of it for ₹300 combined. you're cooked.",
    color: "#ff3b30",
  },
  {
    tag: "PRE-VIVA PANIC",
    emoji: "💀",
    setup: "Lab coat ₹650 new. Viva is tomorrow.",
    punch: "calm down. someone posted one 2 hours ago for ₹120. DOWNLOAD THE APP.",
    color: "#ff9f0a",
  },
  {
    tag: "GRADUATION SPEEDRUN",
    emoji: "🏃",
    setup: "Convocation in 3 days. Cycle still unsold.",
    punch: "post it in 30 seconds. sell it before DSW catches you leaving.",
    color: "#0aff6c",
  },
  {
    tag: "SEM-1 SURVIVOR",
    emoji: "📚",
    setup: "Mom said 'buy all books new, beta'",
    punch: "₹2,400 in books. used them twice. now they sit judging you. list them.",
    color: "#64d2ff",
  },
  {
    tag: "BANK ACCOUNT CHECK",
    emoji: "📉",
    setup: "It's the 22nd of the month.",
    punch: "sell that 'aesthetic' fairy-light set you lit exactly once. NOW.",
    color: "#bf5af2",
  },
  {
    tag: "MESS ESCAPE FUND",
    emoji: "🍕",
    setup: "Mess food again. Dominos is ₹399.",
    punch: "sell one old textbook = 3 dominos nights. the math is mathing.",
    color: "#ff375f",
  },
];

/* ─── social proof strip ─── */
const proofData = [
  { n: 4200, suf: '+', label: 'LPU Students' },
  { n: 18000, suf: '+', label: 'Items Sold' },
  { n: 94, suf: '%', label: 'Sell in <24 hrs' },
  { n: 3800, suf: '', label: 'Avg ₹ Saved/Sem' },
];

const DownloadApp = () => {
  const { canInstall, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [hovered, setHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');
  }, []);

  /* parallax tilt on hero phone */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = ((e.clientX - left) / width - 0.5) * 18;
      const y = ((e.clientY - top) / height - 0.5) * -18;
      el.style.transform = `rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
    };
    const reset = () => { el.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)'; };
    window.addEventListener('mousemove', handle);
    window.addEventListener('mouseleave', reset);
    return () => { window.removeEventListener('mousemove', handle); window.removeEventListener('mouseleave', reset); };
  }, []);

  return (
    <div className="min-h-screen bg-[#090909] text-white overflow-x-hidden" style={{ fontFamily: "'Syne', 'Clash Display', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes glitch {
          0%,100%{text-shadow:none}
          20%{text-shadow:3px 0 #0aff6c,-3px 0 #ff375f}
          40%{text-shadow:-3px 0 #64d2ff,3px 0 #ff9f0a}
          60%{text-shadow:3px 0 #bf5af2,-3px 0 #0aff6c}
        }
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(10,255,108,0.4)} 50%{box-shadow:0 0 0 12px rgba(10,255,108,0)} }
        @keyframes scanline { 0%{top:0%} 100%{top:100%} }
        @keyframes fadeup { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-3deg)} 75%{transform:rotate(3deg)} }
        @keyframes neon-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }

        .fadeup { animation: fadeup 0.7s ease forwards; }
        .fadeup-1 { animation-delay: 0.1s; opacity: 0; }
        .fadeup-2 { animation-delay: 0.25s; opacity: 0; }
        .fadeup-3 { animation-delay: 0.4s; opacity: 0; }
        .fadeup-4 { animation-delay: 0.55s; opacity: 0; }

        .glitch-text:hover { animation: glitch 0.4s steps(1) infinite; }
        .float-card { animation: float 4s ease-in-out infinite; }

        .meme-card:hover .meme-emoji { animation: shake 0.3s ease-in-out; }

        .neon-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .neon-btn::before {
          content:'';
          position:absolute;
          inset:0;
          background: linear-gradient(135deg, #0aff6c22, #0aff6c00);
          opacity:0;
          transition:opacity 0.3s;
        }
        .neon-btn:hover::before { opacity:1; }
        .neon-btn:hover { box-shadow: 0 0 30px rgba(10,255,108,0.4), 0 0 60px rgba(10,255,108,0.15); }
        .neon-btn:active { transform: scale(0.97); }

        .scanline::after {
          content:'';
          position:absolute;
          left:0;right:0;
          height:2px;
          background:rgba(10,255,108,0.3);
          animation:scanline 3s linear infinite;
        }

        .card-glow:hover { box-shadow: 0 0 0 1px #0aff6c33, 0 20px 60px rgba(10,255,108,0.12); }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #090909; }
        ::-webkit-scrollbar-thumb { background: #0aff6c44; border-radius: 2px; }

        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          background-size: 200px;
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#090909]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="MyCampusKart" className="h-8 w-auto" />
            <span className="font-extrabold text-lg tracking-tight">MyCampusKart</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0aff6c] px-3 py-1.5 rounded-full border border-[#0aff6c33] bg-[#0aff6c0a]" style={{animation:'neon-pulse 2s ease-in-out infinite'}}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0aff6c] inline-block"></span>
              LPU ONLY
            </span>
          </div>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <Ticker />

      {/* ── HERO ── */}
      <section className="noise-bg relative pt-16 pb-24 overflow-hidden">
        {/* bg grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'60px 60px'}} />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div className="space-y-8 z-10">
            <div className="fadeup fadeup-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0aff6c0f] border border-[#0aff6c22] text-[#0aff6c] text-[10px] font-black uppercase tracking-[0.25em]">
              <Skull className="h-3.5 w-3.5" /> FOR LPU STUDENTS WHO ARE DONE BEING BROKE
            </div>

            <div className="fadeup fadeup-2 space-y-2">
              <h1 className="text-7xl lg:text-[88px] font-extrabold leading-[0.88] tracking-tight text-white">
                STOP <br />
                <span className="glitch-text" style={{color:'#0aff6c', textShadow:'0 0 40px rgba(10,255,108,0.4)'}}>PAYING</span><br />
                FULL PRICE.
              </h1>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed mt-6 font-medium">
                You're at LPU. Your seniors have <em>everything</em> you need. And they're desperate to sell it before they graduate. <strong className="text-white">This app is literally your ₹₹₹ cheat code.</strong>
              </p>
            </div>

            <div className="fadeup fadeup-3 space-y-4">
              <button
                className="neon-btn w-full max-w-sm h-20 rounded-2xl bg-[#0aff6c] text-black font-extrabold text-xl flex flex-col items-center justify-center gap-0.5 border-2 border-[#0aff6c]"
                onClick={canInstall ? installApp : () => navigate('/dashboard')}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{animation: hovered ? 'none' : 'pulse-border 2.5s ease-in-out infinite'}}
              >
                <div className="flex items-center gap-3">
                  <Download className="h-6 w-6" />
                  <span>{canInstall ? 'INSTALL APP — FREE' : 'OPEN APP — FREE'}</span>
                </div>
                <span className="text-[10px] font-semibold opacity-60 tracking-[0.2em] uppercase">Works on {platform} • No app store needed</span>
              </button>

              <div className="flex items-center gap-5 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-[#0aff6c]" />100% Free</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-[#0aff6c]" />LPU Verified</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-[#0aff6c]" />No Scam</span>
              </div>
            </div>

            {/* FOMO pill */}
            <div className="fadeup fadeup-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ff3b3010] border border-[#ff3b3030]">
              <AlertTriangle className="h-5 w-5 text-[#ff3b30] shrink-0" />
              <p className="text-sm text-slate-300"><span className="text-[#ff3b30] font-black">REAL:</span> 12 items were sold in the last 2 hours. Your new lab coat is on it. So is someone's cycle. Don't sleep.</p>
            </div>
          </div>

          {/* RIGHT: phone mockup */}
          <div className="hidden lg:flex justify-center items-center">
            <div
              ref={heroRef}
              className="relative scanline"
              style={{perspective:'800px', transition:'transform 0.15s ease-out'}}
            >
              {/* glow behind */}
              <div className="absolute inset-0 blur-[80px] bg-[#0aff6c22] rounded-full scale-75" />

              <div className="relative w-[300px] h-[620px] bg-[#111] rounded-[3.5rem] border-[10px] border-[#1a1a1a] shadow-[0_40px_120px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                {/* notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#111] rounded-b-2xl z-20" />
                {/* screen */}
                <div className="absolute inset-0 m-1 bg-[#0e0e0e] rounded-[3rem] overflow-hidden flex flex-col">
                  {/* status bar */}
                  <div className="flex justify-between items-center px-6 pt-10 pb-2 text-[10px] text-slate-500 font-mono">
                    <span>9:41</span>
                    <span>LPU • 5G</span>
                  </div>
                  {/* app content */}
                  <div className="px-5 space-y-4 mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-semibold">NEARBY LISTINGS</p>
                      <span className="text-[10px] text-[#0aff6c] font-black">LIVE</span>
                    </div>

                    {[
                      { name: "Scientific Calculator", price: "₹180", tag: "Block 32", dot: "#0aff6c" },
                      { name: "Lab Coat (L)", price: "₹120", tag: "Hostel 4", dot: "#ff9f0a" },
                      { name: "MTech Thesis Binder", price: "₹60", tag: "Near Canteen", dot: "#64d2ff" },
                      { name: "Cycle (Hero Lectro)", price: "₹2,400", tag: "Ground Floor", dot: "#ff375f" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]" style={{animationDelay:`${i*0.1}s`}}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:`${item.dot}18`}}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{background:item.dot, boxShadow:`0 0 8px ${item.dot}`}} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                          <p className="text-slate-500 text-[10px]">{item.tag}</p>
                        </div>
                        <p className="text-[#0aff6c] text-xs font-black shrink-0">{item.price}</p>
                      </div>
                    ))}

                    <div className="mt-4 p-4 rounded-2xl bg-[#0aff6c0d] border border-[#0aff6c22] text-center">
                      <p className="text-[#0aff6c] text-xs font-black">🔥 47 listings added today</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* floating badge */}
              <div className="float-card absolute -right-16 top-20 bg-[#1a1a1a] border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-bold">You could've saved</p>
                <p className="text-2xl font-extrabold text-[#0aff6c]">₹3,800</p>
                <p className="text-[10px] text-slate-500">this semester alone</p>
              </div>
              <div className="float-card absolute -left-14 bottom-32 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl" style={{animationDelay:'1.5s'}}>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Sold in</p>
                <p className="text-xl font-extrabold text-white">23 mins</p>
                <p className="text-[10px] text-[#0aff6c]">avg. sell time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <div className="border-y border-white/5 bg-[#0c0c0c]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {proofData.map(({ n, suf, label }) => (
            <div key={label} className="text-center space-y-1">
              <p className="text-4xl font-extrabold text-white tabular-nums">
                <Counter to={n} suffix={suf} />
              </p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── DARK MEME GRID ── */}
      <section className="py-24 noise-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[#0aff6c] text-xs font-black uppercase tracking-[0.3em]">No Cap. All Facts.</p>
            <h2 className="text-5xl font-extrabold tracking-tight">LPU Life, Unfiltered.</h2>
            <p className="text-slate-500 text-base">Every single one of these has happened to your senior. Don't let it happen to you.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {memes.map((m, i) => (
              <div
                key={i}
                className="meme-card group relative p-7 rounded-3xl bg-[#111] border border-white/5 card-glow transition-all duration-300 cursor-default overflow-hidden"
              >
                {/* color top bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl" style={{background:m.color}} />
                {/* glow blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" style={{background:m.color}} />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border" style={{color:m.color, borderColor:`${m.color}44`, background:`${m.color}11`}}>
                      {m.tag}
                    </span>
                    <span className="meme-emoji text-3xl">{m.emoji}</span>
                  </div>

                  <div>
                    <p className="text-slate-400 text-sm font-semibold mb-2">{m.setup}</p>
                    <p className="text-white text-base font-bold leading-snug">{m.punch}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE SAVINGS SECTION ── */}
      <section className="py-24 bg-[#0c0c0c] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <p className="text-[#0aff6c] text-xs font-black uppercase tracking-[0.3em] mb-3">The Pizza Index™ (LPU Edition)</p>
              <h2 className="text-5xl font-extrabold leading-tight">
                Your saved ₹3,800<br />
                <span className="text-slate-500">translates to:</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Pizza, val: "19", label: "Dominos Meals", color: "#ff9f0a" },
                { icon: Coffee, val: "63", label: "CCD Cold Coffees", color: "#64d2ff" },
                { icon: Ghost, val: "∞", label: "Mess Skips", color: "#bf5af2" },
                { icon: Zap, val: "6", label: "Months of Netflix", color: "#0aff6c" },
              ].map(({ icon: Icon, val, label, color }) => (
                <div key={label} className="p-5 rounded-2xl bg-[#111] border border-white/5 space-y-3 card-glow transition-all">
                  <Icon className="h-6 w-6" style={{ color }} />
                  <p className="text-3xl font-extrabold text-white">{val}</p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            <p className="text-slate-600 text-xs italic">* based on avg LPU student spend. math checks out, unfortunately.</p>
          </div>

          <div className="space-y-4">
            {[
              { title: "Meet IRL, No Delivery Drama", body: "Canteen, hostel gate, library corridor. Your seller lives 200m away.", icon: "📍" },
              { title: "Real Students, Not Randos", body: "Everyone on here is a verified LPU student. Your money stays on campus.", icon: "🆔" },
              { title: "Sell Before You Graduate", body: "Post in 30 seconds. Don't carry 4 years of junk back to your hometown.", icon: "🎓" },
              { title: "Zero Commission, Zero BS", body: "We don't take a cut. You list, you sell, you keep it all.", icon: "💸" },
            ].map(({ title, body, icon }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-[#111] border border-white/5 card-glow transition-all">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{title}</p>
                  <p className="text-slate-500 text-sm">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO INSTALL ── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-3">
            <p className="text-[#0aff6c] text-xs font-black uppercase tracking-[0.3em]">Literally 15 seconds</p>
            <h2 className="text-5xl font-extrabold tracking-tight">How to Install <span className="text-slate-500">(It's embarrassingly easy)</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                title: "You're Already Here",
                body: "Congrats on step 1. Genuinely.",
                glow: "#0aff6c"
              },
              {
                n: "02",
                title: platform === 'ios' ? "Tap Share →\nAdd to Home" : "Tap ⋮ →\nAdd to Screen",
                body: platform === 'ios' ? "Square icon with arrow. Then 'Add to Home Screen'. Done." : "3 dots in your browser corner. You'll see it.",
                glow: "#64d2ff"
              },
              {
                n: "03",
                title: "App appears.\nYou win.",
                body: "No app store. No 200MB download. No 'storage almost full' popup.",
                glow: "#bf5af2"
              }
            ].map(({ n, title, body, glow }) => (
              <div key={n} className="p-7 rounded-3xl bg-[#111] border border-white/5 text-left space-y-4 card-glow transition-all group">
                <div className="text-5xl font-extrabold leading-none" style={{ color: `${glow}66` }}>{n}</div>
                <div>
                  <p className="font-extrabold text-white text-lg leading-snug whitespace-pre-line">{title}</p>
                  <p className="text-slate-500 text-sm mt-2">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="neon-btn mx-auto h-20 px-14 rounded-2xl bg-[#0aff6c] text-black font-extrabold text-xl flex flex-col items-center justify-center gap-0.5"
            onClick={canInstall ? installApp : () => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="flex items-center gap-2"><Flame className="h-5 w-5" /> DO IT. RIGHT NOW.</span>
            <span className="text-[10px] font-semibold opacity-60 tracking-widest uppercase">your future self will thank you</span>
          </button>
        </div>
      </section>

      {/* ── FINAL FOMO CTA ── */}
      <section className="py-24 bg-[#0c0c0c] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff3b3010] border border-[#ff3b3030] text-[#ff3b30] text-xs font-black uppercase tracking-widest">
            <AlertTriangle className="h-4 w-4" />
            This is your sign. Not kidding.
          </div>
          <h2 className="text-6xl lg:text-7xl font-extrabold leading-[0.9] tracking-tight">
            Your batchmate<br />
            <span style={{color:'#0aff6c', textShadow:'0 0 40px rgba(10,255,108,0.3)'}}>just saved ₹500</span><br />
            <span className="text-slate-500">while you read this.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">4,200+ LPU students are already on here. Every day you wait is money left on the table. Actual money. For actual Dominos.</p>

          <button
            className="neon-btn mx-auto h-24 px-16 rounded-3xl bg-[#0aff6c] text-black font-extrabold text-2xl flex items-center justify-center gap-3"
            onClick={canInstall ? installApp : () => navigate('/dashboard')}
          >
            <TrendingUp className="h-7 w-7" />
            <span>GET THE APP. FREE.</span>
          </button>

          <p className="text-slate-700 text-xs">No signup wall. No credit card. Just an app that saves you money. That's literally it.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-white/5 bg-[#090909] text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="MyCampusKart" className="h-6 w-auto opacity-40" />
          <span className="text-slate-600 font-bold text-sm tracking-tight">MyCampusKart</span>
        </div>
        <p className="text-slate-700 text-xs font-bold uppercase tracking-widest">No App Store • No Data Selling • No Middlemen • Just Campus Hustle</p>
        <p className="text-slate-800 text-xs">© 2026 MyCampusKart. Built by LPU students who got tired of being scammed by Amazon delivery fees.</p>
      </footer>
    </div>
  );
};

export default DownloadApp;
