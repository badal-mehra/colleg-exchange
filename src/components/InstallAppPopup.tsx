import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import logo from "@/assets/mycampuskart-logo.png";

interface StandaloneNavigator extends Navigator {
  standalone?: boolean;
}

interface InstallAppPopupProps {
  /** localStorage key suffix to track per-page dismissal. Defaults to "global". */
  pageKey?: string;
  /** Delay before showing the popup (ms). Default 2500ms. */
  delay?: number;
}

const DISMISS_HOURS = 24;

const InstallAppPopup: React.FC<InstallAppPopupProps> = ({ pageKey = "global", delay = 2500 }) => {
  const { canInstall, installApp } = usePWAInstall();
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show inside the installed PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as StandaloneNavigator).standalone === true;
    if (isStandalone) return;

    // Detect iOS (no beforeinstallprompt available)
    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Respect recent dismissal
    const key = `installPopupDismissed:${pageKey}`;
    const dismissedAt = localStorage.getItem(key);
    if (dismissedAt) {
      const diffHrs = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (diffHrs < DISMISS_HOURS) return;
    }

    const timer = setTimeout(() => {
      // Show popup if installable OR iOS (manual instructions)
      if (canInstall || iOS) {
        setOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [canInstall, pageKey, delay]);

  const dismiss = () => {
    localStorage.setItem(`installPopupDismissed:${pageKey}`, Date.now().toString());
    setOpen(false);
  };

  const handleInstall = async () => {
    await installApp();
    dismiss();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="relative">
              {/* FIXED LOGO HERE: Handles Next.js (.src) or Vite (string) + added object-cover */}
              <img 
                src={typeof logo === 'string' ? logo : (logo as any)?.src} 
                alt="MyCampusKart" 
                className="h-16 w-16 rounded-2xl shadow-lg object-cover" 
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Install MyCampusKart App</DialogTitle>
          <DialogDescription className="text-center">
            Get the full app experience — faster loading, push notifications, and offline access right from your home screen.
          </DialogDescription>
        </DialogHeader>

        {isIOS && !canInstall ? (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="font-medium text-foreground">To install on iOS:</p>
            <p>1. Tap the <strong>Share</strong> button in Safari</p>
            <p>2. Scroll and tap <strong>"Add to Home Screen"</strong></p>
            <p>3. Tap <strong>Add</strong> to confirm</p>
          </div>
        ) : null}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {canInstall && (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          )}
          <Button onClick={dismiss} variant="ghost" className="w-full">
            <X className="h-4 w-4 mr-2" />
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstallAppPopup;
