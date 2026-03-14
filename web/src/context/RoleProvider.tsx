"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type UserRole = "mentee" | "mentor" | "officer";

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("mentee");

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
