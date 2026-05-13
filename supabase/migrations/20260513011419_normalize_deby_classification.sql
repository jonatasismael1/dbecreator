-- =============================================
-- DBE Creator - Migration v8: Normalize Deby classification labels
-- =============================================

update public.ai_analyses
set result = jsonb_set(
  result,
  '{classification}',
  to_jsonb(
    case
      when (result->>'score')::numeric < 4 then 'Fraco'
      when (result->>'score')::numeric < 6 then 'Razoavel'
      when (result->>'score')::numeric < 7.5 then 'Bom'
      when (result->>'score')::numeric < 9 then 'Forte'
      else 'Excelente'
    end
  )
)
where result ? 'score';
