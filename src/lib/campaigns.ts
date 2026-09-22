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
      'The team at Meadow Banks asked us for help with something simple and lovely: making their home feel less like a facility and more like a family front room. They know exactly what they need, they told us what it costs, and every penny of this appeal goes to those two things — nothing else.',
    items: [
      {
        label: 'A homely sitting room',
        amount: 500,
        detail:
          'Traditional and vintage-style furniture and décor, so the shared spaces feel like the front rooms residents remember — somewhere you sit because you want to, not because a chair was put there.',
      },
      {
        label: 'Memories to hold',
        amount: 300,
        detail:
          'Reminiscence and sensory resources: memory boxes, vintage household items, photographs, books, music and activity resources that help residents reconnect with the lives they’ve lived.',
      },
    ],
  },
};

export function getCampaign(id: string): Campaign | null {
  return CAMPAIGNS[id] ?? null;
}
