import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, CheckCheck, MessageCircle, Heart, UserPlus, AtSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationItem {
  id: string;
  title: string | null;
  body: string | null;
  url: string | null;
  is_read: boolean;
  created_at: string;
  type: string | null;
}

// Icon mapping based on notification type (customize to your needs)
const typeIcons: Record<string, React.ReactNode> = {
  message: <MessageCircle className="h-4 w-4 text-blue-400" />,
  like: <Heart className="h-4 w-4 text-pink-400" />,
  follow: <UserPlus className="h-4 w-4 text-emerald-400" />,
  mention: <AtSign className="h-4 w-4 text-violet-400" />,
  default: <Bell className="h-4 w-4 text-muted-foreground" />,
};

// Group notifications by date for a cleaner UI
const groupByDate = (items: NotificationItem[]) => {
  const groups: { label: string; items: NotificationItem[] }[] = [];
  let lastDate = "";

  items.forEach((item) => {
    const date = new Date(item.created_at);
    let label = "";
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    else label = format(date, "MMMM d, yyyy");

    if (lastDate !== label) {
      groups.push({ label, items: [item] });
      lastDate = label;
    } else {
      groups[groups.length - 1].items.push(item);
    }
  });
  return groups;
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, url, is_read, created_at, type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setItems(data as NotificationItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    load();
    const channel = supabase
      .channel(`notif-page-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load, navigate]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    setMarkingAll(true);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    // Optimistically update UI
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  const handleClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    }
    if (n.url) navigate(n.url);
  };

  const grouped = groupByDate(items);

  // Stagger animation for list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Glassmorphism header */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0 || markingAll}
            className="text-sm font-medium gap-1.5 transition-all hover:bg-primary/10"
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all read
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          // Skeleton loader
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                {Array.from({ length: 2 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-3 p-3 rounded-xl border bg-card animate-pulse"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          // Animated empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="inline-block"
            >
              <Bell className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
            </motion.div>
            <p className="text-muted-foreground text-lg font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              New notifications will appear here.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              {grouped.map((group) => (
                <div key={group.label}>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 pl-2"
                  >
                    {group.label}
                  </motion.p>
                  <motion.div className="space-y-2" layout>
                    {group.items.map((n) => (
                      <motion.button
                        key={n.id}
                        layout
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        onClick={() => handleClick(n)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          !n.is_read
                            ? "bg-primary/5 border-primary/30 shadow-sm"
                            : "bg-card border-border/60 hover:bg-muted/20"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* Type icon */}
                          <div className="mt-0.5 shrink-0">
                            {n.type ? (
                              typeIcons[n.type] || typeIcons.default
                            ) : (
                              typeIcons.default
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium", !n.is_read && "text-foreground font-semibold")}>
                              {n.title || "Notification"}
                            </p>
                            {n.body && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              {!n.is_read && (
                                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                              )}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default Notifications;
