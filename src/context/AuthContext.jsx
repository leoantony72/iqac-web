import React, { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthState } from "../services/supabaseAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const subscription = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = () => false;

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
