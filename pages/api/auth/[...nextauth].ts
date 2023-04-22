import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import { PrismaClient } from '@prisma/client'
import { PrismaAdapter } from '@next-auth/prisma-adapter'

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
    }),
    // ...add more providers here
  ],
}

export default NextAuth(authOptions)
