import {
  SsrHttpClientError,
  SsrHttpNotFoundError,
  SsrHttpRateLimitError,
  SsrHttpResponseError,
  SsrHttpServerError,
  SsrHttpUnauthorizedError,
  SsrHttpUnprocessableEntityError,
  SsrNetworkError,
} from './errors'
import {SsrDataFormatError} from '../others/errors'
import {parseRateLimitHeaders} from './utils'

const checkResponse = response => {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  }

  switch (true) {
    case response.status === 403:
      throw new SsrHttpUnauthorizedError(response);
    case response.status === 404:
      throw new SsrHttpNotFoundError(response);
    case response.status === 422:
      throw new SsrHttpUnprocessableEntityError(response);
    case response.status === 429:
      throw new SsrHttpRateLimitError(response);
    case response.status >= 400 && response.status < 500:
      throw new SsrHttpClientError(response);
    case response.status >= 500:
      throw new SsrHttpServerError(response);
    default:
      throw new SsrHttpResponseError(response);
  }
}

export async function fetchUrl(url, options = {}, cors = true) {
  try {
    const response = await fetch(url, {...options, ...(cors ? {mode: 'cors'} : null)});

    return checkResponse(response);
  } catch (err) {
    if (err instanceof TypeError) throw new SsrNetworkError('Network error');

    throw err;
  }
}

export async function fetchJson(url, options) {
  return fetchUrl(url, options)
    .then(async response => {
      const body = await response.json();

      return {headers: response.headers, rateLimit: parseRateLimitHeaders(response), body}
    })
    .catch(err => {
      throw (err instanceof SyntaxError ? new SsrDataFormatError('JSON parse error', err) : err);
    })
}

export async function fetchHtml(url, options) {
  return fetchUrl(url, options)
    .then(async response => {
      const body = response.text();

      return {headers: response.headers, rateLimit: parseRateLimitHeaders(response), body: new DOMParser().parseFromString(body, 'text/html')}
    })
}