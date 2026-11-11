// ADB over WebUSB, the way ModsBeforeFriday talks to a Quest from the browser.
import {Adb, AdbDaemonTransport} from '@yume-chan/adb';
import {AdbDaemonWebUsbDeviceManager, AdbDaemonWebUsbDevice} from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';

// getDataDir() of the Quest mod, its id is "bl"
const REPLAY_DIRS = [
	'/sdcard/ModData/com.beatgames.beatsaber/Mods/bl/replays',
	'/sdcard/ModData/com.beatgames.beatsaber/Mods/BeatLeader/replays',
];

const LINUX_FILE_TYPE_DIRECTORY = 4;

export class QuestBusyError extends Error {}

export async function connectQuest() {
	const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
	if (!manager) throw new Error('This browser has no WebUSB');

	const device = await manager.requestDevice();
	if (!device) return null;

	let connection;
	try {
		connection = await device.connect();
	} catch (e) {
		if (e instanceof AdbDaemonWebUsbDevice.DeviceBusyError) throw new QuestBusyError();
		throw e;
	}

	const transport = await AdbDaemonTransport.authenticate({
		serial: device.serial,
		connection,
		credentialStore: new AdbWebCredentialStore('BeatLeader'),
	});

	return {adb: new Adb(transport), name: device.name || 'Quest'};
}

export async function listReplays(adb) {
	const sync = await adb.sync();
	try {
		const replays = [];
		for (const dir of REPLAY_DIRS) {
			let entries;
			try {
				entries = await sync.readdir(dir);
			} catch {
				continue;
			}
			for (const entry of entries) {
				if (entry.type == LINUX_FILE_TYPE_DIRECTORY || !entry.name.endsWith('.bsor')) continue;
				replays.push({name: entry.name, path: `${dir}/${entry.name}`, time: Number(entry.mtime), size: Number(entry.size)});
			}
		}
		return replays;
	} finally {
		await sync.dispose();
	}
}

export async function readFile(adb, path) {
	const sync = await adb.sync();
	try {
		const chunks = [];
		let length = 0;
		const reader = sync.read(path).getReader();
		while (true) {
			const {done, value} = await reader.read();
			if (done) break;
			chunks.push(value);
			length += value.length;
		}

		const result = new Uint8Array(length);
		let offset = 0;
		for (const chunk of chunks) {
			result.set(chunk, offset);
			offset += chunk.length;
		}
		return result;
	} finally {
		await sync.dispose();
	}
}

export async function disconnectQuest(adb) {
	try {
		await adb.close();
	} catch {}
}
