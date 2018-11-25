import invariant from 'invariant'

import {
  conformsTo,
  defaults,
  isString,
  isFinite,
  isFunction,
  isBoolean,
  isNil,
} from 'lodash'

import * as constants from '../constants'
import * as sanitizers from './sanitizers'

const chatOptions = maybeOptions => {
  /**
   * Chat options
   * @typedef {Object} ChatOptions
   * @property {string} [username]
   * @property {string} [token] OAuth token (use {@link https://twitchtokengenerator.com/} to generate one)
   * @property {number} [connectionTimeout=CONNECTION_TIMEOUT]
   * @property {number} [joinTimeout=JOIN_TIMEOUT]
   * @property {Object} log
   * @property {boolean} [debug=false]
   * @property {Function} [onAuthenticationFailure]
   */
  const shape = {
    username: isString,
    token: value => isNil(value) || isString(value),
    connectionTimeout: isFinite,
    joinTimeout: isFinite,
    onAuthenticationFailure: isFunction,
  }

  const options = defaults(
    {
      ...maybeOptions,
      username: sanitizers.username(maybeOptions.username),
      oauth: sanitizers.oauth(maybeOptions.token),
    },
    {
      token: null,
      connectionTimeout: constants.CONNECTION_TIMEOUT,
      joinTimeout: constants.JOIN_TIMEOUT,
      onAuthenticationFailure: () => Promise.reject(),
    },
  )

  invariant(
    conformsTo(options, shape),
    '[twitch-js/Chat] options: Expected valid options',
  )

  return options
}

const clientOptions = maybeOptions => {
  const shape = {
    username: isString,
    oauth: isString,
    server: isString,
    port: isFinite,
    ssl: isBoolean,
  }

  const options = defaults(
    {
      ...maybeOptions,
      username: sanitizers.username(maybeOptions.username),
      oauth: sanitizers.oauth(maybeOptions.token),
    },
    {
      server: constants.CHAT_SERVER,
      port: constants.CHAT_SERVER_SSL_PORT,
      ssl: true,
    },
  )

  invariant(
    conformsTo(options, shape),
    '[twitch-js/Chat/Client] options: Expected valid options',
  )

  return options
}

export { chatOptions, clientOptions }
