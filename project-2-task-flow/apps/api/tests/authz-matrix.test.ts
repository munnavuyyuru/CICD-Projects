import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addMember, updateMemberRole, removeMember } from '../src/services/memberService';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: mockFrom,
  },
}));

const PROJECT_ID = 'test-project-id';
const OWNER_ID = 'owner-id';
const MEMBER_ID = 'member-id';
const OUTSIDER_ID = 'outsider-id';

function mockGetUserRole(userId: string): 'owner' | 'member' | null {
  if (userId === OWNER_ID) return 'owner';
  if (userId === MEMBER_ID) return 'member';
  return null;
}

function mockGetRoleQuery(userId: string) {
  const role = mockGetUserRole(userId);
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: role ? { role } : null,
            error: null,
          }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Authorization matrix — member management', () => {
  describe.each([
    { actor: OWNER_ID, label: 'owner' },
    { actor: MEMBER_ID, label: 'member' },
    { actor: OUTSIDER_ID, label: 'outsider' },
  ])('actor=$label', ({ actor }) => {
    it('addMember', async () => {
      const isOwner = actor === OWNER_ID;

      mockFrom
        .mockReturnValueOnce(mockGetRoleQuery(actor))
        .mockReturnValueOnce(mockGetRoleQuery('new-user-id'));

      if (isOwner) {
        mockFrom.mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        });
        mockFrom.mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        });
      }

      const result = await addMember(PROJECT_ID, 'new-user-id', 'member', actor);
      expect(result.success).toBe(isOwner);
    });

    it('updateMemberRole', async () => {
      const isOwner = actor === OWNER_ID;

      mockFrom
        .mockReturnValueOnce(mockGetRoleQuery(actor))
        .mockReturnValueOnce(mockGetRoleQuery(MEMBER_ID));

      if (isOwner) {
        mockFrom.mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        });
      }

      const result = await updateMemberRole(PROJECT_ID, MEMBER_ID, 'owner', actor);
      expect(result.success).toBe(isOwner);
    });

    it('removeMember', async () => {
      const isOwner = actor === OWNER_ID;

      mockFrom
        .mockReturnValueOnce(mockGetRoleQuery(actor))
        .mockReturnValueOnce(mockGetRoleQuery(MEMBER_ID));

      if (isOwner) {
        mockFrom.mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        });
      }

      const result = await removeMember(PROJECT_ID, MEMBER_ID, actor);
      expect(result.success).toBe(isOwner);
    });
  });
});
