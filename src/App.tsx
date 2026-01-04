
import ProtectedRoute from "@/components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Import Pages
import AuthCallback from "./pages/AuthCallback";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PWADashboard from "./pages/PWADashboard";
import ItemDetail from "./pages/ItemDetail";
import PGDetail from "./pages/PGDetail";
import KYC from "./pages/KYC";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import SellItem from "./pages/SellItem";
import PWASellItem from "./pages/PWASellItem";
import Chat from "./pages/Chat";
import MyChats from "./pages/MyChats";
import MyListings from "./pages/MyListings";
import MyPGListings from "./pages/MyPGListings";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ScanQR from "./pages/ScanQR";
import MyOrders from "./pages/MyOrders";
import MyCart from "./pages/MyCart";
import MyReports from "./pages/MyReports";
import StaticPage from "./pages/StaticPage";
import PWAProfile from "./pages/PWAProfile";

// Check if running as PWA
const isPWA = () => typeof window !== 'undefined' && (
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true
);

// PWA Dashboard wrapper that checks display mode
const SmartDashboard = () => isPWA() ? <PWADashboard /> : <Dashboard />;

// PWA Sell wrapper
const SmartSellItem = () => isPWA() ? <PWASellItem /> : <SellItem />;

const App = () => (
  <Routes>
    {/** ROUTES WITH HEADER + FOOTER (MainLayout) */}
    <Route element={<MainLayout />}>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SmartDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* FIX: Removed ProtectedRoute wrapper. PWAProfile now handles its own auth check to prevent white-screen race conditions. */}
      <Route path="/pwa-profile" element={<PWAProfile />} />
      
      <Route path="/my-chats" element={<ProtectedRoute><MyChats /></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
    </Route>

    {/** FULLSCREEN ROUTES (NO HEADER / NO FOOTER) */}
    <Route path="/" element={<Index />} />
    <Route path="/home" element={<Home />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/reset-password" element={<ResetPassword />} />

    {/** STATIC PAGES */}
    <Route path="/terms" element={<StaticPage />} />
    <Route path="/privacy" element={<StaticPage />} />
    <Route path="/about" element={<StaticPage />} />
    <Route path="/shipping" element={<StaticPage />} />
    <Route path="/help" element={<StaticPage />} />
    <Route path="/report" element={<StaticPage />} />

    {/** PUBLIC NO-LAYOUT PAGES */}
    <Route path="/item/:id" element={<ItemDetail />} />
    <Route path="/pg/:id" element={<PGDetail />} />
    <Route path="/profile/:mckId" element={<PublicProfile />} />

    {/** PROTECTED NO-LAYOUT PAGES */}
    <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/sell" element={<ProtectedRoute><SmartSellItem /></ProtectedRoute>} />
    <Route path="/chat/:conversationId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/my-cart" element={<ProtectedRoute><MyCart /></ProtectedRoute>} />
    <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
    <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
    <Route path="/my-pg-listings" element={<ProtectedRoute><MyPGListings /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    <Route path="/scan-qr" element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

    {/** NOT FOUND */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
