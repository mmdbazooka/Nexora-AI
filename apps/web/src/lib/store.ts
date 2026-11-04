'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useWorkspace = create<{ workspaceId: string; setWorkspace: (id: string) => void }>()(
  persist((set) => ({ workspaceId: '', setWorkspace: (id) => set({ workspaceId: id }) }), {
    name: 'nexora-workspace',
  }),
);
