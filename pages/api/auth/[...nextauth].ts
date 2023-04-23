import NextAuth, { Session } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import { PrismaClient } from '@prisma/client'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { AdapterUser } from 'next-auth/adapters'

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
  callbacks: {
    async session({ session, user }: { session: Session; user: AdapterUser }) {
      session.user.id = user.id
      return session
    },
  },
}

export default NextAuth(authOptions)
