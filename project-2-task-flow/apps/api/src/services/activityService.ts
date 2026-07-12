import { supabase } from '../lib/supabase';

export async function logActivity(
  projectId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown> | null,
): Promise<boolean> {
  const { error } = await supabase.from('activity_events').insert({
    project_id: projectId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? null,
  });

  return !error;
}
