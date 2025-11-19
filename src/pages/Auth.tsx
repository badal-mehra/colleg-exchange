import React, { useState, useMemo, useCallback } from 'react';
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
import { 
  Loader2, Key, Mail, User, Eye, EyeOff, LogIn, UserPlus, GraduationCap, 
  Search, CheckCircle, XCircle, ArrowRight, Google
} from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/mycampuskart-logo.png'; 

// --- Placeholder Data ---
const SUPPORTED_UNIVERSITIES = [
  { value: 'lovely-professional-university', label: 'Lovely Professional University (@lpu.in)', domain: '@lpu.in' },
  { value: 'delhi-university', label: 'Delhi University (@du.ac.in)', domain: '@du.ac.in' },
  { value: 'stanford-university', label: 'Stanford University (@stanford.edu)', domain: '@stanford.edu' },
];

// --- Utility: Password Strength Checker ---
const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Special character
    return score;
};

// --- Component Definition ---
const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState(SUPPORTED_UNIVERSITIES[0].value);

  // Memoized values
  const currentUniversity = useMemo(() => 
    SUPPORTED_UNIVERSITIES.find(uni => uni.value === selectedUniversity), 
    [selectedUniversity]
  );
  const emailPattern = currentUniversity ? `.*${currentUniversity.domain}$` : '.*';
  const emailTitle = currentUniversity ? `Please use your official university email address (${currentUniversity.domain})` : '';
  const passwordStrength = getPasswordStrength(passwordInput);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- Handlers ---
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await signIn(formData.get('email') as string, formData.get('password') as string);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Password and Confirm Password do not match.", variant: "destructive", });
      setIsLoading(false);
      return;
    }

    if (formData.get('terms') !== 'on') {
      toast({ title: "Agreement Required", description: "Please accept the Terms of Service to create an account.", variant: "destructive", });
      setIsLoading(false);
      return;
    }
    
    // Check minimum strength (e.g., score of 3 or higher)
    if (passwordStrength < 3) {
      toast({ title: "Weak Password", description: "Please choose a stronger password (min 8 chars, mixed case, number, special char recommended).", variant: "destructive", });
      setIsLoading(false);
      return;
    }

    await signUp(
      formData.get('email') as string, 
      password, 
      formData.get('fullName') as string, 
      currentUniversity?.label || 'Unknown University' // Safe access
    );
    
    setIsLoading(false);
  };
  
  const handleOAuthSignIn = useCallback(async (provider: 'google') => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "OAuth Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // If no error, Supabase redirects the user, so no need to set isLoading(false) on success.
  }, [toast]);


  const handleViewTerms = async () => {
    const { data: terms, error } = await supabase
      .from('terms_and_conditions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !terms || !terms.content) {
      toast({
        title: "Terms Not Found",
        description: "Could not load the latest Terms of Service. Check console for details.",
        variant: "destructive",
      });
      console.error("Error fetching terms:", error);
      return;
    }

    // If successful, open in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Terms of Service - MyCampusKart</title>
            <style>
              body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #1f2937; }
              h1 { color: #4f46e5; }
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
  };


  // --- Password Strength Bar Component ---
  const StrengthBar = () => {
    const width = `${(passwordStrength / 5) * 100}%`;
    let color = 'bg-gray-300';
    let text = 'Too Short';

    if (passwordStrength >= 5) {
      color = 'bg-green-500';
      text = 'Excellent';
    } else if (passwordStrength >= 3) {
      color = 'bg-yellow-500';
      text = 'Good';
    } else if (passwordStrength >= 1) {
      color = 'bg-red-500';
      text = 'Weak';
    }

    if (!passwordInput) return null;

    return (
      <div className="mt-1 space-y-1">
        <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div 
            className={`h-full transition-all duration-300 ${color}`} 
            style={{ width: width }}
          />
        </div>
        <p className={`text-xs font-medium ${passwordStrength >= 3 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          Strength: {text}
        </p>
      </div>
    );
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-10 items-center">
        
        {/* Left side - Professional, Themed Hero Content */}
        <div className="space-y-8 text-center lg:text-left hidden lg:block pr-8">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="MyCampusKart Logo" 
              className="h-16 mx-auto lg:mx-0 object-contain"
            />
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                The Campus Standard
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg lg:mx-0 mx-auto">
              Access the secure, institution-verified platform designed for your university life.
            </p>
          </div>

          {/* Feature List (Professional & Simple) */}
          <ul className="space-y-3 pt-6 text-left max-w-md mx-auto lg:mx-0">
            <li className="flex items-center space-x-3 text-lg font-medium text-gray-800 dark:text-gray-200">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <span>Verified Identity (Student/Faculty)</span>
            </li>
            <li className="flex items-center space-x-3 text-lg font-medium text-gray-800 dark:text-gray-200">
              <Key className="h-6 w-6 text-primary flex-shrink-0" />
              <span>Secure, Encrypted Communication</span>
            </li>
            <li className="flex items-center space-x-3 text-lg font-medium text-gray-800 dark:text-gray-200">
              <GraduationCap className="h-6 w-6 text-primary flex-shrink-0" />
              <span>University-Exclusive Services</span>
            </li>
            <li className="flex items-center space-x-3 text-lg font-medium text-gray-800 dark:text-gray-200">
              <Search className="h-6 w-6 text-primary flex-shrink-0" />
              <span>Optimized Campus Resource Discovery</span>
            </li>
          </ul>
        </div>

        {/* Right side - Auth forms (Main Focus) */}
        <div className="lg:order-last order-first flex justify-center w-full">
            <Card className="w-full shadow-xl transition-all duration-300 border-t-4 border-primary">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4 lg:hidden">
                        <img 
                            src={logo} 
                            alt="MyCampusKart" 
                            className="h-12 object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {activeTab === 'signin' ? 'Sign In to MyCampusKart' : 'Get Started'}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === 'signin' 
                            ? 'Use your university credentials to proceed.' 
                            : 'Create your secure account in a few steps.'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="signin" className="space-y-6" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 h-10">
                            <TabsTrigger value="signin" className="flex items-center space-x-2"><LogIn className="w-4 h-4"/><span>Sign In</span></TabsTrigger>
                            <TabsTrigger value="signup" className="flex items-center space-x-2"><UserPlus className="w-4 h-4"/><span>Sign Up</span></TabsTrigger>
                        </TabsList>
                        
                        {/* Sign In Tab */}
                        <TabsContent value="signin" className="space-y-4">
                            <form onSubmit={handleSignIn} className="space-y-5">
                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="signin-email">University Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="signin-email" name="email" type="email" placeholder="your.email@college.edu" required className="pl-10" disabled={isLoading} />
                                    </div>
                                </div>
                                {/* Password */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="signin-password">Password</Label>
                                        <Button type="button" variant="link" className="text-xs p-0 h-auto text-primary hover:text-primary/80" disabled={isLoading}>Forgot Password?</Button>
                                    </div>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="signin-password" name="password" type={showPassword ? "text" : "password"} required className="pl-10 pr-10" disabled={isLoading} />
                                        <Button
                                            type="button" variant="ghost" size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-primary transition-colors duration-150"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                
                                <Button type="submit" className="w-full text-base bg-primary hover:bg-primary/90 transition-colors duration-200" disabled={isLoading}>
                                    {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>) : ("Sign In")}
                                </Button>
                            </form>

                            {/* Divider and OAuth */}
                            <div className="relative pt-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full space-x-2" 
                                onClick={() => handleOAuthSignIn('google')}
                                disabled={isLoading}
                            >
                                <Google className="h-5 w-5 text-red-500" />
                                <span>Sign In with Google</span>
                            </Button>
                        </TabsContent>

                        {/* Sign Up Tab */}
                        <TabsContent value="signup" className="space-y-4">
                            <form onSubmit={handleSignUp} className="space-y-5">
                                {/* University Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-university">Select Your University</Label>
                                    <Select name="university" value={selectedUniversity} onValueChange={setSelectedUniversity} disabled={isLoading} >
                                        <SelectTrigger id="signup-university" className="w-full">
                                            <SelectValue placeholder="Choose your institution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_UNIVERSITIES.map(uni => (
                                                <SelectItem key={uni.value} value={uni.value}>{uni.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-fullName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="signup-fullName" name="fullName" placeholder="Your official name" required className="pl-10" disabled={isLoading} />
                                    </div>
                                </div>
                                
                                {/* University Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">University Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-email" name="email" type="email" required
                                            placeholder={`yourname${currentUniversity?.domain || '@university.edu'}`}
                                            pattern={emailPattern} title={emailTitle} className="pl-10" disabled={isLoading}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Required domain: **{currentUniversity?.domain || 'Select a university first.'}**
                                    </p>
                                </div>
                                
                                {/* Password Field with Strength Indicator */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-password" name="password" type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password" required className="pl-10 pr-10" disabled={isLoading}
                                            onChange={(e) => setPasswordInput(e.target.value)}
                                        />
                                        <Button
                                            type="button" variant="ghost" size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-primary transition-colors duration-150"
                                            onClick={() => setShowPassword(prev => !prev)} disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <StrengthBar />
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password" required className="pl-10 pr-10" disabled={isLoading}
                                        />
                                        <Button
                                            type="button" variant="ghost" size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-primary transition-colors duration-150"
                                            onClick={() => setShowConfirmPassword(prev => !prev)} disabled={isLoading}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Terms Checkbox */}
                                <div className="flex items-start space-x-3 pt-2">
                                    <Checkbox id="terms" name="terms" className="mt-1" disabled={isLoading} />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="terms" className="text-sm font-normal leading-tight cursor-pointer">
                                            I agree to the{' '}
                                            <Button type="button" variant="link" className="h-auto p-0 text-sm font-medium text-primary hover:underline" onClick={handleViewTerms} disabled={isLoading}>
                                                Terms of Service
                                            </Button>
                                        </Label>
                                    </div>
                                </div>
                                
                                <Button type="submit" className="w-full text-base bg-primary hover:bg-primary/90 transition-colors duration-200" disabled={isLoading}>
                                    {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>) : ("Create Account")}
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
