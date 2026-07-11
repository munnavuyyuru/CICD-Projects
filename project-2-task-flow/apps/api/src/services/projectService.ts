import { supabase } from '../lib/supabase';
import type { Project } from '@taskflow/shared';
import { getMemberRole } from './memberService';

export async function getProjects(userId: string): Promise<Project[]> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .or(`owner_id.eq.${userId},id.in(select project_id from project_members where user_id.eq.${userId})`)
    .order('created_at', { ascending: false });

  return (data ?? []) as Project[];
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .or(`owner_id.eq.${userId},id.in(select project_id from project_members where user_id.eq.${userId})`)
    .single();

  return data as Project | null;
}

export async function createProject(
  userId: string,
  input: { name: string; description?: string },
): Promise<Project> {
  const { data } = await supabase
    .from('projects')
    .insert({ owner_id: userId, name: input.name, description: input.description ?? null })
    .select()
    .single();

  if (!data) throw new Error('Failed to create project');

  const { error: memberError } = await supabase.from('project_members').insert({
    project_id: data.id,
    user_id: userId,
    role: 'owner',
    invited_by: userId,
  });

  if (memberError) throw new Error('Failed to add owner to project');

  return data as Project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: { name?: string; description?: string | null },
): Promise<Project | null> {
  const role = await getMemberRole(projectId, userId);
  if (role !== 'owner') return null;

  const { data } = await supabase
    .from('projects')
    .update(input)
    .eq('id', projectId)
    .select()
    .single();

  return data as Project | null;
}

export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const role = await getMemberRole(projectId, userId);
  if (role !== 'owner') return false;

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  return !error;
}
