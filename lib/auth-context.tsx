"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, logout as clearToken } from "@/lib/learning-api";
export type Role = "student" | "teacher" | "admin" | "super_admin";
export type Account = { id:number; name:string; email:string; role:Role; school_id:number; is_active?:boolean };
type AuthState = { user:Account|null; loading:boolean; refresh:()=>Promise<void>; signOut:()=>Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({children}:{children:React.ReactNode}) {
 const [user,setUser] = useState<Account|null>(null);
 const [loading,setLoading] = useState(true);
 const refresh = useCallback(async () => {
  if (!getToken()) { setUser(null); setLoading(false); return; }
  setLoading(true);
  try { setUser(await api<Account>("/me")); }
  catch { setUser(null); clearToken(); }
  finally { setLoading(false); }
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const signOut=async()=>{try { if(getToken()) await api("/auth/logout",{method:"POST"}); } catch {} finally {clearToken();setUser(null);} };
 return <AuthContext.Provider value={{user,loading,refresh,signOut}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("AuthProvider missing");return value;}
