// TransactionConfirmation.tsx (Final Version with Corrected RPC Logic)

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string; // This holds the transaction ID (txn_id)
  status: string;
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  seller_id: string;
  buyer_id: string;
  items: {
    title: string;
    price: number;
    images: string[];
  };
  seller_profiles?: {
    full_name: string;
    mck_id: string;
  };
  buyer_profiles?: {
    full_name: string;
    mck_id: string;
  };
}

interface TransactionConfirmationProps {
  order: Order;
  userType: "seller" | "buyer";
  onConfirm: () => void;
}

export function TransactionConfirmation({
  order,
  userType,
  onConfirm,
}: TransactionConfirmationProps) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // 🔥 FINAL, CORRECTED handleConfirm FUNCTION
  const handleConfirm = async () => {
    try {
      setConfirming(true);

      // Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to confirm transaction");
        return;
      }

      // STEP 1 → Call RPC to confirm transaction
      const { data: confirmData, error: confirmError } = await supabase.rpc(
        "complete_order_with_confirmation",
        {
          order_id: order.id,
          confirming_user_id: user.id,
          user_type: userType
        }
      );

      if (confirmError) {
        console.error("Confirm RPC Error:", confirmError);
        toast.error("Failed to confirm transaction");
        return;
      }

      // Type cast the response
      const response = confirmData as { success?: boolean; message?: string; both_confirmed?: boolean; error?: string } | null;

      if (!response?.success) {
        toast.error(response?.error || "Failed to confirm transaction");
        return;
      }

      // Show message from backend
      if (response?.message) {
        toast.success(response.message);
      }

      // If BOTH parties confirmed, the RPC already marked item as sold

      // Refresh UI (fetches updated status)
      onConfirm();

    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(err.message || "Unexpected error");
    } finally {
      setConfirming(false);
    }
  };
  // 🔥 FINAL, CORRECTED handleConfirm FUNCTION ENDS

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This action is permanent.")) {
        return;
    }

    try {
        setCancelling(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please log in to cancel order");
            return;
        }

        // Call the RPC function (Seller only)
        const { data, error } = await supabase.rpc(
            "cancel_order",
            {
                order_id: order.id,
                seller_id: user.id, 
            }
        );

        if (error) throw error;

        // Type cast the response
        const response = data as { success?: boolean; message?: string; error?: string } | null;

        if (response?.success) {
            toast.success(response.message || "Order cancelled");
            onConfirm(); // Refresh orders list
        } else {
            toast.error(response?.error || "Failed to cancel order");
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
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Transaction Confirmation</h3>
          <p className="text-sm text-muted-foreground">
            Both parties must confirm to complete the transaction
          </p>
        </div>

        {/* Item */}
        <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
          {order.items.images?.[0] && (
            <img
              src={order.items.images[0]}
              alt={order.items.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h4 className="font-semibold">{order.items.title}</h4>
            <p className="text-lg font-bold text-primary">
              ₹{order.items.price}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          {/* Your Status */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              userConfirmed
                ? "bg-success/10 border-success"
                : "bg-muted/30 border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              {userConfirmed ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <Clock className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-semibold">Your Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  {userType === "seller" ? "As Seller" : "As Buyer"}
                </p>
              </div>
            </div>
            {userConfirmed && (
              <span className="text-xs font-medium text-success">Confirmed</span>
            )}
          </div>

          {/* Other Party */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              otherConfirmed
                ? "bg-success/10 border-success"
                : "bg-muted/30 border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              {otherConfirmed ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <Clock className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-semibold">
                  {otherParty?.full_name || "Other Party"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userType === "seller" ? "Buyer" : "Seller"} •{" "}
                  {otherParty?.mck_id}
                </p>
              </div>
            </div>
            {otherConfirmed ? (
              <span className="text-xs font-medium text-success">Confirmed</span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                Pending
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        {!userConfirmed && order.status === "pending" && (
          <div className="flex items-start gap-3 p-4 bg-info/10 border border-info rounded-lg">
            <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-info">Important:</p>
              <p className="text-muted-foreground">
                Only confirm after the item exchange has happened in person.
              </p>
            </div>
          </div>
        )}

        {/* Button Section */}
        <div className="space-y-3">
            {/* Show Confirm button only if status is PENDING and YOU have NOT confirmed */}
            {order.status === "pending" && !userConfirmed ? (
              <Button
                onClick={handleConfirm}
                disabled={confirming || cancelling}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {confirming
                  ? "Confirming..."
                  : `Confirm ${
                      userType === "seller" ? "Item Delivered" : "Item Received"
                    }`}
              </Button>
            ) : order.status === "pending" && userConfirmed && (
                // Show waiting message if I confirmed and waiting for other party
                <div className="text-center py-4">
                    <p className="text-success font-semibold mb-2">
                      ✓ You've confirmed this transaction
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Waiting for {otherParty?.full_name || "the other party"} to complete the transaction.
                    </p>
                </div>
            )}
            
            {/* If status is completed, show completion message (this handles the final state) */}
            {order.status === "completed" && (
                <div className="text-center py-4">
                    <p className="text-success font-semibold mb-2">
                      🎉 Transaction completed!
                    </p>
                </div>
            )}

            {/* Show Cancel Button if Seller AND status is PENDING. */}
            {userType === "seller" && order.status === "pending" && (
                <Button
                    onClick={handleCancel}
                    disabled={cancelling || confirming}
                    variant="destructive"
                    className="w-full h-10 text-base font-semibold"
                >
                    <X className="mr-2 h-4 w-4" />
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                </Button>
            )}
        </div>
      </div>
    </Card>
  );
}
