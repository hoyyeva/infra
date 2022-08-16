import Head from 'next/head'
import Link from 'next/link'
import { useState, useRef } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { useRouter } from 'next/router'
import { UserGroupIcon } from '@heroicons/react/outline'

import ErrorMessage from '../../components/error-message'
import TypeaheadCombobox from '../../components/typeahead-combobox'
import Dashboard from '../../components/layouts/dashboard'

function EmailsSelectInput({ selectedEmails, setSelectedEmails }) {
  const { data: { items: users } = { items: [] } } = useSWR(
    '/api/users?limit=1000'
  )

  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const selectedEmailsId = selectedEmails.map(i => i.id)

  const filteredEmail = [...users.map(u => ({ ...u, user: true }))]
    .filter(s => s?.name?.toLowerCase()?.includes(query.toLowerCase()))
    .filter(s => !selectedEmailsId?.includes(s.id))

  function removeSelectedEmail(email) {
    setSelectedEmails(selectedEmails.filter(item => item.id !== email.id))
  }

  function handleKeyDownEvent(key) {
    if (key === 'Backspace' && inputRef.current.value.length === 0) {
      removeSelectedEmail(selectedEmails[selectedEmails.length - 1])
    }
  }

  return (
    <div className='bg-gray-100 px-4 py-3 dark:bg-gray-900'>
      <TypeaheadCombobox
        selectedEmails={selectedEmails}
        setSelectedEmails={setSelectedEmails}
        onRemove={removedEmail => removeSelectedEmail(removedEmail)}
        inputRef={inputRef}
        setQuery={setQuery}
        filteredEmail={filteredEmail}
        onKeyDownEvent={key => handleKeyDownEvent(key)}
      />
    </div>
  )
}

export default function GroupsAdd() {
  const { mutate } = useSWRConfig()

  const [groupName, setGroupName] = useState('')
  const [emails, setEmails] = useState([])
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const router = useRouter()

  const handleGroupNameInputChange = value => {
    setGroupName(value)
    setError('')
  }

  const addUsersToGroup = async groupId => {
    const usersToAdd = emails.map(email => email.id)

    try {
      const res = await fetch(`/api/groups/${groupId}/users`, {
        method: 'PATCH',
        body: JSON.stringify({ usersToAdd }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw data
      }

      await mutate('/api/groups')

      router.replace('/groups')
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
    }
  }

  const handleCreateGroup = async () => {
    setErrors({})
    setError('')

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: groupName }),
      })

      const group = await res.json()

      if (!res.ok) {
        throw group
      } else {
        addUsersToGroup(group.id)
      }
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
    }
  }

  return (
    <>
      <Head>
        <title>Create Group</title>
      </Head>
      <div className='space-y-4 px-4 py-5 md:px-6 xl:px-0'>
        <div className='flex flex-col'>
          <div className='flex flex-row items-center space-x-2'>
            <UserGroupIcon className='h-6 w-6 dark:text-white' />
            <div>
              <h1 className='text-sm'>Create Group</h1>
            </div>
          </div>
          <div className='mt-6 flex flex-col space-y-1'>
            <div className='mt-4'>
              <label className='text-3xs font-semibold uppercase dark:text-gray-400'>
                Name Your Group
              </label>
              <input
                autoFocus
                spellCheck='false'
                type='search'
                placeholder='enter the group name here'
                value={groupName}
                onChange={e => handleGroupNameInputChange(e.target.value)}
                className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
                  errors.name ? 'border-pink-500' : 'border-gray-800'
                }`}
              />
              {errors && <ErrorMessage message={errors.name} />}
            </div>
            <section className='flex flex-col pt-10 pb-2'>
              <EmailsSelectInput
                selectedEmails={emails}
                setSelectedEmails={setEmails}
              />
            </section>
          </div>
          <div className='mt-6 flex flex-row items-center justify-start'>
            <Link href='/groups'>
              <a className='-ml-4 border-0 px-4 py-2 text-4xs uppercase hover:text-gray-400 dark:text-gray-400 dark:hover:text-white'>
                Cancel
              </a>
            </Link>
            <button
              type='button'
              onClick={() => handleCreateGroup()}
              disabled={!groupName}
              className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'
            >
              Create Group
            </button>
          </div>
        </div>
        {error && <ErrorMessage message={error} />}
      </div>
    </>
  )
}

// GroupsAdd.layout = page => <Fullscreen closeHref='/groups'>{page}</Fullscreen>
GroupsAdd.layout = page => {
  return <Dashboard>{page}</Dashboard>
}
