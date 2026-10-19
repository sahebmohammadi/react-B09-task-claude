export const PROPOSAL_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
