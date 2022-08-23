import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { KeyIcon } from '@heroicons/react/outline'

import Dashboard from '../../components/layouts/dashboard'
import Notification from '../../components/notification'
import PasswordReset from '../../components/password-reset'
import PageHeader from '../../components/page-header'

export default function Account() {
  const { data: auth } = useSWR('/api/users/self')
  const router = useRouter()

  const { resetPassword } = router.query

  const [showNotification, setshowNotification] = useState(false)

  const hasInfraProvider = auth?.providerNames.includes('infra')

  useEffect(() => {
    if (resetPassword && resetPassword === 'success') {
      setshowNotification(true)
    }
  }, [resetPassword])

  return (
    <div>
      <Head>
        <title>Account - Infra</title>
      </Head>
      <div className='md:px-6 xl:px-20 2xl:m-auto 2xl:max-w-6xl'>
        <div className='pb-6'>
          <PageHeader header='Account' />
        </div>
        <div className='px-4 sm:px-6 xl:px-0'>
          {auth && hasInfraProvider && (
            <div className='flex flex-1 flex-col space-y-8'>
              <div className='pt-6'>
                <div className='flex flex-row items-center space-x-2'>
                  <KeyIcon className='h-6 w-6 dark:text-white' />
                  <div>
                    <h1 className='text-base'>Reset Password</h1>
                  </div>
                </div>
                <div className='flex flex-col space-y-2 pt-6'>
                  <PasswordReset />
                </div>
              </div>

              {showNotification && (
                <Notification
                  text='Password Successfully Reset'
                  onClose={() => {
                    setshowNotification(false)
                    router.replace('/account?tab=password')
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

Account.layout = function (page) {
  return <Dashboard>{page}</Dashboard>
}
