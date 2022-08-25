import useSWR from 'swr'
import { useRouter } from 'next/router'

export default function Login({ children }) {
  const { data: auth, error } = useSWR('/api/users/self')
  const router = useRouter()

  if (!auth && !error) {
    return null
  }

  if (auth?.id) {
    // TODO (https://github.com/infrahq/infra/issues/1441): remove me when
    // using an OTP doesn't trigger authentication
    if (router.pathname !== '/login/finish') {
      router.replace('/')
      return null
    }
  }

  return (
    <div className='mt-8 flex min-h-full flex-col justify-center sm:mx-auto sm:w-full sm:max-w-md'>
      <div className='flex flex-col items-center justify-center bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
        <div className='mb-4 rounded-full border border-gray-300 p-2'>
          <img alt='infra icon' className='h-14 w-14' src='/infra-color.svg' />
        </div>
        {children}
      </div>
    </div>
  )
}
