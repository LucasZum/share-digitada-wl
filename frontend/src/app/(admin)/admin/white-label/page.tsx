'use client'
import { useEffect, useRef, useState } from 'react'
import { Upload, Palette, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

import { getWhiteLabel, updateWhiteLabel } from '@/lib/api/whiteLabel'
import { useThemeStore } from '@/store/themeStore'
import type { WhiteLabelConfig } from '@/types/whiteLabel'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export default function WhiteLabelPage() {
  const { applyTheme } = useThemeStore()
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#1E3A5F')
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF')
  const [brandName, setBrandName] = useState('Share')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getWhiteLabel().then((c) => {
      setConfig(c)
      setPrimaryColor(c.primary_color)
      setSecondaryColor(c.secondary_color)
      setBrandName(c.brand_name)
    }).finally(() => setIsLoading(false))
  }, [])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData()
    formData.append('primary_color', primaryColor)
    formData.append('secondary_color', secondaryColor)
    formData.append('brand_name', brandName)
    if (logoFile) formData.append('logo', logoFile)

    try {
      const updated = await updateWhiteLabel(formData)
      setConfig(updated)
      applyTheme(updated)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">White Label</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Identidade Visual</h3>

            {/* Logo Upload */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">Logo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-[var(--color-primary)] cursor-pointer transition-colors bg-gray-50"
              >
                {logoPreview || config?.logo_url ? (
                  <Image
                    src={logoPreview || config!.logo_url!}
                    alt="Logo"
                    width={160}
                    height={48}
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">Clique para enviar</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <p className="text-xs text-gray-400 mt-1">PNG ou SVG recomendado. Mín. 200×50px</p>
            </div>

            <Input label="Nome da marca" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">
              <Palette className="w-4 h-4 inline mr-2 text-[var(--color-primary)]" />
              Cores
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Cor Primária</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => { setPrimaryColor(e.target.value); document.documentElement.style.setProperty('--color-primary', e.target.value) }}
                    className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono flex-1"
                    placeholder="#1E3A5F"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Cor Secundária</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer p-1"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="font-mono flex-1"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Button type="submit" fullWidth isLoading={isSaving} size="lg">
            Salvar Configurações
          </Button>
        </form>

        {/* Preview */}
        <div>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-700 text-sm">Preview — Tela de Login</h3>
            </div>

            <div
              className="rounded-xl overflow-hidden border border-gray-100"
              style={{ background: '#0D1117', padding: '20px' }}
            >
              <div className="text-center mb-4">
                <span className="font-bold text-2xl text-white tracking-tight"
                  style={{ color: primaryColor }}>{brandName}</span>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Sistema de Pagamentos</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Entrar</h4>
                <div className="h-10 rounded-lg border border-gray-200 mb-2 bg-gray-50" />
                <div className="h-10 rounded-lg border border-gray-200 mb-3 bg-gray-50" />
                <div
                  className="h-11 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white text-sm font-semibold">Entrar</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
