// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/router'
// import Head from 'next/head'
// import Link from 'next/link'
// import { useSWRConfig } from 'swr'

// import { providers } from '../../../lib/providers'

// import ErrorMessage from '../../../components/error-message'
// import Dashboard from '../../../components/layouts/dashboard'
// import { ViewGridIcon } from '@heroicons/react/outline'

// function Provider({ kind, name, selected }) {
//   console.log(kind)
//   console.log(selected)
//   return (
//     <div
//       className={`${
//         selected ? 'bg-gray-100' : 'bg-white'
//       } flex cursor-pointer select-none items-center rounded-lg border border-gray-800 bg-transparent px-3
//         py-4 hover:bg-gray-100`}
//     >
//       <img
//         alt='provider icon'
//         className='mr-4 w-6 flex-none'
//         src={`/providers/${kind}.svg`}
//       />
//       <div>
//         <h3 className='flex-1 text-2xs'>{name}</h3>
//       </div>
//     </div>
//   )
// }

// export default function ProvidersAddDetails() {
//   const router = useRouter()
//   const { kind } = router.query

//   const { mutate } = useSWRConfig()

//   const [providerKind, setProviderKind] = useState(
//     kind === undefined ? 'okta' : kind
//   )
//   const [url, setURL] = useState(kind === 'google' ? 'accounts.google.com' : '')
//   const [clientID, setClientID] = useState('')
//   const [clientSecret, setClientSecret] = useState('')
//   const [privateKey, setPrivateKey] = useState('')
//   const [clientEmail, setClientEmail] = useState('')
//   const [domainAdminEmail, setDomainAdminEmail] = useState('')
//   const [error, setError] = useState('')
//   const [errors, setErrors] = useState({})
//   const [name, setName] = useState(providerKind)

//   useEffect(() => setName(providerKind), [providerKind])

//   function docLink() {
//     if (kind == 'azure') {
//       return 'https://infrahq.com/docs/identity-providers/azure-ad'
//     }

//     return 'https://infrahq.com/docs/identity-providers/' + kind
//   }

//   async function onSubmit(e) {
//     e.preventDefault()

//     setErrors({})
//     setError('')

//     const api = {
//       privateKey,
//       clientEmail,
//       domainAdminEmail: domainAdminEmail,
//     }

//     try {
//       await mutate(
//         '/api/providers',
//         async ({ items: providers } = { items: [] }) => {
//           const res = await fetch('/api/providers', {
//             method: 'POST',
//             body: JSON.stringify({
//               name,
//               url,
//               clientID,
//               clientSecret,
//               kind: providerKind,
//               api,
//             }),
//           })

//           const data = await res.json()

//           if (!res.ok) {
//             throw data
//           }

//           return { items: [...providers, data] }
//         }
//       )
//     } catch (e) {
//       if (e.fieldErrors) {
//         const errors = {}
//         for (const error of e.fieldErrors) {
//           errors[error.fieldName.toLowerCase()] =
//             error.errors[0] || 'invalid value'
//         }
//         setErrors(errors)
//       } else {
//         setError(e.message)
//       }

//       return false
//     }

//     router.replace('/providers')

//     return false
//   }

//   const parseGoogleCredentialFile = e => {
//     setErrors({})

//     const fileReader = new FileReader()
//     fileReader.readAsText(e.target.files[0], 'UTF-8')
//     fileReader.onload = e => {
//       let errMsg = ''
//       try {
//         let contents = JSON.parse(e.target.result)

//         if (contents.private_key === undefined) {
//           errMsg = 'invalid service account key file, no private_key found'
//         } else {
//           setPrivateKey(contents.private_key)
//         }

//         if (contents.client_email === undefined) {
//           errMsg = 'invalid service account key file, no client_email found'
//         } else {
//           setClientEmail(contents.client_email)
//         }
//       } catch (e) {
//         errMsg = e.ErrorMessage
//         if (e instanceof SyntaxError) {
//           errMsg = 'invalid service account key file, must be json'
//         }
//       }

//       if (errMsg !== '') {
//         const errors = {}
//         errors['privatekey'] = errMsg
//         setErrors(errors)
//       }
//     }
//   }

//   return (
//     <>
//       <Head>
//         <title>Add Identity Provider - {providerKind}</title>
//       </Head>
//       <div className='flex flex-col'>
//         <div className='flex flex-row items-center space-x-2'>
//           <ViewGridIcon className='h-6 w-6 dark:text-white' />
//           <h1 className='text-sm'>Connect an Identity Provider</h1>
//         </div>
//         <div className='mt-11 grid grid-cols-1 gap-4 sm:grid-cols-4'>
//           {providers.map(
//             p =>
//               p.available && (
//                 <div
//                   key={p.name}
//                   onClick={() => {
//                     setProviderKind(p.kind)
//                     router.replace(`/providers/add/details?kind=${p.kind}`)
//                   }}
//                 >
//                   <Provider {...p} selected={p.kind === providerKind} />
//                 </div>
//               )
//           )}
//         </div>
//         <form onSubmit={onSubmit} className='mt-12'>
//           <div className='mb-8'>
//             <label className='text-2xs uppercase dark:text-gray-400'>
//               Name your provider
//             </label>
//             <input
//               required
//               type='search'
//               placeholder='choose a name for your identity provider'
//               value={name}
//               onChange={e => {
//                 setName(e.target.value)
//                 setErrors({})
//                 setError('')
//               }}
//               className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
//                 errors.name ? 'border-pink-500' : ''
//               }`}
//             />
//             {errors.name && <ErrorMessage message={errors.name} />}
//           </div>
//           <label className='text-2xs uppercase dark:text-gray-400'>
//             Additional details{' '}
//             <a
//               className='text-violet-100 underline'
//               target='_blank'
//               href={docLink()}
//               rel='noreferrer'
//             >
//               learn more
//             </a>
//           </label>
//           {providerKind !== 'google' && (
//             <div className='mt-4'>
//               <label className='text-2xs uppercase dark:text-gray-400'>
//                 URL (Domain)
//               </label>
//               <input
//                 required
//                 autoFocus
//                 placeholder='domain or URL'
//                 value={url}
//                 onChange={e => {
//                   setURL(e.target.value)
//                   setErrors({})
//                   setError('')
//                 }}
//                 className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
//                   errors.url ? 'border-pink-500' : ''
//                 }`}
//               />
//               {errors.url && <ErrorMessage message={errors.url} />}
//             </div>
//           )}
//           <div className='mt-4'>
//             <label className='text-2xs uppercase dark:text-gray-400'>
//               Client ID
//             </label>
//             <input
//               required
//               placeholder='client ID'
//               type='search'
//               value={clientID}
//               onChange={e => {
//                 setClientID(e.target.value)
//                 setErrors({})
//                 setError('')
//               }}
//               className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
//                 errors.clientid ? 'border-pink-500' : ''
//               }`}
//             />
//             {errors.clientid && <ErrorMessage message={errors.clientid} />}
//           </div>
//           <div className='my-4'>
//             <label className='text-2xs uppercase dark:text-gray-400'>
//               Client Secret
//             </label>
//             <input
//               required
//               type='password'
//               placeholder='client secret'
//               value={clientSecret}
//               onChange={e => {
//                 setClientSecret(e.target.value)
//                 setErrors({})
//                 setError('')
//               }}
//               className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
//                 errors.clientsecret ? 'border-pink-500' : ''
//               }`}
//             />
//             {errors.clientsecret && (
//               <ErrorMessage message={errors.clientsecret} />
//             )}
//           </div>
//           {providerKind === 'google' && (
//             <div>
//               <label className='text-2xs uppercase dark:text-gray-400'>
//                 Optional details{' '}
//                 <a
//                   className='text-violet-100 underline'
//                   target='_blank'
//                   href='https://infrahq.com/docs/identity-providers/google#groups' /* TODO: make sure this link works*/
//                   rel='noreferrer'
//                 >
//                   learn more
//                 </a>
//               </label>
//               <div className='mt-4'>
//                 <label className='text-2xs uppercase dark:text-gray-400'>
//                   Private Key
//                 </label>
//                 <input
//                   type='file'
//                   onChange={parseGoogleCredentialFile}
//                   className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
//                     errors.privatekey ? 'border-pink-500' : ''
//                   }`}
//                 />
//                 {errors.privatekey && (
//                   <ErrorMessage message={errors.privatekey} />
//                 )}
//               </div>
//               <div className='mt-4'>
//                 <label className='text-2xs uppercase dark:text-gray-400'>
//                   Workspace Domain Admin
//                 </label>
//                 <input
//                   placeholder='domain admin email'
//                   spellCheck='false'
//                   type='email'
//                   value={domainAdminEmail}
//                   onChange={e => {
//                     setDomainAdminEmail(e.target.value)
//                     setErrors({})
//                     setError('')
//                   }}
//                   className={`w-full border-b border-gray-300 bg-transparent px-px py-3 text-2xs placeholder:italic focus:border-b focus:border-gray-800 focus:outline-none dark:border-gray-900 dark:focus:border-gray-200 ${
//                     errors.domainadminemail ? 'border-pink-500' : ''
//                   }`}
//                 />
//                 {errors.domainadminemail && (
//                   <ErrorMessage message={errors.domainadminemail} />
//                 )}
//               </div>
//             </div>
//           )}
//           <div className='mt-6 flex flex-row items-center justify-start'>
//             <Link href='/providers'>
//               <a className='-ml-4 border-0 px-4 py-2 text-4xs uppercase hover:text-gray-400 dark:text-gray-400 dark:hover:text-white'>
//                 Cancel
//               </a>
//             </Link>
//             <button
//               type='submit'
//               disabled={!name || !url || !clientID || !clientSecret}
//               className='flex-none self-end rounded-md border border-gray-400 bg-gray-100 px-4 py-2 text-2xs hover:bg-gray-200 disabled:hover:bg-gray-200 dark:bg-gray-800 dark:text-white hover:dark:border-white hover:dark:bg-gray-800 dark:disabled:bg-gray-800'
//             >
//               Connect Provider
//             </button>
//           </div>
//         </form>
//         {error && <ErrorMessage message={error} center />}
//       </div>
//     </>
//   )
// }

// ProvidersAddDetails.layout = page => <Dashboard> {page}</Dashboard>
