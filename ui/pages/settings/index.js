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

function AdminList({ grants, users, groups, onRemove, auth, selfGroups }) {
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  return (
    <div className='-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8'>
      <div className='inline-block min-w-full py-2 px-4 align-middle md:px-6 lg:px-8'>
        <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
          <table className='min-w-full divide-y divide-gray-300'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6'
                >
                  Infra Admin
                </th>
              </tr>
            </thead>
            <tbody className='bg-white'>
              {grants
                ?.sort(sortBySubject)
                ?.map(grant => {
                  const message =
                    grant?.user === auth?.id
                      ? 'Are you sure you want to revoke your own admin access?'
                      : selfGroups?.some(g => g.id === grant.group)
                      ? `Are you sure you want to revoke this group's admin access? You are a member of this group.`
                      : undefined

                  const name =
                    users?.find(u => grant.user === u.id)?.name ||
                    groups?.find(group => grant.group === group.id)?.name ||
                    ''

                  return { ...grant, message, name }
                })
                ?.map(grant => {
                  return (
                    <div key={grant.id}>
                      <tr>
                        <td className='whitespace-nowrap py-4 pl-4 pr-3 text-xs font-medium sm:pl-6'>
                          <div>{grant.name}</div>
                          <div>
                            <button
                              onClick={() => {
                                setDeleteId(grant.id)
                                setOpen(true)
                              }}
                              className='cursor-pointer text-4xs uppercase text-gray-800 hover:text-gray-400 dark:text-gray-400 dark:hover:text-white'
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                      <DeleteModal
                        open={open}
                        setOpen={setOpen}
                        primaryButtonText='Revoke'
                        onSubmit={() => {
                          onRemove(deleteId)
                          setOpen(false)
                        }}
                        title='Revoke Admin'
                        message={
                          !grant.message ? (
                            <>
                              Are you sure you want to revoke admin access for{' '}
                              <span className='font-bold text-white'>
                                {grant.name}
                              </span>
                              ?
                            </>
                          ) : (
                            grant.message
                          )
                        }
                      />
                    </div>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
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
        <PageHeader header='Settings' />
        <div className=' px-4 sm:px-6 xl:px-0'>
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
              <div className='py-6'>
                <AdminList
                  grants={grants}
                  users={users}
                  groups={groups}
                  selfGroups={selfGroups}
                  auth={auth}
                  onRemove={async grantId => {
                    await fetch(`/api/grants/${grantId}`, { method: 'DELETE' })
                    mutate({ items: grants?.filter(x => x.id !== grantId) })
                  }}
                />
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
