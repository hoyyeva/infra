import { CheckCircleIcon } from '@heroicons/react/outline'
import { XIcon } from '@heroicons/react/solid'

export default function Notification({ text, onClose }) {
  return (
    <div
      aria-live='assertive'
      className='pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6'
    >
      <div className='fixed bottom-10 right-6 flex w-full flex-col items-center space-y-4 sm:items-end'>
        <div className='pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5'>
          <div className='p-4'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <CheckCircleIcon
                  className='h-6 w-6 text-white'
                  aria-hidden='true'
                />
              </div>
              <div className='ml-3 w-0 flex-1 pt-0.5'>
                <p className='text-sm text-white'>{text}</p>
              </div>
              <div className='ml-4 flex flex-shrink-0'>
                <button
                  data-testid='notification-remove-button'
                  type='button'
                  className='inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none'
                  onClick={onClose}
                >
                  <XIcon className='h-5 w-5' aria-hidden='true' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
