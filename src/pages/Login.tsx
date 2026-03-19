import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", username: "", password: "", confirmPassword: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(loginData.username, loginData.password);
      if (success) { toast.success("Welcome back!"); navigate("/"); }
      else toast.error("Invalid username or password");
    } catch { toast.error("Login failed. Please try again."); }
    finally { setIsLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (registerData.password !== registerData.confirmPassword) { toast.error("Passwords do not match"); setIsLoading(false); return; }
    if (registerData.password.length < 6) { toast.error("Password must be at least 6 characters"); setIsLoading(false); return; }
    try {
      const success = await register(registerData.username, registerData.email, registerData.password, registerData.name);
      if (success) { toast.success("Account created!"); navigate("/"); }
      else toast.error("Username or email already exists");
    } catch { toast.error("Registration failed."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Branding ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-[#0f2e1a] p-12 relative overflow-hidden">
        {/* subtle dot texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        {/* top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600" />

        <div className="relative z-10">
          {/* Logo — enlarged */}
          <div className="flex items-center gap-5 mb-16">
            <div className="h-20 w-20 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center p-2.5">
              <img src={logo} alt="Biozentra" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold tracking-widest text-xl">BIOZENTRA</p>
              <p className="text-emerald-400/80 text-sm mt-0.5">Healthcare Management</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your<br />
              <span className="text-emerald-400">healthcare business</span><br />
              with confidence.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              A complete dashboard for tracking orders, inventory, invoices, and customers — built for Pakistan and the Middle East.
            </p>
          </motion.div>
        </div>

        {/* Bottom: copyright only — feature cards removed */}
        <div className="relative z-10">
          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Biozentra Healthcare. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right Panel: Form ─────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-slate-950 p-8 relative overflow-hidden">

        {/* Faded watermark logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            className="w-[70%] max-w-[420px] object-contain select-none"
            style={{ opacity: 0.045, filter: "grayscale(100%)" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logo} alt="Biozentra" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-bold text-foreground">BIOZENTRA</p>
              <p className="text-xs text-muted-foreground">Healthcare Management</p>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-7 grid w-full grid-cols-2 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <TabsTrigger value="login"
                className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register"
                className="rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            {/* ── Sign In ── */}
            <TabsContent value="login">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
                <p className="text-muted-foreground text-sm mt-1">Enter your credentials to access the dashboard</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-username" className="text-sm font-medium">Username</Label>
                  <Input id="login-username" placeholder="Enter username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input id="login-password" type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required className="h-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-2" disabled={isLoading}>
                  <LogIn className="h-4 w-4" />
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* ── Register ── */}
            <TabsContent value="register">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Create account</h2>
                <p className="text-muted-foreground text-sm mt-1">Register to get started</p>
              </div>
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input placeholder="Your full name" value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input type="email" placeholder="your@email.com" value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Username</Label>
                  <Input placeholder="Choose a username" value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input type={showRegPassword ? "text" : "password"} placeholder="Min. 6 characters"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required className="h-10 pr-10" />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Confirm Password</Label>
                  <Input type="password" placeholder="Re-enter password" value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required className="h-10" />
                </div>
                <Button type="submit" className="w-full h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-1" disabled={isLoading}>
                  <UserPlus className="h-4 w-4" />
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
