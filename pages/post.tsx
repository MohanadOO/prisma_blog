import { signIn, useSession } from 'next-auth/react'
import Router from 'next/router'
import { useState } from 'react'

export default function Post() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { data: session } = useSession()

  if (!session) {
    return (
      <button className='btn mx-auto text-lg' onClick={() => signIn()}>
        Sign In to create Posts
      </button>
    )
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!title || !content) return
    try {
      const body = { title, content }
      const post = await fetch(`/api/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (post.ok) await Router.push('/draft')
      throw new Error(post.statusText)
    } catch (err) {
      console.error(err)
    }
  }
  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col gap-5 max-w-md w-full mx-auto justify-center'
    >
      <h1 className='text-xl font-bold text-teal-400 text-center'>
        Create New Draft
      </h1>
      <label htmlFor='title'>Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        type='text'
        id='title'
        autoFocus
        required
        className='border p-2 text-black rounded-sm'
      />

      <label htmlFor='content'>Content</label>
      <textarea
        value={content}
        required
        onChange={(e) => setContent(e.target.value)}
        id='content'
        className='border p-2 text-black rounded-sm'
      />
      <button className='btn'>Add Post</button>
    </form>
  )
}
