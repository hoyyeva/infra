import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/outline'

export default function EmptyTable({
  title,
  subtitle,
  icon,
  buttonText,
  buttonHref,
}) {
  return (
    <div className='mx-auto my-20 flex flex-1 flex-col justify-center text-center'>
      <span className='mx-auto my-4 h-7 w-7'>{icon}</span>
      <h1 className='mb-2 text-base font-bold'>{title}</h1>
      <h2 className='mx-auto mb-4 max-w-xs text-2xs text-gray-400 dark:text-gray-300'>
        {subtitle}
      </h2>
      {buttonHref && (
        <Link href={buttonHref} data-testid='empty-table-button-link'>
          <button className='my-2 mx-auto flex items-center rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800'>
            <PlusIcon className='mr-1 h-2.5 w-2.5' />
            <div className='text-2xs leading-none'>{buttonText}</div>
          </button>
        </Link>
      )}
    </div>
  )
}
