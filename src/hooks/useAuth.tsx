import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  getStoredUserId,
  setStoredUserId,
  clearAuthState,
} from "@/lib/auth";
import type { User } from "@/types";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userId: Id<"users"> | null;
  login: () => Promise<{ userId: string; username: string }>;
  logout: () => void;
  handleOAuthCallback: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  const exchangeCode = useAction(api.auth.exchangeCodeForToken);

  // Check for stored user ID on mount
  useEffect(() => {
    const storedId = getStoredUserId();
    if (storedId) {
      setUserId(storedId as Id<"users">);
    }
    setIsLoading(false);
  }, []);

  const handleOAuthCallback = async (code: string) => {
    console.log("handleOAuthCallback called with code:", code.substring(0, 10) + "...");
    setIsLoading(true);
    try {
      console.log("Calling exchangeCode action...");
      const result = await exchangeCode({ code });
      console.log("Exchange successful, result:", result);
      setUserId(result.userId as Id<"users">);
      setStoredUserId(result.userId);
    } catch (error) {
      console.error("Exchange failed:", error);
      setIsLoading(false);
      throw error; // Re-throw so AuthCallback can catch it
    }
    setIsLoading(false);
  };

  const login = async () => {
    // This is called after OAuth redirect
    throw new Error("Use handleOAuthCallback instead");
  };

  const logout = () => {
    setUserId(null);
    clearAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!userId && !!user,
        isLoading: isLoading || (!!userId && user === undefined),
        user: user as User | null,
        userId,
        login,
        logout,
        handleOAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
