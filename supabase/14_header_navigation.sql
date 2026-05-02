alter table public.store_settings
add column if not exists header_navigation jsonb not null default '[
  {"id": "home", "enabled": true},
  {"id": "categories", "enabled": true},
  {"id": "promocoes", "enabled": false},
  {"id": "novidades", "enabled": false},
  {"id": "mais_vendidos", "enabled": false}
]'::jsonb;
