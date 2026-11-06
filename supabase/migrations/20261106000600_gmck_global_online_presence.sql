-- Allow signed-in GMCK members to publish and read global online presence.
-- Presence payloads contain only the authenticated user's own ID and connection timestamp.

drop policy if exists "Authenticated users can read GMCK online presence" on realtime.messages;
drop policy if exists "Authenticated users can publish GMCK online presence" on realtime.messages;

create policy "Authenticated users can read GMCK online presence"
on realtime.messages
for select
to authenticated
using (
  extension = 'presence'
  and realtime.topic() = 'gmck:presence'
);

create policy "Authenticated users can publish GMCK online presence"
on realtime.messages
for insert
to authenticated
with check (
  extension = 'presence'
  and realtime.topic() = 'gmck:presence'
);
