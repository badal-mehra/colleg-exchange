// App.tsx

import ProtectedRoute from "@/components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Import Pages
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
import StaticPage from "./pages/StaticPage";

const App = () => (
  <Routes>

    {/** ----------------------------------------------------- */}
    {/** 🟢 ROUTES WITH HEADER + FOOTER (MainLayout)          */}
    {/** ----------------------------------------------------- */}
    <Route element={<MainLayout />}>
      {/* <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} /> */}

      {/** STATIC PAGES */}
      <Route path="/terms" element={<StaticPage />} />
      <Route path="/privacy" element={<StaticPage />} />
      <Route path="/about" element={<StaticPage />} />
      <Route path="/shipping" element={<StaticPage />} />
      <Route path="/help" element={<StaticPage />} />
      <Route path="/report" element={<StaticPage />} />

      {/** DASHBOARD ONLY (Protected) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Route>

    {/** ----------------------------------------------------- */}
    {/** 🔴 FULLSCREEN ROUTES (NO HEADER / NO FOOTER)         */}
    {/** ----------------------------------------------------- */}

    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<Home />}
    <Route path="/reset-password" element={<ResetPassword />} />

    {/** PUBLIC NO-LAYOUT PAGES */}
    <Route path="/item/:id" element={<ItemDetail />} />
    <Route path="/profile/:mckId" element={<PublicProfile />} />

    {/** PROTECTED NO-LAYOUT PAGES */}
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/sell" element={<ProtectedRoute><SellItem /></ProtectedRoute>} />
    <Route path="/chat/:conversationId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/my-chats" element={<ProtectedRoute><MyChats /></ProtectedRoute>} />
    <Route path="/my-cart" element={<ProtectedRoute><MyCart /></ProtectedRoute>} />
    <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
    <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
    <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    <Route path="/scan-qr" element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

    {/** NOT FOUND */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
