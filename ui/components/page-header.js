import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/outline'

export default function PageHeader({ header, buttonLabel, buttonHref }) {
  return (
    <div className='z-10 flex min-h-[40px] flex-none items-center justify-between py-3 px-6'>
      <h1 className='py-3 text-base font-semibold'>{header}</h1>
      {buttonHref && (
        <Link href={buttonHref} data-testid='page-header-button-link'>
          <button className='flex items-center rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'>
            <PlusIcon className='mr-1 h-3 w-3' />
            <div className='text-2xs leading-none'>{buttonLabel}</div>
          </button>
        </Link>
      )}
    </div>
  )
}
