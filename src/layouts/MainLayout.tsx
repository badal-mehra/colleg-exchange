// import React, { useEffect, useState } from "react";
// import { Outlet } from "react-router-dom";
// import { Footer } from "@/components/Footer";
// import Header from "@/components/Header";
// import SWUpdateToast from "@/components/SWUpdateToast";
// import InstallPrompt from "@/components/InstallPrompt";
// import BottomNavBar from "@/components/BottomNavBar";

// const MainLayout = () => {
//   const [isPWA, setIsPWA] = useState(false);

//   useEffect(() => {
//     setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
//   }, []);

//   return (
//     <div className="min-h-screen flex flex-col">
//       {!isPWA && <Header />}

//       <main className={isPWA ? "flex-1 pb-20" : "flex-1"}>
//         <Outlet />
//       </main>

//       <SWUpdateToast />
//       {!isPWA && <InstallPrompt />}
//       {!isPWA && <Footer />}
//       {isPWA && <BottomNavBar />}
//     </div>
//   );
// };

// export default MainLayout;
import React, { useEffect, useState, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import Header from "@/components/Header";
import SWUpdateToast from "@/components/SWUpdateToast";
import InstallPrompt from "@/components/InstallPrompt";
import BottomNavBar from "@/components/BottomNavBar";
import DesktopSidebar from "@/components/DesktopSidebar";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToPush } from "@/hooks/usePushNotifications";

const MainLayout = () => {
  const [isPWA, setIsPWA] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // const checkPWA = window.matchMedia("(display-mode: standalone)").matches ||
    //   (window.navigator as any).standalone === true;
    const [isPWA, setIsPWA] = useState(false);
const [isDesktop, setIsDesktop] = useState(false);

useEffect(() => {
  const check = () => {
    const pwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsPWA(pwa);
    setIsDesktop(window.innerWidth >= 768);
  };

  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);

    setIsPWA(checkPWA);
  }, []);

  // Subscribe to push notifications when user logs in (PWA mode)
  useEffect(() => {
    if (user && isPWA && "Notification" in window && "serviceWorker" in navigator) {
      subscribeToPush(user.id).catch(console.error);
    }
  }, [user, isPWA]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isPWA && <Header />}

      <div className="flex flex-1 w-full">
        {/* Desktop Sidebar - visible on md+ screens in PWA mode */}
        {isPWA && user && <DesktopSidebar />}
        
        <main className="flex-1">
          {/* FIX: Wrapped Outlet in Suspense to prevent white screen on async operations */}
          <Suspense 
            fallback={
              <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <SWUpdateToast />
      {!isPWA && <InstallPrompt />}
      {!isPWA && <Footer />}
      {isPWA && <BottomNavBar />}
    </div>
  );
};

export default MainLayout;
