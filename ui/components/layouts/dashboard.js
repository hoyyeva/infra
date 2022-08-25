import Link from 'next/link'
import { Fragment, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR, { useSWRConfig } from 'swr'
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  ChipIcon,
  UserGroupIcon,
  UserIcon,
  ViewGridIcon,
  XIcon,
  MenuAlt2Icon,
  CogIcon,
} from '@heroicons/react/outline'

import { useAdmin } from '../../lib/admin'
import AuthRequired from '../auth-required'

function Nav({ navigation, admin }) {
  const router = useRouter()

  return (
    <>
      <div className='mb-2 flex flex-shrink-0 select-none items-center'>
        <Link href='/'>
          <a>
            <img className='h-8' src='/InfraLogo.svg' alt='Infra' />
          </a>
        </Link>
      </div>
      <div className='mt-5 h-0 flex-1 overflow-y-auto'>
        <nav className='flex-1 space-y-1'>
          {navigation
            ?.filter(n => (n.admin ? admin : true))
            .map(item => (
              <Link key={item.name} href={item.href}>
                <a
                  className={`
                          ${
                            router.asPath.startsWith(item.href)
                              ? 'text-gray-900'
                              : 'text-gray-400  hover:text-gray-500'
                          }
                        group flex items-center rounded-md py-2 text-sm font-medium`}
                >
                  <item.testIcon
                    className={`
                            ${
                              router.asPath.startsWith(item.href)
                                ? 'text-gray-900'
                                : 'text-gray-400 group-hover:text-gray-500'
                            }
                            mr-4 h-5 w-5 flex-shrink-0
                          `}
                    aria-hidden='true'
                  />
                  {item.name}
                </a>
              </Link>
            ))}
        </nav>
      </div>
    </>
  )
}

function SidebarNav({ children, open, setOpen }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as='div' className='relative z-40 md:hidden' onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter='transition-opacity ease-linear duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='transition-opacity ease-linear duration-300'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-gray-600 bg-opacity-75' />
        </Transition.Child>

        <div className='fixed inset-0 z-40 flex'>
          <Transition.Child
            as={Fragment}
            enter='transition ease-in-out duration-300 transform'
            enterFrom='-translate-x-full'
            enterTo='translate-x-0'
            leave='transition ease-in-out duration-300 transform'
            leaveFrom='translate-x-0'
            leaveTo='-translate-x-full'
          >
            <Dialog.Panel className='relative flex w-full max-w-xs flex-1 flex-col bg-white px-6 pt-5 pb-4'>
              <Transition.Child
                as={Fragment}
                enter='ease-in-out duration-300'
                enterFrom='opacity-0'
                enterTo='opacity-100'
                leave='ease-in-out duration-300'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
              >
                <div className='absolute top-0 right-0 -mr-12 pt-2'>
                  <button
                    type='button'
                    className='justify-cente ml-1 flex h-10 w-10 items-center'
                    onClick={() => setOpen(false)}
                  >
                    <span className='sr-only'>Close sidebar</span>
                    <XIcon
                      className='h-6 w-6 text-white hover:text-gray-600'
                      aria-hidden='true'
                    />
                  </button>
                </div>
              </Transition.Child>
              {children}
            </Dialog.Panel>
          </Transition.Child>
          <div className='w-14 flex-shrink-0'>
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

function Layout({ children }) {
  const router = useRouter()
  const { asPath } = router

  const { data: auth } = useSWR('/api/users/self')
  const { admin, loading } = useAdmin()
  const { mutate } = useSWRConfig()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [asPathList, setAsPathList] = useState([
    ...new Set(
      asPath
        .split('/')
        .filter(n => n)
        .map(name => {
          return name.split('?')[0]
        })
    ),
  ])

  useEffect(
    () =>
      setAsPathList([
        ...new Set(
          asPath
            .split('/')
            .filter(n => n)
            .map(name => {
              return name.split('?')[0]
            })
        ),
      ]),
    [asPath]
  )

  const accessToSettingsPage = admin || auth?.providerNames?.includes('infra')

  if (loading) {
    return null
  }

  async function logout() {
    await fetch('/api/logout', {
      method: 'POST',
    })
    await mutate('/api/users/self', async () => undefined)
    router.replace('/login')
  }

  const navigation = [
    {
      name: 'Clusters',
      href: '/destinations',
      testIcon: ChipIcon,
      icon: '/destinations.svg',
      heroIcon: <ChipIcon />,
    },
    {
      name: 'Providers',
      href: '/providers',
      icon: '/providers.svg',
      admin: true,
      testIcon: ViewGridIcon,
      heroIcon: <ViewGridIcon />,
    },
    {
      name: 'Groups',
      href: '/groups',
      icon: '/groups.svg',
      admin: true,
      testIcon: UserGroupIcon,
      heroIcon: <UserGroupIcon />,
    },
    {
      name: 'Users',
      href: '/users',
      icon: '/users.svg',
      admin: true,
      testIcon: UserIcon,
      heroIcon: <UserIcon />,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: '/providers.svg',
      admin: true,
      testIcon: CogIcon,
      heroIcon: <CogIcon />,
    },
  ]

  const subNavigation = [
    { name: 'Account', href: '/account', admin: accessToSettingsPage },
  ]

  // redirect non-admin routes if user isn't admin
  if (router.pathname.startsWith('/account') && !accessToSettingsPage) {
    router.replace('/')
    return null
  }

  for (const n of [...navigation]) {
    if (router.pathname.startsWith(n.href) && n.admin && !admin) {
      router.replace('/')
      return null
    }
  }

  return (
    <div>
      <SidebarNav open={sidebarOpen} setOpen={setSidebarOpen}>
        <Nav navigation={navigation} admin={admin} />
      </SidebarNav>
      <div className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col'>
        <div className='flex flex-grow flex-col overflow-y-auto border-r border-gray-100 px-6 pt-5 pb-4'>
          <Nav navigation={navigation} admin={admin} />
        </div>
      </div>

      <div className='md:pl-64'>
        <div className='mx-auto flex flex-col px-0 md:px-10 xl:px-[8rem] 2xl:m-auto 2xl:max-w-6xl'>
          <div className='sticky top-0 flex h-16 flex-shrink-0 bg-white'>
            <button
              type='button'
              className='px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden'
              onClick={() => setSidebarOpen(true)}
            >
              <span className='sr-only'>Open sidebar</span>
              <MenuAlt2Icon className='h-6 w-6' aria-hidden='true' />
            </button>
            <div className='flex flex-1 justify-between px-4 md:px-6 xl:px-0'>
              <div className='m-auto flex flex-1 items-center'>
                {!router.pathname.startsWith('/account') &&
                  asPathList?.map((item, index, arr) => {
                    const href = arr.slice(0, index + 1).join('/')
                    const currentPath = [
                      ...new Set(
                        asPath
                          .split('/')
                          .filter(n => n)
                          .map(name => {
                            return name.split('?')[0]
                          })
                      ),
                    ].join('/')

                    const current = currentPath === href

                    return (
                      <Link key={item} href={`/${href}`}>
                        <a
                          className={`text-sm capitalize hover:text-gray-500 ${
                            current ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {item}{' '}
                          {index !== arr.length - 1 && (
                            <span className='mx-2'> / </span>
                          )}
                        </a>
                      </Link>
                    )
                  })}
              </div>
              <div className='ml-4 flex items-center md:ml-6'>
                {/* User dropdown */}
                <Menu as='div' className='relative inline-block text-left'>
                  <span className='sr-only'>Open current user menu</span>
                  <Menu.Button className='flex h-8 w-8 select-none items-center justify-center rounded-full bg-gray-800'>
                    <span className='text-center text-xs font-normal capitalize leading-none text-white'>
                      {auth?.name?.[0]}
                    </span>
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter='transition ease-out duration-100'
                    enterFrom='transform opacity-0 scale-95'
                    enterTo='transform opacity-100 scale-100'
                    leave='transition ease-in duration-75'
                    leaveFrom='transform opacity-100 scale-100'
                    leaveTo='transform opacity-0 scale-95'
                  >
                    <Menu.Items className='absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
                      <div className='px-4 py-3'>
                        <p className='text-sm'>Signed in as</p>
                        <p className='truncate text-sm font-semibold text-gray-900'>
                          {auth?.name}
                        </p>
                      </div>
                      <div className='py-1'>
                        {subNavigation.map(item => (
                          <Menu.Item href={item.href} key={item.name}>
                            <a className='block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100'>
                              {item.name}
                            </a>
                          </Menu.Item>
                        ))}
                      </div>
                      <div className='py-1'>
                        <Menu.Item>
                          <button
                            type='button'
                            onClick={() => logout()}
                            className='block w-full py-2 px-4 text-left text-sm text-gray-700 hover:bg-gray-100'
                          >
                            Sign out
                          </button>
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          <main className='flex-1'>
            <div className=' py-6'>{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard(props) {
  return (
    <AuthRequired>
      <Layout {...props} />
    </AuthRequired>
  )
}
