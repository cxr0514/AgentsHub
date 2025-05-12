import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";

// UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Lock, UserRound } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register form schema
const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeView, setActiveView] = useState<"login" | "signup">("login");

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "user", // Default role
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="relative min-h-screen flex bg-[#071224] text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-gradient-to-r from-[#0a1b32] to-[#061020] opacity-30"></div>
        <div className="absolute right-0 bottom-0 w-[800px] h-[800px] rounded-full bg-gradient-to-l from-[#0d1728] to-[#050d1c] opacity-30"></div>
        <div className="absolute right-1/3 bottom-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-[#081526] to-[#040c1b] opacity-20"></div>
      </div>
      
      {/* Two-column layout */}
      <div className="relative z-10 flex flex-col md:flex-row w-full">
        {/* Left column - Auth forms */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo for mobile view */}
            <div className="md:hidden mb-12">
              <div className="flex items-center justify-center gap-2">
                <div className="text-[#FF7A00] text-6xl">⌂</div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  Prop<span className="text-[#FF7A00]">Invest</span>AI
                </div>
              </div>
              <p className="text-[#8A93A6] text-center mt-2">Real Estate Intelligence Platform</p>
            </div>
            
            {activeView === "login" ? (
              <>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="w-full">
                    <div className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center border border-[#0f1d31] rounded-md px-3 bg-[#050e1d] focus-within:border-[#FF7A00]">
                                <UserRound className="h-4 w-4 mr-2 text-[#FF7A00]" />
                                <Input
                                  placeholder="Username"
                                  {...field}
                                  className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center border border-[#0f1d31] rounded-md px-3 bg-[#050e1d] focus-within:border-[#FF7A00]">
                                <Lock className="h-4 w-4 mr-2 text-[#FF7A00]" />
                                <Input
                                  type="password"
                                  placeholder="Password"
                                  {...field}
                                  className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6 flex flex-col space-y-4">
                      <Button
                        type="submit"
                        className="w-full bg-[#FF7A00] text-white py-2"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline" 
                        className="w-full border-[#0f1d31] text-white bg-[#071224]"
                        onClick={() => setActiveView("signup")}
                      >
                        Sign up
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            ) : (
              <>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="w-full">
                    <div className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center border border-[#0f1d31] rounded-md px-3 bg-[#050e1d] focus-within:border-[#FF7A00]">
                                <UserRound className="h-4 w-4 mr-2 text-[#FF7A00]" />
                                <Input
                                  placeholder="Username"
                                  {...field}
                                  className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center border border-[#0f1d31] rounded-md px-3 bg-[#050e1d] focus-within:border-[#FF7A00]">
                                <Input
                                  type="email"
                                  placeholder="Email"
                                  {...field}
                                  className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center border border-[#0f1d31] rounded-md px-3 bg-[#050e1d] focus-within:border-[#FF7A00]">
                                <Input
                                  placeholder="Full Name"
                                  {...field}
                                  value={field.value || ""}
                                  className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center border border-[#0f1d31] rounded-md px-3 bg-[#050e1d] focus-within:border-[#FF7A00]">
                                <Lock className="h-4 w-4 mr-2 text-[#FF7A00]" />
                                <Input
                                  type="password"
                                  placeholder="Password"
                                  {...field}
                                  className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center border border-[#0f1d31] rounded-md px-3 bg-[#050e1d] focus-within:border-[#FF7A00]">
                                <Lock className="h-4 w-4 mr-2 text-[#FF7A00]" />
                                <Input
                                  type="password"
                                  placeholder="Confirm Password"
                                  {...field}
                                  className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6 flex flex-col space-y-4">
                      <Button
                        type="submit"
                        className="w-full bg-[#FF7A00] text-white py-2"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Sign up"}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline" 
                        className="w-full border-[#0f1d31] text-white bg-[#071224]"
                        onClick={() => setActiveView("login")}
                      >
                        Login
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            )}
            
            {/* Links */}
            <div className="mt-8 flex justify-center space-x-4 text-sm text-[#8A93A6]">
              <a href="#" className="text-[#FF7A00]">Terms of use</a>
              <a href="#" className="text-[#FF7A00]">Privacy policy</a>
            </div>
          </div>
        </div>
        
        {/* Right column - Hero section */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#0a1728] to-[#071224] items-center justify-center p-8">
          <div className="max-w-lg">
            {/* Logo for desktop view */}
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <div className="text-[#FF7A00] text-6xl">⌂</div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  Prop<span className="text-[#FF7A00]">Invest</span>AI
                </div>
              </div>
              <p className="text-[#8A93A6] mt-2">Real Estate Intelligence Platform</p>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">Make Smarter Real Estate Investments</h1>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#FF7A00]/20 flex items-center justify-center">
                    <div className="h-5 w-5 text-[#FF7A00]">✓</div>
                  </div>
                  <h3 className="font-semibold text-lg">AI-Powered Market Analysis</h3>
                </div>
                <p className="text-[#8A93A6] ml-10">Get predictive insights on market trends and property values</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#FF7A00]/20 flex items-center justify-center">
                    <div className="h-5 w-5 text-[#FF7A00]">✓</div>
                  </div>
                  <h3 className="font-semibold text-lg">Advanced Property Comparison</h3>
                </div>
                <p className="text-[#8A93A6] ml-10">Compare properties side-by-side with detailed analytics</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#FF7A00]/20 flex items-center justify-center">
                    <div className="h-5 w-5 text-[#FF7A00]">✓</div>
                  </div>
                  <h3 className="font-semibold text-lg">Personalized Recommendations</h3>
                </div>
                <p className="text-[#8A93A6] ml-10">Discover properties that match your investment criteria</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-[#0f1d31] rounded-lg border border-[#1a2c4a]">
              <p className="text-sm italic text-[#8A93A6]">
                "PropInvestAI has revolutionized our investment strategy. The predictive analytics helped us identify emerging market opportunities before they became obvious."
              </p>
              <div className="mt-2 text-sm font-medium">— Michael Chen, Real Estate Investor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}