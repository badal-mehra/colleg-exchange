// App.tsx

import ProtectedRoute from "@/components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout"; // ⭐ Import the new MainLayout component

// Import all your Page Components
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
      {/* 🔥 CRITICAL FIX: Persistent Layout Route wraps ALL shared pages */}
      <Route element={<MainLayout />}> 
        
        {/* Public Routes inside the persistent layout */}
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<Home />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/profile/:mckId" element={<PublicProfile />} />
        <Route path="/terms" element={<StaticPage />} />
        <Route path="/privacy" element={<StaticPage />} />
        <Route path="/about" element={<StaticPage />} />
        <Route path="/shipping" element={<StaticPage />} />
        <Route path="/help" element={<StaticPage />} />
        <Route path="/report" element={<StaticPage />} />
        
        {/* Protected Routes (nested inside Layout) */}
        <Route
          path="/kyc"
          element={<ProtectedRoute><KYC /></ProtectedRoute>}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        <Route
          path="/sell"
          element={<ProtectedRoute><SellItem /></ProtectedRoute>}
        />
        <Route
          path="/chat/:conversationId?"
          element={<ProtectedRoute><Chat /></ProtectedRoute>}
        />
        <Route
          path="/my-chats"
          element={<ProtectedRoute><MyChats /></ProtectedRoute>}
        />
        <Route
          path="/my-cart"
          element={<ProtectedRoute><MyCart /></ProtectedRoute>}
        />
        <Route
          path="/my-reports"
          element={<ProtectedRoute><MyReports /></ProtectedRoute>}
        />
        <Route
          path="/my-listings"
          element={<ProtectedRoute><MyListings /></ProtectedRoute>}
        />
        <Route
          path="/my-orders"
          element={<ProtectedRoute><MyOrders /></ProtectedRoute>}
        />
        <Route
          path="/leaderboard"
          element={<ProtectedRoute><Leaderboard /></ProtectedRoute>}
        />
        <Route
          path="/scan-qr"
          element={<ProtectedRoute><ScanQR /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
        />
      </Route>
      
      {/* Routes WITHOUT Layout (pure auth/reset pages) */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Catch-all Not Found Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
);

export default App;
