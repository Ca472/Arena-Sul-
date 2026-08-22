-- Add the eighth Structure card to the admin-managed photography catalog.
-- The table remains accessible only through the server-side service role.

set lock_timeout = '10s';

alter table public.site_media
  drop constraint if exists site_media_known_slot,
  add constraint site_media_known_slot check (
    slot in (
      'team-julio-neto',
      'team-gett-lima',
      'team-edson-junior',
      'team-vinicius-alves',
      'team-wallacy',
      'home-about-overview',
      'home-tour-preview',
      'structure-sand-courts',
      'structure-aerial-view',
      'structure-sand-classes',
      'structure-barbecue',
      'structure-bar-kitchen',
      'structure-leisure',
      'structure-events',
      'structure-sand-courts-invitation',
      'modality-beach-tennis',
      'modality-futevolei',
      'modality-beach-volleyball',
      'modality-functional-class',
      'modality-society-football'
    )
  );

reset lock_timeout;
