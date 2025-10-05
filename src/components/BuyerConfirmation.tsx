import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, User } from "lucide-react";

interface BuyerConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderDetails: {
    item_title: string;
    item_price: number;
    seller_name: string;
    seller_mck_id: string;
  } | null;
  loading?: boolean;
}

export const BuyerConfirmation = ({ open, onClose, onConfirm, orderDetails, loading = false }: BuyerConfirmationProps) => {
  if (!orderDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Confirm Transaction
          </DialogTitle>
          <DialogDescription>
            Please verify the details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Item</p>
                <p className="font-semibold">{orderDetails.item_title}</p>
                <p className="text-lg font-bold text-primary mt-1">₹{orderDetails.item_price}</p>
              </div>
            </div>

            <div className="border-t pt-3 flex items-start gap-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Seller</p>
                <p className="font-semibold">{orderDetails.seller_name}</p>
                <p className="text-sm text-muted-foreground">ID: {orderDetails.seller_mck_id}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium text-center">
              Do you confirm receiving this item from the seller?
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ Seller will receive +10 campus points</p>
            <p>✓ You will receive +3 campus points</p>
            <p>✓ Transaction will be recorded in your history</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="flex-1">
            {loading ? "Confirming..." : "Confirm Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};