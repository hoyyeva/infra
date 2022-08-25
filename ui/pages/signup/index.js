import { useState } from 'react'

import { useServerConfig } from '../../lib/serverconfig'

import Login from '../../components/layouts/login'
import ErrorMessage from '../../components/error-message'

export default function Signup() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [subDomain, setSubDomain] = useState('')
  const [automaticOrgDomain, setAutomaticOrgDomain] = useState(true) // track if the user has manually specified the org domain
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const { baseDomain } = useServerConfig()

  async function onSubmit(e) {
    e.preventDefault()

    setSubmitted(true)

    if (password !== confirmPassword) {
      setErrors({
        confirmPassword: 'passwords do not match',
      })
      setSubmitted(false)
      return false
    }

    try {
      // signup
      let res = await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          password,
          org: {
            name: orgName,
            subDomain,
          },
        }),
      })

      if (!res.ok) {
        throw await res.json()
      }

      // redirect to the new org subdomain
      let created = await res.json()

      window.location = `${window.location.protocol}//${created?.organization?.domain}`
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

    setSubmitted(false)

    return false
  }

  const notURLSafePattern = /[^\da-zA-Z-]/g

  function getURLSafeDomain(domain) {
    // remove spaces
    domain = domain.split(' ').join('-')
    // remove unsafe characters
    domain = domain.replace(notURLSafePattern, '')
    return domain.toLowerCase()
  }

  return (
    <>
      <h1 className='text-xl font-bold leading-snug'>Welcome to Infra</h1>
      <h2 className='my-3 text-center text-sm text-gray-400'>
        Set up your admin user to get started.
      </h2>
      <form onSubmit={onSubmit} className='flex w-full max-w-sm flex-col'>
        <div className='my-2 w-full'>
          <label htmlFor='name' className='text-2xs font-medium text-gray-700'>
            Email
          </label>
          <input
            autoFocus
            id='name'
            placeholder='enter your email'
            onChange={e => {
              setName(e.target.value)
              setErrors({})
              setError('')
            }}
            className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-500 focus:outline-none ${
              errors.name ? 'border-pink-500' : 'border-gray-800'
            }`}
          />
          {errors.name && <ErrorMessage message={errors.name} />}
        </div>
        <div className='my-2 w-full'>
          <label
            htmlFor='password'
            className='text-2xs font-medium text-gray-700'
          >
            Password
          </label>
          <input
            id='password'
            type='password'
            placeholder='enter your password'
            onChange={e => {
              setPassword(e.target.value)
              setErrors({})
              setError('')
            }}
            className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-500 focus:outline-none ${
              errors.password ? 'border-pink-500' : 'border-gray-800'
            }`}
          />
          {errors.password && <ErrorMessage message={errors.password} />}
        </div>
        <div className='my-2 w-full'>
          <label
            htmlFor='password'
            className='text-2xs font-medium text-gray-700'
          >
            Confirm Password
          </label>
          <input
            required
            id='confirmPassword'
            type='password'
            placeholder='confirm your password'
            onChange={e => {
              setConfirmPassword(e.target.value)
              setErrors({})
              setError('')
            }}
            className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-500 focus:outline-none ${
              errors.confirmPassword ? 'border-pink-500' : 'border-gray-800'
            }`}
          />
          {errors.confirmPassword && (
            <ErrorMessage message={errors.confirmPassword} />
          )}
        </div>
        <div className='my-2 w-full pt-6 text-sm leading-none text-gray-400'>
          Organization
        </div>
        <div className='my-2 w-full'>
          <label
            htmlFor='orgName'
            className='text-2xs font-medium text-gray-700'
          >
            Name
          </label>
          <input
            required
            id='orgName'
            placeholder='enter your organization name'
            onChange={e => {
              setOrgName(e.target.value)
              setErrors({})
              setError('')
              if (automaticOrgDomain) {
                setSubDomain(getURLSafeDomain(e.target.value))
              }
            }}
            className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-500 focus:outline-none ${
              errors.org?.name ? 'border-pink-500' : 'border-gray-800'
            }`}
          />
        </div>
        <div className='my-2 w-full'>
          <label
            htmlFor='orgDoman'
            className='text-2xs font-medium text-gray-700'
          >
            Domain
          </label>
          <div className='flex flex-wrap'>
            <input
              required
              name='orgDomain'
              placeholder='your-domain'
              value={subDomain}
              onChange={e => {
                setSubDomain(getURLSafeDomain(e.target.value))
                setAutomaticOrgDomain(false) // do not set this automatically once it has been specified
                setErrors({})
                setError('')
              }}
              className={`w-2/3 border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-500 focus:outline-none ${
                errors.org?.subDomain ? 'border-pink-500' : 'border-gray-800'
              }`}
            />
            <div className='mt-2 w-1/3 items-center border border-gray-300 py-2 text-center text-2xs text-gray-500'>
              .{baseDomain}
            </div>
            {errors.domain && <ErrorMessage message={errors.domain} />}
          </div>
        </div>
        <button
          disabled={
            !name ||
            !password ||
            !confirmPassword ||
            !orgName ||
            !subDomain ||
            submitted
          }
          className='mt-4 mb-2 flex w-full justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:pointer-events-none disabled:opacity-30'
        >
          Get Started
        </button>
        {error && <ErrorMessage message={error} center />}
      </form>
    </>
  )
}

Signup.layout = page => <Login>{page}</Login>
