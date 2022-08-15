import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { CogIcon, KeyIcon } from '@heroicons/react/outline'

import { sortBySubject } from '../../lib/grants'
import { useAdmin } from '../../lib/admin'

import Dashboard from '../../components/layouts/dashboard'
import DeleteModal from '../../components/delete-modal'
import Notification from '../../components/notification'
import GrantForm from '../../components/grant-form'
import PasswordReset from './password-reset'
import PageHeader from '../../components/page-header'

function AdminGrant({ name, showRemove, onRemove, message = '' }) {
  const [open, setOpen] = useState(false)

  return (
    <div className='group flex items-center justify-between py-1 text-2xs'>
      <div className='py-1.5'>{name}</div>
      {showRemove && (
        <div className='flex justify-end text-right opacity-0 group-hover:opacity-100'>
          <button
            onClick={() => setOpen(true)}
            className='-mr-2 flex-none cursor-pointer px-2 py-1 text-2xs text-gray-500 hover:text-violet-100'
          >
            Revoke
          </button>
          <DeleteModal
            open={open}
            setOpen={setOpen}
            primaryButtonText='Revoke'
            onSubmit={onRemove}
            title='Revoke Admin'
            message={
              !message ? (
                <>
                  Are you sure you want to revoke admin access for{' '}
                  <span className='font-bold text-white'>{name}</span>?
                </>
              ) : (
                message
              )
            }
          />
        </div>
      )}
    </div>
  )
}

function AccountPasswordReset({ resetPassword }) {
  const [showNotification, setshowNotification] = useState(
    resetPassword === 'success'
  )

  return (
    <>
      <div className='pt-6'>
        <div className='flex flex-row items-center space-x-2'>
          <KeyIcon className='h-6 w-6 dark:text-white' />
          <div>
            <h1 className='text-sm'>Reset Password</h1>
          </div>
        </div>
        <div className='flex flex-col space-y-2 pt-6'>
          <PasswordReset />
        </div>
      </div>
      {resetPassword && (
        <Notification
          show={showNotification}
          setShow={setshowNotification}
          text='Password Successfully Reset'
        />
      )}
    </>
  )
}

export default function Settings() {
  const { data: auth } = useSWR('/api/users/self')
  const { admin } = useAdmin()
  const router = useRouter()

  const { resetPassword, tab } = router.query

  const [tabs, setTabs] = useState([])
  const [current, setCurrent] = useState(tab === undefined ? null : tab)

  const { data: { items: users } = {} } = useSWR('/api/users?limit=1000')
  const { data: { items: groups } = {} } = useSWR('/api/groups?limit=1000')
  const { data: { items: grants } = {}, mutate } = useSWR(
    '/api/grants?resource=infra&privilege=admin&limit=1000'
  )
  const { data: { items: selfGroups } = {} } = useSWR(
    `/api/groups?userID=${auth?.id}&limit=1000`
  )

  const hasInfraProvider = auth?.providerNames.includes('infra')

  useEffect(() => {
    const currentTabs = []
    if (auth && hasInfraProvider) {
      currentTabs.push('account')
      setTabs(currentTabs)
    }

    if (admin) {
      currentTabs.push('admin')
      setTabs(currentTabs)
    }

    if (current === null) {
      setCurrent(currentTabs.includes('account') ? 'account' : currentTabs[0])
      router.replace(`/settings?tab=${currentTabs[0]}`)
    }
  }, [admin, auth, hasInfraProvider, current, router])

  return (
    <div>
      <Head>
        <title>Settings - Infra</title>
      </Head>
      <div className='pb-6'>
        <div className='sm:hidden'>
          <label htmlFor='tabs' className='sr-only'>
            Select a tab
          </label>
          {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
          <select
            id='tabs'
            name='tabs'
            className='block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
            defaultValue={tabs.find(tab => tab === current)}
          >
            {tabs.map(tab => (
              <option key={tab}>{tab}</option>
            ))}
          </select>
        </div>
        <div className='hidden sm:block'>
          <PageHeader header='Settings' />
        </div>
        <div className='hidden px-4 sm:block sm:px-6 xl:px-0'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
              {tabs.map(tab => (
                <a
                  key={tab}
                  onClick={() => {
                    setCurrent(tab)
                    router.replace(`/settings?tab=${tab}`)
                  }}
                  className={`${
                    tab === current
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-xs font-semibold capitalize`}
                >
                  {tab}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className='px-4 sm:px-6 xl:px-0'>
        {current === 'account' && (
          <div className='flex flex-1 flex-col space-y-8'>
            <AccountPasswordReset resetPassword={resetPassword} />
          </div>
        )}
        {current === 'admin' && (
          <div className='flex flex-1 flex-col space-y-8'>
            <div className='pt-6'>
              <div className='flex flex-row items-center space-x-2'>
                <CogIcon className='h-6 w-6 dark:text-white' />
                <div>
                  <h1 className='text-sm'>Admin</h1>
                </div>
              </div>
              <GrantForm
                resource='infra'
                roles={['admin']}
                onSubmit={async ({ user, group }) => {
                  // don't add grants that already exist
                  if (grants?.find(g => g.user === user && g.group === group)) {
                    return false
                  }

                  const res = await fetch('/api/grants', {
                    method: 'POST',
                    body: JSON.stringify({
                      user,
                      group,
                      privilege: 'admin',
                      resource: 'infra',
                    }),
                  })

                  mutate({ items: [...grants, await res.json()] })
                }}
              />
              <div className='mt-6'>
                {grants
                  ?.sort(sortBySubject)
                  ?.map(grant => {
                    const message =
                      grant?.user === auth?.id
                        ? 'Are you sure you want to revoke your own admin access?'
                        : selfGroups?.some(g => g.id === grant.group)
                        ? `Are you sure you want to revoke this group's admin access? You are a member of this group.`
                        : undefined

                    return { ...grant, message }
                  })
                  ?.map(g => (
                    <AdminGrant
                      key={g.id}
                      name={
                        users?.find(u => g.user === u.id)?.name ||
                        groups?.find(group => g.group === group.id)?.name ||
                        ''
                      }
                      showRemove={grants?.length > 1}
                      message={g.message}
                      onRemove={async () => {
                        await fetch(`/api/grants/${g.id}`, { method: 'DELETE' })
                        mutate({ items: grants?.filter(x => x.id !== g.id) })
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

Settings.layout = function (page) {
  return <Dashboard header='Settings'>{page}</Dashboard>
}
