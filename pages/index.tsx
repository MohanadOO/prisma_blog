import { profanity } from '@/lib/profanity'
import { CensorType } from '@2toad/profanity/dist/models'
import { Post } from '@prisma/client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import useSWR, { Fetcher } from 'swr'

const fetcher: Fetcher<any, string> = (...args) =>
  fetch(...args).then((res) => res.json())

export default function Home() {
  const { data: session } = useSession()
  const { data: posts, isLoading, error } = useSWR('/api/post', fetcher)

  if (error)
    return (
      <div className='w-full p-5'>
        <h1>No Posts 🥲</h1>
      </div>
    )
  if (isLoading) return <div className='w-full p-5'>Loading...</div>

  return (
    <div className='w-full p-5'>
      {posts.map((post: Post) => (
        <div key={post.id} className='py-5 border-b border-teal-400 px-5'>
          <h1 className='font-bold text-2xl'>
            {profanity.censor(post.title, CensorType.FirstVowel)}
          </h1>
          <p className='text-lg mt-4'>
            {profanity.censor(post.content || '', CensorType.FirstVowel)}
          </p>
          {session?.user && post.authorId === session.user?.id && (
            <Link href='/draft' className='btn inline-block mt-4'>
              Edit
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
