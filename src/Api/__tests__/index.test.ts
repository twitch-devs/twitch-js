import { mocked } from 'ts-jest/utils'

import * as twitchTypes from '../../twitch'

import originalFetchUtil from '../../utils/fetch'
import * as Errors from '../../utils/fetch/Errors'

import Api from '../'
import { Settings } from '../types'

jest.mock('../../utils/fetch')

const fetchUtil = mocked(originalFetchUtil, true)

describe('Api', () => {
  jest.setTimeout(500)

  const options = {
    token: 'TOKEN',
    clientId: 'CLIENT_ID',
    log: { enabled: false },
  }

  const fetchOptions = { search: { a: 'b' } }

  const helixBaseUrl = Settings.helix.baseUrl
  const krakenBaseUrl = Settings.kraken.baseUrl

  afterEach(() => {
    fetchUtil.mockClear()
  })

  describe('constructor', () => {
    test('should instantiate with clientId', () => {
      expect(() => new Api({ ...options, token: undefined })).not.toThrow()
    })

    test('should throw if clientId is missing', () => {
      expect(() => new Api({ ...options, clientId: undefined })).toThrow()
    })
  })

  test('should allow options to be updated without changing clientId or token', () => {
    const api = new Api(options)

    const log = { level: 'info' }

    const nextOptions = {
      clientId: 'NEXT_CLIENT_ID',
      token: 'NEXT_TOKEN',
      log,
    }

    api.updateOptions(nextOptions)

    expect(api.options).toMatchObject({ ...options, log })
  })

  describe('initialize', () => {
    test('should set readyState and status', async () => {
      const api = new Api(options)
      await api.initialize()

      expect(api.readyState).toBe(2)
      expect(api.status).toMatchSnapshot()
    })

    test('should resolve if already initialized', async () => {
      const api = new Api(options)
      await api.initialize()
      const actual = await api.initialize()

      expect(actual).toMatchSnapshot()
    })

    test('should update client options', async () => {
      const api = new Api(options)
      expect(api.options.token).toBe(options.token)

      const newToken = 'NEW_TOKEN'
      await api.initialize({ token: newToken })

      expect(api.options.token).toBe(newToken)
    })
  })

  describe('headers', () => {
    test('should create headers with clientId and token', async () => {
      const api = new Api(options)
      await api.get()

      expect(fetchUtil.mock.calls).toMatchSnapshot()
    })

    test('should create headers with clientId', async () => {
      const api = new Api({ ...options, token: undefined })
      await api.get()

      expect(fetchUtil.mock.calls).toMatchSnapshot()
    })

    test('should create headers for Kraken', async () => {
      const api = new Api(options)
      await api.get('', { version: twitchTypes.ApiVersions.Kraken })

      expect(fetchUtil.mock.calls).toMatchSnapshot()
    })
  })

  describe('hasScope', () => {
    test('should reject if instance is uninitialized', () => {
      const api = new Api(options)
      const actual = api.hasScope('user_read')
      expect(actual).rejects.toBe(false)
    })

    test('should reject if scope is absent', () => {
      const api = new Api(options)
      const actual = api.hasScope('channel_read')
      expect(actual).rejects.toBe(false)
    })

    test('should resolve if scope is present', async () => {
      const api = new Api(options)
      await api.initialize()

      const actual = api.hasScope('user_read')

      expect(actual).resolves.toBe(true)
    })
  })

  describe('methods', () => {
    test('get should call fetch', async () => {
      const api = new Api(options)

      const endpoint = 'ENDPOINT'
      await api.get(endpoint, fetchOptions)

      const [actualEndpoint, actualOpts] = fetchUtil.mock.calls[0]

      expect(actualEndpoint).toEqual(expect.stringContaining(endpoint))
      expect(actualOpts).toMatchObject(fetchOptions)
    })

    test('post should call fetch with method=post', async () => {
      const api = new Api(options)

      const endpoint = 'ENDPOINT'
      await api.post(endpoint, fetchOptions)

      const [, actualOpts] = fetchUtil.mock.calls[0]

      expect(actualOpts).toMatchObject({ method: 'post' })
    })

    test('put should call fetch with method=put', async () => {
      const api = new Api(options)

      const endpoint = 'ENDPOINT'
      await api.put(endpoint, fetchOptions)

      const [, actualOpts] = fetchUtil.mock.calls[0]

      expect(actualOpts).toMatchObject({ method: 'put' })
    })

    test('should throw on failure', async () => {
      const api = new Api(options)

      try {
        await api.get('404')
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.FetchError)
        expect(error).toMatchSnapshot()
      }
    })
  })

  describe('versions', () => {
    test('should fallback to the Helix endpoint', () => {
      const api = new Api(options)

      const endpoint = 'ENDPOINT'

      return api.get(endpoint, fetchOptions).then(() => {
        const [actualEndpoint, actualOpts] = fetchUtil.mock.calls[0]

        expect(actualEndpoint).toBe(`${helixBaseUrl}/${endpoint}`)
        expect(actualOpts).toMatchObject(fetchOptions)
      })
    })

    test('should call the Kraken endpoint', () => {
      const api = new Api(options)

      const endpoint = 'ENDPOINT'

      return api
        .get(endpoint, {
          ...fetchOptions,
          version: twitchTypes.ApiVersions.Kraken,
        })
        .then(() => {
          const [actualEndpoint, actualOpts] = fetchUtil.mock.calls[0]

          expect(actualEndpoint).toBe(`${krakenBaseUrl}/${endpoint}`)
          expect(actualOpts).toMatchObject(fetchOptions)
        })
    })

    test('should call the Helix endpoint', () => {
      const api = new Api(options)

      const endpoint = 'ENDPOINT'
      const opts = {
        ...fetchOptions,
        version: twitchTypes.ApiVersions['Helix'],
      }

      return api.get(endpoint, opts).then(() => {
        const [actualEndpoint, actualOpts] = fetchUtil.mock.calls[0]

        expect(actualEndpoint).toBe(`${helixBaseUrl}/${endpoint}`)
        expect(actualOpts).toMatchSnapshot()
      })
    })
  })

  describe('onAuthenticationFailure', () => {
    test('should call onAuthenticationFailure', async () => {
      const onAuthenticationFailure = jest.fn(() => Promise.reject())
      const api = new Api({
        ...options,
        token: 'INVALID_TOKEN',
        onAuthenticationFailure,
      })

      try {
        await api.get('401')
      } catch (error) {
        expect(onAuthenticationFailure).toHaveBeenCalled()
      }
    })

    test('should update token', async () => {
      const onAuthenticationFailure = jest.fn(() => Promise.resolve('TOKEN'))
      const api = new Api({
        ...options,
        token: 'INVALID_TOKEN',
        onAuthenticationFailure,
      })

      try {
        await api.get('401')
      } catch (error) {
        expect(onAuthenticationFailure).toHaveBeenCalled()
        expect(api.options.token).toEqual('TOKEN')
      }
    })
  })
})
