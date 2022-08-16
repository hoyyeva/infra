import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import copy from 'copy-to-clipboard'

import Dashboard from '../../components/layouts/dashboard'
import {
  CheckCircleIcon,
  ChipIcon,
  ClipboardCheckIcon,
  ClipboardCopyIcon,
} from '@heroicons/react/outline'
import ErrorMessage from '../../components/error-message'

export default function DestinationsAdd() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [accessKey, setAccessKey] = useState('')
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)

  const [steps, setSteps] = useState([
    { id: 0, name: 'Name Cluster', status: 'current' },
    {
      id: 1,
      name: 'Kubernetes Command',
      status: 'upcoming',
    },
    { id: 2, name: 'Connect', status: 'upcoming' },
  ])

  const [currentStep, setCurrentStep] = useState(
    steps.find(step => step.status === 'current')?.id
  )

  useEffect(() => {
    const interval = setInterval(async () => {
      if (accessKey && name.length > 0) {
        const res = await fetch(`/api/destinations?name=${name}`)
        const { items: destinations } = await res.json()
        if (destinations?.length > 0) {
          setConnected(true)

          let stepsList = steps
          setSteps(
            stepsList.map(step => {
              step.status = 'complete'
            })
          )
        }
      }
    }, 5000)
    return () => {
      clearInterval(interval)
    }
  }, [name, accessKey, steps])

  async function onSubmit(e) {
    e.preventDefault()

    if (!/^[A-Za-z.0-9_-]+$/.test(name)) {
      setError('Invalid cluster name')
      return
    }

    setConnected(false)

    let res = await fetch('/api/users?name=connector&showSystem=true')
    const { items: connectors } = await res.json()

    // TODO (https://github.com/infrahq/infra/issues/2056): handle the case where connector does not exist
    if (!connectors.length) {
      setError('Could not create access key')
      return
    }

    const { id } = connectors[0]
    const keyName =
      name +
      '-' +
      [...Array(10)].map(() => (~~(Math.random() * 36)).toString(36)).join('')
    res = await fetch('/api/access-keys', {
      method: 'POST',
      body: JSON.stringify({
        userID: id,
        name: keyName,
        ttl: '87600h',
        extensionDeadline: '720h',
      }),
    })
    const key = await res.json()

    setAccessKey(key.accessKey)
    setSubmitted(true)

    const step = currentStep
    setCurrentStep(step + 1)

    let stepsList = steps
    stepsList[step].status = 'complete'
    if (step !== steps.length - 1) {
      stepsList[step + 1].status = 'current'
    }

    setSteps(stepsList)
  }

  const server = window.location.host
  let command = `helm install infra-connector infrahq/infra \\
    --set connector.config.accessKey=${accessKey} \\
    --set connector.config.server=${server} \\
    --set connector.config.name=${name}`

  if (window.location.protocol !== 'https:') {
    command += ` \\
    --set connector.config.skipTLSVerify=true`
  }

  return (
    <>
      <Head>
        <title>Add Infrastructure - Infra</title>
      </Head>
      <div className='flex flex-col space-y-4 px-4 py-5 md:px-6 xl:px-0'>
        <div className='flex flex-row items-center space-x-2 pb-5'>
          <ChipIcon className='h-6 w-6 dark:text-white' />
          <h1 className='text-sm'>Connect Infrastructure</h1>
        </div>
        <div className='mt-6 md:grid md:grid-cols-3 md:gap-6'>
          <nav className='flex md:col-span-1' aria-label='Progress'>
            <ol role='list' className='space-y-6'>
              {steps.map(step => (
                <li key={step.name}>
                  {step.status === 'complete' ? (
                    <a href={step.href} className='group'>
                      <span className='flex items-start'>
                        <span className='relative flex h-5 w-5 flex-shrink-0 items-center justify-center'>
                          <CheckCircleIcon
                            className='h-full w-full text-blue-600 group-hover:text-blue-800'
                            aria-hidden='true'
                          />
                        </span>
                        <span className='ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900'>
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status == 'current' ? (
                    <a
                      href={step.href}
                      className='flex items-start'
                      aria-current='step'
                    >
                      <span
                        className='relative flex h-5 w-5 flex-shrink-0 items-center justify-center'
                        aria-hidden='true'
                      >
                        <span className='absolute h-4 w-4 animate-[ping_1.25s_ease-in-out_infinite] rounded-full bg-indigo-200' />
                        <span className='relative block h-2 w-2 rounded-full bg-blue-600' />
                      </span>
                      <span className='ml-3 text-sm font-medium text-blue-600'>
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className='group'>
                      <div className='flex items-start'>
                        <div
                          className='relative flex h-5 w-5 flex-shrink-0 items-center justify-center'
                          aria-hidden='true'
                        >
                          <div className='h-2 w-2 rounded-full bg-gray-300 group-hover:bg-gray-400' />
                        </div>
                        <p className='ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900'>
                          {step.name}
                        </p>
                      </div>
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className='md:col-span-2 md:mt-0'>
            {currentStep === 0 && (
              <form onSubmit={onSubmit} className='flex flex-col'>
                <div className='flex flex-col space-y-1'>
                  <label className='text-3xs font-semibold uppercase dark:text-gray-400'>
                    Name the Cluster
                  </label>
                  <input
                    required
                    name='name'
                    placeholder='provide a name'
                    value={name}
                    onChange={e => {
                      setError('')
                      setName(e.target.value)
                    }}
                    className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
                      error ? 'border-pink-500' : 'border-gray-800'
                    }`}
                  />
                  {error && <ErrorMessage message={error} />}
                </div>
                <div className='mt-6 flex flex-row items-center justify-start'>
                  <button
                    className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'
                    disabled={!name}
                    type='submit'
                  >
                    Next
                  </button>
                </div>
              </form>
            )}
            {currentStep === 1 && (
              <section className='flex flex-col'>
                <label className='mb-2 text-3xs font-semibold uppercase dark:text-gray-400'>
                  Run the command on your Kubernetes cluster
                </label>
                <pre className='min-h-[120px] overflow-auto bg-gray-900 p-4 text-2xs text-gray-300'>
                  {command}
                </pre>
                <div className='flex items-center justify-start'>
                  <button
                    className='border-0 py-2 text-4xs uppercase hover:text-gray-400 disabled:pointer-events-none disabled:opacity-30 dark:text-gray-400 dark:hover:text-white'
                    disabled={copied}
                    onClick={() => {
                      copy(command)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? (
                      <div className='flex flex-row items-center space-x-2 pb-5'>
                        <ClipboardCheckIcon className='h-5 w-5 dark:text-white' />
                        <p>Copied </p>
                      </div>
                    ) : (
                      <div className='flex flex-row items-center space-x-2 pb-5'>
                        <ClipboardCopyIcon className='h-5 w-5 dark:text-white' />
                        <p>Copy Command </p>
                      </div>
                    )}
                  </button>
                </div>
                <div className='mt-6 flex flex-row items-center justify-start'>
                  <button
                    className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'
                    type='button'
                    onClick={() => {
                      const step = currentStep
                      console.log(currentStep)
                      console.log(step)
                      setCurrentStep(step + 1)

                      let stepsList = steps
                      stepsList[step].status = 'complete'
                      if (step !== steps.length - 1) {
                        stepsList[step + 1].status = 'current'
                      }

                      setSteps(stepsList)
                    }}
                  >
                    Next
                  </button>
                </div>
              </section>
            )}
            {currentStep === 2 && (
              <section>
                <label className='mb-2 text-3xs font-semibold uppercase dark:text-gray-400'>
                  Connecting to your Kubernetes cluster
                </label>
                <p className='mt-1 text-xs text-gray-500'>
                  Your cluster will be detected automatically. This may take a
                  few minutes.
                </p>
                {connected ? (
                  <footer className='my-4 mr-3 flex flex-col space-y-3'>
                    <h3 className='text-xs text-gray-500'>✓ Connected</h3>
                    <div className='flex items-center justify-start'>
                      <Link href='/destinations'>
                        <a className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 disabled:hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800 dark:disabled:bg-gray-800'>
                          Finish
                        </a>
                      </Link>
                    </div>
                  </footer>
                ) : (
                  <footer className='my-7 flex items-center'>
                    <h3 className='mr-3 text-xs text-gray-500'>
                      Waiting for connection
                    </h3>
                    {submitted && (
                      <span className='inline-flex h-2 w-2 flex-none animate-[ping_1.25s_ease-in-out_infinite] rounded-full border border-black opacity-75' />
                    )}
                  </footer>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

DestinationsAdd.layout = page => <Dashboard>{page}</Dashboard>
