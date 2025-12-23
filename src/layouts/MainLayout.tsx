// src/layouts/MainLayout.tsx

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Footer } from "@/components/Footer";
import Header from "@/components/Header";
import SWUpdateToast from "@/components/SWUpdateToast";
import InstallPrompt from "@/components/InstallPrompt";

const MainLayout = () => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsPWA(isStandalone);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header /> 
      <main className="flex-1">
        <Outlet />
      </main>
      <SWUpdateToast />
      {/* Hide install prompt in PWA mode */}
      {!isPWA && <InstallPrompt />}
      {/* Hide footer in PWA mode for native app feel */}
      {!isPWA && <Footer />}
    </div>
  );
};

export default MainLayout;
