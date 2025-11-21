// LeaderboardRedesigned.tsx - The new, animated, professional component

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Medal,
  Award,
  Star,
  Target,
  ArrowLeft,
  Crown,
  Zap,
  User as UserIcon,
  CheckCircle,
  Loader
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion'; // Framer Motion for smooth animations

// --- Interface/Type Definitions ---
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  university: string;
  campus_points: number;
  trust_seller_badge: boolean;
  avatar_url?: string | null;
  mck_id?: string;
}

// --- Leaderboard Component ---
const LeaderboardRedesigned = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    // Assuming 'get_monthly_leaderboard' fetches the sorted data
    const { data, error } = await supabase.rpc('get_monthly_leaderboard');

    if (error) {
      console.error('Error fetching leaderboard:', error);
      toast({ title: 'Error', description: 'Failed to load leaderboard', variant: 'destructive' });
      setLeaderboard([]); 
    } else {
      setLeaderboard(data || []);
    }
    setLoading(false);
  };

  // Utility to determine the rank number/icon
  const getRankContent = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500/30" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400 fill-gray-400/30" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600 fill-amber-600/30" />;
      default:
        return <span className="text-xl font-extrabold text-primary/70">{index + 1}</span>;
    }
  };

  // Utility for top 3 visual styling
  const getRankCardStyles = (index: number) => {
    switch (index) {
      case 0:
        return 'border-yellow-500/50 bg-yellow-500/5 shadow-2xl shadow-yellow-500/20 transform scale-[1.02]';
      case 1:
        return 'border-gray-400/40 bg-gray-400/5 shadow-xl shadow-gray-400/10';
      case 2:
        return 'border-amber-600/40 bg-amber-600/5 shadow-lg shadow-amber-600/10';
      default:
        return 'border-border/70 bg-card hover:border-primary/40';
    }
  };

  // Framer Motion animation variants for list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
            <Loader className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className='text-lg font-medium text-muted-foreground'>Loading Campus Elite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header/Back Button */}
        <div className="flex justify-between items-center mb-10">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Title Section */}
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 50 }}
            className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Campus Elite Leaderboard
            </h1>
          </div>
          <p className="text-muted-foreground text-md md:text-lg">The Top 100 student performers this month. Earn points, win rewards! 🏆</p>
        </motion.div>

        {/* Rewards Section (Refined Look) */}
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'tween' }}
        >
            <Card className="mb-10 border-primary/30 bg-primary/5 shadow-lg">
              <CardHeader className='p-4 md:p-6'>
                <CardTitle className="flex items-center gap-2 text-primary font-bold text-xl">
                  <Star className="h-5 w-5 text-warning fill-warning/20" />
                  Monthly Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10">
                    <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-1 fill-yellow-500/20" />
                    <div className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm">🥇 1st</div>
                    <div className="text-xs text-muted-foreground">₹500 Voucher</div>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-400/40 bg-gray-400/10">
                    <Medal className="h-6 w-6 text-gray-400 mx-auto mb-1 fill-gray-400/20" />
                    <div className="font-semibold text-gray-600 dark:text-gray-400 text-sm">🥈 2nd</div>
                    <div className="text-xs text-muted-foreground">₹300 Voucher</div>
                  </div>
                  <div className="p-3 rounded-lg border border-amber-600/40 bg-amber-600/10">
                    <Award className="h-6 w-6 text-amber-600 mx-auto mb-1 fill-amber-600/20" />
                    <div className="font-semibold text-amber-600 dark:text-amber-400 text-sm">🥉 3rd</div>
                    <div className="text-xs text-muted-foreground">₹200 Voucher</div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </motion.div>


        {/* Leaderboard List */}
        {leaderboard.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">The Board is Empty!</h3>
              <p className="text-muted-foreground">Start performing to claim your spot.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.user_id}
                  variants={itemVariants}
                  // Using an actual Card component wrapper to contain the motion.div for better styling compatibility
                  className="rounded-xl transition-all duration-500 ease-in-out hover:shadow-2xl hover:shadow-primary/10"
                >
                    <Card className={`p-4 md:p-5 flex items-center justify-between transition-all duration-300 ${getRankCardStyles(index)}`}>
                        {/* LEFT SIDE: Rank, Avatar, Info */}
                        <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            {/* Rank Icon */}
                            <div className="w-8 flex-shrink-0 text-center">
                                {getRankContent(index)}
                            </div>

                            {/* Avatar */}
                            <Avatar className={`h-12 w-12 flex-shrink-0 transition-all duration-300 ${index < 3 ? 'border-4 border-primary/50 ring-2 ring-primary/20' : 'border-2 border-border/50'}`}>
                                <AvatarImage
                                    src={entry.avatar_url ? `${supabase.storage.from('avatars').getPublicUrl(entry.avatar_url).data.publicUrl}` : undefined}
                                    alt={entry.full_name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-medium">
                                    {entry.full_name?.charAt(0) || <UserIcon className="h-6 w-6" />}
                                </AvatarFallback>
                            </Avatar>

                            {/* Name & University/ID */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold truncate text-foreground">
                                        {entry.full_name}
                                    </h3>
                                    {entry.trust_seller_badge && (
                                        <Badge 
                                            variant="outline" 
                                            className="bg-green-500/10 text-green-500 border-green-500/30 transition-all duration-300 hover:scale-[1.05]"
                                        >
                                            <CheckCircle className="h-3 w-3 mr-1 fill-green-500/20" /> Trusted Seller
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {entry.university || entry.mck_id || 'Campus Member'}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Campus Points */}
                        <div className="flex flex-col items-end text-right flex-shrink-0">
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.05 }}
                                className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
                            >
                                {entry.campus_points}
                            </motion.div>
                            <div className="text-xs text-muted-foreground">
                                Campus Points
                            </div>
                        </div>
                    </Card>
                </motion.div>
              ))}
            </motion.div>
          )}


        {/* How Points Work (Refined) */}
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 50 }}
        >
            <Card className="mt-12 border-primary/20 bg-muted/20 shadow-xl">
              <CardHeader className='pb-4'>
                <CardTitle className="flex items-center gap-2 text-primary font-bold">
                  <Target className="h-5 w-5 text-primary" /> Campus Points System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg text-foreground">
                        Earning Points <Zap className='h-4 w-4 text-warning' />
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground list-none pl-0">
                      <li className='flex items-start'>• Complete a sale: <span className="text-green-500 font-semibold ml-2">+10 points</span></li>
                      <li className='flex items-start'>• Make a purchase: <span className="text-primary font-semibold ml-2">+5 points</span></li>
                      <li className='flex items-start'>• Get verified: <span className="text-warning font-semibold ml-2">+20 points</span></li>
                      <li className='flex items-start'>• First listing: <span className="text-blue-500 font-semibold ml-2">+15 points</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg text-foreground">
                        Perks & Status <Trophy className='h-4 w-4 text-primary' />
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground list-none pl-0">
                      <li className='flex items-start'>• 7+ deals: <span className="text-green-500 font-semibold ml-2">Trusted Seller Badge</span></li>
                      <li className='flex items-start'>• Top 3 monthly: <span className="text-warning font-semibold ml-2">Cash Vouchers</span></li>
                      <li className='flex items-start'>• 100+ points: <span className="text-primary font-semibold ml-2">Premium Features</span></li>
                      <li className='flex items-start'>• 500+ points: <span className="text-warning font-semibold ml-2">VIP Status Access</span></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
        </motion.div>

      </div>
    </div>
  );
};

export default LeaderboardRedesigned;
