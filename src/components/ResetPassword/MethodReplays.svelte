<script>
	import {onDestroy} from 'svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {session, pickReplays, checkReplay, copyContinueLink} from './api';

	const MAX_REPLAY_SIZE = 20 * 1024 * 1024;

	let running = false;
	let status = null;
	let error = null;
	let copied = false;
	let adb = null;
	let quest = null;

	async function copyLink() {
		copied = await copyContinueLink();
		setTimeout(() => (copied = false), 2000);
	}

	async function connect() {
		running = true;
		error = null;
		status = 'Pick your Quest in the browser window, then allow USB debugging in the headset if it asks…';
		try {
			adb ??= await import('../../utils/quest-adb');
			quest = await adb.connectQuest();
			if (!quest) return;

			status = `Connected to ${quest.name}, looking for replays…`;
			const replays = (await adb.listReplays(quest.adb)).filter(r => r.size <= MAX_REPLAY_SIZE);

			const picked = replays.length ? await pickReplays(replays.map(r => ({name: r.name, time: r.time}))) : [];
			if (!picked.length) {
				error = replays.length
					? `None of the ${replays.length} replays on the headset applicable.`
					: 'No BeatLeader replays on this headset.';
				return;
			}

			for (const [index, name] of picked.entries()) {
				status = `Checking replay ${index + 1} of ${picked.length}…`;
				await checkReplay(await adb.readFile(quest.adb, replays.find(r => r.name == name).path));
				if ($session?.canComplete) return;
			}
			error = `None of the ${picked.length} replays matches a run recorded for this profile.`;
		} catch (e) {
			if (adb && e instanceof adb.QuestBusyError) {
				error = 'The Quest is busy with another program. Close SideQuest and other tools that use it, then try again.';
			} else if (e?.name != 'NotFoundError') {
				error = e?.message ?? 'Could not talk to the Quest, reconnect the cable and try again.';
			}
		} finally {
			status = null;
			running = false;
			if (quest) adb.disconnectQuest(quest.adb);
			quest = null;
		}
	}

	onDestroy(() => quest && adb.disconnectQuest(quest.adb));
</script>

{#if !navigator.usb}
	<p>
		This needs a browser that can use USB devices: Chrome or Edge on a computer, or Chrome on Android. Open the reset there with a private
		link, it moves the reset over.
	</p>
	<Button iconFa="fas fa-copy" label={copied ? 'Copied!' : 'Copy the link'} noMargin={true} on:click={copyLink} />
{:else}
	<ol class="steps">
		<li>Connect the Quest to this device with a USB cable.</li>
		<li>Close SideQuest and other programs that use the Quest.</li>
		<li>
			Press the button, pick the Quest, then allow USB debugging in the headset. It needs developer mode, which is on if you installed the
			mods yourself.
		</li>
	</ol>
	{#if $session.replayUploadsLeft}
		<Button
			type="primary"
			iconFa="fab fa-usb"
			label="Connect the Quest"
			loading={running}
			disabled={running}
			noMargin={true}
			on:click={connect} />
	{:else}
		<p class="bad">No more replays can be checked in this session.</p>
	{/if}
	{#if status}
		<p class="status"><Spinner /> {status}</p>
	{/if}
	{#if error}
		<p class="bad">{error}</p>
	{/if}
{/if}
