import { SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/components/AppLayout";

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
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ItemDetail from "./pages/ItemDetail";
import KYC from "./pages/KYC";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import SellItem from "./pages/SellItem";
import Chat from "./pages/Chat";
import MyChats from "./pages/MyChats";
import MyListings from "./pages/MyListings";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ScanQR from "./pages/ScanQR";
import MyOrders from "./pages/MyOrders";
import MyCart from "./pages/MyCart";
import MyReports from "./pages/MyReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <SidebarProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>
              {/* NO SIDEBAR ROUTES */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/profile/:mckId" element={<PublicProfile />} />

              {/* PAGES WITH SIDEBAR */}
              <Route
                path="/home"
                element={
                  <AppLayout>
                    <Home />
                  </AppLayout>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sell"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SellItem />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat/:conversationId?"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Chat />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-chats"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyChats />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-cart"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyCart />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-reports"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyReports />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-listings"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyListings />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyOrders />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Leaderboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/scan-qr"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ScanQR />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
