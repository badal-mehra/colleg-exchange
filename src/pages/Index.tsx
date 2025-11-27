import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Users, Shield, BookOpen, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  // Redirect authenticated users to home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/home" replace />;
};

export default Index;
