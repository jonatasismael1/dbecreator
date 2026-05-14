import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/context/auth-context'
import { useWorkspace } from '@/features/workspaces/hooks/use-workspace'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Building, Link as LinkIcon, Camera, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { IntegrationsTab } from '../components/integrations-tab'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado'
}

export function SettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: workspace, isLoading: wsLoading } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'integrations'>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState('')
  const [workspaceLogoDraft, setWorkspaceLogoDraft] = useState('')

  // Profile Form State
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  
  // Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const wsName = workspaceNameDraft || workspace?.name || ''
  const workspaceLogoUrl = workspaceLogoDraft || workspace?.logo_url || ''
  
  // Note: To be fully functional this requires updating the user metadata in Supabase
  // and the workspace table. Since Supabase auth allows updating user metadata easily:
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMsg('')
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })
      if (error) throw error
      setSuccessMsg('Perfil atualizado com sucesso!')
    } catch (err: unknown) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      setSuccessMsg('Foto de perfil atualizada com sucesso!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: unknown) {
      alert('Erro ao fazer upload da imagem: ' + getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setSuccessMsg('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      alert('Erro ao alterar senha: ' + getErrorMessage(err))
    } finally {
      setIsSaving(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspace) return
    setIsSaving(true)
    setSuccessMsg('')
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name: wsName })
        .eq('id', workspace.id)
      
      if (error) throw error
      setWorkspaceNameDraft('')
      setSuccessMsg('Workspace atualizado com sucesso. Recarregue a página para ver a alteração.')
    } catch (err: unknown) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erro ao atualizar workspace')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleUploadWorkspaceLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspace || !e.target.files?.[0]) return

    const file = e.target.files[0]
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Use uma imagem PNG, JPG ou WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A logo deve ter no maximo 2 MB.')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const filePath = `${workspace.id}/logo-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('workspace-logos')
        .upload(filePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('workspace-logos').getPublicUrl(filePath)
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({ logo_url: data.publicUrl })
        .eq('id', workspace.id)
      if (updateError) throw updateError

      setWorkspaceLogoDraft(data.publicUrl)
      queryClient.invalidateQueries({ queryKey: ['workspace', user?.id] })
      setSuccessMsg('Logo do workspace atualizada com sucesso.')
    } catch (err: unknown) {
      alert('Erro ao enviar logo: ' + getErrorMessage(err))
    } finally {
      setUploading(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <PageHeader 
        title="Configurações" 
        description="Gerencie seu perfil e as preferências do seu workspace."
      />

      <div className="flex gap-6 mt-6 flex-col md:flex-row">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile' 
                ? 'bg-dbe-blue text-white' 
                : 'text-dbe-muted hover:text-dbe-text hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <User className="h-4 w-4" />
            Perfil do usuário
          </button>
          
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workspace' 
                ? 'bg-dbe-blue text-white' 
                : 'text-dbe-muted hover:text-dbe-text hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Building className="h-4 w-4" />
            Workspace
          </button>
          
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'integrations' 
                ? 'bg-dbe-blue text-white' 
                : 'text-dbe-muted hover:text-dbe-text hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            Integrações
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {successMsg && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          {activeTab === 'profile' && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                  <User className="h-5 w-5 text-dbe-text" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-dbe-text">Informações do Perfil</h3>
                  <p className="text-sm text-dbe-muted">Atualize seus dados pessoais.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden bg-dbe-dark border border-dbe-border flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-dbe-muted" />
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleUploadAvatar}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-dbe-text">Sua Foto</p>
                    <p className="text-dbe-muted text-xs mb-2">Clique na imagem para alterar</p>
                    {uploading && <p className="text-dbe-blue text-xs animate-pulse">Enviando...</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dbe-text mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-black/5 dark:bg-black/20 border border-dbe-border/50 rounded-lg px-4 py-2 text-dbe-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-dbe-muted mt-1">O e-mail de login não pode ser alterado por aqui.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dbe-text mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar perfil'}
                  </Button>
                </div>
              </form>

              <hr className="my-8 border-dbe-border" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                  <KeyRound className="h-5 w-5 text-dbe-text" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-dbe-text">Segurança</h3>
                  <p className="text-sm text-dbe-muted">Altere sua senha de acesso.</p>
                </div>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-dbe-text mb-1">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dbe-text mb-1">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                    placeholder="Repita a nova senha"
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" variant="secondary" disabled={isSaving || !newPassword || !confirmPassword}>
                    Alterar senha
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'workspace' && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                  <Building className="h-5 w-5 text-dbe-text" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-dbe-text">Configurações do workspace</h3>
                  <p className="text-sm text-dbe-muted">Gerencie as informações do seu espaço de trabalho.</p>
                </div>
              </div>

              {wsLoading ? (
                <div className="text-sm text-dbe-muted">Carregando workspace...</div>
              ) : !workspace ? (
                <div className="text-sm text-dbe-muted">Nenhum workspace encontrado.</div>
              ) : (
                <form onSubmit={handleSaveWorkspace} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-dbe-text mb-2">
                      Logo do workspace
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dbe-border bg-dbe-dark">
                        {workspaceLogoUrl ? (
                          <img src={workspaceLogoUrl} alt="Logo do workspace" className="h-full w-full object-contain" />
                        ) : (
                          <Building className="h-7 w-7 text-dbe-muted" />
                        )}
                      </div>
                      <div>
                        <label className="inline-flex cursor-pointer items-center rounded-lg border border-dbe-border px-3 py-2 text-sm text-dbe-text transition-colors hover:bg-white/5">
                          Alterar logo
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleUploadWorkspaceLogo}
                            disabled={uploading}
                          />
                        </label>
                        <p className="mt-1 text-xs text-dbe-muted">PNG, JPG ou WebP ate 2 MB.</p>
                        {uploading && <p className="mt-1 text-xs text-dbe-blue">Enviando...</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dbe-text mb-1">
                      ID do workspace
                    </label>
                    <input
                      type="text"
                      value={workspace.id}
                      disabled
                      className="w-full bg-black/5 dark:bg-black/20 border border-dbe-border/50 rounded-lg px-4 py-2 text-dbe-muted cursor-not-allowed font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dbe-text mb-1">
                      Nome do workspace
                    </label>
                    <input
                      type="text"
                      value={wsName}
                      onChange={(e) => setWorkspaceNameDraft(e.target.value)}
                      className="w-full bg-dbe-dark border border-dbe-border rounded-lg px-4 py-2 text-dbe-text focus:outline-none focus:border-dbe-blue transition-colors"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar workspace'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {activeTab === 'integrations' && (
            <IntegrationsTab />
          )}
        </div>
      </div>
    </div>
  )
}
