/**
 * Assignment types — personal and shared.
 * Shared assignments are visible to both partners in couple mode.
 */

/** Base assignment as returned by GET /api/assignments */
export interface AssignmentResponse {
  id: string;
  sessionId: string;
  userId: string;
  title: string;
  description: string | null;
  type: string | null;
  response: string | null;
  isShared: boolean;
  coupleId: string | null;
  partnerCompletedAt: string | null;
  partnerResponse: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shared assignment with partner info (enriched on the client) */
export interface SharedAssignmentView extends AssignmentResponse {
  isShared: true;
  coupleId: string;
  partnerName: string | null;
}
