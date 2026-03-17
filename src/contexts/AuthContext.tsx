import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setToken, clearToken } from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
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
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
    const currentUser = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Try backend first
    try {
      const tokens = await api.auth.login(username, password);
      setToken(tokens.access);
      const userObj: User = { id: username, username, email: "", name: username };
      setUser(userObj);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));
      return true;
    } catch {
      // Backend unavailable - fall back to local auth
    }
    const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const found = storedUsers.find(
      (u: any) => u.username === username && u.password === password
    );
    if (found) {
      const { password: _p, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      await api.auth.register(username, password, email, name);
      return await login(username, password);
    } catch {
      // Backend unavailable - fall back to local registration
    }
    const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (storedUsers.some((u: any) => u.username === username || u.email === email)) {
      return false;
    }
    const newUser = { id: Date.now().toString(), username, email, password, name };
    storedUsers.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
    const { password: _p, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    return true;
  };

  const logout = () => {
    setUser(null);
    clearToken();
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
