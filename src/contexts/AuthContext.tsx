import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  register: (username: string, email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = "biozentra-users";
const CURRENT_USER_KEY = "biozentra-current-user";

const defaultUsers = [
  { id: "1", username: "admin", email: "admin@biozentra.com", password: "admin123", name: "Admin User" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // ── Supabase Auth mode ────────────────────────────────────────────────
    if (isSupabaseConfigured && supabase) {
      // Restore session on load
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email || "",
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email || "",
          });
        }
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email || "",
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email || "",
          });
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }

    // ── localStorage fallback mode ────────────────────────────────────────
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<{ ok: boolean; message: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) return { ok: true, message: "" };

      // Return the real Supabase error so the UI can display it
      if (error) {
        const msg = error.message || "Login failed";
        if (msg.toLowerCase().includes("email not confirmed") || msg.toLowerCase().includes("not confirmed")) {
          return { ok: false, message: "Your email is not verified. Please check your inbox for a confirmation link, or use Forgot Password to resend." };
        }
        if (msg.toLowerCase().includes("invalid login") || msg.toLowerCase().includes("invalid credentials")) {
          return { ok: false, message: "Incorrect email or password. Please try again." };
        }
        return { ok: false, message: msg };
      }
    }

    // Local fallback — accept email or username
    const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const found = storedUsers.find(
      (u: any) => (u.username === email || u.email === email) && u.password === password
    );
    if (found) {
      const { password: _p, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      return { ok: true, message: "" };
    }
    return { ok: false, message: "Incorrect email or password. Please try again." };
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const register = async (
    username: string,
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    // Option D: domain whitelist — if VITE_ALLOWED_EMAIL_DOMAIN is set,
    // only emails from that domain are allowed to register.
    const allowedDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN as string | undefined;
    if (allowedDomain) {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (emailDomain !== allowedDomain.toLowerCase()) {
        console.warn("Registration blocked: unauthorised email domain.");
        return false;
      }
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, name } },
      });
      if (!error) return true;
      return false;
    }

    // Local fallback
    const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (storedUsers.some((u: any) => u.username === username || u.email === email)) return false;
    const newUser = { id: Date.now().toString(), username, email, password, name };
    storedUsers.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
    const { password: _p, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    return true;
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (!error) {
        return { success: true, message: "Password reset email sent! Check your inbox." };
      }
      return { success: false, message: error.message };
    }
    return { success: false, message: "Password reset requires Supabase to be configured." };
  };

  // ── Reset Password (called from ResetPassword page after clicking email link) ──
  const resetPassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) return { success: true, message: "Password updated successfully!" };
      return { success: false, message: error.message };
    }
    return { success: false, message: "Not supported in offline mode." };
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
