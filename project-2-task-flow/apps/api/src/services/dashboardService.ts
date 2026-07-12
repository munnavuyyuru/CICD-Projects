import { supabase } from '../lib/supabase';

export interface DashboardStats {
  projectCount: number;
  taskCount: number;
  completedCount: number;
}

export interface ActivityEventWithAuthor {
  id: string;
  project_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  display_name: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentActivity: ActivityEventWithAuthor[];
}

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .or(`owner_id.eq.${userId},id.in(select project_id from project_members where user_id.eq.${userId})`);

  const projectIds = (projects ?? []).map((p) => p.id);
  const projectCount = projectIds.length;

  let taskCount = 0;
  let completedCount = 0;

  if (projectIds.length > 0) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .in('project_id', projectIds);

    const taskList = tasks ?? [];
    taskCount = taskList.length;
    completedCount = taskList.filter((t) => t.status === 'done').length;
  }

  const stats: DashboardStats = { projectCount, taskCount, completedCount };

  let recentActivity: ActivityEventWithAuthor[] = [];
  if (projectIds.length > 0) {
    const { data: events } = await supabase
      .from('activity_events')
      .select('id, project_id, actor_id, action, entity_type, entity_id, metadata, created_at, profiles!inner(display_name)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(20);

    recentActivity = ((events ?? []) as unknown[]).map((event) => { const e = event as Record<string, unknown>; return {
      id: e.id as string,
      project_id: e.project_id as string,
      actor_id: e.actor_id as string,
      action: e.action as string,
      entity_type: e.entity_type as string,
      entity_id: e.entity_id as string,
      metadata: e.metadata as Record<string, unknown> | null,
      created_at: e.created_at as string,
      display_name: (e.profiles as unknown as { display_name: string }).display_name,
    }; }); }

  return { stats, recentActivity };
}
