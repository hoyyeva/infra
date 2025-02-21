import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import useSWR from 'swr'
import '@testing-library/jest-dom'

import Login, { Providers } from '../pages/login/index'

function mockedProviders() {
  return {
    data: {
      items: [],
    },
  }
}

jest.mock('swr', () => {
  return {
    __esModule: true,
    default: jest.fn(mockedProviders),
    useSWRConfig: jest.fn(() => ({
      mutate: () => {},
    })),
  }
})

const providers = {
  data: {
    items: [
      {
        id: 0,
        name: 'Okta',
        kind: 'okta',
        url: 'example@okta.com',
      },
      {
        id: 1,
        name: 'Azure Active Directory',
        kind: 'azure',
        url: 'example@azure.com',
      },
    ],
  },
}

describe('Login Component', () => {
  it('should render', () => {
    expect(() => render(<Login />)).not.toThrow()
  })

  it('should render with correct state', () => {
    render(<Login />)

    expect(screen.getByText('Login to Infra')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByText('Login').closest('button')).toBeDisabled()
  })

  it('should render with no provider', () => {
    render(<Login />)

    expect(
      screen.queryByText('Welcome back. Login with your credentials')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('or via your identity provider.')
    ).not.toBeInTheDocument()
  })

  it('it renders with multiple providers', () => {
    useSWR.mockReturnValue(providers)

    render(<Login />)

    expect(
      screen.getByText(
        'Welcome back. Login with your credentials or via your identity provider.'
      )
    ).toBeInTheDocument()
  })

  it('should not enable the login button when enter username only', () => {
    render(<Login />)

    const usernameInput = screen.getByLabelText('Email')
    fireEvent.change(usernameInput, {
      target: { value: 'example@infrahq.com' },
    })
    expect(screen.getByLabelText('Email')).toHaveValue('example@infrahq.com')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByText('Login').closest('button')).toBeDisabled()
  })

  it('should enable the login button when enter both username and password', () => {
    render(<Login />)

    const usernameInput = screen.getByLabelText('Email')
    fireEvent.change(usernameInput, {
      target: { value: 'example@infrahq.com' },
    })

    const passwordInput = screen.getByLabelText('Password')
    fireEvent.change(passwordInput, {
      target: { value: 'password' },
    })

    expect(screen.getByLabelText('Email')).toHaveValue('example@infrahq.com')
    expect(screen.getByLabelText('Password')).toHaveValue('password')
    expect(screen.getByText('Login').closest('button')).not.toBeDisabled()
  })
})

describe('Providers Component', () => {
  it('should render', () => {
    expect(() =>
      render(<Providers providers={providers.data.items} />)
    ).not.toThrow()
  })

  it('should render the correct images based on the kind of the provider', () => {
    const { items } = providers.data
    const { getAllByAltText } = render(<Providers providers={items} />)

    const image = getAllByAltText('identity provider icon')

    expect(image[0]).toHaveAttribute('src', `/providers/${items[0].kind}.svg`)
    expect(image[1]).toHaveAttribute('src', `/providers/${items[1].kind}.svg`)
  })

  it('should not render Single Sign-On as the button title', () => {
    const { items } = providers.data
    render(<Providers providers={items} />)

    expect(screen.queryByText('Single Sign-On')).not.toBeInTheDocument()
  })
})
