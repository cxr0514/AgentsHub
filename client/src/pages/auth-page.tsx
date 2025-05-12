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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Background gradient waves */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-wave absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-gradient-to-r from-teal-400 to-teal-200 opacity-20"></div>
        <div className="animate-wave-slow absolute right-0 bottom-0 w-[800px] h-[800px] rounded-full bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-400 opacity-20"></div>
        <div className="animate-wave-slower absolute right-1/3 bottom-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-400 opacity-10"></div>
        <div className="animate-pulse absolute left-1/4 top-1/4 w-2 h-2 rounded-full bg-white opacity-50"></div>
        <div className="animate-pulse-slow absolute right-1/3 top-1/2 w-1 h-1 rounded-full bg-white opacity-80"></div>
        <div className="animate-pulse-slower absolute left-1/2 top-1/3 w-1 h-1 rounded-full bg-white opacity-70"></div>
        {/* Add more particle dots across the background */}
        {Array.from({ length: 20 }).map((_, index) => (
          <div 
            key={index} 
            className="animate-pulse absolute w-1 h-1 rounded-full bg-white opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${3 + Math.random() * 7}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Logo and content container */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full max-w-md">
        {/* Logo */}
        <div className="mb-12">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
            <path d="M60 10L110 90H10L60 10Z" fill="white"/>
            <path d="M60 45L77.5 75H42.5L60 45Z" fill="black"/>
          </svg>
          <h1 className="text-2xl font-bold tracking-wider text-center mt-4">DATAFINITI</h1>
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
                          <div className="flex items-center border border-gray-600 rounded-md px-3 bg-black/30 backdrop-blur-sm focus-within:ring-1 focus-within:ring-purple-400">
                            <UserRound className="h-4 w-4 mr-2 text-gray-300" />
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
                          <div className="flex items-center border border-gray-600 rounded-md px-3 bg-black/30 backdrop-blur-sm focus-within:ring-1 focus-within:ring-purple-400">
                            <Lock className="h-4 w-4 mr-2 text-gray-300" />
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
                    className="w-full bg-indigo-700 hover:bg-indigo-600 text-white py-2"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline" 
                    className="w-full border-gray-600 text-white hover:bg-gray-800 hover:text-white"
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
                          <div className="flex items-center border border-gray-600 rounded-md px-3 bg-black/30 backdrop-blur-sm focus-within:ring-1 focus-within:ring-purple-400">
                            <UserRound className="h-4 w-4 mr-2 text-gray-300" />
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
                          <div className="flex items-center border border-gray-600 rounded-md px-3 bg-black/30 backdrop-blur-sm focus-within:ring-1 focus-within:ring-purple-400">
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
                          <div className="flex items-center border border-gray-600 rounded-md px-3 bg-black/30 backdrop-blur-sm focus-within:ring-1 focus-within:ring-purple-400">
                            <Input
                              placeholder="Full Name"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center border border-gray-600 rounded-md px-3 bg-black/30 backdrop-blur-sm focus-within:ring-1 focus-within:ring-purple-400">
                            <Lock className="h-4 w-4 mr-2 text-gray-300" />
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
                          <div className="flex items-center border border-gray-600 rounded-md px-3 bg-black/30 backdrop-blur-sm focus-within:ring-1 focus-within:ring-purple-400">
                            <Lock className="h-4 w-4 mr-2 text-gray-300" />
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
                    className="w-full bg-teal-700 hover:bg-teal-600 text-white py-2"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Sign up"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline" 
                    className="w-full border-gray-600 text-white hover:bg-gray-800 hover:text-white"
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
        <div className="mt-8 flex justify-center space-x-4 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Terms of use</a>
          <a href="#" className="hover:text-white transition-colors">Privacy policy</a>
        </div>
      </div>
    </div>
  );
}