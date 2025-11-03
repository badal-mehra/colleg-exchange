import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "listing" | "seller" | "other";
  targetId?: string;
  targetName?: string;
}

export const ReportModal = ({ isOpen, onClose, reportType, targetId, targetName }: ReportModalProps) => {
  const [reason, setReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasonOptions = {
    listing: [
      "Scam or fraudulent listing",
      "Fake or counterfeit product",
      "Inappropriate content",
      "Misleading description",
      "Prohibited item",
      "Other"
    ],
    seller: [
      "Scam or fraudulent behavior",
      "Harassment or inappropriate conduct",
      "Fake account",
      "Suspicious activity",
      "Other"
    ],
    other: [
      "Technical issue",
      "Spam",
      "Inappropriate behavior",
      "Other"
    ]
  };

  const handleSubmit = async () => {
    if (!selectedReason && !reason.trim()) {
      toast.error("Please select or enter a reason for reporting");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to report");
        return;
      }

      const finalReason = selectedReason === "Other" || !selectedReason 
        ? reason.trim() 
        : `${selectedReason}${reason.trim() ? `: ${reason.trim()}` : ""}`;

      const { error } = await supabase
        .from("reports")
        .insert({
          report_type: reportType,
          target_id: targetId,
          reported_by: user.id,
          reporter_email: user.email,
          reason: finalReason,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Report submitted successfully");
      onClose();
      setReason("");
      setSelectedReason("");
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report {reportType === "listing" ? "Listing" : reportType === "seller" ? "Seller" : "Issue"}
          </DialogTitle>
          <DialogDescription>
            {targetName && `Reporting: ${targetName}`}
            <br />
            Please provide details about why you're reporting this {reportType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Reason for reporting</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reasonOptions[reportType].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any additional information that might help us investigate..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            variant="destructive"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
