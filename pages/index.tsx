import { Post } from '@prisma/client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export async function getServerSideProps() {
  const res = await fetch('http://localhost:3000/api/post')
  if (!res.ok) {
    return {
      props: {
        posts: [],
      },
    }
  }

  const posts = await res.json()

  return {
    props: {
      posts,
    },
  }
}

export default function Home({ posts }: { posts: Post[] }) {
  const { data: session } = useSession()
  return (
    <div className='w-full p-5'>
      {posts.map((post: Post) => (
        <div key={post.id} className='py-5 border-b border-teal-400 px-5'>
          <h1 className='font-bold text-2xl'>{post.title}</h1>
          <p className='text-lg mt-4'>{post.content}</p>
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
