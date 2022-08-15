import useSWR from 'swr'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import Fullscreen from '../../components/layouts/fullscreen'
import ErrorMessage from '../../components/error-message'

export default function PasswordReset() {
  const router = useRouter()

  const { data: auth } = useSWR('/api/users/self')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  async function onSubmit(e) {
    e.preventDefault()

    if (password !== confirmPassword) {
      setErrors({
        confirmPassword: 'passwords do not match',
      })
      return false
    }

    try {
      const rest = await fetch(`/api/users/${auth?.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...auth,
          password: confirmPassword,
        }),
      })

      const data = await rest.json()

      if (!rest.ok) {
        throw data
      }

      router.replace('/settings?tab=account&resetPassword=success')
    } catch (e) {
      if (e.fieldErrors) {
        const errors = {}
        for (const error of e.fieldErrors) {
          errors[error.fieldName.toLowerCase()] =
            error.errors[0] || 'invalid value'
        }
        setErrors(errors)
      } else {
        setError(e.message)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className='flex flex-col'>
      <div className='my-2 w-full'>
        <label htmlFor='name' className='text-2xs uppercase dark:text-gray-400'>
          New Password
        </label>
        <input
          required
          name='password'
          type='password'
          placeholder='enter your new password'
          onChange={e => {
            setPassword(e.target.value)
            setErrors({})
            setError('')
          }}
          className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
            errors.password ? 'border-pink-500' : 'border-gray-800'
          }`}
        />
        {errors.password && <ErrorMessage message={errors.password} />}
      </div>
      <div className='my-2 w-full'>
        <label
          htmlFor='password'
          className='text-2xs uppercase dark:text-gray-400'
        >
          Confirm New Password
        </label>
        <input
          required
          name='confirmPassword'
          type='password'
          placeholder='confirm your new password'
          onChange={e => {
            setConfirmPassword(e.target.value)
            setErrors({})
            setError('')
          }}
          className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
            errors.confirmPassword ? 'border-pink-500' : 'border-gray-800'
          }`}
        />
        {errors.confirmPassword && (
          <ErrorMessage message={errors.confirmPassword} />
        )}
      </div>
      <div className='mt-6 flex flex-row items-center justify-start'>
        <Link href='/settings'>
          <a className='-ml-4 border-0 px-4 py-2 text-4xs uppercase hover:text-gray-400 dark:text-gray-400 dark:hover:text-white'>
            Cancel
          </a>
        </Link>
        <button
          type='submit'
          disabled={!password || !confirmPassword}
          className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'
        >
          Reset
        </button>
      </div>
      {error && <ErrorMessage message={error} center />}
    </form>
  )
}

PasswordReset.layout = page => (
  <Fullscreen closeHref='/settings'>{page}</Fullscreen>
)
