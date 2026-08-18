import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../lib/db";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth
      .getSession()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const profile = await auth.signIn(email, password);
    setUser(profile);
    return profile;
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
