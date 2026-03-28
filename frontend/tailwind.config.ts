import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        machine: '#0D1117',
        header: '#111827',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        // Light terminal theme
        surface: '#F4F5F7',
        terminalBorder: '#E2E5EA',
        terminalText: '#1A1D23',
        terminalMuted: '#6B7280',
        terminalLabel: '#9CA3AF',
        nfcBlue: '#0A84FF',
        nfcRing: '#60B4FF',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"Fira Code"',
          '"Fira Mono"',
          '"Roboto Mono"',
          'monospace',
        ],
      },
      animation: {
        'pulse-dot': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'check-draw': 'checkDraw 0.5s ease-out forwards',
        'nfc-pulse': 'nfcPulse 1.8s ease-in-out infinite',
        'nfc-ring-1': 'nfcRing1 2s ease-out infinite',
        'nfc-ring-2': 'nfcRing2 2s ease-out 0.6s infinite',
        'terminal-blink': 'terminalBlink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        checkDraw: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        nfcPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.12)', opacity: '0.7' },
        },
        nfcRing1: {
          '0%': { transform: 'scale(0.85)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        nfcRing2: {
          '0%': { transform: 'scale(0.85)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        terminalBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
