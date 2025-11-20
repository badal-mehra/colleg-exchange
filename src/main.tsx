// main.tsx

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css"; 
// Import all necessary providers and utilities
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";

const container = document.getElementById("root");
const root = createRoot(container!);

// Initialize QueryClient outside of the render function
const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    {/* 🔥 CRITICAL FIX 1: BrowserRouter is the root of the routing */}
    <BrowserRouter>
      {/* 🔥 CRITICAL FIX 2: ALL Providers MUST be here, outside of App.tsx */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            
            {/* App Component (containing ONLY Routes) */}
            <App /> 
            
            {/* Toasters/Notifications */}
            <Toaster />
            <Sonner />
            
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
