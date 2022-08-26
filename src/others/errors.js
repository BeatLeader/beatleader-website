export class SsrError extends Error {
	constructor(message) {
		super(message);

		this.name = 'SsrError';
	}

	toString() {
		return this.message && this.message.length ? this.message : this.name;
	}
}

export class SsrTimeoutError extends SsrError {
	constructor(timeout, message) {
		super(message && message.length ? message : `Timeout Error (${timeout}ms)`);

		this.name = 'SsrTimeoutError';
		this.timeout = timeout;
	}
}

export class SsrDataFormatError extends SsrError {
	constructor(message, previous = null) {
		super(message && message.length ? message : `Data format error`);

		this.name = 'SsrDataFormatError';
		this.previous = previous;
	}
}
