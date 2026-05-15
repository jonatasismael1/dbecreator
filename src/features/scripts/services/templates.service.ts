import { supabase } from '@/lib/supabase/client'
import type { ScriptTemplate } from '../types/script.types'

export const templatesService = {
  async getTemplates(): Promise<ScriptTemplate[]> {
    const { data, error } = await supabase
      .from('script_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      throw error
    }

    return data as ScriptTemplate[]
  }
}
