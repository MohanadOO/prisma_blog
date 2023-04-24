import { GetServerSidePropsContext } from 'next'
import { signIn, useSession } from 'next-auth/react'
import prisma from '../prisma/client'
import Router from 'next/router'
import { Post } from '@prisma/client'
import { authOptions } from './api/auth/[...nextauth]'
import { getServerSession } from 'next-auth'

export async function getServerSideProps({
  req,
  res,
}: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return { props: { drafts: [] } }
  }

  const drafts = await prisma.post.findMany({
    where: { author: { email: session.user?.email } },
  })

  return {
    props: {
      drafts,
    },
  }
}

export default function Draft({ drafts }: { drafts: Post[] }) {
  const { data: session } = useSession()

  if (!session) {
    return (
      <button className='btn text-lg mx-auto' onClick={() => signIn('google')}>
        Sign In to see Drafts
      </button>
    )
  }

  async function handlePost(
    e: React.SyntheticEvent,
    id: number,
    published: boolean,
    del = false
  ) {
    e.preventDefault()
    try {
      await fetch(`/api/post${del ? `?id=${id}` : ''}`, {
        method: del ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: del ? '' : JSON.stringify({ id, published }),
      })
      await Router.push('/draft')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className='p-5 w-full'>
      {drafts.map((draft: Post) => (
        <div
          key={draft.title}
          className='flex justify-between items-center border-b-2 pb-10 px-5'
        >
          <div>
            <h2 className='text-2xl font-bold text-teal-600 my-4'>
              {draft.title}
            </h2>
            <p>{draft.content}</p>
            {!draft.published ? (
              <button
                onClick={(e: React.SyntheticEvent) =>
                  handlePost(e, draft.id, draft.published)
                }
                className='btn mt-4'
              >
                Publish
              </button>
            ) : (
              <button
                onClick={(e: React.SyntheticEvent) =>
                  handlePost(e, draft.id, draft.published)
                }
                className='btn btn-red mt-4'
              >
                Unpublish
              </button>
            )}
          </div>
          <button
            onClick={(e: React.SyntheticEvent) =>
              handlePost(e, draft.id, draft.published, true)
            }
            className='btn btn-red'
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
