import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface BargainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalPrice: number;
  onSubmit: (offerPrice: number) => void;
  itemTitle: string;
}

export const BargainingDialog = ({ isOpen, onClose, originalPrice, onSubmit, itemTitle }: BargainingDialogProps) => {
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = () => {
    const price = parseFloat(offerPrice);
    
    if (!offerPrice || isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }
    
    if (price >= originalPrice) {
      setError("Your offer should be less than the original price");
      return;
    }
    
    onSubmit(price);
    setOfferPrice("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Make an Offer
          </DialogTitle>
          <DialogDescription>
            Original Price: <span className="font-semibold text-foreground">₹{originalPrice.toLocaleString()}</span>
            <br />
            Enter your negotiated price for "{itemTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="offer-price">Your Offer Price (₹)</Label>
            <Input
              id="offer-price"
              type="number"
              placeholder="Enter your offer amount"
              value={offerPrice}
              onChange={(e) => {
                setOfferPrice(e.target.value);
                setError("");
              }}
              min="1"
              max={originalPrice - 1}
              className="text-lg"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {offerPrice && !error && parseFloat(offerPrice) > 0 && parseFloat(offerPrice) < originalPrice && (
              <p className="text-sm text-muted-foreground">
                You're offering ₹{parseFloat(offerPrice).toLocaleString()} 
                ({Math.round((1 - parseFloat(offerPrice) / originalPrice) * 100)}% off)
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">💡 Bargaining Tips:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Make a reasonable offer to start the negotiation</li>
              <li>Be polite and respectful in your chat</li>
              <li>The seller may counter-offer</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Start Chat with Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
