import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@shared/permissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/PermissionGuard";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Loader2, User, KeyRound, Mail, Save } from "lucide-react";

// Profile form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Confirm password is required." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

const UserProfile = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
  });

  // Password change form
  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      apiRequest("PATCH", `/api/users/${user?.id}/profile`, values),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred while updating your profile.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (values: PasswordChangeValues) =>
      apiRequest("POST", `/api/users/${user?.id}/change-password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "An error occurred while changing your password.",
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Handle password change form submission
  const onPasswordSubmit = (values: PasswordChangeValues) => {
    changePasswordMutation.mutate(values);
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    
    const nameParts = user.fullName.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return nameParts[0][0].toUpperCase();
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Please log in to view your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Profile | RealComp - Real Estate Comparison Tool</title>
        <meta
          name="description"
          content="Manage your RealComp user profile and account settings"
        />
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">User Profile</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profile Sidebar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{user.fullName || user.username}</CardTitle>
                <CardDescription className="text-center">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{user.username}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your profile information and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile Information</TabsTrigger>
                  <TabsTrigger value="password">Change Password</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <PermissionGuard 
                    permission={Permission.MANAGE_OWN_PROFILE}
                    fallback={
                      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                        <p className="text-yellow-700">
                          You do not have permission to edit your profile. Please contact an administrator.
                        </p>
                      </div>
                    }
                  >
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your full name" 
                                  {...field} 
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                />
                              </FormControl>
                              <FormDescription>
                                This is the name that will be displayed on your profile and reports.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter your email address" 
                                  {...field} 
                                  disabled={!isEditing || updateProfileMutation.isPending}
                                />
                              </FormControl>
                              <FormDescription>
                                Your email is used for notifications and account recovery.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                          {!isEditing ? (
                            <Button 
                              type="button" 
                              onClick={() => setIsEditing(true)}
                            >
                              Edit Profile
                            </Button>
                          ) : (
                            <>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  setIsEditing(false);
                                  profileForm.reset({
                                    fullName: user.fullName || "",
                                    email: user.email || "",
                                  });
                                }}
                                disabled={updateProfileMutation.isPending}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </form>
                    </Form>
                  </PermissionGuard>
                </TabsContent>

                <TabsContent value="password">
                  <PermissionGuard 
                    permission={Permission.MANAGE_OWN_PROFILE}
                    fallback={
                      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                        <p className="text-yellow-700">
                          You do not have permission to change your password. Please contact an administrator.
                        </p>
                      </div>
                    }
                  >
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your current password" 
                                  {...field} 
                                  disabled={changePasswordMutation.isPending}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your new password" 
                                  {...field} 
                                  disabled={changePasswordMutation.isPending}
                                />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Confirm your new password" 
                                  {...field} 
                                  disabled={changePasswordMutation.isPending}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end pt-4">
                          <Button 
                            type="submit"
                            disabled={changePasswordMutation.isPending}
                          >
                            {changePasswordMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Changing Password...
                              </>
                            ) : (
                              <>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Change Password
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </PermissionGuard>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UserProfile;