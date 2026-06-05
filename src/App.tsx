
import ProtectedRoute from "@/components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Import Pages
import AuthCallback from "./pages/AuthCallback";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PWADashboard from "./pages/PWADashboard";
import ItemDetail from "./pages/ItemDetail";
import PGDetail from "./pages/PGDetail";
import KYC from "./pages/KYC";
import Profile from "./pages/Profile";
import PWAEditProfile from "./pages/PWAEditProfile";
import PublicProfile from "./pages/PublicProfile";
import SellItem from "./pages/SellItem";
import PWASellItem from "./pages/PWASellItem";
import Chat from "./pages/Chat";
import PWAChat from "./pages/PWAChat";
import MyChats from "./pages/MyChats";
import PWAChats from "./pages/PWAChats";
import MyListings from "./pages/MyListings";
import PWAMyListings from "./pages/PWAMyListings";
import MyPGListings from "./pages/MyPGListings";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ScanQR from "./pages/ScanQR";
import MyOrders from "./pages/MyOrders";
import PWAMyOrders from "./pages/PWAMyOrders";
import MyCart from "./pages/MyCart";
import MyReports from "./pages/MyReports";
import StaticPage from "./pages/StaticPage";
import PWAProfile from "./pages/PWAProfile";
import DownloadApp from "./pages/DownloadApp";
import Notifications from "./pages/Notifications";
import EditItem from "./pages/EditItem";

// Blog & Campus
import BlogHub from "./pages/blog/BlogHub";
import BlogPostPage from "./pages/blog/BlogPostPage";
import BlogTaxonomyPage from "./pages/blog/BlogTaxonomyPage";
import CampusIndex from "./pages/campus/CampusIndex";
import CampusPage from "./pages/campus/CampusPage";
import BlogAdmin from "./pages/admin/blog/BlogAdmin";
import BlogEditor from "./pages/admin/blog/BlogEditor";
import { CategoryAdmin, TagAdmin } from "./pages/admin/blog/TaxonomyAdmin";
import CampusAdmin from "./pages/admin/campus/CampusAdmin";

// Check if running as PWA
const isPWA = () => typeof window !== 'undefined' && (
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true
);

// Unified home: PWA users (standalone display) get the native PWA dashboard,
// everyone else (logged in or not) gets the Browse marketplace. This single
// switcher backs `/`, `/home`, `/browse`, `/dashboard`, `/categories`, etc.
const SmartHome = () => (isPWA() ? <PWADashboard /> : <Browse />);
const SmartDashboard = SmartHome;

// PWA Sell wrapper
const SmartSellItem = () => isPWA() ? <PWASellItem /> : <SellItem />;

// PWA Chat wrappers
const SmartChat = () => isPWA() ? <PWAChat /> : <Chat />;
const SmartChats = () => isPWA() ? <PWAChats /> : <MyChats />;

// PWA Listings wrapper
const SmartMyListings = () => isPWA() ? <PWAMyListings /> : <MyListings />;

// PWA Orders wrapper
const SmartMyOrders = () => isPWA() ? <PWAMyOrders /> : <MyOrders />;

// PWA Profile wrapper
const SmartProfile = () => isPWA() ? <PWAEditProfile /> : <Profile />;

const App = () => (
  <Routes>
    {/** ROUTES WITH HEADER + FOOTER (MainLayout) */}
    <Route element={<MainLayout />}>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SmartHome />
          </ProtectedRoute>
        }
      />
        </Route>
      {/* FIX: Removed ProtectedRoute wrapper. PWAProfile now handles its own auth check to prevent white-screen race conditions. */}
      <Route path="/pwa-profile" element={<PWAProfile />} />
      
      <Route path="/my-chats" element={<ProtectedRoute><SmartChats /></ProtectedRoute>} />
      {/* <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} /> */}
      <Route path="/my-orders" element={<ProtectedRoute><SmartMyOrders /></ProtectedRoute>} />
  

    {/** FULLSCREEN ROUTES (NO HEADER / NO FOOTER) */}
    <Route path="/" element={<SmartHome />} />
    <Route path="/home" element={<SmartHome />} />
    <Route path="/browse" element={<SmartHome />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/downloadmycampuskartapp" element={<DownloadApp />} />

    {/** STATIC PAGES */}
    <Route path="/terms" element={<StaticPage />} />
    <Route path="/privacy" element={<StaticPage />} />
    <Route path="/about" element={<StaticPage />} />
    <Route path="/shipping" element={<StaticPage />} />
    <Route path="/help" element={<StaticPage />} />
    <Route path="/report" element={<StaticPage />} />

    {/** PUBLIC NO-LAYOUT PAGES - SEO-friendly slugged URLs (also matches legacy /item/:id) */}
    <Route path="/item/:slugId" element={<ItemDetail />} />
    <Route path="/pg/:slugId" element={<PGDetail />} />
    <Route path="/profile/:mckId" element={<PublicProfile />} />
    <Route path="/u/:mckId" element={<PublicProfile />} />
    <Route path="/category/:slug" element={<SmartHome />} />
    <Route path="/categories" element={<SmartHome />} />
    <Route path="/categories/:slug" element={<SmartHome />} />
    <Route path="/campus-marketplace/:city" element={<SmartHome />} />



    {/** PROTECTED NO-LAYOUT PAGES */}
    <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><SmartProfile /></ProtectedRoute>} />
    <Route path="/sell" element={<ProtectedRoute><SmartSellItem /></ProtectedRoute>} />
    <Route path="/chat/:conversationId?" element={<ProtectedRoute><SmartChat /></ProtectedRoute>} />
    <Route path="/pwa-chat/:conversationId" element={<ProtectedRoute><PWAChat /></ProtectedRoute>} />
    <Route path="/my-cart" element={<ProtectedRoute><MyCart /></ProtectedRoute>} />
    <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
    <Route path="/my-listings" element={<ProtectedRoute><SmartMyListings /></ProtectedRoute>} />
    <Route path="/my-pg-listings" element={<ProtectedRoute><MyPGListings /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    <Route path="/scan-qr" element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/edit-item/:id" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />

    {/** BLOG (public) */}
    <Route path="/blog" element={<BlogHub />} />
    <Route path="/blog/category/:slug" element={<BlogTaxonomyPage kind="category" />} />
    <Route path="/blog/tag/:slug" element={<BlogTaxonomyPage kind="tag" />} />
    <Route path="/blog/:slug" element={<BlogPostPage />} />

    {/** CAMPUS (public) */}
    <Route path="/campuses" element={<CampusIndex />} />
    <Route path="/campus/:slug" element={<CampusPage />} />

    {/** ADMIN BLOG */}
    <Route path="/admin/blog" element={<ProtectedRoute><BlogAdmin /></ProtectedRoute>} />
    <Route path="/admin/blog/new" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
    <Route path="/admin/blog/:id/edit" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
    <Route path="/admin/blog/categories" element={<ProtectedRoute><CategoryAdmin /></ProtectedRoute>} />
    <Route path="/admin/blog/tags" element={<ProtectedRoute><TagAdmin /></ProtectedRoute>} />
    <Route path="/admin/campus" element={<ProtectedRoute><CampusAdmin /></ProtectedRoute>} />


    {/** NOT FOUND */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
