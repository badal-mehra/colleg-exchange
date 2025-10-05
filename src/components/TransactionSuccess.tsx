import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trophy, Star } from "lucide-react";

interface TransactionSuccessProps {
  open: boolean;
  onClose: () => void;
  itemTitle: string;
  sellerName: string;
}

export const TransactionSuccess = ({ open, onClose, itemTitle, sellerName }: TransactionSuccessProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Transaction Completed</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <CheckCircle2 className="h-20 w-20 text-primary opacity-75" />
              </div>
              <CheckCircle2 className="h-20 w-20 text-primary relative" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Deal Confirmed! 🎉</h3>
              <p className="text-muted-foreground">
                Transaction completed successfully
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium">Item:</span>
              <span className="text-muted-foreground">{itemTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-medium">Seller:</span>
              <span className="text-muted-foreground">{sellerName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">+3</p>
              <p className="text-xs text-muted-foreground mt-1">Points Earned</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">✓</p>
              <p className="text-xs text-muted-foreground mt-1">Verified Deal</p>
            </div>
          </div>

          <Button onClick={onClose} className="w-full">
            Continue Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};