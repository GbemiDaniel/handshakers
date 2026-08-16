"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Auth from "@/components/Auth";
import { AccountProvider, useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "@/components/WorkspaceManagerModal";
import AssignWorkspaceModal from "@/components/AssignWorkspaceModal";
import { supabase } from "@/utils/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Loader2, Building, Plus, ArrowRight, MoreVertical, AlertTriangle, UserPlus, UserMinus, Search, X, PlusCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/store/useAdminStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

function TaskersToolbar({ searchQuery, setSearchQuery, filterStatus, setFilterStatus }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search taskers by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center p-1 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-sm">
        {["All", "Active", "Inactive"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filterStatus === status 
                ? "bg-slate-900 text-white shadow-xs dark:bg-slate-700" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

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

function TaskerActionMenu({ tasker, onAssignClick }) {
  const activeMemberships = tasker.memberships || [];
  const isActive = activeMemberships.length > 0;

  const handleDeactivate = async () => {
    if (!isActive) return;
    
    const deactivatePromise = async () => {
      const { error } = await supabase
        .from('account_members')
        .delete()
        .eq('user_id', tasker.id);
        
      if (error) throw error;
      useAdminStore.getState().deactivateTaskerOptimistic(tasker.id);
    };

    toast.promise(deactivatePromise(), {
      loading: `Deactivating ${tasker.name}...`,
      success: `${tasker.name} has been deactivated.`,
      error: `Failed to deactivate ${tasker.name}.`
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95 focus:outline-none"
          title="Tasker Actions"
        >
          <MoreVertical className="w-5 h-5 inline-block" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={onAssignClick}
          disabled={isActive}
          className="hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-2 font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Assign to Workspace</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleDeactivate}
          disabled={!isActive}
          className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition-colors cursor-pointer flex items-center gap-2 font-medium"
        >
          <UserMinus className="w-4 h-4" />
          <span>Deactivate Tasker</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const TaskerRow = React.memo(({ 
  tasker, 
  onAssignClick 
}) => {
  // Dynamically calculate status and workspace string from raw memberships
  const activeMemberships = tasker.memberships || [];
  let status = "Inactive";
  let workspaceName = "Unassigned";
  
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

  return (
    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors border-b border-slate-100 dark:border-slate-800/60">
      <TableCell className="px-6 py-4">
        <div className="font-medium text-slate-900 dark:text-slate-100">{tasker.name}</div>
        <div className="text-xs text-slate-500">{tasker.email}</div>
      </TableCell>
      <TableCell className="px-6 py-4">
        {status === "Active" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm dark:shadow-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></span>
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
            Inactive
          </span>
        )}
      </TableCell>
      <TableCell className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
        {workspaceName}
      </TableCell>
      <TableCell className="px-6 py-4 text-right">
        <TaskerActionMenu tasker={tasker} onAssignClick={onAssignClick} />
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  return prevProps.tasker === nextProps.tasker;
});

const TaskerMobileCard = React.memo(({ 
  tasker, 
  onAssignClick 
}) => {
  // Dynamically calculate status and workspace string from raw memberships
  const activeMemberships = tasker.memberships || [];
  let status = "Inactive";
  let workspaceName = "Unassigned";
  
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

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors relative">
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col min-w-0 pr-4">
          <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{tasker.name}</div>
          <div className="text-xs text-slate-500 truncate">{tasker.email}</div>
        </div>
        <div className="shrink-0 mt-0.5">
          {status === "Active" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm dark:shadow-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></span>
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
              Inactive
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between w-full border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">
          {workspaceName}
        </div>
        <div className="shrink-0">
          <TaskerActionMenu tasker={tasker} onAssignClick={onAssignClick} />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.tasker === nextProps.tasker;
});

function Overview({ session }) {
  const router = useRouter();
  const { isSuperAdmin } = useAccount(); // Keep for now
  
  // Zustand Store
  const workspaces = useAdminStore(state => state.workspaces);
  const taskers = useAdminStore(state => state.taskers);
  const isLoadingWorkspaces = useAdminStore(state => state.isLoadingWorkspaces);
  const isLoadingTaskers = useAdminStore(state => state.isLoadingTaskers);
  const setWorkspaces = useAdminStore(state => state.setWorkspaces);
  const setTaskers = useAdminStore(state => state.setTaskers);
  const removeWorkspaceOptimistic = useAdminStore(state => state.removeWorkspaceOptimistic);

  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("workspaces");
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [taskerToAssign, setTaskerToAssign] = useState(null);
  
  // Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredTaskers = React.useMemo(() => {
    return taskers.filter((tasker) => {
      const matchesSearch = tasker.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tasker.id.toLowerCase().includes(searchQuery.toLowerCase());
                            
      const status = tasker.memberships?.length > 0 ? "Active" : "Inactive";
      const matchesStatus = filterStatus === "All" ? true : status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [taskers, searchQuery, filterStatus]);

  const fetchAccounts = async () => {
    useAdminStore.getState().setIsLoadingWorkspaces(true);
    try {
      const { data, error } = await supabase.from("accounts").select("id, account_name, weekly_pool_hours, created_at");
      if (error) throw error;
      setWorkspaces(data || []);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setWorkspaces([]);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [session?.user?.id]);

  const fetchTaskers = async (isSilent = false) => {
    if (!isSilent && activeTab !== "taskers") return;
    if (!isSilent && taskers.length === 0) useAdminStore.getState().setIsLoadingTaskers(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role");

      if (profilesError) throw profilesError;

      // Fetch account_members and join accounts
      const { data: members, error: membersError } = await supabase
        .from("account_members")
        .select(`
          user_id,
          status,
          account_id,
          accounts (
            account_name
          )
        `)
        .eq("status", "active");

      if (membersError) throw membersError;

      const enrichedTaskers = (profiles || []).map((profile) => {
        const activeMemberships = (members || []).filter(m => m.user_id === profile.id);
        
        return {
          id: profile.id,
          name: profile.full_name || "Unknown User",
          email: `ID: ${profile.id.slice(0, 8)}`,
          memberships: activeMemberships
        };
      });
      
      setTaskers(enrichedTaskers);
    } catch (err) {
      console.error("Error fetching taskers:", err);
    } finally {
      if (!isSilent) useAdminStore.getState().setIsLoadingTaskers(false);
    }
  };

  useEffect(() => {
    fetchTaskers();
  }, [activeTab]);

  useEffect(() => {
    if (isLoadingWorkspaces) return;
    if (!isSuperAdmin && workspaces.length === 1) {
      router.push('/workspace/' + workspaces[0].id);
    }
  }, [workspaces, isSuperAdmin, isLoadingWorkspaces, router]);

  useEffect(() => {
    // Fail-safe redirect: if activeTab is taskers but user is not super admin, force them to workspaces
    if (activeTab === "taskers" && !isSuperAdmin) {
      setActiveTab("workspaces");
    }
  }, [activeTab, isSuperAdmin]);

  if (isLoadingWorkspaces) {
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

  const confirmDelete = async () => {
    if (!workspaceToDelete?.id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', workspaceToDelete.id);

      if (error) throw error;

      toast.success(`${workspaceToDelete.account_name || workspaceToDelete.name} has been permanently deleted.`);
      
      // Zustand Optimistic UI Engine
      removeWorkspaceOptimistic(workspaceToDelete.id);
      
      setIsDeleteModalOpen(false);
      setWorkspaceToDelete(null);
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error(error.message || "Failed to delete workspace. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 pb-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome, {session?.user?.user_metadata?.full_name || 'Daniel'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Select a workspace to manage your team's time and payouts.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsManagerModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out shrink-0"
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
        
        {isSuperAdmin && (
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
        )}
      </div>

      {/* Content Area */}
      <div className="pt-2">
        {activeTab === "workspaces" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((account) => (
              <WorkspaceCard 
                key={account.id} 
                account={account} 
                isSuperAdmin={isSuperAdmin} 
                router={router} 
                onDeleteRequest={handleDeleteRequest} 
              />
            ))}

            {!isSuperAdmin && workspaces.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                You don't have access to any workspaces yet.
              </div>
            )}
          </div>
        )}
        
        {activeTab === "taskers" && isSuperAdmin && (
          <div className="animate-in fade-in duration-300">
            <TaskersToolbar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
            <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="overflow-x-auto min-h-[300px]">
                {isLoadingTaskers ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Loading taskers...</span>
                  </div>
                ) : filteredTaskers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                    <p className="text-sm font-medium">No taskers found matching your criteria.</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <TableHead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Tasker</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Status</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Assigned Workspace</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody key={`desktop-${searchQuery}-${filterStatus}`} className="animate-in fade-in duration-300">
                          {filteredTaskers.map((tasker) => (
                            <TaskerRow 
                              key={tasker.id} 
                              tasker={tasker} 
                              onAssignClick={() => {
                                setTaskerToAssign(tasker);
                                setIsAssignModalOpen(true);
                              }}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div key={`mobile-${searchQuery}-${filterStatus}`} className="grid gap-3 p-4 md:hidden animate-in fade-in duration-300">
                      {filteredTaskers.map((tasker) => (
                        <TaskerMobileCard 
                          key={tasker.id} 
                          tasker={tasker} 
                          onAssignClick={() => {
                            setTaskerToAssign(tasker);
                            setIsAssignModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <WorkspaceManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        onAccountCreated={fetchAccounts}
      />

      <AssignWorkspaceModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setTaskerToAssign(null);
        }}
        tasker={taskerToAssign}
        full_name={taskerToAssign?.name}
        onSuccess={fetchTaskers}
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
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center min-w-[5rem] px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-xl transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col">
        {/* Anchored Top Navigation Header */}
        <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-white/75 dark:bg-slate-950/75 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Logo className="w-8 h-8" showText={true} />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all active:scale-95"
                    title="User Menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {(session?.user?.user_metadata?.full_name || session?.user?.email || "U").substring(0, 2).toUpperCase()}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {session?.user?.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setSession(null);
                    }}
                    className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition-colors cursor-pointer flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Overview session={session} />
        </main>
      </div>
    </AccountProvider>
  );
}
