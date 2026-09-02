-- Track the actual refunded amount, not just a paid/refunded flag
--
-- Run after 0011. `charge.refunded` fires for partial refunds too
-- (Stripe's `amount_refunded` can be less than `amount`), but until now
-- the webhook treated ANY refund as fully zeroing the pledge out of
-- every total — a £100 gift with a £10 partial refund was dropping the
-- entire £100, not £10, from the charity's reported "Total raised" and
-- the donor's own total. This column lets every total instead subtract
-- exactly what was actually given back.

alter table public.pledges
  add column if not exists refunded_amount integer not null default 0;
