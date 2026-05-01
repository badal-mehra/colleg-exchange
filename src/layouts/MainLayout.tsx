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
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToPush } from "@/hooks/usePushNotifications";

interface StandaloneNavigator extends Navigator {
  standalone?: boolean;
}

const MainLayout = () => {
  const [isPWA, setIsPWA] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkPWA = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as StandaloneNavigator).standalone === true;
    setIsPWA(checkPWA);
  }, []);

  // Keep push subscriptions fresh on app load and when returning to the tab.
  useEffect(() => {
    if (!user || !("Notification" in window) || !("serviceWorker" in navigator)) return;

    const refreshSubscription = () => {
      if (Notification.permission === "granted") {
        subscribeToPush(user.id, { prompt: false }).catch(console.error);
      }
    };

    refreshSubscription();
    window.addEventListener("focus", refreshSubscription);
    document.addEventListener("visibilitychange", refreshSubscription);

    return () => {
      window.removeEventListener("focus", refreshSubscription);
      document.removeEventListener("visibilitychange", refreshSubscription);
    };
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isPWA && <Header />}

      <main className={isPWA ? "flex-1" : "flex-1"}>
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

      <SWUpdateToast />
      {!isPWA && <InstallPrompt />}
      {!isPWA && <Footer />}
      {isPWA && <BottomNavBar />}
    </div>
  );
};

export default MainLayout;
