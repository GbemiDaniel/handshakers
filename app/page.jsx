"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Auth from "@/components/Auth";
import { AccountProvider, useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "@/components/WorkspaceManagerModal";
import { supabase } from "@/utils/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Loader2, Building, Plus, ArrowRight, MoreVertical, AlertTriangle } from "lucide-react";

function WorkspaceCard({ account, isSuperAdmin, router, onDeleteRequest }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const workspaceName = account.account_name || account.name || "Workspace";
  const initials = workspaceName.substring(0, 2).toUpperCase();

  return (
    <div className="group text-left bg-white dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/30 rounded-2xl p-4 sm:p-6 transition-all duration-300 ease-in-out flex flex-col relative overflow-visible h-44 cursor-pointer" onClick={() => router.push(`/workspace/${account.id}`)}>
      {/* Top Row: Avatar + Name + Dropdown */}
      <div className="flex items-start justify-between w-full mb-auto relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center font-bold text-sm shadow-sm">
            {initials}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {workspaceName}
          </h3>
        </div>
        
        {/* Dropdown Menu */}
        {isSuperAdmin && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onDeleteRequest(account);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Workspace
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Middle Row: Badges */}
      <div className="flex items-center gap-2 my-4 w-full">
        <span className="text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
          {isSuperAdmin ? "Super Admin" : "Member"}
        </span>
        <span className="text-xs text-slate-500 font-medium">
          &bull; 2 Members
        </span>
      </div>

      {/* Bottom Row: Last Active */}
      <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto w-full">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"></div>
        <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
          Last Active: Today
        </span>
      </div>
    </div>
  );
}

function Overview({ session }) {
  const router = useRouter();
  const { accounts, isSuperAdmin, isLoadingAccounts, refreshAccounts } = useAccount();
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("workspaces");
  
  // Taskers State
  const [taskers, setTaskers] = useState([]);
  const [isLoadingTaskers, setIsLoadingTaskers] = useState(true);
  
  // Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);

  useEffect(() => {
    async function fetchTaskers() {
      if (activeTab !== "taskers") return;
      setIsLoadingTaskers(true);
      try {
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, role"); // Removed email if it's not present

        if (profilesError) throw profilesError;

        // Fetch account_members and join accounts
        const { data: members, error: membersError } = await supabase
          .from("account_members")
          .select(`
            user_id,
            status,
            accounts (
              account_name
            )
          `)
          .eq("status", "active");

        if (membersError) throw membersError;

        const formattedTaskers = (profiles || []).map((profile) => {
          // Find all active memberships for this profile manually in memory
          const activeMemberships = (members || []).filter(m => m.user_id === profile.id);
          
          let workspaceName = "Unassigned";
          let status = "Inactive";
          
          if (activeMemberships.length > 0) {
            status = "Active";
            const firstMembership = activeMemberships[0];
            const account = firstMembership.accounts;
            
            if (account) {
               const acc = Array.isArray(account) ? account[0] : account;
               workspaceName = acc?.account_name || "Unknown Workspace";
            }
            
            if (activeMemberships.length > 1) {
               workspaceName += ` (+${activeMemberships.length - 1} more)`;
            }
          }
          
          return {
            id: profile.id,
            name: profile.full_name || "Unknown User",
            email: `ID: ${profile.id.slice(0, 8)}`,
            status: status,
            workspace: workspaceName
          };
        });
        
        setTaskers(formattedTaskers);
      } catch (err) {
        console.error("Error fetching taskers:", err);
      } finally {
        setIsLoadingTaskers(false);
      }
    }

    fetchTaskers();
  }, [activeTab]);

  useEffect(() => {
    if (isLoadingAccounts) return;
    if (!isSuperAdmin && accounts.length === 1) {
      router.push('/workspace/' + accounts[0].id);
    }
  }, [accounts, isSuperAdmin, isLoadingAccounts, router]);

  if (isLoadingAccounts) {
    return (
      <div className="py-12 flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium">Loading your workspaces...</span>
      </div>
    );
  }

  const handleDeleteRequest = (account) => {
    setWorkspaceToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // Mock delete logic
    console.log("Mock deleting workspace", workspaceToDelete);
    setIsDeleteModalOpen(false);
    setWorkspaceToDelete(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Welcome, {session?.user?.user_metadata?.full_name || 'Daniel'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Select a workspace to manage your team's time and payouts.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsManagerModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
        )}
      </div>

      {/* Tabbed Navigation */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("workspaces")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "workspaces" 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Workspaces
          {activeTab === "workspaces" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("taskers")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "taskers" 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Taskers
          {activeTab === "taskers" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="pt-2">
        {activeTab === "workspaces" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <WorkspaceCard 
                key={account.id} 
                account={account} 
                isSuperAdmin={isSuperAdmin} 
                router={router} 
                onDeleteRequest={handleDeleteRequest} 
              />
            ))}

            {!isSuperAdmin && accounts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                You don't have access to any workspaces yet.
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto min-h-[300px]">
              {isLoadingTaskers ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Loading taskers...</span>
                </div>
              ) : taskers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-medium">No taskers found on the platform.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Tasker</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Assigned Workspace</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {taskers.map((tasker) => (
                      <tr key={tasker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{tasker.name}</div>
                          <div className="text-xs">{tasker.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          {tasker.status === "Active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          {tasker.workspace}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <MoreVertical className="w-5 h-5 inline-block" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      <WorkspaceManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        onAccountCreated={refreshAccounts}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center border border-red-200 dark:border-red-900/60">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 mt-0.5">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Delete Workspace
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-300">{workspaceToDelete?.account_name || workspaceToDelete?.name}</strong>? This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/60 px-5 py-4 sm:px-6 flex items-center justify-end gap-3 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setWorkspaceToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-xl transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

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
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading OS...</span>
        </div>
      </main>
    );
  }

  // Unauthenticated View
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>

          <header className="text-center space-y-2.5">
            <div className="flex justify-center mb-6">
              <Logo className="w-10 h-10" showText={true} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Global Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="max-w-5xl mx-auto mb-10 flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="w-8 h-8" showText={true} />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session?.user?.user_metadata?.full_name && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {session.user.user_metadata.full_name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setSession(null);
              }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </nav>
        <Overview session={session} />
      </main>
    </AccountProvider>
  );
}
