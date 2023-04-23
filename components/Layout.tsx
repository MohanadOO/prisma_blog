import React from 'react'
import { Inter } from 'next/font/google'
import Nav from './Nav'

const inter = Inter({ subsets: ['latin'] })

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`flex min-h-screen flex-col items-start p-3 max-w-6xl w-full mx-auto ${inter.className}`}
    >
      <Nav />
      {children}
    </div>
  )
}
