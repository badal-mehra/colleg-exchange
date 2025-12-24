// // src/layouts/MainLayout.tsx
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
    // SIMPLE + RELIABLE: true ONLY in installed PWA
    setIsPWA(
      window.matchMedia("(display-mode: standalone)").matches
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ✅ WEB ONLY HEADER */}
      {!isPWA && <Header />}

      <main className={isPWA ? "flex-1 pb-20" : "flex-1"}>
        <Outlet />
      </main>

      <SWUpdateToast />

      {/* ✅ WEB ONLY */}
      {!isPWA && <InstallPrompt />}
      {!isPWA && <Footer />}

      {/* ✅ APP ONLY */}
      {isPWA && <BottomNavBar />}
    </div>
  );
};

export default MainLayout;


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
//     // Check if running as installed PWA (standalone mode)
//     const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
//       || (window.navigator as any).standalone === true;
//     setIsPWA(isStandalone);
//   }, []);

//   return (
//     <div className="min-h-screen flex flex-col">
      
//       <main className={isPWA ? "flex-1 pb-20" : "flex-1"}>
//         <Outlet />
//       </main>
//       <SWUpdateToast />
//       {/* Hide install prompt in PWA mode */}
//       {!isPWA && <InstallPrompt />}
//       {/* Hide footer and headerin PWA mode for native app feel */}
//       {!isPWA && <Footer />}
//       {!isPWA && <Header />}

//       {/* Show bottom nav bar in PWA mode */}
//       {isPWA && <BottomNavBar />}
//     </div>
//   );
// };

// export default MainLayout;
