import {SsrError} from '../others/errors'
import {delay} from '../utils/promise'
import {parseRateLimitHeaders} from './utils'

export class SsrNetworkError extends SsrError {
  constructor(message) {
    super(message);

    this.name = "SsrNetworkError";
  }

  shouldRetry() {
    return true;
  }

  async waitBeforeRetry() {
    return true;
  }
}

export class SsrNetworkTimeoutError extends SsrNetworkError {
  constructor(timeout, message) {
    super(message && message.length ? message : `Timeout Error (${timeout}ms)`)

    this.name = "SsrNetworkTimeoutError";
    this.timeout = timeout;
  }
}

export class SsrHttpResponseError extends SsrNetworkError {
  constructor(response, ...args) {
    super(`HTTP Error Response: ${response && response.status ? response.status : 'None'} ${response && response.statusText ? response.statusText : ''}`, ...args);

    this.name = 'SsrHttpResponseError';
    this.response = response;

    const {remaining, limit, resetAt} = parseRateLimitHeaders(response);

    this.remaining = remaining;
    this.limit = limit;
    this.resetAt = resetAt;
  }

  getResponse() {
    return this.response;
  }
}

export class SsrHttpClientError extends SsrHttpResponseError {
  constructor(...args) {
    super(...args);

    this.name = 'SsrHttpClientError';
  }

  shouldRetry() {
    return false;
  }

  async waitBeforeRetry() {
    return true;
  }
}

export class SsrHttpRateLimitError extends SsrHttpClientError {
  constructor(response, ...args) {
    super(response, ...args);

    this.name = 'SsrHttpRateLimitError';
  }

  shouldRetry() {
    return true;
  }

  async waitBeforeRetry(rateLimitCallback = null, rateLimitCallbackTick = 500) {
    if (this.resetAt === null || this.remaining > 0) return true;

    const expiresInMs = this.resetAt - new Date() + 1000;
    if (expiresInMs > 0) await delay(expiresInMs);

    return true;
  }
}

export class SsrHttpUnauthenticatedError extends SsrHttpClientError {
  constructor(...args) {
    super(...args);

    this.name = "SsrHttpUnauthenticatedError";
  }
}

export class SsrHttpUnauthorizedError extends SsrHttpClientError {
  constructor(...args) {
    super(...args);

    this.name = "SsrHttpUnauthorizedError";
  }
}

export class SsrHttpNotFoundError extends SsrHttpClientError {
  constructor(...args) {
    super(...args);

    this.name = "SsrHttpNotFoundError";
  }
}

export class SsrHttpUnprocessableEntityError extends SsrHttpClientError {
  constructor(...args) {
    super(...args);

    this.name = "SsrHttpUnprocessableEntityError";
  }
}

export class SsrHttpServerError extends SsrHttpResponseError {
  constructor(...args) {
    super(...args);

    this.name = 'SsrHttpServerError';
  }
}