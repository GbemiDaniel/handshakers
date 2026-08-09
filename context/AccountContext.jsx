"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase";

export const AccountContext = createContext({
  accounts: [],
  activeAccount: null,
  setActiveAccount: () => {},
  isLoadingAccounts: true,
  isSuperAdmin: false,
  refreshAccounts: () => {},
});

export function AccountProvider({ children, session }) {
  const params = useParams();
  const urlAccountId = params?.accountId;

  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
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
          .select("is_super_admin, role")
          .eq("id", userId)
          .single();

        if (!error && profile) {
          // Explicitly set isSuperAdmin state from profile column
          const adminFlag = profile.is_super_admin === true || profile.is_super_admin === "true" || profile.role === "admin";
          setIsSuperAdmin(Boolean(adminFlag));
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

  // 2. Fetch available accounts for the current user
  const fetchAccounts = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      setActiveAccount(null);
      setIsLoadingAccounts(false);
      return;
    }

    setIsLoadingAccounts(true);
    try {
      const { data, error } = await supabase.from("accounts").select("*");

      if (!error && data && data.length > 0) {
        setAccounts(data);
        setActiveAccount((prev) => {
          if (prev && data.some((acc) => acc.id === prev.id)) {
            return prev;
          }
          return data[0];
        });
      } else {
        setAccounts([]);
        setActiveAccount(null);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setAccounts([]);
      setActiveAccount(null);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, [fetchAccounts]);

  // 3. Synchronize activeAccount with urlAccountId from URL parameters
  useEffect(() => {
    if (urlAccountId && accounts.length > 0) {
      const matchedAccount = accounts.find((acc) => String(acc.id) === String(urlAccountId));
      if (matchedAccount) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveAccount(matchedAccount);
      }
    }
  }, [urlAccountId, accounts]);

  const value = {
    accounts,
    activeAccount,
    setActiveAccount,
    isLoadingAccounts,
    isSuperAdmin,
    refreshAccounts: fetchAccounts,
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
