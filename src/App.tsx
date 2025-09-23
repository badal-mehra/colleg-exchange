import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ItemDetail from "./pages/ItemDetail";
import KYC from "./pages/KYC";
import Profile from "./pages/Profile";
import SellItem from "./pages/SellItem";
import Chat from "./pages/Chat";
import MyChats from "./pages/MyChats";
import MyListings from "./pages/MyListings";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/kyc" element={
              <ProtectedRoute>
                <KYC />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/sell" element={
              <ProtectedRoute>
                <SellItem />
              </ProtectedRoute>
            } />
            <Route path="/chat/:conversationId?" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/my-chats" element={<ProtectedRoute><MyChats /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;