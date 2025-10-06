import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  seller_confirmed_at?: string;
  buyer_confirmed_at?: string;
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

export function TransactionConfirmation({ order, userType, onConfirm }: TransactionConfirmationProps) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to confirm transaction");
        return;
      }

      const { data, error } = await supabase.rpc('complete_order_with_confirmation', {
        order_id: order.id,
        confirming_user_id: user.id,
        user_type: userType
      }) as { data: any; error: any };

      if (error) throw error;

      if (data?.success) {
        if (data?.completed) {
          toast.success(data.message);
        } else {
          toast.success(data.message);
        }
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

  const otherParty = userType === "seller" ? order.buyer_profiles : order.seller_profiles;
  const userConfirmed = userType === "seller" ? order.seller_confirmed : order.buyer_confirmed;
  const otherConfirmed = userType === "seller" ? order.buyer_confirmed : order.seller_confirmed;

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-2">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Transaction Confirmation
          </h3>
          <p className="text-sm text-muted-foreground">
            Both parties must confirm to complete the transaction
          </p>
        </div>

        {/* Item Details */}
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
            <p className="text-lg font-bold text-primary">₹{order.items.price}</p>
          </div>
        </div>

        {/* Confirmation Status */}
        <div className="space-y-3">
          {/* Your Status */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
            userConfirmed ? 'bg-success/10 border-success' : 'bg-muted/30 border-border'
          }`}>
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

          {/* Other Party Status */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
            otherConfirmed ? 'bg-success/10 border-success' : 'bg-muted/30 border-border'
          }`}>
            <div className="flex items-center gap-3">
              {otherConfirmed ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <Clock className="w-6 h-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-semibold">{otherParty?.full_name || "Other Party"}</p>
                <p className="text-sm text-muted-foreground">
                  {userType === "seller" ? "Buyer" : "Seller"} • {otherParty?.mck_id}
                </p>
              </div>
            </div>
            {otherConfirmed ? (
              <span className="text-xs font-medium text-success">Confirmed</span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">Pending</span>
            )}
          </div>
        </div>

        {/* Info Box */}
        {!userConfirmed && (
          <div className="flex items-start gap-3 p-4 bg-info/10 border border-info rounded-lg">
            <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-info">Important:</p>
              <p className="text-muted-foreground">
                Only confirm after you've successfully {userType === "seller" ? "handed over the item" : "received the item"} in person. 
                This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!userConfirmed ? (
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {confirming ? "Confirming..." : `Confirm ${userType === "seller" ? "Item Delivered" : "Item Received"}`}
          </Button>
        ) : (
          <div className="text-center py-4">
            <p className="text-success font-semibold mb-2">✓ You've confirmed this transaction</p>
            {!otherConfirmed && (
              <p className="text-sm text-muted-foreground">
                Waiting for {userType === "seller" ? "buyer" : "seller"} confirmation...
              </p>
            )}
            {otherConfirmed && (
              <p className="text-sm text-success">
                🎉 Transaction completed! Points awarded.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
