import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/layout'
import { AuthProvider } from '../contexts/AuthContext'
import AuthGuard from '../components/AuthGuard'

function AppContent({ Component, pageProps }: AppProps) {
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