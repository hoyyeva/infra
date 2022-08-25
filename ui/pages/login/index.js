import { useRouter } from 'next/router'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { useServerConfig } from '../../lib/serverconfig'

import Link from 'next/link'

import { providers as providersList } from '../../lib/providers'

import LoginLayout from '../../components/layouts/login'

function oidcLogin({ id, clientID, authURL, scopes }) {
  window.localStorage.setItem('providerID', id)

  const state = [...Array(10)]
    .map(() => (~~(Math.random() * 36)).toString(36))
    .join('')
  window.localStorage.setItem('state', state)

  const redirectURL = window.location.origin + '/login/callback'
  window.localStorage.setItem('redirectURL', redirectURL)

  document.location.href = `${authURL}?redirect_uri=${redirectURL}&client_id=${clientID}&response_type=code&scope=${scopes.join(
    '+'
  )}&state=${state}`
}

export function Providers({ providers }) {
  return (
    <>
      <div className='mt-2 w-full max-w-sm'>
        {providers.map(
          p =>
            p.kind && (
              <button
                onClick={() => oidcLogin(p)}
                key={p.id}
                title={`${p.name} — ${p.url}`}
                className='my-2 inline-flex w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50'
              >
                <img
                  alt='identity provider icon'
                  className='h-4'
                  src={`/providers/${p.kind}.svg`}
                />
                <span className='items-center pl-4 text-xs text-gray-400'>
                  {providersList.filter(i => i.kind === p.kind) ? (
                    <span>
                      <span>Login with </span>
                      <span className='capitalize'>{p.name}</span>
                    </span>
                  ) : (
                    'Single Sign-On'
                  )}
                </span>
              </button>
            )
        )}
      </div>
    </>
  )
}

export default function Login() {
  const { data: { items: providers } = {} } = useSWR(
    '/api/providers?limit=1000',
    {
      fallbackData: [],
    }
  )
  const { mutate } = useSWRConfig()
  const router = useRouter()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { isEmailConfigured } = useServerConfig()

  async function onSubmit(e) {
    e.preventDefault()

    try {
      const res = await fetch('/api/login', {
        method: 'post',
        body: JSON.stringify({
          passwordCredentials: {
            name,
            password,
          },
        }),
      })

      if (!res.ok) {
        throw await res.json()
      }

      const data = await res.json()

      if (data.passwordUpdateRequired) {
        router.replace({
          pathname: '/login/finish',
          query: { user: data.userID },
        })

        return false
      }

      await mutate('/api/users/self')
      router.replace('/')
    } catch (e) {
      console.error(e)
      setError('Invalid credentials')
    }

    return false
  }

  return (
    <>
      <h1 className='text-xl font-bold leading-snug'>Login to Infra</h1>
      <h2 className='my-3 text-center text-sm text-gray-400'>
        Welcome back. Login with your credentials{' '}
        {providers?.length > 0 && 'or via your identity provider.'}
      </h2>
      {providers?.length > 0 && (
        <>
          <Providers providers={providers || []} />
          <div className='relative mt-4 w-full'>
            <div
              className='absolute inset-0 flex items-center'
              aria-hidden='true'
            >
              <div className='w-full border-t border-gray-400' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='bg-white px-2 text-2xs text-gray-400'>OR</span>
            </div>
          </div>
        </>
      )}
      <form
        onSubmit={onSubmit}
        className='relative flex w-full max-w-sm flex-col'
      >
        <div className='my-2 w-full'>
          <label htmlFor='name' className='text-2xs font-medium text-gray-700'>
            Email
          </label>
          <input
            required
            autoFocus
            id='name'
            placeholder='enter your email'
            onChange={e => {
              setName(e.target.value)
              setError('')
            }}
            className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-500 focus:outline-none ${
              error ? 'border-pink-500' : 'border-gray-800'
            }`}
          />
        </div>
        <div className='my-2 w-full'>
          <label
            htmlFor='password'
            className='text-2xs font-medium text-gray-700'
          >
            Password
          </label>
          <input
            required
            id='password'
            type='password'
            data-testid='form-field-password'
            placeholder='enter your password'
            onChange={e => {
              setPassword(e.target.value)
              setError('')
            }}
            className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-500 focus:outline-none ${
              error ? 'border-pink-500' : 'border-gray-800'
            }`}
          />
        </div>
        {isEmailConfigured && (
          <div className='mt-4 flex items-center justify-end text-sm'>
            <Link href='/password-reset'>
              <a className='font-medium text-blue-600 hover:text-blue-500'>
                Forgot your password?
              </a>
            </Link>
          </div>
        )}
        <button
          disabled={!name || !password}
          className='mt-4 mb-2 flex w-full justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:pointer-events-none disabled:opacity-30'
        >
          Login
        </button>
        {error && (
          <p className='absolute -bottom-3.5 mx-auto w-full text-center text-2xs text-pink-400'>
            {error}
          </p>
        )}
      </form>
    </>
  )
}

Login.layout = page => <LoginLayout>{page}</LoginLayout>
