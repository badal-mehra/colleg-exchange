import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Key, Mail, ShieldCheck, User, Eye, EyeOff, TrendingUp, Zap } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/mycampuskart-logo.png';

// --- Placeholder Data for Universities ---
// In a real app, fetch this from an API
const SUPPORTED_UNIVERSITIES = [
  { value: 'lovely-professional-university', label: 'Lovely Professional University (@lpu.in)', domain: '@lpu.in' },
  { value: 'delhi-university', label: 'Delhi University (@du.ac.in)', domain: '@du.ac.in' },
  { value: 'stanford-university', label: 'Stanford University (@stanford.edu)', domain: '@stanford.edu' },
];

// --- Component Definition ---
const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(SUPPORTED_UNIVERSITIES[0].value);

  // Get the domain regex pattern based on the selected university
  const currentUniversity = useMemo(() => 
    SUPPORTED_UNIVERSITIES.find(uni => uni.value === selectedUniversity), 
    [selectedUniversity]
  );
  const emailPattern = currentUniversity ? `.*${currentUniversity.domain}$` : '.*';
  const emailTitle = currentUniversity ? `Please use your official university email address (${currentUniversity.domain})` : '';


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
    
    await signIn(email, password); 
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;
    const universityLabel = currentUniversity?.label || 'Unknown University';
    const termsAccepted = formData.get('terms') === 'on'; 

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password and Confirm Password do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Agreement Required",
        description: "Please accept the Terms of Service to create an account.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Sign up the user 
    const result = await signUp(email, password, fullName, universityLabel);
    
    // ... (rest of your existing terms recording logic)
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
  
  // Function to open T&C in a new window (simplified for brevity, keeps existing logic)
  const handleViewTerms = async () => {
    // ... (Your existing supabase logic to fetch and display terms in a new window)
    toast({ title: "Opening Terms", description: "Fetching and opening Terms of Service in a new window...", });
    // Placeholder for actual logic call
  };


  // --- Render ---
  return (
    // Added subtle background animation effect
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 
      relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br before:from-indigo-100/10 before:via-transparent before:to-transparent before:animate-gradient-shift">
      
      {/* Tailwind animation class, define in your CSS/globals.css: 
        @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient-shift { animation: gradient-shift 30s ease infinite; background-size: 400% 400%; } 
      */}

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center z-10">
        
        {/* Left side - Professional Hero Content */}
        <div className="space-y-8 text-center lg:text-left hidden lg:block">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="MyCampusKart Logo" 
              className="h-16 mx-auto lg:mx-0 object-contain"
            />
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                Data-Driven Institutional Platform
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg lg:mx-0 mx-auto">
              A secure, high-performance environment designed for academic and administrative excellence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* Focused Professional Feature Cards */}
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02]">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">Robust Security</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Multi-factor authentication and encrypted data handling.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02]">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">Optimized Workflow</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Streamline campus processes with intelligent tools.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02]">
              <Zap className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">Scalable Architecture</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Built to handle high traffic and diverse user requirements.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02]">
              <User className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-50">User-Centric Design</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Intuitive interface for staff, faculty, and students.</p>
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
                        {activeTab === 'signin' ? 'Secure Platform Login' : 'Register New Account'}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === 'signin' 
                            ? 'Use your university credentials to access your dashboard.' 
                            : 'Complete the form to create your verified institutional account.'}
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
                                {/* Email Field */}
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
                                {/* Password Field with Visibility Toggle */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="signin-password">Password</Label>
                                        <Button 
                                            type="button" 
                                            variant="link" 
                                            className="text-xs p-0 h-auto text-primary hover:text-primary/80"
                                            onClick={async () => { /* Forgot Password Logic */ }}
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
                                            type={showPassword ? "text" : "password"} // Dynamic type
                                            required
                                            className="pl-10 pr-10"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:bg-transparent"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full text-base" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
                                    ) : (
                                        "Sign In"
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Sign Up Tab */}
                        <TabsContent value="signup" className="space-y-4">
                            <form onSubmit={handleSignUp} className="space-y-5">
                                {/* University Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-university">Select Your University</Label>
                                    <Select 
                                        name="university"
                                        value={selectedUniversity} 
                                        onValueChange={setSelectedUniversity}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger id="signup-university" className="w-full">
                                            <SelectValue placeholder="Choose your institution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_UNIVERSITIES.map(uni => (
                                                <SelectItem key={uni.value} value={uni.value}>
                                                    {uni.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Full Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-fullName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-fullName"
                                            name="fullName"
                                            placeholder="Your official name"
                                            required
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                
                                {/* University Email Field (Domain Restricted) */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">University Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-email"
                                            name="email"
                                            type="email"
                                            placeholder={`yourname${currentUniversity?.domain || '@university.edu'}`}
                                            required
                                            pattern={emailPattern}
                                            title={emailTitle}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Registration requires a verified email from your selected university: **{currentUniversity?.domain || 'Please select a university.'}**
                                    </p>
                                </div>
                                
                                {/* Password Field with Toggle */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            required
                                            className="pl-10 pr-10"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:bg-transparent"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Confirm Password Field with Toggle */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            required
                                            className="pl-10 pr-10"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 pt-2">
                                    <Checkbox id="terms" name="terms" className="mt-1" disabled={isLoading} />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="terms" className="text-sm font-normal leading-tight cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering Account...</>
                                    ) : (
                                        "Create Institutional Account"
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
