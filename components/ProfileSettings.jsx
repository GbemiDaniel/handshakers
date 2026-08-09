"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { X, Save, User, Shield, Loader2, Sparkles } from "lucide-react";

export default function ProfileSettings({ isOpen, onClose, session, onProfileUpdate }) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const userId = session?.user?.id;
  const userEmail = session?.user?.email || "";

  // Fetch current user profile when drawer opens
  useEffect(() => {
    async function fetchProfile() {
      if (!userId || !isOpen) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", userId)
        .single();

      if (error) {
        toast.error("Failed to load profile data.");
      } else if (data) {
        setFullName(data.full_name || "");
        setRole(data.role || "member");
      }
      setIsLoading(false);
    }

    fetchProfile();
  }, [userId, isOpen]);

  // Handle Save
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", userId);

    setIsSaving(false);

    if (error) {
      toast.error(`Error updating profile: ${error.message}`);
    } else {
      toast.success("Profile updated successfully!");
      if (onProfileUpdate) onProfileUpdate();
      onClose();
    }
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Blur Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity duration-200 ease-in-out animate-in fade-in"
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className="fixed inset-y-0 right-0 w-full sm:max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-60 flex flex-col h-full transform transition-transform duration-200 ease-in-out animate-in slide-in-from-right border-l border-transparent dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-settings-title" className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Profile Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your personal account details</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close settings drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500 gap-2.5">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">Loading profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Account Email (Read-Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Account Email
                </label>
                <input
                  type="email"
                  readOnly
                  value={userEmail}
                  className="w-full h-11 px-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed select-none"
                />
              </div>

              {/* Full Name Input */}
              <div>
                <label
                  htmlFor="fullNameInput"
                  className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="fullNameInput"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 transition-all duration-200 ease-in-out"
                  />
                </div>
              </div>

              {/* Role Badge Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Role Permission
                </label>
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                  <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">System Role</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize tracking-wide border ${
                        role === "admin"
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {role === "admin" && <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Action Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-11 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] disabled:opacity-60 text-white font-medium rounded-xl shadow-xs transition-all duration-200 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
