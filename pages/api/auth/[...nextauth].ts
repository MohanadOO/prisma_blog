import NextAuth, { NextAuthOptions, Session, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import { PrismaClient, User } from '@prisma/client'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { AdapterUser } from 'next-auth/adapters'
import {
  NextApiRequest,
  NextApiResponse,
} from 'next'

import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { getCookie, setCookie } from 'cookies-next'
import {
  JWT,
  JWTDecodeParams,
  JWTEncodeParams,
  decode,
  encode,
} from 'next-auth/jwt'

type Credentials = {
  username: string
  email: string
  password: string
  confirm: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return await NextAuth(req, res, authOptions(req, res))
}

export const authOptions = (
  req: NextApiRequest,
  res: NextApiResponse
): NextAuthOptions => {
  const prisma = new PrismaClient()

  function generateHash(password: string): string {
    const saltRounds = 10
    return bcrypt.hashSync(password, saltRounds)
  }

  function compareHash(plainPassword: string, hash: string): boolean {
    return bcrypt.compareSync(plainPassword, hash)
  }

  function resMessage(status: number, message: string) {
    return res.status(status).json({
      statusText: message,
    })
  }

  function nextAuthInclude(include: string) {
    return req.query.nextauth?.includes(include)
  }

  async function signUser(user: User, credentials: Credentials) {
    // If user has signed in before using Google account it will create a new user in the database but without a username and password.
    if (!user.username && !user.password) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username: credentials.username,
          password: generateHash(credentials.password),
        },
      })
      // Create a Credential account for the user
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: user.id,
        },
      })
      if (user && account) return user
      return resMessage(500, 'Unable to link account to created user profile')
    }
    const comparePassword = compareHash(
      credentials.password,
      user.password as string
    )
    if (comparePassword) return user
    return resMessage(500, 'Wrong Password!')
  }

  async function createNewUser(credentials: Credentials) {
    const { username, password, email } = credentials
    const avatar = `https://ui-avatars.com/api/?background=random&name=${username}&length=1`
    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: generateHash(password),
        image: avatar,
      },
    })
    if (!user) return resMessage(500, 'Unable to create new user')

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.id,
      },
    })
    if (user && account) return user
    return resMessage(500, 'Unable to link account to created user')
  }

  return {
    adapter: PrismaAdapter(prisma),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_ID || '',
        clientSecret: process.env.GOOGLE_SECRET || '',
      }),
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          username: {
            label: 'Username',
            type: 'text',
            placeholder: 'John Doe',
          },
          email: {
            label: 'Email',
            type: 'email',
            placeholder: 'john@doe.com',
          },
          password: {
            label: 'Password',
            type: 'password',
            placeholder: '**********',
          },
          confirm: {
            label: 'Confirm',
            type: 'password',
            placeholder: '**********',
          },
        },
        async authorize(credentials, req): Promise<any> {
          try {
            if (req.method !== 'POST') {
              res.setHeader('Allow', ['POST'])
              return resMessage(405, `Method ${req.method} Not Allowed`)
            }

            const { username, email, password, confirm } =
              credentials as Credentials

            if (!username || !email || !password || !confirm) {
              return resMessage(400, 'Invalid user parameters')
            }
            if (password.length < 6) {
              return resMessage(400, 'Password must be at least 6 characters')
            }
            if (password != confirm) {
              return resMessage(400, 'Password mismatch')
            }

            // Search for user credentials in the database
            const user = await prisma.user.findFirst({
              where: {
                email: email,
              },
            })

            // User Exists
            if (user) return signUser(user, credentials as Credentials)

            // User not exist
            return createNewUser(credentials as Credentials)
          } catch (error) {
            console.error(error)
          }
        },
      }),
    ],
    callbacks: {
      async signIn({ user, account, email }: any) {
        if (nextAuthInclude('callback') && nextAuthInclude('credentials')) {
          if (!user) return true

          const sessionToken = randomUUID()
          const sessionMaxAge = 60 * 60 * 24 * 30
          const sessionExpiry = new Date(Date.now() + sessionMaxAge * 1000)

          await prisma.session.create({
            data: {
              sessionToken: sessionToken,
              userId: user.id,
              expires: sessionExpiry,
            },
          })

          setCookie(`next-auth.session-token`, sessionToken, {
            expires: sessionExpiry,
            req: req,
            res: res,
          })

          return true
        }

        // Check first if there is no user in the database. Then we can create new user with this OAuth credentials.
        const profileExists = await prisma.user.findFirst({
          where: {
            email: user.email,
          },
        })
        if (!profileExists) return true

        // Check if there is an existing account in the database. Then we can log in with this account.
        const accountExists = await prisma.account.findFirst({
          where: {
            AND: [{ provider: account.provider }, { userId: profileExists.id }],
          },
        })
        if (accountExists) return true

        // If there is no account in the database, we create a new account with this OAuth credentials.
        await prisma.account.create({
          data: {
            userId: profileExists.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        })

        // Since a user is already exist in the database we can update user information.
        await prisma.user.update({
          where: { id: profileExists.id },
          data: { name: user.name, image: user.image },
        })
        return user
      },
      async jwt({ token, user }: any) {
        if (user) token.user = user
        return token
      },
      async session({
        session,
        user,
      }: {
        session: Session
        token: any
        user: AdapterUser
      }) {
        if (user) {
          session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }
        }
        return session
      },
    },
    jwt: {
      encode: async ({
        token,
        secret,
        maxAge,
      }: JWTEncodeParams): Promise<any> => {
        if (
          nextAuthInclude('callback') &&
          nextAuthInclude('credentials') &&
          req.method === 'POST'
        ) {
          const cookie = getCookie(`next-auth.session-token`, {
            req: req,
          })
          if (cookie) return cookie
          else return ''
        }

        return encode({ token, secret, maxAge })
      },
      decode: async ({ token, secret }: JWTDecodeParams) => {
        if (
          nextAuthInclude('callback') &&
          nextAuthInclude('credentials') &&
          req.method === 'POST'
        ) {
          return null
        }

        return decode({ token, secret })
      },
    },
  }
}

export const getServerAuthSession = (req: any, res: any) => {
  return getServerSession(req, res, authOptions(req, res))
}
