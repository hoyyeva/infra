import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'
import useSWR from 'swr'
import DeleteModal from '../../components/delete-modal'
import EmptyData from '../../components/empty-data'
import Dashboard from '../../components/layouts/dashboard'
import Metadata from '../../components/metadata'
import RemoveButton from '../../components/remove-button'
import RoleSelect from '../../components/role-select'
import { useAdmin } from '../../lib/admin'
import { sortByResource } from '../../lib/grants'

export default function UserDetail() {
  const router = useRouter()
  const userId = router.query.uid

  const { data: user } = useSWR(`/api/users/${userId}`)
  const { data: auth } = useSWR('/api/users/self')

  const { data: { items } = {}, mutate } = useSWR(
    `/api/grants?user=${user?.id}&showInherited=1&limit=1000`
  )
  const { data: { items: groups } = {}, mutate: mutateGroups } = useSWR(
    `/api/groups?userID=${user?.id}&limit=1000`
  )

  const { data: { items: infraAdmins } = {} } = useSWR(
    '/api/grants?resource=infra&privilege=admin&limit=1000'
  )

  const [open, setOpen] = useState(false)
  const { admin, loading: adminLoading } = useAdmin()

  const grants = items?.filter(g => g.resource !== 'infra')
  const adminGroups = infraAdmins?.map(admin => admin.group)
  const metadata = [
    { title: 'ID', data: user?.id },
    {
      title: 'Created',
      data: user?.created ? dayjs(user.created).fromNow() : '-',
    },
    { title: 'Providers', data: user?.providerNames.join(', ') },
  ]

  const loading = [!adminLoading, auth, grants, groups].some(x => !x)

  const handleRemoveGroupFromUser = async groupId => {
    const usersToRemove = [user.id]
    await fetch(`/api/groups/${groupId}/users`, {
      method: 'PATCH',
      body: JSON.stringify({ usersToRemove }),
    })
    mutateGroups({
      items: groups.filter(i => i.id !== groupId),
    })
  }

  return (
    !loading && (
      <div className='flex flex-1 flex-col space-y-6'>
        {admin && (
          <>
            <section>
              <h3 className='mb-4 border-b border-gray-800 py-4 text-3xs uppercase text-gray-400'>
                Access
              </h3>
              {grants
                ?.sort(sortByResource)
                ?.sort((a, b) => {
                  if (a.user === user.id) {
                    return -1
                  }

                  if (b.user === user.id) {
                    return 1
                  }

                  return 0
                })
                .map(g => (
                  <div
                    key={g.id}
                    className='flex items-center justify-between text-2xs'
                  >
                    <div>{g.resource}</div>
                    {g.user !== user.id ? (
                      <div className='flex'>
                        <div
                          title='This access is inherited by a group and cannot be edited here'
                          className='relative mx-1 self-center rounded border border-gray-800 bg-gray-800 px-2 pt-px text-2xs text-gray-400'
                        >
                          inherited
                        </div>
                        <div className='relative w-32 flex-none py-2 pl-3 pr-8 text-left text-2xs text-gray-400'>
                          {g.privilege}
                        </div>
                      </div>
                    ) : (
                      <RoleSelect
                        role={g.privilege}
                        resource={g.resource}
                        remove
                        direction='left'
                        onRemove={async () => {
                          await fetch(`/api/grants/${g.id}`, {
                            method: 'DELETE',
                          })
                          mutate({ items: grants.filter(x => x.id !== g.id) })
                        }}
                        onChange={async privilege => {
                          const res = await fetch('/api/grants', {
                            method: 'POST',
                            body: JSON.stringify({
                              ...g,
                              privilege,
                            }),
                          })

                          // delete old grant
                          await fetch(`/api/grants/${g.id}`, {
                            method: 'DELETE',
                          })
                          mutate({
                            items: [
                              ...grants.filter(f => f.id !== g.id),
                              await res.json(),
                            ],
                          })
                        }}
                      />
                    )}
                  </div>
                ))}
              {!grants?.length && !loading && (
                <EmptyData>
                  <div className='mt-6'>No access</div>
                </EmptyData>
              )}
            </section>
            <section>
              <h3 className='border-b border-gray-800 py-4 text-3xs uppercase text-gray-400'>
                Groups
              </h3>
              <div className='mt-4'>
                {groups?.length === 0 && (
                  <EmptyData>
                    <div className='mt-6'>No groups</div>
                  </EmptyData>
                )}
                {groups.map(group => {
                  return (
                    <div
                      key={group.id}
                      className='group flex items-center justify-between truncate text-2xs'
                    >
                      <div className='py-2'>{group.name}</div>

                      <div className='flex justify-end text-right opacity-0 group-hover:opacity-100'>
                        <button
                          onClick={() =>
                            auth?.id === user?.id &&
                            adminGroups?.includes(group.id)
                              ? setOpen(true)
                              : handleRemoveGroupFromUser(group.id)
                          }
                          className='-mr-2 flex-none cursor-pointer px-2 py-1 text-2xs text-gray-500 hover:text-violet-100'
                        >
                          Remove
                        </button>
                        <DeleteModal
                          open={open}
                          setOpen={setOpen}
                          primaryButtonText='Remove'
                          onSubmit={() => handleRemoveGroupFromUser(group.id)}
                          title='Remove Group'
                          message='Are you sure you want to remove yourself from this group? You will lose any access that this group grants.'
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
        <section>
          <h3 className='border-b border-gray-800 py-4 text-3xs uppercase text-gray-400'>
            Metadata
          </h3>
          <Metadata data={metadata} />
        </section>
        <section className='flex flex-1 flex-col items-end justify-end py-6'>
          {auth.id !== user?.id && (
            <RemoveButton
              onRemove={async () => {
                await fetch(`/api/users/${userId}`, {
                  method: 'DELETE',
                })

                router.replace('/users')
              }}
              modalTitle='Remove User'
              modalMessage={
                <>
                  Are you sure you want to remove{' '}
                  <span className='font-bold text-white'>{user?.name}?</span>
                </>
              }
            />
          )}
        </section>
      </div>
    )
  )
}

UserDetail.layout = page => {
  return <Dashboard>{page}</Dashboard>
}
