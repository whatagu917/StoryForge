import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/layout'
import { AuthProvider } from '../contexts/AuthContext'
import AuthGuard from '../components/AuthGuard'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    if (router.pathname === '/') {
      router.replace('/editor')
    }
  }, [router])

  return (
    <AuthProvider>
      <AuthGuard>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthGuard>
    </AuthProvider>
  )
}

export default function App(props: AppProps) {
  return <AppContent {...props} />
} 