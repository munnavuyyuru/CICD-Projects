import { supabase } from '../lib/supabase';
import { getMemberRole } from './memberService';
import { logActivity } from './activityService';
import type { PaginatedResponse } from '@taskflow/shared';

export interface CommentWithAuthor {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  display_name: string;
}

async function getTaskProjectId(taskId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', taskId)
    .single();

  return data?.project_id ?? null;
}

export async function getComments(
  taskId: string,
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<PaginatedResponse<CommentWithAuthor>> {
  const projectId = await getTaskProjectId(taskId);
  if (!projectId) return { data: [], cursor: null, has_more: false };

  const role = await getMemberRole(projectId, userId);
  if (!role) return { data: [], cursor: null, has_more: false };

  let query = supabase
    .from('comments')
    .select('id, task_id, author_id, content, created_at, profiles!inner(display_name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error || !data) return { data: [], cursor: null, has_more: false };

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null;

  return {
    data: items.map((row) => ({
      id: row.id as string,
      task_id: row.task_id as string,
      author_id: row.author_id as string,
      content: row.content as string,
      created_at: row.created_at as string,
      display_name: (row.profiles as unknown as { display_name: string }).display_name,
    })),
    cursor: nextCursor,
    has_more: hasMore,
  };
}

export async function createComment(
  taskId: string,
  authorId: string,
  content: string,
): Promise<CommentWithAuthor | null> {
  const projectId = await getTaskProjectId(taskId);
  if (!projectId) return null;

  const role = await getMemberRole(projectId, authorId);
  if (!role) return null;

  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, author_id: authorId, content })
    .select('id, task_id, author_id, content, created_at, profiles!inner(display_name)')
    .single();

  if (error || !data) return null;

  await logActivity(projectId, authorId, 'created', 'comment', data.id);

  return {
    id: data.id as string,
    task_id: data.task_id as string,
    author_id: data.author_id as string,
    content: data.content as string,
    created_at: data.created_at as string,
    display_name: (data.profiles as unknown as { display_name: string }).display_name,
  };
}

export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<boolean> {
  const { data: comment } = await supabase
    .from('comments')
    .select('id, task_id, author_id')
    .eq('id', commentId)
    .single();

  if (!comment) return false;

  if (comment.author_id === userId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    return !error;
  }

  const projectId = await getTaskProjectId(comment.task_id);
  if (!projectId) return false;

  const role = await getMemberRole(projectId, userId);
  if (role === 'owner') {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    return !error;
  }

  return false;
}
