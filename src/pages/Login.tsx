import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type View = "auth" | "forgot" | "forgot-sent";

export default function Login() {
  const navigate = useNavigate();
  const { login, forgotPassword } = useAuth();

  // Always force light mode on the login screen regardless of dashboard theme
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.classList.contains("dark") ? "dark" : root.classList.contains("light") ? "light" : null;
    root.classList.remove("dark", "light");
    root.classList.add("light");
    return () => {
      root.classList.remove("light");
      if (prev) root.classList.add(prev);
    };
  }, []);

  const [view, setView] = useState<View>("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(loginData.email, loginData.password);
      if (result.ok) { toast.success("Welcome back!"); navigate("/"); }
      else toast.error(result.message || "Login failed. Please try again.");
    } catch { toast.error("Login failed. Please try again."); }
    finally { setIsLoading(false); }
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await forgotPassword(forgotEmail);
      if (result.success) { setView("forgot-sent"); }
      else toast.error(result.message);
    } catch { toast.error("Failed to send reset email."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center bg-[#0f2e1a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600" />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
          <div className="h-36 w-36 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center p-4">
            <img src={logo} alt="Biozentra" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold tracking-widest text-3xl">BIOZENTRA</p>
            <p className="text-emerald-400/80 text-base mt-1 tracking-wide">Healthcare Management</p>
          </div>
          <p className="text-slate-500 text-xs mt-2 max-w-[220px] leading-relaxed">
            Internal management portal. Access is restricted to authorised staff only.
          </p>
        </motion.div>

        <p className="absolute bottom-6 text-slate-600 text-xs">
          © {new Date().getFullYear()} Biozentra Healthcare. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-slate-950 p-8 relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img src={logo} alt="" aria-hidden className="w-[72%] max-w-[440px] object-contain select-none"
            style={{ opacity: 0.05, filter: "grayscale(100%)" }} />
        </div>

        <div className="w-full max-w-[400px] relative z-10">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logo} alt="Biozentra" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-bold text-foreground">BIOZENTRA</p>
              <p className="text-xs text-muted-foreground">Healthcare Management</p>
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Forgot password — email entry ── */}
            {view === "forgot" && (
              <motion.div key="forgot"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setView("auth")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </button>
                <h2 className="text-2xl font-bold text-foreground mb-1">Forgot password?</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Enter your registered email and we'll send you a reset link.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Email address</Label>
                    <Input type="email" placeholder="name@biozentra.pk" required
                      value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="h-10" />
                  </div>
                  <Button type="submit" className="w-full h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={isLoading}>
                    <Mail className="h-4 w-4" />
                    {isLoading ? "Sending…" : "Send Reset Email"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── Forgot password — email sent ── */}
            {view === "forgot-sent" && (
              <motion.div key="sent"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
                <p className="text-muted-foreground text-sm mb-2">
                  A password reset link has been sent to
                </p>
                <p className="font-semibold text-foreground mb-6">{forgotEmail}</p>
                <p className="text-xs text-muted-foreground mb-6">
                  Click the link in the email to set a new password. The link expires in 1 hour.
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setView("auth"); setForgotEmail(""); }}>
                  Back to Sign In
                </Button>
              </motion.div>
            )}

            {/* ── Sign In ── */}
            {view === "auth" && (
              <motion.div key="auth"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
                  <p className="text-muted-foreground text-sm mt-1">Enter your credentials to access the dashboard</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Email address</Label>
                    <Input type="email" placeholder="name@biozentra.pk" required
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Enter password" required
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="h-10 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setView("forgot")}
                      className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className="w-full h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={isLoading}>
                    <LogIn className="h-4 w-4" />
                    {isLoading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Don't have access?{" "}
                  <span className="text-foreground font-medium">Contact your administrator.</span>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
