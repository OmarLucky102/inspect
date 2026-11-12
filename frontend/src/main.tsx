import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import App from './App.tsx'
import { AuthProvider } from './features/auth/auth-context.tsx'
import { GlobalErrorBoundary } from './components/errors/GlobalErrorBoundary.tsx'
import { queryClient } from './lib/query-client.ts'
import { getCdnAsset } from './lib/assets'
import './lib/i18n'
import './index.css'

// Ensure tab favicon dynamically resolves from Cloudflare R2
const faviconUrl = getCdnAsset('favicon.webp')
const linkEl = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
if (linkEl) {
  linkEl.href = faviconUrl
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <BrowserRouter>
          <GlobalErrorBoundary>
            <AuthProvider>
              <App />
              <Toaster position="top-center" toastOptions={{ duration: 3200 }} />
            </AuthProvider>
          </GlobalErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
