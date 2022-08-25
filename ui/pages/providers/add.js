import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import { InformationCircleIcon, ViewGridIcon } from '@heroicons/react/outline'

import { providers } from '../../lib/providers'

import ErrorMessage from '../../components/error-message'
import Dashboard from '../../components/layouts/dashboard'

function Provider({ kind, name, selected }) {
  return (
    <div
      className={`${
        selected ? 'bg-gray-100' : 'bg-white'
      } flex cursor-pointer select-none items-center rounded-lg border border-gray-300 bg-transparent px-3
        py-4 hover:bg-gray-100`}
    >
      <img
        alt='provider icon'
        className='mr-4 w-6 flex-none'
        src={`/providers/${kind}.svg`}
      />
      <div>
        <h3 className='flex-1 text-2xs'>{name}</h3>
      </div>
    </div>
  )
}

export default function ProvidersAddDetails() {
  const router = useRouter()

  const { type } = router.query

  const { mutate } = useSWRConfig()

  const [kind, setKind] = useState(
    type === undefined ? providers[0].kind : type
  )
  const [url, setURL] = useState(type === 'google' ? 'accounts.google.com' : '')
  const [clientID, setClientID] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [domainAdminEmail, setDomainAdminEmail] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [name, setName] = useState(kind)

  useEffect(() => setName(kind), [kind])

  function docLink() {
    if (kind == 'azure') {
      return 'https://infrahq.com/docs/identity-providers/azure-ad'
    }

    return 'https://infrahq.com/docs/identity-providers/' + kind
  }

  async function onSubmit(e) {
    e.preventDefault()

    setErrors({})
    setError('')

    const api = {
      privateKey,
      clientEmail,
      domainAdminEmail: domainAdminEmail,
    }

    try {
      await mutate(
        '/api/providers',
        async ({ items: providers } = { items: [] }) => {
          const res = await fetch('/api/providers', {
            method: 'POST',
            body: JSON.stringify({
              name,
              url,
              clientID,
              clientSecret,
              kind,
              api,
            }),
          })

          const data = await res.json()

          if (!res.ok) {
            throw data
          }

          return { items: [...providers, data] }
        }
      )
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

      return false
    }

    router.replace('/providers')

    return false
  }

  const parseGoogleCredentialFile = e => {
    setErrors({})

    const fileReader = new FileReader()
    fileReader.readAsText(e.target.files[0], 'UTF-8')
    fileReader.onload = e => {
      let errMsg = ''
      try {
        let contents = JSON.parse(e.target.result)

        if (contents.private_key === undefined) {
          errMsg = 'invalid service account key file, no private_key found'
        } else {
          setPrivateKey(contents.private_key)
        }

        if (contents.client_email === undefined) {
          errMsg = 'invalid service account key file, no client_email found'
        } else {
          setClientEmail(contents.client_email)
        }
      } catch (e) {
        errMsg = e.ErrorMessage
        if (e instanceof SyntaxError) {
          errMsg = 'invalid service account key file, must be json'
        }
      }

      if (errMsg !== '') {
        const errors = {}
        errors['privatekey'] = errMsg
        setErrors(errors)
      }
    }
  }

  return (
    <>
      <Head>
        <title>Add Identity Provider - {kind}</title>
      </Head>
      <div className='flex flex-col space-y-4 px-4 py-5 md:px-6 xl:px-10 2xl:m-auto 2xl:max-w-6xl'>
        <div className='flex flex-row items-center space-x-2 pb-5'>
          <ViewGridIcon className='h-6 w-6' />
          <h1 className='text-base'>Connect an Identity Provider</h1>
        </div>

        <form
          onSubmit={onSubmit}
          className='space-y-8 divide-y divide-gray-200'
        >
          <div className='space-y-8'>
            <div className='max-w-4xl space-y-1'>
              <div className='pb-2'>
                <h3 className='text-base font-medium leading-6 text-gray-900'>
                  Provider
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Name and select the type of your provider
                </p>
              </div>

              <div className='mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6'>
                <div className='sm:col-span-6 lg:col-span-5'>
                  <div className='pb-3'>
                    <label className='text-2xs font-medium text-gray-700'>
                      Provider Kind
                    </label>
                  </div>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {providers.map(
                      p =>
                        p.available && (
                          <div
                            key={p.name}
                            onClick={() => {
                              setKind(p.kind)
                              router.replace(`/providers/add?type=${p.kind}`)
                            }}
                          >
                            <Provider {...p} selected={p.kind === kind} />
                          </div>
                        )
                    )}
                  </div>
                </div>

                <div className='sm:col-span-6 lg:col-span-5'>
                  <label className='text-2xs font-medium text-gray-700'>
                    Name of Provider
                  </label>
                  <input
                    required
                    type='search'
                    placeholder='choose a name for your identity provider'
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      setErrors({})
                      setError('')
                    }}
                    className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none ${
                      errors.name ? 'border-pink-500' : ''
                    }`}
                  />
                  {errors.name && <ErrorMessage message={errors.name} />}
                </div>
              </div>
            </div>

            <div className='max-w-4xl space-y-1 pt-8'>
              <div className='pb-2'>
                <h3 className='text-base font-medium leading-6 text-gray-900'>
                  Additional Information
                </h3>
                <div className='mt-1 flex flex-row items-center space-x-1 text-sm text-gray-400'>
                  <InformationCircleIcon className='h-4 w-4' />
                  <a
                    className='underline hover:text-gray-500'
                    target='_blank'
                    href={docLink()}
                    rel='noreferrer'
                  >
                    learn more
                  </a>
                </div>
              </div>
              <div className='mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6'>
                {kind !== 'google' && (
                  <div className='sm:col-span-6 lg:col-span-5'>
                    <label className='text-2xs font-medium text-gray-700'>
                      URL (Domain)
                    </label>
                    <input
                      required
                      autoFocus
                      placeholder='domain or URL'
                      value={url}
                      onChange={e => {
                        setURL(e.target.value)
                        setErrors({})
                        setError('')
                      }}
                      className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none ${
                        errors.url ? 'border-pink-500' : ''
                      }`}
                    />
                    {errors.url && <ErrorMessage message={errors.url} />}
                  </div>
                )}

                <div className='sm:col-span-6 lg:col-span-5'>
                  <label className='text-2xs font-medium text-gray-700'>
                    Client ID
                  </label>
                  <input
                    required
                    placeholder='client ID'
                    type='search'
                    value={clientID}
                    onChange={e => {
                      setClientID(e.target.value)
                      setErrors({})
                      setError('')
                    }}
                    className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none ${
                      errors.clientid ? 'border-pink-500' : ''
                    }`}
                  />
                  {errors.clientid && (
                    <ErrorMessage message={errors.clientid} />
                  )}
                </div>

                <div className='sm:col-span-6 lg:col-span-5'>
                  <label className='text-2xs font-medium text-gray-700'>
                    Client Secret
                  </label>
                  <input
                    required
                    type='password'
                    placeholder='client secret'
                    value={clientSecret}
                    onChange={e => {
                      setClientSecret(e.target.value)
                      setErrors({})
                      setError('')
                    }}
                    className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none ${
                      errors.clientsecret ? 'border-pink-500' : ''
                    }`}
                  />
                  {errors.clientsecret && (
                    <ErrorMessage message={errors.clientsecret} />
                  )}
                </div>
              </div>
            </div>

            {kind === 'google' && (
              <div className='max-w-4xl space-y-1 pt-8'>
                <div className='pb-2'>
                  <h3 className='text-base font-medium leading-6 text-gray-900'>
                    Optional Information for Google Groups
                  </h3>
                  <div className='mt-1 flex flex-row items-center space-x-1 text-sm text-gray-400'>
                    <InformationCircleIcon className='h-4 w-4' />
                    <a
                      className='text-gray-400 underline hover:text-gray-500'
                      target='_blank'
                      href='https://infrahq.com/docs/identity-providers/google#groups' /* TODO: make sure this link works*/
                      rel='noreferrer'
                    >
                      learn more
                    </a>
                  </div>
                </div>
                <div className='mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6'>
                  <div className='sm:col-span-6 lg:col-span-5'>
                    <label className='text-2xs font-medium text-gray-700'>
                      Private Key
                    </label>
                    <input
                      type='file'
                      onChange={parseGoogleCredentialFile}
                      className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none ${
                        errors.privatekey ? 'border-pink-500' : ''
                      }`}
                    />
                    {errors.privatekey && (
                      <ErrorMessage message={errors.privatekey} />
                    )}
                  </div>

                  <div className='sm:col-span-6 lg:col-span-5'>
                    <label className='text-2xs font-medium text-gray-700'>
                      Workspace Domain Admin
                    </label>
                    <input
                      placeholder='domain admin email'
                      spellCheck='false'
                      type='email'
                      value={domainAdminEmail}
                      onChange={e => {
                        setDomainAdminEmail(e.target.value)
                        setErrors({})
                        setError('')
                      }}
                      className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none ${
                        errors.domainadminemail ? 'border-pink-500' : ''
                      }`}
                    />
                    {errors.domainadminemail && (
                      <ErrorMessage message={errors.domainadminemail} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {error && <ErrorMessage message={error} center />}

          <div className='pt-5 pb-3'>
            <div className='flex items-center justify-end'>
              <Link href='/providers'>
                <a className='-ml-4 border-0 px-4 py-2 text-4xs uppercase hover:text-gray-400'>
                  Cancel
                </a>
              </Link>
              <button
                type='submit'
                disabled={!name || !url || !clientID || !clientSecret}
                className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:cursor-pointer hover:bg-gray-200 disabled:hover:cursor-not-allowed disabled:hover:bg-gray-100'
              >
                Connect Provider
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

ProvidersAddDetails.layout = page => <Dashboard> {page}</Dashboard>
