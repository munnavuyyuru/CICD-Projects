import { supabase } from '../lib/supabase';
import type { Task } from '@taskflow/shared';
import { getMemberRole } from './memberService';
import { logActivity } from './activityService';

export async function getTasks(projectId: string, userId: string): Promise<Task[]> {
  if (!(await getMemberRole(projectId, userId))) return [];

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  return (data ?? []) as Task[];
}

export async function getTask(taskId: string, userId: string): Promise<Task | null> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!data) return null;

  if (!(await getMemberRole(data.project_id, userId))) return null;

  return data as Task;
}

export async function createTask(
  userId: string,
  input: {
    project_id: string;
    title: string;
    description?: string;
    priority?: number;
    assignee_id?: string;
    due_date?: string;
  },
): Promise<Task | null> {
  if (!(await getMemberRole(input.project_id, userId))) return null;

  const { data: maxPos } = await supabase
    .from('tasks')
    .select('position')
    .eq('project_id', input.project_id)
    .order('position', { ascending: false })
    .limit(1);

  const nextPos = (maxPos?.[0]?.position ?? 0) + 1;

  const { data } = await supabase
    .from('tasks')
    .insert({
      project_id: input.project_id,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 2,
      assignee_id: input.assignee_id ?? null,
      due_date: input.due_date ?? null,
      position: nextPos,
    })
    .select()
    .single();

  if (data) {
    await logActivity(input.project_id, userId, 'created', 'task', data.id);
  }

  return data as Task | null;
}

export async function updateTask(
  taskId: string,
  userId: string,
  input: {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: number;
    assignee_id?: string | null;
    due_date?: string | null;
    position?: number;
  },
): Promise<Task | null> {
  const { data: existing } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!existing) return null;

  if (!(await getMemberRole(existing.project_id, userId))) return null;

  const { data } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', taskId)
    .select()
    .single();

  return data as Task | null;
}

export async function deleteTask(taskId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', taskId)
    .single();

  if (!existing) return false;

  if (!(await getMemberRole(existing.project_id, userId))) return false;

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  return !error;
}
