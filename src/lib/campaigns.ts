/**
 * Named fundraising appeals — each one a real, costed request from a
 * real care home, so a giver can see exactly what their money buys.
 * Client-safe: no secrets, imported by pages and API routes alike.
 *
 * `id` doubles as pledges.project_id, which is how a payment stays
 * traceable to its appeal all the way through Stripe and the database.
 */
export type CampaignItem = {
  label: string;
  amount: number;
  detail: string;
};

export type Campaign = {
  id: string;
  /** The appeal's short name, used in headlines. */
  title: string;
  home: string;
  address: string;
  goal: number;
  /** Why this appeal exists, in one warm paragraph. */
  story: string;
  items: CampaignItem[];
};

export const CAMPAIGNS: Record<string, Campaign> = {
  'meadow-banks': {
    id: 'meadow-banks',
    title: 'Make Meadow Banks feel like home',
    home: 'Meadow Banks Care Home',
    address: 'Hall Lane, Upminster RM14 1TT',
    goal: 800,
    story:
      'Meadowbanks asked us to raise £800 for two things they need. Every penny of this appeal goes to those two things — nothing else.',
    items: [
      {
        label: 'Vintage furniture & décor',
        amount: 500,
        detail:
          'Traditional or vintage-style furniture and décor to create a homely setting.',
      },
      {
        label: 'Reminiscence & sensory resources',
        amount: 300,
        detail:
          'Memory boxes, vintage household items, photographs, books, music and activity resources.',
      },
    ],
  },
};

export function getCampaign(id: string): Campaign | null {
  return CAMPAIGNS[id] ?? null;
}
