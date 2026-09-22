"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useAdminStore } from "@/store/useAdminStore";

export const AccountContext = createContext({
  activeAccount: null,
  setActiveAccount: () => {},
  isSuperAdmin: false,
  accounts: [],
  isLoadingAccounts: false,
  refreshAccounts: () => {},
});

export function AccountProvider({ children, session }) {
  const params = useParams();
  const urlAccountId = params?.accountId;

  const [activeAccount, setActiveAccount] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const userId = session?.user?.id;

  // 1. Query super admin status from profiles table
  useEffect(() => {
    async function fetchSuperAdminStatus() {
      if (!userId) {
        setIsSuperAdmin(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_super_admin")
          .eq("id", userId)
          .single();

        if (!error && profile) {
          // Must match the database's notion of super admin exactly — treating
          // profiles.role as a fallback showed buttons the policies then refused.
          setIsSuperAdmin(profile.is_super_admin === true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (err) {
        console.error("Error fetching super admin status:", err);
        setIsSuperAdmin(false);
      }
    }

    fetchSuperAdminStatus();
  }, [userId]);

  // Subscribe to Zustand store for workspaces
  const workspaces = useAdminStore((state) => state.workspaces);
  const isLoadingAccounts = useAdminStore((state) => state.isLoadingWorkspaces);
  const setWorkspaces = useAdminStore((state) => state.setWorkspaces);
  const setIsLoadingAccounts = useAdminStore((state) => state.setIsLoadingWorkspaces);

  const refreshAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const { data, error } = await supabase.from("accounts").select("id, account_name, weekly_pool_hours, created_at");
      if (error) throw error;
      setWorkspaces(data || []);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setWorkspaces([]);
    }
  }, [setIsLoadingAccounts, setWorkspaces]);

  useEffect(() => {
    if (workspaces.length === 0) {
      refreshAccounts();
    }
  }, [workspaces.length, refreshAccounts]);

  // Synchronize activeAccount with urlAccountId from URL parameters
  useEffect(() => {
    if (urlAccountId && workspaces.length > 0) {
      const matchedAccount = workspaces.find((acc) => String(acc.id) === String(urlAccountId));
      if (matchedAccount) {
        setActiveAccount(matchedAccount);
      }
    } else if (!urlAccountId && workspaces.length > 0 && !activeAccount) {
      // Fallback for default active account if no URL param
      setActiveAccount(workspaces[0]);
    }
  }, [urlAccountId, workspaces]);

  const value = {
    activeAccount,
    setActiveAccount,
    isSuperAdmin,
    accounts: workspaces,
    isLoadingAccounts,
    refreshAccounts,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
}
