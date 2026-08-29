"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Auth from "@/components/Auth";
import { AccountProvider, useAccount } from "@/context/AccountContext";
import WorkspaceManagerModal from "@/components/WorkspaceManagerModal";
import EditCapacityModal from "@/components/EditCapacityModal";
import AssignWorkspaceModal from "@/components/AssignWorkspaceModal";
import { supabase } from "@/utils/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Sparkles, Loader2, Building, Plus, ArrowRight, MoreVertical, AlertTriangle, 
  UserPlus, UserMinus, Search, X, PlusCircle, LogOut, CheckCircle2, ShieldCheck, 
  Zap, Activity, Play, ChevronRight, Check, Layers, Users, Clock, Flame, 
  BarChart3, Database, Lock, Sliders, ArrowUpRight, Cpu, Compass
} from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/store/useAdminStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import MarketingCalculator from "@/components/MarketingCalculator";
import TelemetrySync from "@/components/TelemetrySync";
import AppBootSequence from "@/components/AppBootSequence";
import FourFeatureCardsGrid from "@/components/FeatureCards";
import { TeamNodeToken, PrecisionChronometerToken, CyberGridIcon, PlayDemoBadge } from "@/components/GlowTokens";
import Navbar from "@/components/Navbar";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";

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

function WorkspaceCard({ account, isSuperAdmin, router, onDeleteRequest, onEditCapacityRequest }) {
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
                      onEditCapacityRequest(account);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Edit Capacity
                  </button>
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

  // Edit Capacity State
  const [isEditCapacityModalOpen, setIsEditCapacityModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null);

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

  const handleEditCapacityRequest = (account) => {
    setWorkspaceToEdit(account);
    setIsEditCapacityModalOpen(true);
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
                onEditCapacityRequest={handleEditCapacityRequest}
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
              <div className="overflow-x-auto min-h-75">
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

      <EditCapacityModal
        isOpen={isEditCapacityModalOpen}
        onClose={() => {
          setIsEditCapacityModalOpen(false);
          setWorkspaceToEdit(null);
        }}
        workspace={workspaceToEdit}
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
                className="inline-flex items-center justify-center min-w-20 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-xl transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed gap-2"
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

const heroContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 15, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // -------------------------------------------------------------
  // Global Pointer Parallax Physics (Protected via fine-pointer check)
  // -------------------------------------------------------------
  const [hasFinePointer, setHasFinePointer] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Background Ambient Parallax Layers (Strict GPU Compositing)
  // Slow, gentle drift [-15,15] range creates spatial depth vs foreground elements
  const bgOrb1X = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);
  const bgOrb1Y = useTransform(mouseY, [-0.5, 0.5], [-12, 12]);

  const bgOrb2X = useTransform(mouseX, [-0.5, 0.5], [20, -20]);
  const bgOrb2Y = useTransform(mouseY, [-0.5, 0.5], [15, -15]);

  const bgOrb3X = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const bgOrb3Y = useTransform(mouseY, [-0.5, 0.5], [12, -12]);

  const handlePointerMove = useCallback(
    (e) => {
      if (!hasFinePointer) return;
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth - 0.5);
      mouseY.set(e.clientY / innerHeight - 0.5);
    },
    [hasFinePointer, mouseX, mouseY]
  );

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHasFinePointer(mediaQuery.matches);

    const updateCapability = (e) => setHasFinePointer(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateCapability);
    } else {
      mediaQuery.addListener(updateCapability);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateCapability);
      } else {
        mediaQuery.removeListener(updateCapability);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasFinePointer) return;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [hasFinePointer, handlePointerMove]);

  if (loading) {
    return <AppBootSequence/>;
  }

  // Unauthenticated View - Marketing Funnel
  if (!session) {
    return (
      <div className="relative min-h-screen w-full bg-[#030712] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden font-sans">
        {/* ------------------------------------------------------------- */}
        {/* Atmospheric Volumetric Lighting & Parallax Layer               */}
        {/* ------------------------------------------------------------- */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {/* Targeted Feathered Ambient Radial Glow — incredibly soft, from-blue-900/10 per art direction */}
          <div className="absolute top-20 sm:top-28 left-1/2 -translate-x-1/2 w-[56rem] max-w-full h-[28rem] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950/0 to-transparent blur-3xl" />

          {/* Top-Left Volumetric Deep Primary Blue Atmosphere */}
          <motion.div
            style={hasFinePointer ? { x: bgOrb1X, y: bgOrb1Y } : undefined}
            className="absolute -top-32 -left-32 w-232 h-232 rounded-full bg-blue-700/8 blur-[180px] will-change-transform"
          />
          
          {/* Top-Right Volumetric Subtle Cyan Accent Mist */}
          <motion.div
            style={hasFinePointer ? { x: bgOrb2X, y: bgOrb2Y } : undefined}
            className="absolute -top-20 -right-20 w-208 h-208 rounded-full bg-cyan-600/6 blur-[180px] will-change-transform"
          />
          
          {/* Bottom Ambient Deep Indigo / Void Floor */}
          <motion.div
            style={hasFinePointer ? { x: bgOrb3X, y: bgOrb3Y } : undefined}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-220 h-128 rounded-full bg-indigo-950/15 blur-[180px] will-change-transform"
          />

          {/* Whispering Micro-Matrix Grid Pattern (Barely Perceptible 1.5% Opacity) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_45%_at_50%_25%,#000_60%,transparent_100%)] opacity-70" />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Dedicated Navbar Component                                    */}
        {/* ------------------------------------------------------------- */}
        <Navbar onAuthModalOpen={() => setShowAuthModal(true)} />

        <main className="relative z-10 flex flex-col items-center w-full">
          {/* ========================================================= */}
          {/* SECTION 1: THE HERO (Image 1 & Image 2 Kinetic Typography) */}
          {/* Clean pt-24 clearing fixed header seamlessly without gap   */}
          {/* ========================================================= */}
          <section className="relative w-full pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center text-center">
              <motion.div variants={heroContainerVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8 flex flex-col items-center">

                <motion.h1
                  variants={heroItemVariants}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] font-medium tracking-[-0.04em] text-slate-200 max-w-5xl mx-auto leading-[1.1] flex flex-col items-center justify-center text-center w-full"
                >
                  <span className="block w-full drop-shadow-sm">Shared accounts</span>
                  <span className="block w-full text-slate-400">and team payouts</span>
                  
                  {/* Line 3: Perfectly symmetrical value props without the awkward prefix */}
                  <span className="flex flex-wrap items-center justify-center gap-x-3 md:gap-x-4 mt-3 sm:mt-5 w-full">
                    <span className="flex items-center whitespace-nowrap font-bold tracking-tight">
                      <TeamNodeToken className="w-9 h-9 md:w-11 md:h-11 lg:w-14 lg:h-14 mr-2 sm:mr-3 shrink-0"/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500 pb-1">
                        transparent
                      </span>
                    </span>
                    
                    <span className="text-slate-500 font-light mx-2 sm:mx-4">+</span>
                    
                    <span className="flex items-center whitespace-nowrap font-bold tracking-tight">
                      <PrecisionChronometerToken className="w-9 h-9 md:w-11 md:h-11 lg:w-14 lg:h-14 mr-2 sm:mr-3 shrink-0"/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 pb-1">
                        exact
                      </span>
                    </span>
                  </span>
                </motion.h1>

                {/* Cinematic Subtext */}
                <motion.p
                  variants={heroItemVariants}
                  className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-light mt-6 tracking-normal"
                >
                  The all-in-one workspace for account managers and collaborative taskers. Log time independently, track progress visually, and let Handshakers automatically calculate payable hours without restrictive platform timers.
                </motion.p>
              </motion.div>

              {/* ========================================================= */}
              {/* TRIPTYCH 3-CARD HERO SHOWCASE (Reference Image 1 & 2)     */}
              {/* ========================================================= */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-7xl mx-auto mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center"
              >
                {/* CARD 1 (Left): Release Balance Precisely with Simple Rules */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="relative rounded-[28px] bg-linear-to-b from-[#0a1220]/80 via-[#060a12]/90 to-[#03060a]/95 border border-white/8 hover:border-blue-500/30 backdrop-blur-2xl transform-gpu will-change-transform p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden space-y-5 transition-colors duration-200 group cursor-pointer"
                >
                  <div className="absolute -top-16 inset-x-0 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none" />

                  <div className="flex items-center justify-between pb-3 border-b border-white/6">
                    <span className="text-xs font-semibold text-slate-300">Rules</span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                      Live Engine
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Release balance precisely with simple pro-rata rules.
                  </p>

                  {/* Micro-Taskers List */}
                  <div className="space-y-3">
                    {[
                      { name: "Marcus V.", tag: "#Core", hours: "14.50 hrs", billable: "11.60 hrs", pct: "75%" },
                      { name: "Elena R.", tag: "#Design", hours: "18.00 hrs", billable: "14.40 hrs", pct: "90%" },
                      { name: "Devon K.", tag: "#FullStack", hours: "17.50 hrs", billable: "14.00 hrs", pct: "85%" },
                    ].map((tasker, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/4 space-y-2 shadow-sm">
                        <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline text-xs">
                          <span className="font-semibold text-white">{tasker.name}</span>
                          <span className="font-mono text-cyan-300 font-medium text-right">{tasker.billable}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline text-[10px] text-slate-500 font-mono">
                          <span>{tasker.tag}</span>
                          <span className="text-right">Logged: {tasker.hours}</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-white/4 overflow-hidden mt-0.5">
                          <div className="h-full bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full" style={{ width: tasker.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Toggles Status */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      Auto-Rebalance
                    </span>
                    <span className="font-mono text-slate-300">Active</span>
                  </div>
                </motion.div>

                {/* CARD 2 (Center Hero): Capped Pool Auto-Distributor + Play Demo Badge */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="relative rounded-[28px] bg-linear-to-b from-[#0c182c]/90 via-[#070f1e]/95 to-[#03060a]/95 border border-blue-500/40 hover:border-cyan-400/50 backdrop-blur-2xl transform-gpu will-change-transform p-7 sm:p-8 text-left shadow-[0_25px_60px_-10px_rgba(37,99,235,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden space-y-6 lg:-translate-y-4 scale-100 sm:scale-105 z-20 transition-colors duration-200 group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between pb-3 border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]" />
                      <span className="text-xs font-bold text-white tracking-tight">Active Pool Allocation</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/30 shadow-[0_0_8px_rgba(59,130,246,0.25)]">
                      Capped 40.00 hrs
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Auto-balance team payouts based on approved client budgets.
                  </p>

                  {/* Central Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-white/6 shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Team Logged</span>
                      <span className="text-lg font-bold text-white font-mono">50.00 hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Client Paid</span>
                      <span className="text-lg font-bold text-cyan-300 font-mono">40.00 hrs</span>
                    </div>
                  </div>

                  {/* Central Interactive Play Demo Badge Overlay */}
                  <div className="py-3 flex justify-center">
                    <PlayDemoBadge onPlay={() => setShowAuthModal(true)} />
                  </div>
                </motion.div>

                {/* CARD 3 (Right): Scale Fast with Adaptive Metrics and Feedback */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="relative rounded-[28px] bg-linear-to-b from-[#0a1220]/80 via-[#060a12]/90 to-[#03060a]/95 border border-white/8 hover:border-cyan-500/30 backdrop-blur-2xl transform-gpu will-change-transform p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden space-y-5 transition-colors duration-200 group cursor-pointer"
                >
                  <div className="absolute -top-16 inset-x-0 h-32 bg-cyan-500/10 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none" />

                  <div className="flex items-center justify-between pb-3 border-b border-white/6">
                    <span className="text-xs font-semibold text-slate-300">Live Telemetry</span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                      0.000 ms
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Scale fast with adaptive metrics and real-time reconciliation.
                  </p>

                  {/* SVG Glowing Line Graph (Electric Blue & Cyan) */}
                  <div className="h-28 w-full relative flex items-end">
                    <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 60 Q 40 50, 70 30 T 140 25 T 200 10 L 200 80 L 0 80 Z"
                        fill="url(#chartGradient)"
                      />
                      <path
                        d="M0 60 Q 40 50, 70 30 T 140 25 T 200 10"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        className="drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                      />
                      <circle cx="200" cy="10" r="4" fill="#ffffff" className="drop-shadow-[0_0_6px_#38bdf8]" />
                    </svg>
                  </div>

                  {/* Real-time telemetry items */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Distribution Velocity</span>
                      <span className="font-mono text-emerald-400 font-semibold">+18.4%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Payout Dispute Rate</span>
                      <span className="font-mono text-white font-semibold">0.00%</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Upgraded Humanized Value Pillars - Mobile Responsive Fixed */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -50px 0px" }}
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
            }}
            className="w-full max-w-6xl mx-auto py-24 sm:py-32 px-6 relative z-10"
          >
            <div className="flex flex-col md:flex-row items-stretch border-y md:border-y-0 border-white/[0.05] md:border-transparent">
              
              {/* Pillar 1: Automated Payouts */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
                className="group relative flex flex-col items-start text-left flex-1 border-b md:border-b-0 md:border-r border-white/[0.05] py-8 md:py-4 md:px-8 lg:px-12 md:pl-0 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <h3 className="text-base sm:text-lg md:text-xl font-medium text-slate-300 group-hover:text-white transition-colors duration-300 tracking-wide mb-2">
                  Automated Team Payouts
                </h3>
                <p className="text-sm sm:text-base text-slate-500 group-hover:text-slate-400 transition-colors duration-300 font-light leading-relaxed">
                  Set a client budget and let Handshakers calculate everyone's fair share instantly. No more end-of-week spreadsheet math.
                </p>
              </motion.div>

              {/* Pillar 2: Trust & Autonomy */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
                className="group relative flex flex-col items-start text-left flex-1 border-b md:border-b-0 md:border-r border-white/[0.05] py-8 md:py-4 md:px-8 lg:px-12 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <h3 className="text-base sm:text-lg md:text-xl font-medium text-slate-300 group-hover:text-white transition-colors duration-300 tracking-wide mb-2">
                  Independent Time Tracking
                </h3>
                <p className="text-sm sm:text-base text-slate-500 group-hover:text-slate-400 transition-colors duration-300 font-light leading-relaxed">
                  Log your work without invasive screen recorders or spyware. We believe in trusting professionals to do their jobs.
                </p>
              </motion.div>

              {/* Pillar 3: Transparency */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
                className="group relative flex flex-col items-start text-left flex-1 py-8 md:py-4 md:px-8 lg:px-12 md:pr-0 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <h3 className="text-base sm:text-lg md:text-xl font-medium text-slate-300 group-hover:text-white transition-colors duration-300 tracking-wide mb-2">
                  Real-Time Transparency
                </h3>
                <p className="text-sm sm:text-base text-slate-500 group-hover:text-slate-400 transition-colors duration-300 font-light leading-relaxed">
                  Everyone on the team can see the budget, the progress, and their exact earnings. No hidden numbers, just absolute clarity.
                </p>
              </motion.div>

            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* SECTION 2: THE 2-COLUMN MODULE (Reference Image 1)        */}
          {/* ========================================================= */}
          <motion.section
            id="features"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full py-24 sm:py-32 scroll-mt-20"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
              {/* Section Header with Accent Gradient Eyebrow Line */}
              <div className="space-y-4">
                <div className="w-12 h-1 rounded-full bg-linear-to-r from-purple-500 to-blue-500" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white max-w-xl">
                  Payout infrastructure you'll actually enjoy using
                </h2>
              </div>

              {/* 2-Column Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                {/* Left Description */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-400">
                      Auto-reconciled allocation pools
                    </span>
                    <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                      We're focusing on what you need to track, reconcile, and release: faster, fairer pro-rata payouts built for modern B2B agencies and cross-functional product squads.
                    </p>
                  </div>

                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors group cursor-pointer"
                  >
                    <span>Learn about Pro-Rata Math</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Right Dark Elevated Console */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="lg:col-span-7 rounded-3xl bg-[#090d16] border border-white/8 backdrop-blur-2xl transform-gpu will-change-transform p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] space-y-6 overflow-hidden transition-colors duration-200 cursor-pointer"
                >
                  {/* Console Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-white/6">
                    <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Capped Pool
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-400/20 text-xs font-semibold">
                      Pro-Rata Active
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/20 text-xs font-semibold">
                      Live Sync
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-white/4 text-slate-400 border border-white/6 text-xs font-semibold">
                      Audit Trail
                    </span>
                  </div>

                  {/* Micro Table Simulation */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-12 text-slate-500 px-3 py-1 uppercase text-[10px]">
                      <span className="col-span-5">Member</span>
                      <span className="col-span-3 text-right">Logged</span>
                      <span className="col-span-4 text-right">Allocated</span>
                    </div>
                    {[
                      { member: "Sarah Chen", logged: "16:00", payout: "12.80 hrs", share: "32.0%" },
                      { member: "Alex Rivera", logged: "14:00", payout: "11.20 hrs", share: "28.0%" },
                      { member: "Liam Vance", logged: "20:00", payout: "16.00 hrs", share: "40.0%" },
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-12 items-center px-3 py-2.5 rounded-xl bg-white/2 border border-white/4 hover:bg-white/4 transition-colors">
                        <span className="col-span-5 text-white font-sans font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          {row.member}
                        </span>
                        <span className="col-span-3 text-right text-slate-400">{row.logged}</span>
                        <span className="col-span-4 text-right text-emerald-400 font-semibold">{row.payout} ({row.share})</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* ========================================================= */}
          {/* SECTION 3: FOUR-COLUMN FEATURE GRID (Reference Image 1 & 2) */}
          {/* ========================================================= */}
          <div id="engine" className="w-full border-t border-white/4 scroll-mt-20">
            <FourFeatureCardsGrid />
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: MISSION CONTROL CONSOLE (Reference Image 1)    */}
          {/* ========================================================= */}
          <motion.section
            id="releases"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full py-24 sm:py-32 border-t border-white/4 scroll-mt-20"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
              <div className="space-y-4 text-left">
                <div className="w-12 h-1 rounded-full bg-linear-to-r from-purple-500 to-blue-500" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
                  Mission control for releases
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                {/* Left Wide Screen Console Mockup */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="lg:col-span-8 rounded-3xl bg-[#090d16] border border-white/8 backdrop-blur-2xl transform-gpu will-change-transform p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] space-y-6 overflow-hidden transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/6 gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>RELEASE PAYOUTS v2</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Total Pool: 40.00 hrs</span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {[
                      { name: "Payments Engine", status: "Active", weight: "35.0%", release: "2 min ago", color: "bg-emerald-400" },
                      { name: "Auth Microservice", status: "Reconciled", weight: "25.0%", release: "1 hr ago", color: "bg-blue-400" },
                      { name: "UI Design Sprint", status: "Audited", weight: "40.0%", release: "Just now", color: "bg-purple-400" },
                      { name: "GraphQL Gateway", status: "Pending", weight: "0.0%", release: "In queue", color: "bg-amber-400" },
                    ].map((row, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-3 rounded-xl bg-white/2 border border-white/4 gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 shrink-0 rounded-full ${row.color}`} />
                          <span className="font-sans font-medium text-white text-sm truncate">{row.name}</span>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 text-slate-400">
                          <span className="text-slate-300">{row.status}</span>
                          <span className="font-bold text-white tabular-nums">{row.weight}</span>
                          {row.release === "In queue" ? (
                            <div className="w-16 flex justify-end">
                              <TelemetrySync />
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 whitespace-nowrap">{row.release}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Right Bullet Points */}
                <div className="lg:col-span-4 space-y-6">
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Get an overview of compensation metrics for task releases, dynamic distribution, and real-time team allocation right inside one single console.
                  </p>

                  <ul className="space-y-3.5 text-sm sm:text-base font-medium text-slate-200">
                    <li className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#38bdf8]" />
                      <span>Best-in-class reporting</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                      <span>Granular time tracks</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      <span>Custom views</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ========================================================= */}
          {/* SECTION 5: MODELED FOR B2B (Reference Image 1)            */}
          {/* ========================================================= */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full py-24 sm:py-32 border-t border-white/4"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
              <div className="space-y-4 text-left">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
                  Modeled for B2B
                </h2>
              </div>

              {/* 3 Dense Micro-Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {/* Micro-Card 1 */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="p-8 rounded-3xl bg-[#090d16]/80 border border-white/6 backdrop-blur-2xl transform-gpu will-change-transform space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-200 cursor-pointer"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      Workspaces, not chaos
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Time is accurately aggregated at the workspace level, right out of the box.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3 font-mono text-xs text-slate-400">
                    <div className="flex items-center justify-between text-white font-semibold">
                      <span>Agency Workspace</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/6 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-3/4" />
                    </div>
                  </div>
                </motion.div>

                {/* Micro-Card 2 */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="p-8 rounded-3xl bg-[#090d16]/80 border border-white/6 backdrop-blur-2xl transform-gpu will-change-transform space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-200 cursor-pointer"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      Powerful views
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Compare real-time filters for feature access, adoption, and time releases.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Approved Pool</span>
                      <span className="text-white font-bold">40.00 hrs</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Reconciled</span>
                      <span className="text-emerald-400 font-bold">100.0%</span>
                    </div>
                  </div>
                </motion.div>

                {/* Micro-Card 3 */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                  transition={{ duration: 0.2 }}
                  className="p-8 rounded-3xl bg-[#090d16]/80 border border-white/6 backdrop-blur-2xl transform-gpu will-change-transform space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-200 cursor-pointer"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      Custom member segments
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Create and target billing slices of team members based on powerful pro-rata algorithms.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2 font-mono text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Engineering</span>
                      <span className="text-white">60%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Product Design</span>
                      <span className="text-white">40%</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* ========================================================= */}
          {/* SECTION 6: EXECUTIVE TESTIMONIAL (Reference Image 1)       */}
          {/* ========================================================= */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full py-24 sm:py-32 border-t border-white/4"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center text-center space-y-8">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-relaxed text-balance max-w-4xl">
                "Handshakers is building an easy way to create compensation ownership, shared trust, and zero payout friction in your product team."
              </h3>
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">
                  AH
                </div>
                <div className="text-left text-xs">
                  <span className="font-semibold text-white block">Andrew Heiss</span>
                  <span className="text-slate-400 font-mono">Head of Operations @ Polymath</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ========================================================= */}
          {/* SECTION 7: INTERACTIVE SANDBOX (THE WORKING CALCULATOR)   */}
          {/* ========================================================= */}
          <motion.section
            id="demo"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full py-24 sm:py-32 border-t border-white/4 scroll-mt-20"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12 sm:space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <div className="w-12 h-1 rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 mx-auto" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
                  Don't trust black-box algorithms? <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-300">
                    Try the math yourself.
                  </span>
                </h2>
                <p className="text-slate-400 text-base sm:text-lg">
                  Adjust any parameter below. Watch how the pro-rata allocation redistributes capped time across the team in real-time.
                </p>
              </div>

              {/* The Embeddable Glassmorphic Calculator */}
              <MarketingCalculator onCtaClick={() => setShowAuthModal(true)} />
            </div>
          </motion.section>

          {/* ========================================================= */}
          {/* SECTION 8: FINAL CTA BANNER & FOOTER                      */}
          {/* ========================================================= */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full py-24 sm:py-32 border-t border-white/4"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-center">
              <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl relative rounded-3xl bg-linear-to-b from-[#0e1424] via-[#090d16] to-[#05070c] border border-blue-500/30 backdrop-blur-2xl transform-gpu will-change-transform p-10 sm:p-16 text-center space-y-8 overflow-hidden shadow-[0_25px_60px_-15px_rgba(37,99,235,0.3)]"
              >
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
                    Ready to automate your team?
                  </h2>
                  <p className="text-base sm:text-lg text-slate-400">
                    Join high-performing agencies running transparent, conflict-free compensation on Handshakers.
                  </p>
                </div>
                <div className="relative z-10 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold text-base shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-colors duration-200 cursor-pointer overflow-hidden"
                  >
                    Create Your Free Workspace
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.section>
        </main>

        {/* Global Clean Footer (Reference Image 1) */}
        <footer id="company" className="w-full pt-8 pb-28 sm:pb-32 text-center text-slate-500 text-xs sm:text-sm border-t border-white/4 bg-[#030712] scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" showText={true} />
            </div>
            <p className="font-mono text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Handshakers Inc. High-Precision Compensation Infrastructure.
            </p>
          </div>
        </footer>

        {/* Floating Bottom Action Banner (Reference Image 2 Inspired) */}
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
          <div className="pointer-events-auto max-w-xl w-full p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 text-xs overflow-hidden">
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              <span>Free tier available. No credit card required.</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_18px_rgba(37,99,235,0.4)] transition-colors duration-200 cursor-pointer shrink-0 overflow-hidden"
            >
              Get Started
            </motion.button>
          </div>
        </div>

        {/* Glassmorphic Auth Modal Overlay */}
        {showAuthModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-slate-900/95 rounded-3xl shadow-2xl border border-white/8 p-6 sm:p-8 overflow-hidden backdrop-blur-2xl transform-gpu will-change-transform animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/6 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 text-center">
                <div className="flex justify-center mb-4">
                  <Logo className="w-10 h-10" showText={false} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">Welcome to Handshakers</h3>
                <p className="text-sm text-slate-400 mt-1.5">Sign in or create your workspace in seconds.</p>
              </div>

              <Auth
                onAuthSuccess={(sess) => {
                  setSession(sess);
                  setShowAuthModal(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
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
