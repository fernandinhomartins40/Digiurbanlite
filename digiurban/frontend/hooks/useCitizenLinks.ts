/**
 * Hook para gerenciar vínculos de cidadãos em protocolos
 */

import { useState, useCallback } from 'react'
import { useToast } from './use-toast'

export interface CitizenLink {
  id?: string
  linkedCitizenId: string
  linkedCitizen?: {
    id: string
    name: string
    cpf: string
    email?: string
    phone?: string
    birthDate?: string
    rg?: string
  }
  linkType: string
  relationship?: string
  role: string
  contextData?: any
  isVerified?: boolean
  verifiedAt?: string
  verifiedBy?: string
  createdAt?: string
  updatedAt?: string
}

interface UseCitizenLinksOptions {
  protocolId?: string
  autoLoad?: boolean
}

export function useCitizenLinks(options: UseCitizenLinksOptions = {}) {
  const { protocolId, autoLoad = false } = options
  const [links, setLinks] = useState<CitizenLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  /**
   * Carregar vínculos de um protocolo
   */
  const loadLinks = useCallback(async (pId?: string) => {
    const id = pId || protocolId
    if (!id) {
      setError('protocolId é necessário')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/protocols/${id}/citizen-links`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar vínculos')
      }

      setLinks(data.data.links || [])
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'Erro ao carregar vínculos'
      })
    } finally {
      setLoading(false)
    }
  }, [protocolId, toast])

  /**
   * Adicionar novo vínculo
   */
  const addLink = useCallback(async (link: Omit<CitizenLink, 'id'>, pId?: string) => {
    const id = pId || protocolId
    if (!id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'protocolId é necessário'
      })
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/protocols/${id}/citizen-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(link)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao adicionar vínculo')
      }

      const newLink = data.data.link
      setLinks(prev => [...prev, newLink])

      toast({
        title: 'Sucesso',
        description: data.message || 'Vínculo adicionado com sucesso'
      })

      return newLink
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'Erro ao adicionar vínculo'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [protocolId, toast])

  /**
   * Atualizar vínculo existente
   */
  const updateLink = useCallback(async (
    linkId: string,
    updates: Partial<Omit<CitizenLink, 'id' | 'linkedCitizenId'>>,
    pId?: string
  ) => {
    const id = pId || protocolId
    if (!id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'protocolId é necessário'
      })
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/protocols/${id}/citizen-links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar vínculo')
      }

      const updatedLink = data.data.link
      setLinks(prev => prev.map(l => l.id === linkId ? updatedLink : l))

      toast({
        title: 'Sucesso',
        description: 'Vínculo atualizado com sucesso'
      })

      return updatedLink
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'Erro ao atualizar vínculo'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [protocolId, toast])

  /**
   * Verificar vínculo manualmente
   */
  const verifyLink = useCallback(async (linkId: string, pId?: string) => {
    const id = pId || protocolId
    if (!id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'protocolId é necessário'
      })
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/admin/protocols/${id}/citizen-links/${linkId}/verify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao verificar vínculo')
      }

      const verifiedLink = data.data.link
      setLinks(prev => prev.map(l => l.id === linkId ? verifiedLink : l))

      toast({
        title: 'Sucesso',
        description: 'Vínculo verificado com sucesso'
      })

      return verifiedLink
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'Erro ao verificar vínculo'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [protocolId, toast])

  /**
   * Remover vínculo
   */
  const removeLink = useCallback(async (linkId: string, pId?: string) => {
    const id = pId || protocolId
    if (!id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'protocolId é necessário'
      })
      return false
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/protocols/${id}/citizen-links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover vínculo')
      }

      setLinks(prev => prev.filter(l => l.id !== linkId))

      toast({
        title: 'Sucesso',
        description: 'Vínculo removido com sucesso'
      })

      return true
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'Erro ao remover vínculo'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [protocolId, toast])

  /**
   * Adicionar múltiplos vínculos de uma vez
   */
  const addMultipleLinks = useCallback(async (
    linksData: Array<Omit<CitizenLink, 'id'>>,
    pId?: string
  ) => {
    const results = await Promise.all(
      linksData.map(link => addLink(link, pId))
    )
    return results.filter(Boolean) as CitizenLink[]
  }, [addLink])

  /**
   * Obter vínculos por tipo
   */
  const getLinksByType = useCallback((linkType: string) => {
    return links.filter(link => link.linkType === linkType)
  }, [links])

  /**
   * Obter vínculos verificados
   */
  const getVerifiedLinks = useCallback(() => {
    return links.filter(link => link.isVerified)
  }, [links])

  /**
   * Obter vínculos não verificados
   */
  const getUnverifiedLinks = useCallback(() => {
    return links.filter(link => !link.isVerified)
  }, [links])

  return {
    links,
    loading,
    error,
    loadLinks,
    addLink,
    updateLink,
    verifyLink,
    removeLink,
    addMultipleLinks,
    getLinksByType,
    getVerifiedLinks,
    getUnverifiedLinks
  }
}
