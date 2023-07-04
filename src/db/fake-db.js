import {
	indexedDB,
	IDBCursor,
	IDBCursorWithValue,
	IDBDatabase,
	IDBFactory,
	IDBIndex,
	IDBKeyRange,
	IDBObjectStore,
	IDBOpenDBRequest,
	IDBRequest,
	IDBTransaction,
	IDBVersionChangeEvent,
} from 'fake-indexeddb';

export function fakeIDB() {
	// http://stackoverflow.com/a/33268326/786644 - works in browser, worker, and Node.js
	var globalVar =
		typeof window !== 'undefined'
			? window
			: typeof WorkerGlobalScope !== 'undefined'
			? self
			: typeof global !== 'undefined'
			? global
			: Function('return this;')();

	Object.defineProperty(globalVar, 'indexedDB', {value: indexedDB});
	Object.defineProperty(globalVar, 'IDBCursor', {value: IDBCursor});
	Object.defineProperty(globalVar, 'IDBCursorWithValue', {value: IDBCursorWithValue});
	Object.defineProperty(globalVar, 'IDBDatabase', {value: IDBDatabase});
	Object.defineProperty(globalVar, 'IDBFactory', {value: IDBFactory});
	Object.defineProperty(globalVar, 'IDBIndex', {value: IDBIndex});
	Object.defineProperty(globalVar, 'IDBKeyRange', {value: IDBKeyRange});
	Object.defineProperty(globalVar, 'IDBObjectStore', {value: IDBObjectStore});
	Object.defineProperty(globalVar, 'IDBOpenDBRequest', {value: IDBOpenDBRequest});
	Object.defineProperty(globalVar, 'IDBRequest', {value: IDBRequest});
	Object.defineProperty(globalVar, 'IDBTransaction', {value: IDBTransaction});
	Object.defineProperty(globalVar, 'IDBVersionChangeEvent', {value: IDBVersionChangeEvent});
}
