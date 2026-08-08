"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Auth from "@/components/Auth";
import { AccountProvider, useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "@/components/WorkspaceManagerModal";
import { supabase } from "@/utils/supabase";
import { Sparkles, Loader2, Building, Plus, ArrowRight } from "lucide-react";

function CommandCenter() {
  const router = useRouter();
  const { accounts, isSuperAdmin, isLoadingAccounts, refreshAccounts } = useAccount();
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  useEffect(() => {
    if (isLoadingAccounts) return;
    if (!isSuperAdmin && accounts.length === 1) {
      router.push('/workspace/' + accounts[0].id);
    }
  }, [isLoadingAccounts, isSuperAdmin, accounts, router]);

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Workspaces</h2>
        <p className="text-sm text-slate-500">
          Select a workspace to enter the command center.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Create New Workspace Card (Super Admin Only) */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsManagerModalOpen(true)}
            className="group flex flex-col items-center justify-center gap-3 p-6 h-40 bg-blue-50/50 hover:bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-300 rounded-3xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-blue-700">Create New Workspace</span>
          </button>
        )}

        {/* Workspace Cards */}
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => router.push(`/workspace/${acc.id}`)}
            className="group relative flex flex-col justify-between p-6 h-40 bg-white border border-slate-200 hover:border-blue-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 text-left overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
              <Building className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 truncate">
                {acc.account_name || acc.name || `Workspace (${acc.id.slice(0, 8)})`}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-1">
                Enter Command Center
              </p>
            </div>
          </button>
        ))}

        {!isSuperAdmin && accounts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl">
            You don't have access to any workspaces yet.
          </div>
        )}
      </div>

      <WorkspaceManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        onAccountCreated={refreshAccounts}
      />
    </div>
  );
}

export default function RootPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for authentication changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Loading OS...</span>
        </div>
      </main>
    );
  }

  // Unauthenticated View
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <header className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handshakers Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Global Command Center
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Sign in to manage your multi-tenant workspaces.
            </p>
          </header>

          <Auth onAuthSuccess={(sess) => setSession(sess)} />
        </div>
      </main>
    );
  }

  // Authenticated View
  return (
    <AccountProvider session={session}>
      <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Handshakers OS</span>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setSession(null);
            }}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Sign out
          </button>
        </div>
        <CommandCenter />
      </main>
    </AccountProvider>
  );
}
