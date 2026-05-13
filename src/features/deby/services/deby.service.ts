import { supabase } from '@/lib/supabase/client'
import type { AiAnalysis } from '../types/deby.types'

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
    if (!data?.analysis) throw new Error('Resposta da Deby sem analise.')
    return data.analysis as AiAnalysis
  },
}
