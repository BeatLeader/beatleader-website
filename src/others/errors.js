export class SsrError extends Error {
  constructor(message) {
    super(message);

    this.name = "SsrError";
  }

  toString() {
    return this.message && this.message.length ? this.message : this.name;
  }
}

export class SsrTimeoutError extends SsrError {
  constructor(timeout, ...args) {
    super(...args);

    this.name = "SsrTimeoutError";
    this.timeout = timeout;
  }
}