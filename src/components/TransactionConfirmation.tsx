// TransactionConfirmation.tsx (Updated)

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, X } from "lucide-react"; // Import X for the cancel icon
import { toast } from "sonner";

// ... (Interface definitions remain the same) ...

export function TransactionConfirmation({
  order,
  userType,
  onConfirm,
}: TransactionConfirmationProps) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false); // New state for cancellation

  const handleConfirm = async () => {
    // ... (Your existing handleConfirm logic remains here) ...
    // [CODE OMITTED FOR BREVITY]
    try {
      setConfirming(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to confirm transaction");
        return;
      }

      const { data, error } = await supabase.rpc(
        "complete_order_with_confirmation",
        {
          order_id: order.id,
          confirming_user_id: user.id,
          user_type: userType,
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
        onConfirm();
      } else {
        toast.error(data?.error || "Failed to confirm transaction");
      }
    } catch (error: any) {
      console.error("Error confirming transaction:", error);
      toast.error(error.message || "Failed to confirm transaction");
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
        return;
    }

    try {
        setCancelling(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please log in to cancel order");
            return;
        }

        // Call the new RPC function
        const { data, error } = await supabase.rpc(
            "cancel_order",
            {
                order_id: order.id,
                seller_id: user.id, // Only the seller can call this
            }
        );

        if (error) throw error;

        if (data?.success) {
            toast.success(data.message);
            onConfirm(); // Refresh orders list
        } else {
            // Display the specific error from the RPC (e.g., "Cannot cancel")
            toast.error(data?.error || "Failed to cancel order");
        }
    } catch (error: any) {
        console.error("Error cancelling order:", error);
        toast.error(error.message || "Failed to cancel order");
    } finally {
        setCancelling(false);
    }
  };

  const userConfirmed =
    userType === "seller" ? order.seller_confirmed : order.buyer_confirmed;

  const otherConfirmed =
    userType === "seller" ? order.buyer_confirmed : order.seller_confirmed;

  const otherParty =
    userType === "seller" ? order.buyer_profiles : order.seller_profiles;

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-2">
      {/* ... (Existing Card content omitted for brevity) ... */}

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Transaction Confirmation</h3>
          <p className="text-sm text-muted-foreground">
            Both parties must confirm to complete the transaction
          </p>
        </div>

        {/* Item - Omitted */}
        {/* Status - Omitted */}
        {/* Info - Omitted */}

        {/* Button Section */}
        <div className="space-y-3">
            {!userConfirmed ? (
              <Button
                onClick={handleConfirm}
                disabled={confirming || cancelling} // Disable if cancelling is in progress
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {confirming
                  ? "Confirming..."
                  : `Confirm ${
                      userType === "seller" ? "Item Delivered" : "Item Received"
                    }`}
              </Button>
            ) : (
              <div className="text-center py-4">
                <p className="text-success font-semibold mb-2">
                  ✓ You've confirmed this transaction
                </p>
                {otherConfirmed && (
                  <p className="text-sm text-success">
                    🎉 Transaction completed!
                  </p>
                )}
              </div>
            )}
            
            {/* ✅ NEW: Cancel Button (Seller Only, Pending Status) */}
            {userType === "seller" && order.status === "pending" && (
                <Button
                    onClick={handleCancel}
                    disabled={cancelling || confirming} // Disable if confirming is in progress
                    variant="destructive"
                    className="w-full h-10 text-base font-semibold"
                >
                    <X className="mr-2 h-4 w-4" />
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                </Button>
            )}

            {/* If buyer has confirmed but seller hasn't, buyer sees a message */}
            {userType === "buyer" && !userConfirmed && otherConfirmed && (
                <div className="text-center py-2 text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    Seller has confirmed, awaiting your confirmation.
                </div>
            )}
        </div>
      </div>
    </Card>
  );
}
