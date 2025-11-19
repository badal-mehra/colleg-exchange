import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox'; // Use Checkbox component for better styling
import { Loader2, Key, Mail, Shield, BookOpen, User, University } from 'lucide-react'; // Updated icons for a professional look
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/mycampuskart-logo.png';

// --- Component Definition ---
const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin'); // State to control active tab

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- Handlers ---
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Simulate successful sign-in or handle error inside useAuth
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
    // Checkbox returns "on" or null, so we explicitly check for "on"
    const termsAccepted = formData.get('terms') === 'on'; 
    
    if (!termsAccepted) {
      toast({
        title: "Agreement Required",
        description: "Please accept the Terms of Service to create an account.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Sign up the user (Error handling is typically done within the signUp function)
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
        // Suppress potential SQL error if terms acceptance fails; user is already created.
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
  
  // Function to open T&C in a new window (as per original logic)
  const handleViewTerms = async () => {
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
                h1 { color: #1f2937; } /* Darker text */
                .version { color: #6b7280; font-size: 0.9rem; margin-bottom: 1.5rem; }
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
  };


  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        
        {/* Left side - Professional Hero Content */}
        <div className="space-y-8 text-center lg:text-left hidden lg:block">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="MyCampusKart Logo" 
              className="h-16 mx-auto lg:mx-0 object-contain"
            />
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                Secure Student Ecosystem
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg lg:mx-0 mx-auto">
              Your trusted platform for the university community. Access verified resources and services.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* Professional Feature Cards */}
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition hover:shadow-lg">
              <Shield className="h-6 w-6 text-indigo-500" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">Verified Access</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exclusive for verified university members.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition hover:shadow-lg">
              <University className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">Campus Focus</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Services tailored to your specific university needs.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition hover:shadow-lg">
              <BookOpen className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">Resource Hub</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Centralized access to essential academic and campus items.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md transition hover:shadow-lg">
              <User className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">Community Tools</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect securely with your peers and groups.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="lg:order-last order-first flex justify-center">
            <Card className="w-full max-w-lg shadow-2xl dark:shadow-none transition-all duration-300">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4 lg:hidden">
                        <img 
                            src={logo} 
                            alt="MyCampusKart" 
                            className="h-12 object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {activeTab === 'signin' ? 'Access Your Account' : 'Create Student Account'}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === 'signin' 
                            ? 'Enter your credentials to continue to the platform.' 
                            : 'Join the verified MyCampusKart university network.'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="signin" className="space-y-6" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 h-10">
                            <TabsTrigger value="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        {/* Sign In Tab */}
                        <TabsContent value="signin" className="space-y-4">
                            <form onSubmit={handleSignIn} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="signin-email">University Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signin-email"
                                            name="email"
                                            type="email"
                                            placeholder="your.email@college.edu"
                                            required
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="signin-password">Password</Label>
                                        <Button 
                                            type="button" 
                                            variant="link" 
                                            className="text-xs p-0 h-auto text-primary hover:text-primary/80"
                                            onClick={async () => {
                                                const email = (document.getElementById('signin-email') as HTMLInputElement)?.value;
                                                if (!email) {
                                                    toast({ title: "Error", description: "Please enter your email first.", variant: "destructive" });
                                                    return;
                                                }
                                                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                                    redirectTo: `${window.location.origin}/reset-password`,
                                                });
                                                if (error) {
                                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                                } else {
                                                    toast({ title: "Success", description: "Password reset email sent! Check your inbox.", });
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            Forgot Password?
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signin-password"
                                            name="password"
                                            type="password"
                                            required
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full text-base" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                                    ) : (
                                        "Sign In to Platform"
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Sign Up Tab */}
                        <TabsContent value="signup" className="space-y-4">
                            <form onSubmit={handleSignUp} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-fullName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-fullName"
                                            name="fullName"
                                            placeholder="Your full name"
                                            required
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">LPU Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-email"
                                            name="email"
                                            type="email"
                                            placeholder="yourname@lpu.in"
                                            required
                                            pattern=".*@lpu\.in$"
                                            title="Please use your LPU email address (@lpu.in)"
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Verification required: Only **@lpu.in** emails are accepted.</p>
                                </div>
                                {/* Hidden input for 'university' as LPU is hardcoded for signup */}
                                <input type="hidden" name="university" value="Lovely Professional University" />
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-password"
                                            name="password"
                                            type="password"
                                            placeholder="Create a strong password"
                                            required
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 pt-2">
                                    <Checkbox 
                                        id="terms"
                                        name="terms"
                                        className="mt-1"
                                        disabled={isLoading}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label 
                                            htmlFor="terms" 
                                            className="text-sm font-normal leading-tight cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            I agree to the{' '}
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto p-0 text-sm font-medium text-primary hover:underline"
                                                onClick={handleViewTerms}
                                                disabled={isLoading}
                                            >
                                                Terms of Service
                                            </Button>
                                        </Label>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full text-base" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                                    ) : (
                                        "Create Verified Account"
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
