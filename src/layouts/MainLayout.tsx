import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Footer } from "@/components/Footer";
import Header from "@/components/Header";
import SWUpdateToast from "@/components/SWUpdateToast";
import InstallPrompt from "@/components/InstallPrompt";
import BottomNavBar from "@/components/BottomNavBar";

const MainLayout = () => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {!isPWA && <Header />}

      <main className={isPWA ? "flex-1 pb-20" : "flex-1"}>
        <Outlet />
      </main>

      <SWUpdateToast />
      {!isPWA && <InstallPrompt />}
      {!isPWA && <Footer />}
      {isPWA && <BottomNavBar />}
    </div>
  );
};

export default MainLayout;
