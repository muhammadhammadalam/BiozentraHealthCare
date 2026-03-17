import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, Download, Check, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            Install BIOZENTRA App
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Get quick access to your healthcare dashboard right from your device's home screen.
          </p>

          {isInstalled ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="rounded-xl border border-success/20 bg-success/10 p-6"
            >
              <Check className="mx-auto mb-4 h-12 w-12 text-success" />
              <h2 className="text-xl font-semibold text-success">App Installed!</h2>
              <p className="mt-2 text-muted-foreground">
                BIOZENTRA is now installed on your device.
              </p>
            </motion.div>
          ) : isIOS ? (
            <div className="rounded-xl border border-border bg-card p-6 text-left">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Install on iOS
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground">
                      Look for the <Share className="inline h-4 w-4" /> icon at the bottom of Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Select "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground">
                      Scroll down and tap <Plus className="inline h-4 w-4" /> Add to Home Screen
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tap "Add"</p>
                    <p className="text-sm text-muted-foreground">
                      Confirm by tapping Add in the top right corner
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button size="lg" onClick={handleInstall} className="gap-2">
              <Download className="h-5 w-5" />
              Install App
            </Button>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-muted-foreground">
                Open this page in Chrome, Edge, or Safari to install the app on your device.
              </p>
            </div>
          )}

          <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
            {[
              {
                title: "Works Offline",
                description: "Access your dashboard even without internet connection",
              },
              {
                title: "Fast & Smooth",
                description: "Native-like experience with instant loading",
              },
              {
                title: "Always Updated",
                description: "Get the latest features automatically",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="rounded-lg border border-border bg-card p-4"
              >
                <h3 className="font-medium text-foreground">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
