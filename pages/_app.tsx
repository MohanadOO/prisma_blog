import Layout from '@/components/Layout'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import { SessionProvider } from 'next-auth/react'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Layout>
        <Head>
          <title>Prisma Blog</title>
        </Head>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  )
}
