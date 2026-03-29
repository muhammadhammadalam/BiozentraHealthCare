import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Supabase puts the access token in the URL hash after the user clicks the email link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("type=recovery")) {
      setHasToken(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      const result = await resetPassword(password);
      if (result.success) {
        setDone(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        toast.error(result.message);
      }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 p-8 relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img src={logo} alt="" aria-hidden className="w-[60%] max-w-[400px] object-contain select-none"
          style={{ opacity: 0.05, filter: "grayscale(100%)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logo} alt="Biozentra" className="h-10 w-10 object-contain" />
          <div>
            <p className="font-bold text-foreground tracking-widest">BIOZENTRA</p>
            <p className="text-xs text-muted-foreground">Healthcare Management</p>
          </div>
        </div>

        {done ? (
          // ── Success state ──
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password updated!</h2>
            <p className="text-muted-foreground text-sm">
              Your password has been changed successfully. Redirecting to sign in…
            </p>
          </motion.div>
        ) : !hasToken ? (
          // ── Invalid / expired link ──
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid link</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button onClick={() => navigate("/login")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Back to Sign In
            </Button>
          </div>
        ) : (
          // ── Set new password form ──
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Set new password</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter and confirm your new password below.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} placeholder="Min. 6 characters" required
                    value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="Re-enter new password" required
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" />
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="flex gap-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= i * 3
                        ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-yellow-400" : "bg-emerald-500"
                        : "bg-muted"
                    }`} />
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-2" disabled={isLoading}>
                <KeyRound className="h-4 w-4" />
                {isLoading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
