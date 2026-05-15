import { supabase } from '@/lib/supabase/client'
import type { AiAnalysis } from '../types/deby.types'

async function getAuthHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sessão expirada. Entre novamente.')
  return `Bearer ${token}`
}

export const debyService = {
  async getHistory(workspaceId: string): Promise<AiAnalysis[]> {
    const { data, error } = await supabase
      .from('ai_analyses')
      .select('id, workspace_id, script_id, model, result, created_at, scripts(id,title)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as unknown as AiAnalysis[]).map((analysis) => ({
      ...analysis,
      scripts: Array.isArray(analysis.scripts) ? analysis.scripts[0] ?? null : analysis.scripts ?? null,
    }))
  },

  async analyzeScript(scriptId: string): Promise<AiAnalysis> {
    const { data, error } = await supabase.functions.invoke('analyze-script', {
      body: { script_id: scriptId },
    })

    if (error) throw error
    if (!data?.analysis) throw new Error('Resposta da Deby sem análise.')
    return data.analysis as AiAnalysis
  },

  async suggestHook(topic: string, context?: string): Promise<string[]> {
    const authorization = await getAuthHeader()
    const { data, error } = await supabase.functions.invoke('deby-suggest-hook', {
      headers: { authorization },
      body: { topic, context: context || '' },
    })
    if (error) throw error
    if (!Array.isArray(data?.hooks)) throw new Error('Resposta inesperada da Deby.')
    return data.hooks as string[]
  },

  async optimizeCta(ctaText: string, goal: string): Promise<{ optimized_cta: string; explanation: string }> {
    const authorization = await getAuthHeader()
    const { data, error } = await supabase.functions.invoke('deby-optimize-cta', {
      headers: { authorization },
      body: { cta_text: ctaText, goal },
    })
    if (error) throw error
    if (!data?.optimized_cta) throw new Error('Resposta inesperada da Deby.')
    return data as { optimized_cta: string; explanation: string }
  },

  async generateIdeas(
    pillarId: string,
    pillarName: string,
    count = 5,
  ): Promise<Array<{ title: string; hook_suggestion: string; pillar: string }>> {
    const authorization = await getAuthHeader()
    const { data, error } = await supabase.functions.invoke('deby-generate-ideas', {
      headers: { authorization },
      body: { pillar_id: pillarId, pillar_name: pillarName, count },
    })
    if (error) throw error
    if (!Array.isArray(data?.ideas)) throw new Error('Resposta inesperada da Deby.')
    return data.ideas as Array<{ title: string; hook_suggestion: string; pillar: string }>
  },

  async getReportInsights(workspaceId: string) {
    const { data, error } = await supabase
      .from('report_insights')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Array<{ id: string; insight_text: string; recommendation_text: string; created_at: string }>
  },

  async generateReportInsights(workspaceId: string) {
    const authorization = await getAuthHeader()
    const { data, error } = await supabase.functions.invoke('deby-report-insights', {
      headers: { authorization },
      body: { workspace_id: workspaceId },
    })
    if (error) throw error
    if (!Array.isArray(data?.insights)) throw new Error('Resposta inesperada da Deby.')
    return data.insights as Array<{ id: string; insight_text: string; recommendation_text: string; created_at: string }>
  },
}
