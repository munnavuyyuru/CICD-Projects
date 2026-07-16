-- ============================================================
-- TaskFlow Seed Data -- Your actual Supabase profiles
-- ============================================================

DO $$
DECLARE
  alice uuid := '949e8d26-13b6-4d20-9f2d-5ddbed11c37c';
  bob    uuid := '954c0ceb-c22f-43a8-aa79-7c2a69850aa0';
  carol  uuid := '838c6632-d573-44d1-8673-4472367ba6ef';
  deva   uuid := '389a51e1-1606-4946-9a19-19b651cf18dd';
  demo   uuid := 'e599a688-b3e9-41d9-8482-8376a0736e4c';

  p1 uuid := '11111111-1111-1111-1111-111111111111';
  p2 uuid := '22222222-2222-2222-2222-222222222222';
  t1 uuid := '33333333-3333-3333-3333-333333333333';
  t2 uuid := '44444444-4444-4444-4444-444444444444';
  t3 uuid := '55555555-5555-5555-5555-555555555555';
  c1 uuid := '66666666-6666-6666-6666-666666666666';
BEGIN

  INSERT INTO public.projects (id, owner_id, name, description, created_at)
  VALUES
    (p1, alice, 'Website Redesign', 'Complete overhaul of marketing site', now() - interval '28 days'),
    (p2, bob, 'Mobile App v2', 'React Native rewrite', now() - interval '20 days')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO public.project_members (project_id, user_id, role, invited_by, created_at)
  VALUES
    (p1, alice, 'owner', alice, now() - interval '28 days'),
    (p1, bob, 'member', alice, now() - interval '27 days'),
    (p1, carol, 'member', alice, now() - interval '26 days'),
    (p2, bob, 'owner', bob, now() - interval '20 days'),
    (p2, carol, 'member', bob, now() - interval '19 days'),
    (p2, demo, 'member', bob, now() - interval '18 days')
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO public.tasks (id, project_id, title, description, status, priority, assignee_id, due_date, position, created_at)
  VALUES
    (t1, p1, 'Design new homepage hero', 'Hero section with animated background', 'done', 1, alice, (now() + interval '5 days')::date, 1.0, now() - interval '27 days'),
    (t2, p1, 'Implement responsive navbar', 'Mobile-first navigation', 'in_progress', 2, bob, (now() + interval '3 days')::date, 2.0, now() - interval '26 days'),
    (t3, p1, 'Set up CI/CD pipeline', 'GitHub Actions for build + deploy', 'todo', 3, carol, (now() + interval '7 days')::date, 3.0, now() - interval '25 days'),
    (gen_random_uuid(), p1, 'Write component documentation', 'Storybook stories', 'todo', 3, null, (now() + interval '10 days')::date, 4.0, now() - interval '24 days'),
    (gen_random_uuid(), p2, 'Configure push notifications', 'FCM + APNs setup', 'in_progress', 1, carol, (now() + interval '2 days')::date, 1.0, now() - interval '19 days'),
    (gen_random_uuid(), p2, 'Build onboarding flow', '3-step tutorial', 'todo', 2, demo, (now() + interval '5 days')::date, 2.0, now() - interval '18 days'),
    (gen_random_uuid(), p2, 'Optimize bundle size', 'Code splitting + tree shaking', 'todo', 2, deva, (now() + interval '8 days')::date, 3.0, now() - interval '17 days'),
    (gen_random_uuid(), p2, 'Add dark mode support', 'CSS variables + theme switcher', 'done', 3, bob, (now() - interval '2 days')::date, 4.0, now() - interval '16 days')
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status;

  INSERT INTO public.comments (id, task_id, author_id, content, created_at)
  VALUES
    (c1, t1, bob, 'Hero looks great! The animation is smooth on mobile too.', now() - interval '26 days'),
    (gen_random_uuid(), t2, alice, 'Navbar blocks scrolling on iOS Safari.', now() - interval '25 days'),
    (gen_random_uuid(), t3, carol, 'Pipeline passes locally. Pushing config today.', now() - interval '24 days'),
    (gen_random_uuid(), (SELECT id FROM public.tasks WHERE project_id = p1 AND title = 'Write component documentation' LIMIT 1), alice, 'Assigning to you for review.', now() - interval '23 days')
  ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

  INSERT INTO public.activity_events (id, project_id, actor_id, action, entity_type, entity_id, metadata, created_at)
  VALUES
    (gen_random_uuid(), p1, alice, 'created', 'project', p1, '{"name": "Website Redesign"}'::jsonb, now() - interval '28 days'),
    (gen_random_uuid(), p1, alice, 'created', 'task', t1, '{"title": "Design new homepage hero"}'::jsonb, now() - interval '27 days'),
    (gen_random_uuid(), p1, bob, 'created', 'task', t2, '{"title": "Implement responsive navbar"}'::jsonb, now() - interval '26 days'),
    (gen_random_uuid(), p1, alice, 'updated', 'task', t1, '{"status": "done"}'::jsonb, now() - interval '25 days'),
    (gen_random_uuid(), p1, bob, 'created', 'comment', c1, '{"task_id": "33333333-3333-3333-3333-333333333333"}'::jsonb, now() - interval '26 days'),
    (gen_random_uuid(), p2, bob, 'created', 'project', p2, '{"name": "Mobile App v2"}'::jsonb, now() - interval '20 days')
  ON CONFLICT (id) DO UPDATE SET metadata = EXCLUDED.metadata;

END $$;

-- Capitalize display names for consistency
UPDATE public.profiles SET display_name = 'Alice' WHERE id = '949e8d26-13b6-4d20-9f2d-5ddbed11c37c' AND display_name = 'alice';
UPDATE public.profiles SET display_name = 'Bob' WHERE id = '954c0ceb-c22f-43a8-aa79-7c2a69850aa0' AND display_name = 'bob';
UPDATE public.profiles SET display_name = 'Carol' WHERE id = '838c6632-d573-44d1-8673-4472367ba6ef' AND display_name = 'Carol';
UPDATE public.profiles SET display_name = 'Deva' WHERE id = '389a51e1-1606-4946-9a19-19b651cf18dd' AND display_name = 'deva';
UPDATE public.profiles SET display_name = 'Demo User' WHERE id = 'e599a688-b3e9-41d9-8482-8376a0736e4c' AND display_name = 'demo';
