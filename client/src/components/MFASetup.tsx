import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, LockKeyhole, Shield, Smartphone, Check, AlertTriangle, QrCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

interface MFASetupProps {
  onComplete?: () => void;
}

const MFASetup = ({ onComplete }: MFASetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<number>(1);
  const [token, setToken] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState<boolean>(false);
  
  // Get MFA status
  const { data: mfaStatus, isLoading: isLoadingMfaStatus } = useQuery({
    queryKey: ['/api/mfa/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/mfa/status');
      if (!response.ok) {
        throw new Error('Failed to fetch MFA status');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Generate MFA secret
  const generateSecretMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mfa/generate');
      if (!response.ok) {
        throw new Error('Failed to generate MFA secret');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setMfaSecret(data.secret);
      setQrCodeData(data.qrCode);
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate MFA secret",
        variant: "destructive",
      });
    },
  });

  // Verify MFA token
  const verifyTokenMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const response = await apiRequest('POST', '/api/mfa/verify', {
        token: verificationToken,
        secret: mfaSecret,
      });
      if (!response.ok) {
        throw new Error('Failed to verify token');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setRecoveryCodes(data.recoveryCodes);
      setStep(3);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  // Enable MFA
  const enableMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mfa/enable', {
        secret: mfaSecret,
      });
      if (!response.ok) {
        throw new Error('Failed to enable MFA');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "MFA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enable MFA",
        variant: "destructive",
      });
    },
  });

  // Disable MFA
  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mfa/disable');
      if (!response.ok) {
        throw new Error('Failed to disable MFA');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "MFA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
      
      // Reset state
      setStep(1);
      setToken("");
      setQrCodeData(null);
      setMfaSecret(null);
      setRecoveryCodes([]);
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disable MFA",
        variant: "destructive",
      });
    },
  });

  const handleStartSetup = () => {
    generateSecretMutation.mutate();
  };

  const handleVerifyToken = () => {
    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    verifyTokenMutation.mutate(token);
  };

  const handleEnableMfa = () => {
    enableMfaMutation.mutate();
  };

  const handleDisableMfa = () => {
    disableMfaMutation.mutate();
  };

  // If MFA is already enabled, show the disable option
  if (mfaStatus?.enabled) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-[#071224] text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-[#FF7A00]" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-gray-300">
            Manage your account's two-factor authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">MFA is enabled</AlertTitle>
            <AlertDescription className="text-green-700">
              Your account is protected with two-factor authentication.
            </AlertDescription>
          </Alert>

          <div className="rounded-md bg-slate-50 p-4 border">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Smartphone className="h-5 w-5 text-slate-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-slate-800">Authenticator App</h3>
                <p className="mt-1 text-sm text-slate-600">
                  You're using an authenticator app to generate verification codes.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Recovery Codes</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Make sure you've saved your recovery codes in a safe place. 
                  You'll need them if you lose access to your authenticator app.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: "Recovery Codes",
                description: "Please contact support to generate new recovery codes.",
              });
            }}
          >
            Get New Recovery Codes
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisableMfa}
            disabled={disableMfaMutation.isPending}
          >
            {disableMfaMutation.isPending ? "Disabling..." : "Disable MFA"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-[#071224] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2 text-[#FF7A00]" />
          Set Up Two-Factor Authentication
        </CardTitle>
        <CardDescription className="text-gray-300">
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <Progress value={(step / 3) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <div>Generate</div>
            <div>Verify</div>
            <div>Complete</div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Enhance Your Account Security</AlertTitle>
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to your account.
                In addition to your password, you'll need a code from your authenticator app to sign in.
              </AlertDescription>
            </Alert>

            <div className="rounded-md bg-slate-50 p-4 border space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-slate-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-slate-800">Before you begin:</h3>
                  <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-1">
                    <li>
                      Install an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy
                    </li>
                    <li>
                      Make sure your device's time and date are set correctly
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && qrCodeData && (
          <div className="space-y-4">
            <div className="text-center">
              <Tabs defaultValue="qr" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="qr">QR Code</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="qr" className="space-y-4 pt-4">
                  <div className="mx-auto w-48 h-48 mb-4">
                    <img 
                      src={qrCodeData} 
                      alt="QR Code for MFA setup" 
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Scan this QR code with your authenticator app
                  </p>
                </TabsContent>
                <TabsContent value="manual" className="space-y-4 pt-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      If you can't scan the QR code, enter this code manually in your authenticator app:
                    </p>
                    <div className="bg-slate-100 p-3 rounded font-mono text-lg tracking-wide break-all">
                      {mfaSecret}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="token"
                  placeholder="Enter 6-digit code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider"
                />
                <Button 
                  onClick={handleVerifyToken} 
                  disabled={verifyTokenMutation.isPending || !token || token.length !== 6}
                >
                  {verifyTokenMutation.isPending ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Save Your Recovery Codes</AlertTitle>
              <AlertDescription className="text-amber-700">
                If you lose access to your authenticator app, you can use these recovery codes to regain access to your account.
                Keep them in a safe place. Each code can only be used once.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-slate-50 border rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Recovery Codes</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                >
                  {showRecoveryCodes ? "Hide" : "Show"}
                </Button>
              </div>
              
              {showRecoveryCodes ? (
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm bg-white p-2 border rounded">
                      {code}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 bg-slate-100 rounded">
                  <LockKeyhole className="h-8 w-8 text-slate-400" />
                </div>
              )}
              
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Copy recovery codes to clipboard
                    navigator.clipboard.writeText(recoveryCodes.join('\n'));
                    toast({
                      title: "Copied",
                      description: "Recovery codes copied to clipboard",
                    });
                  }}
                >
                  Copy Codes
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-slate-50 p-4 border">
              <div className="flex items-center space-x-2">
                <Checkbox id="confirm-saved" />
                <Label htmlFor="confirm-saved">
                  I have saved these recovery codes in a safe place
                </Label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {step === 1 ? (
          <>
            <Button 
              variant="outline" 
              onClick={onComplete}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartSetup} 
              disabled={generateSecretMutation.isPending}
              className="bg-[#071224] hover:bg-[#0f1d31] text-white"
            >
              {generateSecretMutation.isPending ? "Generating..." : "Start Setup"}
            </Button>
          </>
        ) : step === 2 ? (
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            className="ml-auto"
          >
            Back
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button 
              onClick={handleEnableMfa} 
              disabled={enableMfaMutation.isPending}
              className="bg-[#071224] hover:bg-[#0f1d31] text-white"
            >
              {enableMfaMutation.isPending ? "Enabling..." : "Enable MFA"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default MFASetup;