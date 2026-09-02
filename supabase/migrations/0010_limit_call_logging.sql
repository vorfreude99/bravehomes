-- Blunt the "fake missed call" harassment vector
--
-- Run after 0009. The `calls` table is written client-side by whoever
-- places a call — there's no trusted server watching the actual WebRTC
-- signalling, so the insert policy from 0008 only ever checked
-- `auth.uid() = caller_id`. That means any signed-in member could call
-- `logCallOutcome` directly (bypassing the real call flow entirely) to
-- plant a "missed video call from you" notification on any other
-- member's bell, repeatedly — a real concern given the userbase skews
-- older and this reads as a phone call they missed.
--
-- This is a mitigation, not a fix: nothing server-side can actually
-- verify a call happened without a trusted signalling relay, which this
-- app doesn't have. What it *can* do cheaply is stop someone from being
-- called by themselves and cap how many "missed call" notifications one
-- person can generate against another in an hour, which turns "spam
-- someone's notifications indefinitely" into "mildly annoying, briefly."

create or replace function public.limit_call_logging()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if new.caller_id = new.callee_id then
    raise exception 'cannot log a call to yourself';
  end if;

  select count(*) into recent_count
  from public.calls
  where caller_id = new.caller_id
    and callee_id = new.callee_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 8 then
    raise exception 'too many call notifications logged for this person recently';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_call_logging on public.calls;
create trigger guard_call_logging
  before insert on public.calls
  for each row
  execute function public.limit_call_logging();
