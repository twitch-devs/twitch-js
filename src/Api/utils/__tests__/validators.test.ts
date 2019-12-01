import * as validators from '../validators'

describe('Api/utils/validators', () => {
  const options = { clientId: 'CLIENT_ID' }

  describe('apiOptions', () => {
    test('should return default chat options', () => {
      const actual = validators.apiOptions(options)

      expect(actual).toMatchSnapshot()
    })

    test('default onAuthenticationFailure should reject', done => {
      const { onAuthenticationFailure } = validators.apiOptions(options)

      onAuthenticationFailure().catch(() => done())
    })
  })
})
