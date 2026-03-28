'use client'
import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { getWhiteLabel } from '@/lib/api/whiteLabel'

export function useWhiteLabel() {
  const { config, isLoaded, applyTheme } = useThemeStore()

  useEffect(() => {
    if (!isLoaded) {
      getWhiteLabel()
        .then(applyTheme)
        .catch(() => {
          // Use defaults silently
          applyTheme({
            primary_color: '#1E3A5F',
            secondary_color: '#FFFFFF',
            brand_name: 'Share',
            logo_url: null,
            updated_at: '',
          })
        })
    } else if (config) {
      applyTheme(config)
    }
  }, [isLoaded, config, applyTheme])

  return { config, isLoaded }
}
