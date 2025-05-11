import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const { user } = useAuth();

  return (
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
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and manage property reports</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Reports Page</h2>
          <p className="text-muted-foreground mb-4">
            This is a placeholder for the Reports page content. Future implementation will include:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Comparative Market Analysis (CMA) reports</li>
            <li>Investment property analysis</li>
            <li>After Repair Value (ARV) calculations</li>
            <li>Maximum Allowable Offer (MAO) calculations</li>
            <li>PDF report generation and export</li>
          </ul>
        </div>
      </div>
    </div>
  );
}