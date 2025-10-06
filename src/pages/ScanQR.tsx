import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ScanQR() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to orders page as QR scanning is replaced
    const timer = setTimeout(() => {
      navigate("/my-orders");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="bg-success/10 border-2 border-success rounded-full w-24 h-24 flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">New Confirmation System</h1>
          <p className="text-muted-foreground">
            QR scanning has been replaced with a more secure dual-confirmation system. 
            Both buyer and seller must confirm independently.
          </p>
        </div>
        <Button onClick={() => navigate("/my-orders")} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go to My Orders
        </Button>
      </div>
    </div>
  );
}
