import { useRouter } from 'next/router'
import useSWR from 'swr'
import dayjs from 'dayjs'

import { useAdmin } from '../../lib/admin'

import RemoveButton from '../../components/remove-button'
import Metadata from '../../components/metadata'
import Dashboard from '../../components/layouts/dashboard'

export default function ProviderDetail() {
  const router = useRouter()
  const providerId = router.query.pid

  const { data: provider } = useSWR(`/api/providers/${providerId}`)
  const { admin, loading: adminLoading } = useAdmin()

  const metadata = [
    { title: 'Name', data: provider?.name },
    { title: 'URL', data: provider?.url },
    { title: 'Client ID', data: provider?.clientID },
    {
      title: 'Added',
      data: provider?.created ? dayjs(provider?.created).fromNow() : '-',
    },
    {
      title: 'Updated',
      data: provider?.updated ? dayjs(provider?.updated).fromNow() : '-',
    },
  ]
  const loading = adminLoading || !provider

  return (
    !loading && (
      <div>
        <section>
          <h3 className='border-b border-gray-800 py-4 text-3xs uppercase text-gray-400'>
            Metadata
          </h3>
          <Metadata data={metadata} />
        </section>
        {admin && (
          <section className='flex flex-1 flex-col items-end justify-end py-6'>
            <RemoveButton
              onRemove={async () => {
                await fetch(`/api/providers/${providerId}`, {
                  method: 'DELETE',
                })

                router.replace('/providers')
              }}
              modalTitle='Remove Identity Provider'
              modalMessage={
                <>
                  Are you sure you want to delete{' '}
                  <span className='font-bold text-white'>{provider?.name}</span>
                  ? This action cannot be undone.
                </>
              }
            />
          </section>
        )}
      </div>
    )
  )
}

ProviderDetail.layout = page => {
  return <Dashboard>{page}</Dashboard>
}
