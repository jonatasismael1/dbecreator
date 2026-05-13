# Schema do Banco de Dados — DBE Creator

## Tabelas Principais

### `profiles`
- `id`: uuid (PK, references auth.users)
- `full_name`: text
- `avatar_url`: text
- `updated_at`: timestamp

### `workspaces`
- `id`: uuid (PK)
- `name`: text
- `slug`: text (unique)
- `settings`: jsonb
- `created_by`: uuid (FK, nullable)
- `created_at`: timestamp

### `workspace_members`
- `workspace_id`: uuid (FK)
- `user_id`: uuid (FK)
- `role`: text (owner, admin, member, viewer)
- `joined_at`: timestamp

### `market_maps`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `niche`: text
- `competitors`: jsonb
- `differentiators`: text
- `target_audience`: text
- `main_pain`: text
- `tone_of_voice`: text
- `is_complete`: boolean
- `deby_insights`: jsonb (insights estrategicos do mapa)
- `last_insights_at`: timestamp
- `created_at`: timestamp
- `updated_at`: timestamp

### `content_pillars`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `title`: text
- `description`: text
- `type`: text (authority, sales, connection, etc.)

### `ideas`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `title`: text
- `description`: text
- `status`: text (backlog, doing, done)
- `tags`: text[]

### `materials`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `title`: text
- `type`: text (link, file, audio)
- `url`: text
- `content`: text

### `scripts`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `idea_id`: uuid (FK, nullable)
- `content_pillar_id`: uuid (FK, nullable)
- `title`: text
- `hook`: text
- `body`: text
- `cta`: text
- `status`: text (draft, ready, recorded)
- `last_analysis_score`: numeric (0-10)

### `script_versions`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `script_id`: uuid (FK)
- `version_number`: int
- `title`: text
- `hook`: text
- `body`: text
- `cta`: text
- `status`: text (draft, ready, recorded)
- `content_pillar_id`: uuid (FK, nullable)
- `created_by`: uuid (FK, nullable)
- `created_at`: timestamp

### `ai_analyses`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `script_id`: uuid (FK)
- `model`: text
- `result`: jsonb (schema Deby)
- `created_by`: uuid (FK, nullable)
- `created_at`: timestamp

### `campaigns`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `name`: text
- `objective`: text
- `start_date`: date
- `end_date`: date

### `calendar_items`
- `id`: uuid
- `workspace_id`: uuid (FK)
- `script_id`: uuid (FK, nullable)
- `publish_date`: timestamp
- `platform`: text (reels, tiktok, shorts)
- `notes`: text
- `created_at`: timestamp
- `updated_at`: timestamp

### `approvals`
- `id`: uuid
- `script_id`: uuid (FK)
- `token`: text (para link público)
- `status`: text (pending, approved, requested_changes)

## Segurança (RLS)
- **Regra Geral:** `auth.uid() IN (SELECT user_id FROM workspace_members WHERE workspace_id = table.workspace_id)`.
- Perfis são visíveis apenas para membros do mesmo workspace.
- Links de aprovação possuem bypass de auth via token único.
