// src/layouts/MainLayout.tsx (New File)

import React from "react";
import { Outlet } from "react-router-dom";
import { Footer } from "@/components/Footer"; // Assuming Footer is a separate component
import Header from "@/components/Header"; // ⭐ Imports the optimized Header

const MainLayout = () => {
  return (
    // Persistent Layout Wrapper
    <div className="min-h-screen flex flex-col">
      
      {/* Header stays mounted across all inner routes */}
      <Header /> 
      
      {/* Main content area */}
      <main className="flex-1">
        {/* Outlet renders the specific page component (/dashboard, /item/:id, etc.) */}
        <Outlet />
      </main>
      
      {/* Footer stays mounted across all inner routes */}
      {/* Note: Footer was in Dashboard.tsx, now lives here consistently */}
      <Footer /> 
    </div>
  );
};

export default MainLayout;
