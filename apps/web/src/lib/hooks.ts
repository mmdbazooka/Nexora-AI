'use client';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from './store';
import { api, paged } from './api';
import type { User, Workspace, Member } from './types';
export function useUser() {
  return useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me'), retry: false });
}
export function useWorkspaces() {
  return useQuery({ queryKey: ['workspaces'], queryFn: () => api<Workspace[]>('/workspaces') });
}
export function useWorkspaceId() {
  const { workspaceId } = useWorkspace();
  const { data } = useWorkspaces();
  return data?.some((w) => w._id === workspaceId) ? workspaceId : data?.[0]?._id || '';
}
export function useMembers() {
  const id = useWorkspaceId();
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => api<Member[]>(`/workspaces/${id}/members`),
    enabled: !!id,
  });
}
export function useList<T>(kind: string, query = '') {
  const id = useWorkspaceId();
  return useQuery({
    queryKey: [kind, id, query],
    queryFn: () => paged<T>(`/workspaces/${id}/${kind}${query ? '?' + query : ''}`),
    enabled: !!id,
  });
}
export function useWorkspaceData<T>(kind: string) {
  const id = useWorkspaceId();
  return useQuery({
    queryKey: [kind, id],
    queryFn: () => api<T>(`/workspaces/${id}/${kind}`),
    enabled: !!id,
  });
}
