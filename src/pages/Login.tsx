import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, UserPlus, CheckCircle2 } from "lucide-react";
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
  const [registerData, setRegisterData] = useState({
    name: "", email: "", username: "", password: "", confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(loginData.username, loginData.password);
      if (success) {
        toast.success("Welcome back!");
        navigate("/");
      } else {
        toast.error("Invalid username or password");
      }
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }
    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    try {
      const success = await register(
        registerData.username, registerData.email,
        registerData.password, registerData.name
      );
      if (success) {
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        toast.error("Username or email already exists");
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534]">

      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-green-400/10 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-emerald-300/5 blur-2xl" />
        {/* subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75 }}
          className="flex flex-col items-center text-center"
        >
          {/* Logo with glow ring */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl scale-125" />
            <div className="relative h-36 w-36 rounded-full bg-white/10 p-3 ring-2 ring-emerald-400/40 shadow-2xl">
              <img src={logo} alt="Biozentra" className="h-full w-full object-contain drop-shadow-xl" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-black tracking-tight text-white drop-shadow-lg"
          >
            BIOZENTRA
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-lg font-semibold text-emerald-300 tracking-wide"
          >
            Healthcare Management
          </motion.p>

          {/* Feature list */}
          <div className="mt-12 space-y-4 text-left max-w-xs w-full">
            {[
              "Track sales & inventory in real time",
              "Manage orders, invoices & customers",
              "Smart analytics for smarter decisions",
              "Secure & fast — built for your team",
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.12 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                <span className="text-sm text-green-100/90">{text}</span>
              </motion.div>
            ))}
          </div>

          {/* Decorative pill badges */}
          <div className="mt-10 flex flex-wrap gap-2 justify-center">
            {["Pakistan", "Middle East", "PKR / AED / SAR"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-emerald-500/40 bg-emerald-900/40 px-3 py-1 text-xs text-emerald-300"
              >
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />
              <div className="relative h-20 w-20 rounded-full bg-white/10 p-2 ring-2 ring-emerald-400/40">
                <img src={logo} alt="Biozentra" className="h-full w-full object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white">BIOZENTRA</h1>
            <p className="text-sm text-emerald-300">Healthcare Management</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-emerald-700/40 bg-[#052e16]/70 p-8 shadow-2xl backdrop-blur-xl">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 bg-green-950/60 rounded-xl">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-green-400/70 data-[state=active]:bg-emerald-700 data-[state=active]:text-white font-semibold"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-green-400/70 data-[state=active]:bg-emerald-700 data-[state=active]:text-white font-semibold"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* ── Login ── */}
              <TabsContent value="login">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                  <p className="text-sm text-green-400/70 mt-1">Sign in to your dashboard</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-username" className="text-green-200 text-sm font-medium">Username</Label>
                    <Input
                      id="login-username"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                      className="border-emerald-700/50 bg-green-950/50 text-white placeholder:text-green-600/50 focus:border-emerald-400 focus-visible:ring-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-green-200 text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="border-emerald-700/50 bg-green-950/50 text-white placeholder:text-green-600/50 focus:border-emerald-400 focus-visible:ring-emerald-500/30 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500/50 hover:text-green-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-900/40 transition-all"
                    disabled={isLoading}
                  >
                    <LogIn className="h-4 w-4" />
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Register ── */}
              <TabsContent value="register">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Create account</h2>
                  <p className="text-sm text-green-400/70 mt-1">Register to get started</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-green-200 text-sm font-medium">Full Name</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="border-emerald-700/50 bg-green-950/50 text-white placeholder:text-green-600/50 focus:border-emerald-400 focus-visible:ring-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-green-200 text-sm font-medium">Email</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="border-emerald-700/50 bg-green-950/50 text-white placeholder:text-green-600/50 focus:border-emerald-400 focus-visible:ring-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-green-200 text-sm font-medium">Username</Label>
                    <Input
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                      className="border-emerald-700/50 bg-green-950/50 text-white placeholder:text-green-600/50 focus:border-emerald-400 focus-visible:ring-emerald-500/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-green-200 text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        type={showRegPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        className="border-emerald-700/50 bg-green-950/50 text-white placeholder:text-green-600/50 focus:border-emerald-400 focus-visible:ring-emerald-500/30 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500/50 hover:text-green-300 transition-colors"
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-green-200 text-sm font-medium">Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="border-emerald-700/50 bg-green-950/50 text-white placeholder:text-green-600/50 focus:border-emerald-400 focus-visible:ring-emerald-500/30"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-900/40 transition-all"
                    disabled={isLoading}
                  >
                    <UserPlus className="h-4 w-4" />
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-5 text-center text-xs text-green-700/60">
            © {new Date().getFullYear()} BIOZENTRA Healthcare. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
