-- Adiciona controle de visibilidade das secoes da pagina inicial.
-- Cada secao listada em hidden_home_sections NAO sera renderizada na home da loja,
-- independentemente da ordem configurada em homepage_layout.

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hidden_home_sections jsonb NOT NULL DEFAULT '[]'::jsonb;
