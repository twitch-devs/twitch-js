import fetch from 'node-fetch'
import FormData from 'form-data'
import { stringify } from 'qs'

import parser from './parser'

/**
 * Fetch options
 * @typedef {Object} FetchOptions
 * @property {string} [method=get] - The request method, e.g., `get`, `post`.
 * @property {Object} [headers] - Any headers you want to add to your request.
 * @property {Object} [search] - Any query parameters you want to add to your request.
 * @property {Object|FormData} [body] - Any body that you want to add to your request.
 */

/**
 * Fetches URL
 * @param {string} url
 * @param {FetchOptions} [options]
 * @param {Object} [qsOptions]
 * @returns {Promise<Object>}
 */
const fetchUtil = (url, options = {}, qsOptions = {}) => {
  const isBodyJson =
    options.body &&
    !(options.body instanceof FormData) &&
    typeof options.body === 'object'

  const body = isBodyJson ? JSON.stringify(options.body) : options.body

  const headers = isBodyJson
    ? { ...options.headers, 'Content-Type': 'application/json' }
    : options.headers

  const search =
    typeof options.search === 'object'
      ? `?${stringify(options.search, qsOptions)}`
      : ''

  return fetch(`${url}${search}`, {
    ...options,
    method: options.method || 'get',
    search: undefined,
    headers,
    body,
  }).then(parser)
}

export default fetchUtil
