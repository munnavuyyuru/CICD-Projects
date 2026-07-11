import { supabase } from '../lib/supabase';
import type { MemberRole } from '@taskflow/shared';

export interface MemberWithProfile {
  project_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  display_name: string;
}

async function countOwners(projectId: string): Promise<number> {
  const { count } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('role', 'owner');

  return count ?? 0;
}

export async function getMemberRole(
  projectId: string,
  userId: string,
): Promise<MemberRole | null> {
  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  return (data?.role as MemberRole) ?? null;
}

export async function getMembers(
  projectId: string,
  userId: string,
): Promise<MemberWithProfile[]> {
  const callerRole = await getMemberRole(projectId, userId);
  if (!callerRole) return [];

  const { data } = await supabase
    .from('project_members')
    .select('project_id, user_id, role, created_at, profiles(display_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (!data) return [];

  return data.map((row) => ({
    project_id: row.project_id as string,
    user_id: row.user_id as string,
    role: row.role as MemberRole,
    created_at: row.created_at as string,
    display_name: (row.profiles as unknown as { display_name: string }).display_name,
  }));
}

export async function addMember(
  projectId: string,
  memberUserId: string,
  role: MemberRole,
  invitedBy: string,
): Promise<{ success: boolean; error?: string }> {
  const actorRole = await getMemberRole(projectId, invitedBy);
  if (actorRole !== 'owner') {
    return { success: false, error: 'Only project owners can add members' };
  }

  const existingRole = await getMemberRole(projectId, memberUserId);
  if (existingRole) {
    return { success: false, error: 'User is already a member of this project' };
  }

  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: memberUserId,
    role,
    invited_by: invitedBy,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateMemberRole(
  projectId: string,
  memberUserId: string,
  newRole: MemberRole,
  actorUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const actorRole = await getMemberRole(projectId, actorUserId);
  if (actorRole !== 'owner') {
    return { success: false, error: 'Only project owners can change roles' };
  }

  const targetRole = await getMemberRole(projectId, memberUserId);
  if (!targetRole) {
    return { success: false, error: 'User is not a member of this project' };
  }

  if (targetRole === 'owner' && newRole !== 'owner') {
    const ownerCount = await countOwners(projectId);
    if (ownerCount <= 1) {
      return { success: false, error: 'Cannot demote the last owner' };
    }
  }

  const { error } = await supabase
    .from('project_members')
    .update({ role: newRole })
    .eq('project_id', projectId)
    .eq('user_id', memberUserId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeMember(
  projectId: string,
  memberUserId: string,
  actorUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const actorRole = await getMemberRole(projectId, actorUserId);
  if (actorRole !== 'owner') {
    return { success: false, error: 'Only project owners can remove members' };
  }

  const targetRole = await getMemberRole(projectId, memberUserId);
  if (!targetRole) {
    return { success: false, error: 'User is not a member of this project' };
  }

  if (targetRole === 'owner') {
    const ownerCount = await countOwners(projectId);
    if (ownerCount <= 1) {
      return { success: false, error: 'Cannot remove the last owner' };
    }
  }

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', memberUserId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
