// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from './../../../prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const data = await prisma.post.findMany({
        where: {
          published: true,
        },
      })
      return res.status(200).json(data)
    } catch (err) {
      return res.status(500).json(err)
    }
  }

  if (req.method === 'POST') {
    const { title, content } = req.body
    const session = await getServerSession(req, res, authOptions)
    if (session) {
      try {
        const result = await prisma.post.create({
          data: {
            title,
            content,
            author: { connect: { email: session?.user?.email || '' } },
          },
        })
        res.json(result)
      } catch (err) {
        return res.status(500).json(err)
      }
    } else {
      res.status(401).send({ message: 'Unauthorized' })
    }
  }

  if (req.method === 'PATCH') {
    const { id, published } = req.body
    if (!id || published === '') {
      return res.status(401).send({ message: 'Unauthorized' })
    }

    const session = await getServerSession(req, res, authOptions)
    if (session) {
      try {
        const result = await prisma.post.update({
          where: { id },
          data: { published: !published },
        })
        res.json(result)
      } catch (err) {
        return res.status(500).json(err)
      }
    }
  }

  if (req.method === 'DELETE') {
    const id = req.query.id
    if (!id) res.status(401).send({ message: 'ID not found' })
    const session = await getServerSession(req, res, authOptions)
    if (session) {
      try {
        await prisma.post.delete({
          where: { id: Number(id) },
        })
        res.status(200).send('Delete Post Successfully')
      } catch (err) {
        return res.status(500).json(err)
      }
    }
    res.status(401).send({ message: 'Unauthorized' })
  }
}
