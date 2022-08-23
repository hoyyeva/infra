import { useRouter } from 'next/router'
import useSWR from 'swr'
import dayjs from 'dayjs'

import { useAdmin } from '../../lib/admin'
import { sortBySubject, sortByPrivilege } from '../../lib/grants'

import EmptyData from '../../components/empty-data'
import RoleSelect from '../../components/role-select'
import GrantForm from '../../components/grant-form'
import Metadata from '../../components/metadata'
import RemoveButton from '../../components/remove-button'
import Dashboard from '../../components/layouts/dashboard'

function parent(resource = '') {
  const parts = resource.split('.')
  return parts.length > 1 ? parts[0] : null
}

function ConnectSection({ userID, resource, kind = 'resource' }) {
  const { data: { items: grants } = {} } = useSWR(
    `/api/grants?user=${userID}&resource=${resource}&showInherited=1&limit=1000`
  )

  const roles = [
    ...new Set(
      grants?.filter(g => g.resource !== 'infra')?.map(ug => ug.privilege)
    ),
  ].sort(sortByPrivilege)

  if (!roles.length) {
    return null
  }

  return (
    <section>
      <h3 className='border-b border-gray-800 py-4 text-3xs uppercase text-gray-400'>
        Connect
      </h3>
      <p className='my-4 text-2xs leading-normal'>
        Connect to this {kind} via the{' '}
        <a
          target='_blank'
          href='https://infrahq.com/docs/install/install-infra-cli'
          className='font-medium text-violet-200 underline'
          rel='noreferrer'
        >
          Infra CLI
        </a>
        . You have <span className='font-semibold'>{roles.join(', ')}</span>{' '}
        access.
      </p>
      <pre className='overflow-auto rounded-md bg-gray-900 px-4 py-3 text-2xs leading-normal text-gray-300'>
        infra login {window.location.host}
        <br />
        infra use {resource}
        <br />
        kubectl get pods
      </pre>
    </section>
  )
}

export default function DestinationDetail() {
  const router = useRouter()
  const destinationId = router.query.id

  const { data: destination } = useSWR(`/api/destinations/${destinationId}`)

  const { admin } = useAdmin()
  const { data: auth } = useSWR('/api/users/self')
  const { data: { items: users } = {} } = useSWR('/api/users?limit=1000')
  const { data: { items: groups } = {} } = useSWR('/api/groups?limit=1000')
  const { data: { items: grants } = {}, mutate } = useSWR(
    `/api/grants?resource=${destination?.name}&limit=1000`
  )
  const { data: { items: inherited } = {} } = useSWR(() =>
    parent(destination?.name)
      ? `/api/grants?resource=${parent(destination?.name)}&limit=1000`
      : null
  )

  const empty =
    grants?.length === 0 &&
    (parent(destination?.name) ? inherited?.length === 0 : true)
  const metadata = [
    { title: 'ID', data: destination?.id || '-' },
    { title: 'Kind', data: destination?.kind || '-' },
    {
      title: 'Added',
      data: destination?.created ? dayjs(destination?.created).fromNow() : '-',
    },
    {
      title: 'Updated',
      data: destination?.updated
        ? dayjs(destination.upd?.updated).fromNow()
        : '-',
    },
    {
      title: 'Connector Version',
      data: destination?.version || '-',
    },
  ]

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      {admin && (
        <section>
          <h3 className='border-b border-gray-800 py-4 text-3xs uppercase text-gray-400'>
            Access
          </h3>
          <GrantForm
            roles={destination?.roles}
            onSubmit={async ({ user, group, privilege }) => {
              // don't add grants that already exist
              if (
                grants?.find(
                  g =>
                    g.user === user &&
                    g.group === group &&
                    g.privilege === privilege
                )
              ) {
                return false
              }

              const res = await fetch('/api/grants', {
                method: 'POST',
                body: JSON.stringify({
                  user,
                  group,
                  privilege,
                  resource: destination?.name,
                }),
              })

              mutate({ items: [...grants, await res.json()] })
            }}
          />
          <div className='mt-4'>
            {empty && (
              <EmptyData>
                <div className='mt-6'>No access</div>
              </EmptyData>
            )}
            {grants
              ?.sort(sortByPrivilege)
              ?.sort(sortBySubject)
              ?.map(g => (
                <div
                  key={g.id}
                  className='flex items-center justify-between text-2xs'
                >
                  <div className='truncate'>
                    {users?.find(u => u.id === g.user)?.name}
                    {groups?.find(group => group.id === g.group)?.name}
                  </div>
                  <RoleSelect
                    role={g.privilege}
                    roles={destination.roles}
                    remove
                    onRemove={async () => {
                      await fetch(`/api/grants/${g.id}`, { method: 'DELETE' })
                      mutate({ items: grants.filter(x => x.id !== g.id) })
                    }}
                    onChange={async privilege => {
                      if (privilege === g.privilege) {
                        return
                      }

                      const res = await fetch('/api/grants', {
                        method: 'POST',
                        body: JSON.stringify({
                          ...g,
                          privilege,
                        }),
                      })

                      // delete old grant
                      await fetch(`/api/grants/${g.id}`, { method: 'DELETE' })

                      mutate({
                        items: [
                          ...grants.filter(f => f.id !== g.id),
                          await res.json(),
                        ],
                      })
                    }}
                    direction='left'
                  />
                </div>
              ))}
            {inherited
              ?.sort(sortByPrivilege)
              ?.sort(sortBySubject)
              ?.map(g => (
                <div
                  key={g.id}
                  className='flex items-center justify-between text-2xs'
                >
                  <div className='truncate'>
                    {users?.find(u => u.id === g.user)?.name}
                    {groups?.find(group => group.id === g.group)?.name}
                  </div>
                  <div className='flex flex-none'>
                    <div
                      title='This access is inherited by a parent resource and cannot be edited here'
                      className='relative mx-1 self-center rounded border border-gray-800 bg-gray-800 px-2 pt-px text-2xs text-gray-400'
                    >
                      inherited
                    </div>
                    <div className='relative w-32 flex-none py-2 pl-3 pr-8 text-left text-2xs text-gray-400'>
                      {g.privilege}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
      <ConnectSection
        userID={auth?.id}
        kind={destination?.kind}
        resource={destination?.name}
      />
      <section>
        <h3 className='border-b border-gray-800 py-4 text-3xs uppercase text-gray-400'>
          Metadata
        </h3>
        <Metadata data={metadata} />
      </section>
      {admin && destination?.id && (
        <section className='flex flex-1 flex-col items-end justify-end py-6'>
          <RemoveButton
            onRemove={async () => {
              await fetch(`/api/destinations/${destination?.id}`, {
                method: 'DELETE',
              })

              router.replace('/destinations')
            }}
            modalTitle='Remove Cluster'
            modalMessage={
              <>
                Are you sure you want to disconnect{' '}
                <span className='font-bold text-white'>
                  {destination?.name}?
                </span>
                <br />
                Note: you must also uninstall the Infra Connector from this
                cluster.
              </>
            }
          />
        </section>
      )}
    </div>
  )
}

DestinationDetail.layout = page => {
  return <Dashboard>{page}</Dashboard>
}
