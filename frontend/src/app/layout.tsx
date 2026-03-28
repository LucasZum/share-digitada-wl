import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/pos/ThemeProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Share POS',
  description: 'Sistema de pagamentos Share Pagamentos',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: { background: '#16A34A', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#16A34A' },
              },
              error: {
                style: { background: '#DC2626', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#DC2626' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
