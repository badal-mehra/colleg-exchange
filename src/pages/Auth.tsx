import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Users, Shield, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/mycampuskart-logo.png';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const university = formData.get('university') as string;
    const termsAccepted = formData.get('terms') as string;
    
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Sign up the user
    const result = await signUp(email, password, fullName, university);
    
    // If signup successful, record terms acceptance
    if (result?.data?.user) {
      const { data: activeTerms } = await supabase
        .from('terms_and_conditions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (activeTerms) {
        await supabase
          .from('user_terms_acceptance')
          .insert({
            user_id: result.data.user.id,
            terms_id: activeTerms.id,
          });
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero content */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="MyCampusKart" 
              className="h-16 mx-auto lg:mx-0"
            />
            <p className="text-xl text-muted-foreground">
              Your Campus Marketplace - Buy, Sell, Connect
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card border">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Buy & Sell</h3>
                <p className="text-sm text-muted-foreground">Easy trading</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card border">
              <Users className="h-8 w-8 text-accent" />
              <div>
                <h3 className="font-semibold">Connect</h3>
                <p className="text-sm text-muted-foreground">Chat with peers</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card border">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Verified</h3>
                <p className="text-sm text-muted-foreground">Student-only</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card border">
              <BookOpen className="h-8 w-8 text-accent" />
              <div>
                <h3 className="font-semibold">Campus</h3>
                <p className="text-sm text-muted-foreground">Your college</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <img 
                src={logo} 
                alt="MyCampusKart" 
                className="h-14"
              />
            </div>
            <CardTitle>Welcome to MyCampusKart</CardTitle>
            <CardDescription>
              Join your campus marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@college.edu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-xs p-0 h-auto"
                        onClick={async () => {
                          const email = (document.getElementById('email') as HTMLInputElement)?.value;
                          if (!email) {
                            toast({
                              title: "Error",
                              description: "Please enter your email first",
                              variant: "destructive",
                            });
                            return;
                          }
                          const { error } = await supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: `${window.location.origin}/reset-password`,
                          });
                          if (error) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          } else {
                            toast({
                              title: "Success",
                              description: "Password reset email sent! Check your inbox.",
                            });
                          }
                        }}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">LPU Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="yourname@lpu.in"
                      required
                      pattern=".*@lpu\.in$"
                      title="Please use your LPU email address (@lpu.in)"
                    />
                    <p className="text-xs text-muted-foreground">Use your @lpu.in email only</p>
                  </div>
                  <input type="hidden" name="university" value="Lovely Professional University" />
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      required
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                      I agree to the{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm text-primary hover:underline"
                        onClick={async () => {
                          const { data: terms } = await supabase
                            .from('terms_and_conditions')
                            .select('*')
                            .eq('is_active', true)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();
                          
                          if (terms) {
                            const newWindow = window.open('', '_blank');
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Terms and Conditions - MyCampusKart</title>
                                    <style>
                                      body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                                      h1 { color: #333; }
                                      .version { color: #666; font-size: 0.9rem; }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>Terms and Conditions</h1>
                                    <p class="version">Version: ${terms.version}</p>
                                    <div>${terms.content.replace(/\n/g, '<br>')}</div>
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          } else {
                            toast({
                              title: "Terms not available",
                              description: "Terms and conditions are not currently available. Please contact support.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Terms and Conditions
                      </Button>
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
