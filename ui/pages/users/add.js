import { UserIcon } from '@heroicons/react/outline'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useServerConfig } from '../../lib/serverconfig'

import ErrorMessage from '../../components/error-message'
import Dashboard from '../../components/layouts/dashboard'

function AddUser({ email, onChange, onKeyDown, onSubmit, error }) {
  return (
    <form onSubmit={onSubmit} className='flex flex-col'>
      <div className='flex flex-row items-center space-x-2'>
        <UserIcon className='h-5 w-5 dark:text-white' />
        <div>
          <h1 className='text-sm'>Add User</h1>
        </div>
      </div>
      <div className='mt-6 flex flex-col space-y-1'>
        <div className='mt-4'>
          <label className='text-3xs font-semibold uppercase dark:text-gray-400'>
            User Email
          </label>
          <input
            autoFocus
            spellCheck='false'
            type='email'
            placeholder='enter the user email here'
            value={email}
            onChange={onChange}
            onKeyDown={onKeyDown}
            className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
              error ? 'border-pink-500' : 'border-gray-800'
            }`}
          />
        </div>
        {error && <ErrorMessage message={error} />}
      </div>
      <div className='mt-6 flex flex-row items-center justify-start'>
        <Link href='/users'>
          <a className='-ml-4 border-0 px-4 py-2 text-4xs uppercase hover:text-gray-400 dark:text-gray-400 dark:hover:text-white'>
            Cancel
          </a>
        </Link>
        <button
          type='submit'
          disabled={!email}
          className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'
        >
          Add User
        </button>
      </div>
    </form>
  )
}

function UserOneTimePassword({ isEmailConfigured, password, onSubmit }) {
  return (
    <div className='flex flex-col'>
      <div className='flex flex-row items-center space-x-2'>
        <UserIcon className='h-5 w-5 dark:text-white' />
        <div>
          <h1 className='text-sm'>Add User</h1>
        </div>
      </div>
<<<<<<< HEAD
      {isEmailConfigured ? (
        <h2 className='mt-5 text-2xs'>
          User added. The user has been emailed a link inviting them to join.
        </h2>
      ) : (
        <div>
          <h2 className='mt-5 text-2xs'>
            User added. Send the user this temporary password for their initial
            login. This password will not be shown again.
          </h2>
          <div className='mt-6 flex flex-col space-y-1'>
            <label className='text-3xs uppercase text-gray-400'>
              Temporary Password
            </label>
            <input
              readOnly
              value={password}
              className='my-0 w-full bg-transparent py-2 font-mono text-3xs focus:outline-none'
            />
          </div>
        </div>
      )}
      <div className='mt-6 flex flex-row items-center justify-end'>
=======
      <h2 className='mt-5 text-xs'>
        User added. Send the user this temporary password for their initial
        login. This password will not be shown again.
      </h2>
      <div className='mt-6 flex flex-col space-y-1'>
        <label className='text-3xs font-semibold uppercase dark:text-gray-400'>
          Temporary Password
        </label>
        <input
          readOnly
          value={password}
          className='my-0 w-full bg-gray-100 px-4 py-3 font-mono text-2xs focus:outline-none dark:bg-gray-900'
        />
      </div>
      <div className='mt-6 flex flex-row items-center justify-start'>
>>>>>>> 780e0cb3 (feat: provider wip)
        <button
          onClick={onSubmit}
          className='-ml-4 border-0 px-4 py-2 text-4xs uppercase hover:text-gray-400 dark:text-gray-400 dark:hover:text-white'
        >
          Add Another
        </button>
        <Link href='/users'>
          <a className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'>
            Done
          </a>
        </Link>
      </div>
    </div>
  )
}

export default function UsersAdd() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('add')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const { isEmailConfigured } = useServerConfig()

  async function handleUserOneTimePassword(e) {
    e.preventDefault()

    setErrors({})
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: email,
        }),
      })
      const user = await res.json()

      if (!res.ok) {
        throw user
      }

      setState('password')
      setPassword(user.oneTimePassword)
    } catch (e) {
      if (e.fieldErrors) {
        const errors = {}
        for (const error of e.fieldErrors) {
          errors[error.fieldName.toLowerCase()] =
            error.errors[0] || 'invalid value'
        }

        // TODO: need to work with backend for better error message
        if (e.code === 409 && errors.identity_id) {
          errors.name = 'user already exists'
        }

        setErrors(errors)
      } else {
        setError(e.message)
      }

      return false
    }
  }

  function handleInputChange(value) {
    setEmail(value)
    setError('')
  }

  function handleAddUser() {
    setState('add')
    setEmail('')
    setPassword('')
  }

  function handleKeyDownEvent(e) {
    if (e.key === 'Enter' && email.length > 0) {
      handleUserOneTimePassword(e)
    }
  }

  return (
    <>
      <Head>
        <title>Add User</title>
      </Head>
      <div className='space-y-4 px-4 py-5 md:px-6 xl:px-0'>
        {state === 'add' && (
          <AddUser
            email={email}
            onChange={e => {
              handleInputChange(e.target.value)
              setErrors({})
              setError('')
            }}
            onKeyDown={e => handleKeyDownEvent(e)}
            onSubmit={handleUserOneTimePassword}
            error={errors.name}
          />
        )}
        {state === 'password' && (
          <UserOneTimePassword
            isEmailConfigured={isEmailConfigured}
            password={password}
            onSubmit={() => handleAddUser()}
          />
        )}
        {error && <ErrorMessage message={error} />}
      </div>
    </>
  )
}

// UsersAdd.layout = page => <Fullscreen closeHref='/users'>{page}</Fullscreen>
UsersAdd.layout = page => {
  return <Dashboard>{page}</Dashboard>
}
