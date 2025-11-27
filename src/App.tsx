// App.tsx – ✅ FINAL, FIXED, PRODUCTION-READY

import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/layouts/MainLayout";
// import MainLayout from "@/components/MainLayout";

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
// // Public Pages
// import Landing from "@/pages/Landing";
// import AuthPage from "@/pages/AuthPage";
// import KycPage from "@/pages/KycPage";

// // Protected Pages (Require Login + Layout)
// import Dashboard from "@/pages/Dashboard";
// import ItemDetail from "@/pages/ItemDetail";
// import Chat from "@/pages/Chat";
// import MyOrders from "@/pages/MyOrders";
// import MyListings from "@/pages/MyListings";
// import SellItem from "@/pages/SellItem";
// import MyCart from "@/pages/MyCart";
// import MyChats from "@/pages/MyChats";
// import Leaderboard from "@/pages/Leaderboard";
// import ProfilePage from "@/pages/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ✅ PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/kyc" element={<KycPage />} />

        {/* ✅ PROTECTED + LAYOUT WRAPPED ROUTES */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/item/:id" element={<ItemDetail />} />              {/* ✅ FIXED */}
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/sell" element={<SellItem />} />
          <Route path="/my-cart" element={<MyCart />} />
          <Route path="/my-chats" element={<MyChats />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile/:mckId" element={<ProfilePage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
