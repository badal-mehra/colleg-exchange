import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Report {
  id: string;
  report_type: string;
  target_id: string | null;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  isMyReport?: boolean;
}

export default function MyReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to view your reports");
        navigate("/auth");
        return;
      }

      // Fetch both reports submitted by user AND reports about user
      const [myReports, reportsAboutMe] = await Promise.all([
        // Reports I submitted
        supabase
          .from("reports")
          .select("*")
          .eq("reported_by", user.id)
          .order("created_at", { ascending: false }),
        // Reports about me (when I'm the target)
        supabase
          .from("reports")
          .select("*")
          .eq("target_id", user.id)
          .eq("report_type", "seller")
          .order("created_at", { ascending: false })
      ]);

      if (myReports.error) throw myReports.error;
      if (reportsAboutMe.error) throw reportsAboutMe.error;

      // Add a flag to distinguish report types
      const allReports = [
        ...(myReports.data || []).map(r => ({ ...r, isMyReport: true })),
        ...(reportsAboutMe.data || []).map(r => ({ ...r, isMyReport: false }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReports(allReports);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast.error(error.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "reviewed":
        return "secondary";
      case "resolved":
        return "outline";
      default:
        return "default";
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "listing":
        return "📦";
      case "seller":
        return "👤";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Reports</h1>
            <p className="text-sm text-muted-foreground">
              Reports submitted by you and reports filed about you
            </p>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No reports yet</p>
              <p className="text-sm text-muted-foreground text-center">
                You haven't submitted any reports. If you encounter any issues with listings or sellers, you can report them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className={!report.isMyReport ? "border-destructive/50" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getReportTypeIcon(report.report_type)}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base capitalize">
                            {report.report_type} Report
                          </CardTitle>
                          {!report.isMyReport && (
                            <Badge variant="destructive" className="text-xs">
                              About You
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs mt-1">
                          {report.isMyReport ? 'Submitted' : 'Received'} on {format(new Date(report.created_at), "PPP 'at' p")}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(report.status)} className="capitalize">
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!report.isMyReport && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <p className="text-sm text-warning-foreground font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        This report was filed against you
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Reason:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {report.reason}
                    </p>
                  </div>

                  {report.admin_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        {report.isMyReport ? 'Admin Response:' : 'Action Taken:'}
                      </p>
                      <p className="text-sm bg-primary/5 p-3 rounded-md border border-primary/10 whitespace-pre-wrap">
                        {report.admin_notes}
                      </p>
                    </div>
                  )}

                  {report.reviewed_at && (
                    <p className="text-xs text-muted-foreground">
                      Last updated: {format(new Date(report.updated_at), "PPP 'at' p")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
