import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Users, Shield, BookOpen, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold text-primary tracking-tight">
                MyCampusKart
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Your trusted campus marketplace where students buy, sell, and connect safely
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <a href="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose MyCampusKart?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for students, by students. Safe, verified, and convenient.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg border bg-background">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Verified Students</h3>
              <p className="text-muted-foreground">
                Only verified students can join. Safe transactions guaranteed with ID verification.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg border bg-background">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Easy Trading</h3>
              <p className="text-muted-foreground">
                List items in seconds, browse by category, and find exactly what you need.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg border bg-background">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Campus Community</h3>
              <p className="text-muted-foreground">
                Connect with students from your college. Built-in chat for easy communication.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg border bg-background">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Student Focused</h3>
              <p className="text-muted-foreground">
                From textbooks to furniture, find everything you need for college life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of students already using MyCampusKart to buy and sell safely on campus.
            </p>
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/auth">
                Join MyCampusKart
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 MyCampusKart. Built for students, by students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
