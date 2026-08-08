"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { X, Users, UserPlus, Trash2, Loader2, User, Shield, RefreshCw, AlertTriangle } from "lucide-react";

export default function ManageTeamModal({ isOpen, onClose, activeAccount }) {
  const [members, setMembers] = useState([]);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [showInactive, setShowInactive] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const accountId = activeAccount?.id;
  const accountName = activeAccount?.account_name || activeAccount?.name || "Workspace";

  const fetchMembers = useCallback(async () => {
    if (!accountId || !isOpen) return;
    setIsLoading(true);

    try {
      const { data: memberRows, error: memberErr } = await supabase
        .from("account_members")
        .select("id, user_id, role, status")
        .eq("account_id", accountId);

      if (memberErr) throw memberErr;

      const { data: profileRows, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, role");

      if (profErr) throw profErr;

      const profileMap = {};
      (profileRows || []).forEach((p) => {
        profileMap[p.id] = p;
      });

      const formattedMembers = (memberRows || []).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role || "member",
        status: m.status || "active",
        full_name: profileMap[m.user_id]?.full_name || `User (${m.user_id.slice(0, 6)})`,
      }));

      setMembers(formattedMembers);

      const activeMemberUserIds = new Set(
        formattedMembers.filter(m => m.status === 'active').map((m) => m.user_id)
      );
      const notInAccount = (profileRows || []).filter((p) => !activeMemberUserIds.has(p.id));

      setAvailableProfiles(notInAccount);
      if (notInAccount.length > 0) {
        setSelectedUserId(notInAccount[0].id);
      } else {
        setSelectedUserId("");
      }
    } catch (err) {
      toast.error(`Error loading team members: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, isOpen]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async (e) => {
    e?.preventDefault();
    if (!selectedUserId || !accountId) return;

    setIsAdding(true);
    try {
      const { error } = await supabase.from("account_members").upsert([
        {
          account_id: accountId,
          user_id: selectedUserId,
          role: "member",
          status: "active"
        },
      ], { onConflict: 'account_id, user_id' });

      if (error) throw error;

      toast.success("Team member added successfully!");
      fetchMembers();
    } catch (err) {
      toast.error(`Failed to add member: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from("account_members")
        .update({ status: 'inactive' })
        .eq("id", memberToRemove.id);

      if (error) throw error;

      toast.success(`${memberToRemove.full_name} removed from workspace.`);
      fetchMembers();
    } catch (err) {
      toast.error(`Failed to remove member: ${err.message}`);
    } finally {
      setIsActionLoading(false);
      setMemberToRemove(null);
    }
  };

  const handleReactivateMember = async (memberId, memberName) => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from("account_members")
        .update({ status: 'active' })
        .eq("id", memberId);

      if (error) throw error;

      toast.success(`${memberName} has been reactivated.`);
      fetchMembers();
    } catch (err) {
      toast.error(`Failed to reactivate member: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        if (memberToRemove) {
          setMemberToRemove(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, memberToRemove]);

  if (!isOpen) return null;

  const displayedMembers = members.filter(m => showInactive ? true : m.status === 'active');

  return (
    <>
      {/* --- MAIN MODAL --- */}
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Centering Container */}
        <div className="flex items-center justify-center min-h-full p-4 sm:p-6 pointer-events-none">
          {/* Modal Card */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white z-20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                  Manage Workspace Team
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  Workspace: <span className="font-medium text-slate-700">{accountName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/30">

            {/* Add Member Form */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Member to Workspace</span>
              </div>
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={availableProfiles.length === 0 || isAdding}
                  className="flex-1 h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:opacity-50 min-w-0"
                >
                  {availableProfiles.length === 0 ? (
                    <option value="">No available profiles to add</option>
                  ) : (
                    availableProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || `User (${p.id.slice(0, 6)})`}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="submit"
                  disabled={!selectedUserId || isAdding}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors shrink-0 flex items-center justify-center gap-1.5 focus:outline-none w-full sm:w-auto"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /><span>Add</span></>}
                </button>
              </form>
            </div>

            {/* Member List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                <div className="flex items-center gap-2">
                  <span>Workspace Members</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{displayedMembers.length}</span>
                </div>
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className="text-slate-400 hover:text-slate-700 capitalize flex items-center gap-1 transition-colors"
                >
                  {showInactive ? "Hide Inactive" : "Show Inactive"}
                </button>
              </div>

              {isLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading members...</span>
                </div>
              ) : displayedMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-slate-200/60 rounded-xl bg-white shadow-sm">
                  No members found.
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[40vh] p-4 space-y-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                  {displayedMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 bg-slate-50 border rounded-xl transition-all gap-3 ${member.status === 'inactive' ? 'border-dashed border-slate-200 opacity-60 grayscale-[0.5]' : 'border-slate-100 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
                          {member.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {member.full_name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            ID: {member.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {member.status === 'inactive' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-200 text-slate-600 uppercase tracking-wider">
                            Inactive
                          </span>
                        )}
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 capitalize">
                          <Shield className="w-2.5 h-2.5" />
                          {member.role}
                        </span>

                        {member.status === 'inactive' ? (
                          <button
                            type="button"
                            onClick={() => handleReactivateMember(member.id, member.full_name)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors disabled:opacity-50 text-xs font-bold shadow-sm focus:outline-none"
                            title="Reactivate member"
                          >
                            {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Reactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMemberToRemove({ id: member.id, full_name: member.full_name })}
                            disabled={isActionLoading}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 focus:outline-none"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end z-20">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors focus:outline-none"
            >
              Done
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {memberToRemove && (
        <div className="fixed inset-0 z-[110]">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMemberToRemove(null)}
          />
          <div className="flex items-center justify-center min-h-full p-4 sm:p-6 pointer-events-none">
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl pointer-events-auto p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">Remove Member?</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to remove <span className="font-semibold text-slate-700">{memberToRemove.full_name}</span> from {accountName}? They will lose access to this workspace.
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                <button
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 h-11 sm:h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors focus:outline-none"
                  disabled={isActionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveMember}
                  className="flex-1 h-11 sm:h-10 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 focus:outline-none"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </>
  );
}