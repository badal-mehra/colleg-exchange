import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Home,
  ShieldCheck,
  Instagram,
  TrendingUp,
  Flame,
  ArrowRight,
  Users,
  Star,
  Sparkles,
  Camera,
} from "lucide-react";

// ─── Sell Hero Card ───────────────────────────────────────────────────────────
const SellHeroCard = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-2xl cursor-pointer select-none w-full"
      style={{
        background: "linear-gradient(135deg, #FF6B35 0%, #FF3D71 60%, #C2185B 100%)",
        padding: "1.25rem",
        boxShadow: hovered
          ? "0 20px 40px -8px rgba(255,107,53,0.45)"
          : "0 8px 24px -4px rgba(255,107,53,0.3)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      onClick={onClick}
    >
      {/* bg blob */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20px",
          left: "40%",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          pointerEvents: "none",
        }}
      />

      {/* label pill */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(255,255,255,0.2)",
          color: "white",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "3px 8px",
          borderRadius: "999px",
          marginBottom: "12px",
        }}
      >
        <Flame style={{ width: "10px", height: "10px" }} />
        sell now
      </span>

      <p
        style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: "12px",
          margin: "0 0 4px",
          fontWeight: 500,
        }}
      >
        Your old stuff is literally…
      </p>
      <h2
        style={{
          color: "white",
          fontSize: "22px",
          fontWeight: 800,
          margin: "0 0 16px",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}
      >
        collecting dust 💀
      </h2>

      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "white",
          color: "#FF3D71",
          fontSize: "13px",
          fontWeight: 700,
          padding: "8px 16px",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          transition: "gap 0.2s ease",
        }}
      >
        Snap & list in 60s
        <ArrowRight
          style={{
            width: "14px",
            height: "14px",
            transform: hovered ? "translateX(3px)" : "translateX(0)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>
    </div>
  );
};

// ─── Trending Chip ────────────────────────────────────────────────────────────
const trendingItems = [
  "Cycle 🚴",
  "MacBook",
  "Textbooks 📚",
  "Room Heater",
  "Headphones 🎧",
  "Mattress",
];

const TrendingRow = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActiveIdx((i) => (i + 1) % trendingItems.length),
      2200
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-xl border border-border/50 bg-card w-full"
      style={{ padding: "12px 14px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
          }}
        >
          <TrendingUp style={{ width: "11px", height: "11px", color: "#22c55e" }} />
          trending on campus
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            color: "#22c55e",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
              animation: "pulse 1.5s infinite",
            }}
          />
          live
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {trendingItems.map((item, i) => (
          <span
            key={item}
            style={{
              fontSize: "11.5px",
              fontWeight: i === activeIdx ? 700 : 500,
              padding: "3px 10px",
              borderRadius: "999px",
              transition: "all 0.3s ease",
              background:
                i === activeIdx
                  ? "linear-gradient(90deg,#FF6B35,#FF3D71)"
                  : "var(--secondary)",
              color: i === activeIdx ? "white" : "var(--muted-foreground)",
              transform: i === activeIdx ? "scale(1.05)" : "scale(1)",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Action Row (PG + Verified) ───────────────────────────────────────────────
const MiniActionCard = ({
  icon,
  iconBg,
  title,
  subtitle,
  tag,
  tagColor,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-xl border border-border/50 bg-card text-left w-full"
      style={{
        padding: "14px", // Standardized padding to match the sidebar components
        cursor: "pointer",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered ? "0 6px 16px -4px rgba(0,0,0,0.12)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "3px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "999px",
                background: tagColor,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              {tag}
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--muted-foreground)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        </div>
        <ArrowRight
          style={{
            width: "14px",
            height: "14px",
            color: "var(--muted-foreground)",
            flexShrink: 0,
            transform: hovered ? "translate(3px,-3px)" : "none",
            transition: "transform 0.2s ease",
          }}
        />
      </div>
    </button>
  );
};

// ─── Instagram Widget (GenZ Redirect) ─────────────────────────────────────────
const InstagramWidget = () => {
  const [hovered, setHovered] = useState(false);

  const posts = [
    { bg: "#FF6B35", emoji: "📦" },
    { bg: "#7C3AED", emoji: "🤝" },
    { bg: "#0EA5E9", emoji: "🏠" },
    { bg: "#10B981", emoji: "💸" },
    { bg: "#F59E0B", emoji: "📚" },
    { bg: "#EC4899", emoji: "🎧" },
  ];

  return (
    <div
      className="rounded-xl border border-border/50 bg-card overflow-hidden w-full"
      style={{ padding: "14px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            padding: "2px",
            background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#FF6B35,#FF3D71)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "16px" }}>🛒</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            @mycampuskart
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "var(--muted-foreground)",
            }}
          >
            we post memes & deals ngl
          </p>
        </div>

        {/* Redirect Anchor Tag */}
        <a
          href="https://instagram.com/mycampuskart"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 800,
            textDecoration: "none",
            background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            color: "white",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            boxShadow: hovered ? "0 4px 12px rgba(220, 39, 67, 0.4)" : "none",
          }}
        >
          <Instagram style={{ width: "12px", height: "12px" }} />
          Stalk Us 👀
        </a>
      </div>

      {/* Fake post grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "3px",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "10px",
        }}
      >
        {posts.map((p, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              background: p.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              opacity: 0.85,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { label: "posts", val: "142" },
            { label: "followers", val: "4.2k" },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                {val}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  color: "var(--muted-foreground)",
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: "10px",
            color: "var(--muted-foreground)",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          📸 tap to join the cult
        </p>
      </div>
    </div>
  );
};

// ─── Social Proof Footer ──────────────────────────────────────────────────────
const SocialProof = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 12px",
      borderRadius: "12px",
      background: "var(--secondary)",
      width: "full",
    }}
  >
    <div style={{ display: "flex", marginRight: "2px" }}>
      {["#FF6B35", "#7C3AED", "#0EA5E9", "#10B981"].map((color, i) => (
        <div
          key={i}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: color,
            border: "2px solid var(--background)",
            marginLeft: i === 0 ? 0 : "-6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "9px",
          }}
        >
          {["😎", "🎓", "💪", "🔥"][i]}
        </div>
      ))}
    </div>
    <p
      style={{
        margin: 0,
        fontSize: "11px",
        color: "var(--muted-foreground)",
        lineHeight: 1.3,
      }}
    >
      <strong style={{ color: "var(--foreground)", fontWeight: 700 }}>
        2,400+ students
      </strong>{" "}
      already flexing on here
    </p>
  </div>
);

// ─── Right Panel ──────────────────────────────────────────────────────────────
const RightPanel = () => {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-full h-full">
      <SellHeroCard onClick={() => navigate("/sell")} />

      <TrendingRow />

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
        <MiniActionCard
          icon={<Home style={{ width: "18px", height: "18px", color: "#7C3AED" }} />}
          iconBg="rgba(124,58,237,0.12)"
          title="Find a PG"
          subtitle="hostel wifi got you crying? relatable."
          tag="new"
          tagColor="#7C3AED"
          onClick={() => navigate("/browse?tab=pg")}
        />
        <MiniActionCard
          icon={
            <ShieldCheck
              style={{ width: "18px", height: "18px", color: "#10B981" }}
            />
          }
          iconBg="rgba(16,185,129,0.12)"
          title="Verified sellers only"
          subtitle="KYC-checked. no cap, no scam."
          tag="safe"
          tagColor="#10B981"
          onClick={() => navigate("/browse")}
        />
      </div>

      <InstagramWidget />

      <SocialProof />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </aside>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem] gap-5 items-start py-6">
      <div className="min-w-0 rounded-2xl overflow-hidden shadow-md border border-border/50 bg-card">
        {children}
      </div>
      <RightPanel />
    </div>
  </div>
);

export default Layout;
