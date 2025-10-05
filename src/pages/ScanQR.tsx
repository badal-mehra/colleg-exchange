import { useState } from "react";
import { QRScanner } from "@/components/QRScanner";
import { BuyerConfirmation } from "@/components/BuyerConfirmation";
import { TransactionSuccess } from "@/components/TransactionSuccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ScanQR = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      setQrData(parsedData);

      // Verify QR code
      const { data: verifyResult, error } = await supabase.functions.invoke("verify-qr", {
        body: { qr_data: parsedData, confirm: false },
      });

      if (error) throw error;

      if (verifyResult.success && verifyResult.action === "confirm_required") {
        setOrderDetails(verifyResult.order);
        setShowScanner(false);
        setShowConfirmation(true);
      } else {
        throw new Error(verifyResult.error || "Failed to verify QR code");
      }
    } catch (error: any) {
      console.error("Error scanning QR:", error);
      toast.error(error.message || "Invalid QR code");
      setShowScanner(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { data: confirmResult, error } = await supabase.functions.invoke("verify-qr", {
        body: { qr_data: qrData, confirm: true },
      });

      if (error) throw error;

      if (confirmResult.success && confirmResult.action === "completed") {
        setShowConfirmation(false);
        setShowSuccess(true);
        toast.success(confirmResult.message);
      } else {
        throw new Error(confirmResult.error || "Failed to confirm transaction");
      }
    } catch (error: any) {
      console.error("Error confirming transaction:", error);
      toast.error(error.message || "Failed to confirm transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setOrderDetails(null);
    setQrData(null);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Scan Transaction QR</h1>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <QrCode className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Confirm Your Purchase</h2>
              <p className="text-muted-foreground">
                Scan the seller's QR code to confirm you've received the item
              </p>
            </div>
          </div>

          <Button onClick={() => setShowScanner(true)} className="w-full" size="lg">
            <QrCode className="h-5 w-5 mr-2" />
            Open Camera to Scan
          </Button>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Meet the seller in person</li>
              <li>Click "Open Camera to Scan"</li>
              <li>Point your camera at seller's QR code</li>
              <li>Verify the item details</li>
              <li>Confirm to complete the transaction</li>
            </ol>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">🎁 Rewards</p>
            <ul className="text-sm space-y-1">
              <li>• Earn +3 campus points</li>
              <li>• Seller earns +10 points</li>
              <li>• Build trust in the community</li>
            </ul>
          </div>
        </div>
      </div>

      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <BuyerConfirmation
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        orderDetails={orderDetails}
        loading={loading}
      />

      {orderDetails && (
        <TransactionSuccess
          open={showSuccess}
          onClose={handleSuccessClose}
          itemTitle={orderDetails.item_title}
          sellerName={orderDetails.seller_name}
        />
      )}
    </div>
  );
};

export default ScanQR;