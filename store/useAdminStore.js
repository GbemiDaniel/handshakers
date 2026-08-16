import { create } from 'zustand';

export const useAdminStore = create((set) => ({
  // --- STATE ---
  workspaces: [],
  taskers: [],
  isLoadingWorkspaces: true,
  isLoadingTaskers: true,

  // --- SETTERS (For initial data fetching) ---
  setWorkspaces: (workspaces) => set({ workspaces, isLoadingWorkspaces: false }),
  setTaskers: (taskers) => set({ taskers, isLoadingTaskers: false }),
  setIsLoadingWorkspaces: (isLoading) => set({ isLoadingWorkspaces: isLoading }),
  setIsLoadingTaskers: (isLoading) => set({ isLoadingTaskers: isLoading }),

  // --- OPTIMISTIC MUTATIONS (The UI Sync Engine) ---
  
  // 1. Delete Workspace: Removes workspace AND scrubs it from tasker memberships in UI
  removeWorkspaceOptimistic: (workspaceId) => set((state) => ({
    workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
    taskers: state.taskers.map((tasker) => ({
      ...tasker,
      memberships: tasker.memberships?.filter((m) => m.account_id !== workspaceId) || []
    }))
  })),

  // 2. Assign Tasker: Updates a tasker's membership array in the UI instantly
  assignTaskerOptimistic: (taskerId, newMembershipRecord) => set((state) => ({
    taskers: state.taskers.map((tasker) => 
      tasker.id === taskerId 
        ? { ...tasker, memberships: [...(tasker.memberships || []), newMembershipRecord] }
        : tasker
    )
  })),

  // 3. Deactivate/Update Tasker: Updates any root property on a tasker
  updateTaskerOptimistic: (taskerId, updatedFields) => set((state) => ({
    taskers: state.taskers.map((tasker) =>
      tasker.id === taskerId ? { ...tasker, ...updatedFields } : tasker
    )
  })),

  // 4. Deactivate Tasker: Revokes workspace access by clearing memberships array
  deactivateTaskerOptimistic: (taskerId, workspaceId = null) => set((state) => ({
    taskers: state.taskers.map((tasker) => 
      tasker.id === taskerId 
        ? {
            ...tasker,
            memberships: workspaceId 
              ? tasker.memberships?.filter((m) => m.account_id !== workspaceId) || []
              : []
          }
        : tasker
    )
  }))
}));
