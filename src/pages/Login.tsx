import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, UserPlus, ShieldCheck } from "lucide-react";
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
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-900">
      {/* Animated background circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-2xl" />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center"
        >
          <motion.img
            src={logo}
            alt="Biozentra"
            className="mb-8 h-32 w-32 drop-shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow">
            BIOZENTRA
          </h1>
          <p className="mt-2 text-lg font-medium text-cyan-300">Healthcare Management</p>
          <div className="mt-10 space-y-4 text-left max-w-sm">
            {[
              "Track sales & inventory in real time",
              "Manage orders, invoices & customers",
              "Smart analytics for smarter decisions",
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3"
              >
                <ShieldCheck className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <span className="text-sm text-cyan-100">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <img src={logo} alt="Biozentra" className="mb-3 h-20 w-20 drop-shadow-xl" />
            <h1 className="text-2xl font-bold text-white">BIOZENTRA</h1>
            <p className="text-sm text-cyan-300">Healthcare Management</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 bg-white/10 rounded-xl">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-white/70 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-white/70 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">Welcome back</h2>
                  <p className="text-sm text-cyan-200/70">Sign in to your dashboard</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-username" className="text-cyan-100 text-sm">Username</Label>
                    <Input
                      id="login-username"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-cyan-100 text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-cyan-400 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-11 rounded-xl"
                    disabled={isLoading}
                  >
                    <LogIn className="h-4 w-4" />
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">Create account</h2>
                  <p className="text-sm text-cyan-200/70">Register to get started</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-cyan-100 text-sm">Full Name</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-cyan-100 text-sm">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-cyan-100 text-sm">Username</Label>
                    <Input
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-cyan-100 text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        type={showRegPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 chars)"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-cyan-400 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-cyan-100 text-sm">Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-cyan-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-11 rounded-xl"
                    disabled={isLoading}
                  >
                    <UserPlus className="h-4 w-4" />
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()} BIOZENTRA Healthcare. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
