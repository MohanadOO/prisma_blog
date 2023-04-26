import cn from '@/lib/cn'
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Nav() {
  const { data: session } = useSession()
  const asPath = useRouter().asPath

  const navigation = [
    { title: 'Home', href: '/' },
    { title: 'Draft', href: '/draft' },
    { title: 'Post', href: '/post' },
  ]
  return (
    <nav className='p-5 mb-20 rounded-md shadow-lg bg-neutral-950 text-neutral-200 w-full'>
      <ul className='flex items-center gap-5 font-medium'>
        {navigation.map(({ title, href }) => (
          <li key={title}>
            <Link
              className={cn(
                'py-2 px-4 rounded-lg',
                asPath === href
                  ? 'text-teal-400 underline underline-offset-8 cursor-default'
                  : 'hover:underline underline-offset-4'
              )}
              href={href}
            >
              {title}
            </Link>
          </li>
        ))}
        <li className='ml-auto flex gap-2 text-sm'>
          {!session ? (
            <button className='btn' onClick={() => signIn()}>
              Sign in
            </button>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.user?.image || ''}
                alt={session.user?.name || 'User Avatar'}
                className='w-8 h-8 rounded-md cursor-pointer hover:ring ring-teal-400 mr-2'
              />
              <button className='btn' onClick={() => signOut()}>
                Sign Out
              </button>
            </>
          )}
        </li>
      </ul>
    </nav>
  )
}
