import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QrCode, RefreshCw, Clock } from "lucide-react";

interface SellerQRDisplayProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

export const SellerQRDisplay = ({ orderId, open, onClose }: SellerQRDisplayProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-qr", {
        body: { order_id: orderId },
      });

      if (error) throw error;

      if (data.success) {
        setQrCode(data.qr_code);
        setExpiresAt(new Date(data.expires_at));
        toast.success("QR code generated successfully");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Error generating QR:", error);
      toast.error(error.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && orderId) {
      generateQR();
    }
  }, [open, orderId]);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleRegenerate = () => {
    generateQR();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Transaction QR Code
          </DialogTitle>
          <DialogDescription>
            Show this QR code to the buyer to confirm the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : qrCode ? (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-border">
                <img src={qrCode} alt="Transaction QR Code" className="w-full h-auto" />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Expires in:</span>
                </div>
                <span className={`text-sm font-bold ${timeLeft === "Expired" ? "text-destructive" : "text-primary"}`}>
                  {timeLeft}
                </span>
              </div>

              {timeLeft === "Expired" && (
                <Button onClick={handleRegenerate} className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate QR Code
                </Button>
              )}

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>• QR code is valid for 10 minutes</p>
                <p>• Can only be used once</p>
                <p>• Buyer must scan to confirm receipt</p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Unable to generate QR code</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};