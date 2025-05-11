import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Permission } from "@shared/permissions";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <PermissionGuard permission={Permission.MANAGE_API_KEYS} fallback={<div>You don't have permission to access this page.</div>}>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" className="mb-2" asChild>
                <Link href="/" className="flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage system settings and preferences</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Settings Page</h2>
            <p className="text-muted-foreground mb-4">
              This is a placeholder for the Settings page content. Future implementation will include:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>User account management</li>
              <li>System preferences</li>
              <li>Application customization options</li>
              <li>Integration settings</li>
              <li>MLS connection management</li>
            </ul>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}