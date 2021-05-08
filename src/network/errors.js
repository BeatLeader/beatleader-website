import {SsrError} from '../others/errors'
import {nullIfUndefined} from '../utils/js'
import {delay} from '../utils/promise'

// TODO: move it to queue
const waitForRateLimitReset = async (expiresInMs, rateLimitCallback = null) => {
  const rateLimitCallbackTick = 500;

  let timer = expiresInMs;
  let intId;

  if (rateLimitCallback)
    intId = setInterval(_ => rateLimitCallback((timer = timer - rateLimitCallbackTick)), rateLimitCallbackTick)

  await delay(expiresInMs);

  if (rateLimitCallback) clearInterval(intId);
}

export class SsrNetworkError extends SsrError {
  constructor(message) {
    super(message);

    this.name = "SsrNetworkError";
  }

  async shouldRetry() {
    return Promise.resolve(true);
  }
}

export class SsrNetworkTimeoutError extends SsrNetworkError {
  constructor(timeout, ...args) {
    super(...args);

    this.name = "SsrNetworkTimeoutError";
    this.timeout = timeout;
  }
}

export class SsrHttpResponseError extends SsrNetworkError {
  constructor(response, ...args) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);

    this.name = 'SsrHttpResponseError';
    this.response = response;
  }
}

export class SsrHttpClientError extends SsrHttpResponseError {
  constructor(response, ...args) {
    super(response, ...args);

    this.name = 'SsrHttpClientError';
  }

  async shouldRetry() {
    return Promise.resolve(false);
  }
}

export class SsrHttpRateLimitError extends SsrHttpClientError {
  constructor(response, tryNum = 0, ...args) {
    super(response, ...args);

    this.name = 'SsrHttpRateLimitError';
    this.tryNum = Number.isFinite(tryNum) ? tryNum : 0;
  }

  async shouldRetry(rateLimitCallback) {
    const rateLimiteDelaySteps = [1000, 5000, 10000];
    const delayStep = nullIfUndefined(rateLimiteDelaySteps[this.tryNum]) ?? rateLimiteDelaySteps[rateLimiteDelaySteps.length - 1];

    const rateLimitReset = parseInt(this.response.headers.get('x-ratelimit-reset'), 10);
    const expiresInMs = (
      rateLimitReset && !isNaN(rateLimitReset)
        ? (new Date(rateLimitReset * 1000)).getTime() - (new Date()).getTime()
        : 0
    ) + delayStep;

    if (expiresInMs > 0) await waitForRateLimitReset(expiresInMs, rateLimitCallback);

    return Promise.resolve(true);
  }
}

export class SsrHttpUnauthorizedError extends SsrHttpClientError {
  constructor(response, ...args) {
    super(response, ...args);

    this.name = "SsrHttpUnauthorizedError";
  }
}

export class SsrHttpNotFoundError extends SsrHttpClientError {
  constructor(response, ...args) {
    super(response, ...args);

    this.name = "SsrHttpNotFoundError";
  }
}

export class SsrHttpUnprocessableEntityError extends SsrHttpClientError {
  constructor(response, ...args) {
    super(response, ...args);

    this.name = "SsrHttpUnprocessableEntityError";
  }
}

export class SsrHttpServerError extends SsrHttpResponseError {
  constructor(response, ...args) {
    super(response, ...args);

    this.name = 'SsrHttpServerError';
  }
}