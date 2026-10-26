<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import Button from '../Common/Button.svelte';
	import Switcher from '../Common/Switcher.svelte';
	import Spinner from '../Common/Spinner.svelte';

	const channels = [
		{id: 'release', label: 'Release', iconFa: 'fas fa-check'},
		{id: 'beta', label: 'Beta', iconFa: 'fas fa-flask'},
	];
	const otherChannels = {tibytes: 'Tibytes', legacy: 'Legacy (hardcoded endpoints)', other: 'Unrecognized names'};
	const slotRegex = /^\d+(\.\d+){1,3}$/;

	let files = null;
	let loading = false;
	let error = null;

	let uploads = [];
	// stagingId -> channel -> {target: slot | 'new' | '', newSlot}
	let selection = {};
	let channel = 'release';
	let archive = true;
	let uploading = false;
	let publishing = false;
	let published = null;
	let dragging = false;
	let fileInput;

	let showArchived = {};

	async function readError(response) {
		const text = await response.text();
		return text?.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`;
	}

	async function fetchFiles() {
		loading = true;
		error = null;
		try {
			const response = await fetch(`${BL_API_URL}reesabers/files`, {credentials: 'include'});
			if (!response.ok) throw new Error(await readError(response));
			files = await response.json();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function gameVersion(manifest) {
		return manifest?.gameVersion?.match(/^\d+(\.\d+){1,3}/)?.[0] ?? '';
	}

	function compareVersions(a, b) {
		const pa = (a ?? '').split('.').map(Number);
		const pb = (b ?? '').split('.').map(Number);
		for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
			const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
			if (diff) return diff;
		}
		return 0;
	}

	function slotsFor(files, channel, platform) {
		return (files ?? [])
			.filter(f => f.channel === channel && f.platform === platform && f.slot && !f.archiveTag)
			.sort((a, b) => compareVersions(b.slot, a.slot));
	}

	function initialSelection(upload) {
		return Object.fromEntries(
			channels.map(({id}) => {
				const match = upload.matches?.[id];
				if (match?.slot && !match.isNew) return [id, {target: match.slot, newSlot: gameVersion(upload.manifest)}];
				return [id, {target: match?.isNew ? 'new' : '', newSlot: match?.slot ?? gameVersion(upload.manifest)}];
			})
		);
	}

	async function stage(fileList) {
		const list = [...(fileList ?? [])].filter(f => /\.(zip|qmod)$/i.test(f.name));
		if (!list.length) {
			error = 'Select .zip (PC) or .qmod (Quest) builds';
			return;
		}

		const data = new FormData();
		list.forEach(f => data.append('files', f, f.name));

		uploading = true;
		error = null;
		published = null;
		try {
			const response = await fetch(`${BL_API_URL}reesabers/files/stage`, {credentials: 'include', method: 'POST', body: data});
			if (!response.ok) throw new Error(await readError(response));
			const result = await response.json();

			files = result.files;
			result.uploads.forEach(u => (selection[u.stagingId] = initialSelection(u)));
			uploads = [...uploads, ...result.uploads];
		} catch (e) {
			error = e.message;
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	function discard(upload) {
		uploads = uploads.filter(u => u !== upload);
		delete selection[upload.stagingId];
		fetch(`${BL_API_URL}reesabers/files/stage/${upload.stagingId}`, {credentials: 'include', method: 'DELETE'});
	}

	function resolvedSlot(sel) {
		if (!sel) return '';
		return sel.target === 'new' ? (sel.newSlot ?? '').trim() : sel.target;
	}

	function validate(uploads, selection, channel, files) {
		const targets = uploads.map(u => `${u.platform}:${resolvedSlot(selection[u.stagingId]?.[channel])}`);

		return uploads.map((u, i) => {
			const sel = selection[u.stagingId]?.[channel];
			const slot = resolvedSlot(sel);
			const replaces = slotsFor(files, channel, u.platform).find(f => f.slot === slot);

			let problem = null;
			if (u.error) problem = u.error;
			else if (!slot) problem = 'Pick a target slot';
			else if (!slotRegex.test(slot)) problem = 'Slot should be a game version like 1.40.0';
			else if (targets.indexOf(targets[i]) !== i || targets.lastIndexOf(targets[i]) !== i) problem = 'Another upload targets the same slot';

			return {upload: u, slot, replaces, problem, fileName: fileNameFor(channel, u.platform, slot)};
		});
	}

	function fileNameFor(channel, platform, slot) {
		return `ReeSabers_${channel === 'beta' ? 'beta_' : ''}${slot}.${platform === 'quest' ? 'qmod' : 'zip'}`;
	}

	async function publish() {
		const lines = plan.map(
			p =>
				`${p.fileName}  ←  ${p.upload.originalName} (v${p.upload.manifest?.version ?? '?'})` +
				(p.replaces ? `, replaces v${p.replaces.manifest?.version ?? '?'}${archive ? ' (archived)' : ' (deleted)'}` : ', new slot')
		);
		if (!confirm(`Publish to ${channel.toUpperCase()}?\n\n${lines.join('\n')}`)) return;

		publishing = true;
		error = null;
		try {
			const response = await fetch(`${BL_API_URL}reesabers/files/publish`, {
				credentials: 'include',
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({channel, archive, items: plan.map(p => ({stagingId: p.upload.stagingId, slot: p.slot}))}),
			});
			if (!response.ok) throw new Error(await readError(response));
			const result = await response.json();

			files = result.files;
			published = result.published;
			uploads = [];
			selection = {};
		} catch (e) {
			error = e.message;
		} finally {
			publishing = false;
		}
	}

	function onDrop(e) {
		dragging = false;
		stage(e.dataTransfer?.files);
	}

	function formatSize(size) {
		return size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(2)} MB`;
	}

	function splitArchived(list) {
		return {current: list.filter(f => !f.archiveTag), archived: list.filter(f => f.archiveTag)};
	}

	$: plan = validate(uploads, selection, channel, files);
	$: canPublish = plan.length > 0 && plan.every(p => !p.problem) && !publishing && !uploading;
	$: grouped = Object.fromEntries(
		[...channels.map(c => c.id), ...Object.keys(otherChannels)].map(id => [id, splitArchived((files ?? []).filter(f => f.channel === id))])
	);

	fetchFiles();
</script>

<div class="reesabers-files">
	<div class="rs-section">
		<div class="rs-section-header">
			<h3>Upload builds</h3>
		</div>

		<div
			class="dropzone"
			class:dragging
			role="region"
			aria-label="Drop builds to upload"
			on:dragover|preventDefault={() => (dragging = true)}
			on:dragleave={() => (dragging = false)}
			on:drop|preventDefault={onDrop}>
			<input style="display:none" type="file" multiple accept=".zip,.qmod" bind:this={fileInput} on:change={e => stage(e.target.files)} />
			{#if uploading}
				<Spinner />
				<span>Uploading and reading manifests...</span>
			{:else}
				<span>Drop PC .zip and Quest .qmod builds here, or</span>
				<Button type="primary" iconFa="fas fa-upload" label="Choose files" on:click={() => fileInput.click()} />
			{/if}
		</div>

		{#if uploads.length}
			<div class="upload-options">
				<Switcher values={channels} value={channels.find(c => c.id === channel)} on:change={e => (channel = e.detail.id)} />
				<label class="archive-option" title="Keep replaced files downloadable under their slot + old mod version name">
					<input type="checkbox" bind:checked={archive} />
					Archive replaced files
				</label>
			</div>

			<table class="files-table">
				<thead>
					<tr>
						<th>Upload</th>
						<th>Platform</th>
						<th>Version</th>
						<th>Manifest game version</th>
						<th>Replaces ({channel})</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{#each plan as p (p.upload.stagingId)}
						{@const u = p.upload}
						{@const match = u.matches?.[channel]}
						<tr class:has-problem={p.problem}>
							<td>
								<div class="rs-file-name">{u.originalName}</div>
								<div class="muted">{formatSize(u.size)}</div>
							</td>
							<td><span class="platform {u.platform}">{u.platform === 'quest' ? 'Quest' : 'PC'}</span></td>
							<td>{u.manifest?.version ? `v${u.manifest.version}` : '—'}</td>
							<td>{u.manifest?.gameVersion ?? '—'}</td>
							<td>
								{#if !u.error}
									<div class="target">
										<select bind:value={selection[u.stagingId][channel].target}>
											<option value="">— pick a slot —</option>
											{#each slotsFor(files, channel, u.platform) as slot}
												<option value={slot.slot}>
													{slot.fileName} ({slot.manifest?.version ? `v${slot.manifest.version}` : 'unknown version'})
												</option>
											{/each}
											<option value="new">New slot...</option>
										</select>
										{#if selection[u.stagingId][channel].target === 'new'}
											<input class="new-slot" placeholder="1.40.0" bind:value={selection[u.stagingId][channel].newSlot} />
										{/if}
									</div>
									{#if p.slot && slotRegex.test(p.slot)}
										<div class="muted">
											→ {p.fileName}
											{#if p.replaces}
												(v{p.replaces.manifest?.version ?? '?'} → v{u.manifest?.version ?? '?'})
											{/if}
										</div>
									{/if}
									{#if match && match.confidence !== 'none' && resolvedSlot(selection[u.stagingId][channel]) === match.slot}
										<div class="confidence {match.confidence}" title={match.reason}>
											{#if match.confidence === 'high'}
												<i class="fas fa-circle-check" /> Matched: {match.reason}
											{:else if match.confidence === 'low'}
												<i class="fas fa-triangle-exclamation" /> Guess, please check: {match.reason}
											{:else}
												<i class="fas fa-plus" /> {match.reason}
											{/if}
										</div>
									{/if}
								{/if}
								{#if p.problem}
									<div class="problem"><i class="fas fa-circle-xmark" /> {p.problem}</div>
								{/if}
								{#each u.warnings as warning}
									<div class="warning"><i class="fas fa-triangle-exclamation" /> {warning}</div>
								{/each}
							</td>
							<td>
								<Button type="danger" iconFa="fas fa-xmark" title="Remove from this batch" on:click={() => discard(u)} />
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="publish-row">
				{#if publishing}
					<Spinner />
				{/if}
				<Button
					type="green"
					iconFa="fas fa-cloud-arrow-up"
					label="Publish {plan.length} {plan.length === 1 ? 'build' : 'builds'} to {channel === 'beta' ? 'Beta' : 'Release'}"
					disabled={!canPublish}
					on:click={publish} />
			</div>
		{/if}

		{#if published}
			<div class="success">
				<i class="fas fa-circle-check" /> Published:
				{#each published as p}
					<div>
						{p.fileName}
						{#if p.archivedAs}<span class="muted">(previous file kept as {p.archivedAs})</span>{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if error}
			<div class="problem">{error}</div>
		{/if}
	</div>

	<div class="rs-section">
		<div class="rs-section-header">
			<h3>Files on the server</h3>
			<Button type="default" iconFa="fas fa-arrows-rotate" title="Refresh" loading={loading} on:click={fetchFiles} />
		</div>

		{#if !files && loading}
			<Spinner />
		{:else if files}
			{#each [...channels.map(c => [c.id, c.label]), ...Object.entries(otherChannels)] as [id, label]}
				{@const group = grouped[id]}
				{#if group && (group.current.length || group.archived.length || channels.some(c => c.id === id))}
					<h4>{label}</h4>
					{#if group.current.length}
						<table class="files-table">
							<thead>
								<tr>
									<th>File</th>
									<th>Platform</th>
									<th>Version</th>
									<th>Manifest game version</th>
									<th>Size</th>
									<th>Updated</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{#each group.current as f (f.fileName)}
									<tr>
										<td>
											{#if f.downloadPath}
												<a href={BL_API_URL + f.downloadPath} title="Download a patched copy">{f.fileName}</a>
											{:else}
												{f.fileName}
											{/if}
										</td>
										<td><span class="platform {f.platform}">{f.platform === 'quest' ? 'Quest' : 'PC'}</span></td>
										<td>{f.manifest?.version ? `v${f.manifest.version}` : '—'}</td>
										<td>{f.manifest?.gameVersion ?? '—'}</td>
										<td>{formatSize(f.size)}</td>
										<td title={dateFromUnix(f.modified)?.toLocaleString()}>{formatDateRelative(dateFromUnix(f.modified))}</td>
										<td>
											{#if f.error}
												<div class="problem"><i class="fas fa-circle-xmark" /> {f.error}</div>
											{:else if !f.warnings.length}
												<span class="ok"><i class="fas fa-circle-check" /> OK</span>
											{/if}
											{#each f.warnings as warning}
												<div class="warning"><i class="fas fa-triangle-exclamation" /> {warning}</div>
											{/each}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<div class="muted">No files</div>
					{/if}

					{#if group.archived.length}
						<span
							class="archived-toggle clickable"
							role="button"
							tabindex="0"
							on:click={() => (showArchived[id] = !showArchived[id])}
							on:keydown={() => (showArchived[id] = !showArchived[id])}>
							{showArchived[id] ? 'Hide' : 'Show'} archived versions ({group.archived.length})
							<i class="fas fa-chevron-{showArchived[id] ? 'up' : 'down'}" />
						</span>
						{#if showArchived[id]}
							<table class="files-table archived">
								<tbody>
									{#each group.archived as f (f.fileName)}
										<tr>
											<td>
												{#if f.downloadPath}
													<a href={BL_API_URL + f.downloadPath} title="Download a patched copy">{f.fileName}</a>
												{:else}
													{f.fileName}
												{/if}
											</td>
											<td><span class="platform {f.platform}">{f.platform === 'quest' ? 'Quest' : 'PC'}</span></td>
											<td>{f.manifest?.version ? `v${f.manifest.version}` : '—'}</td>
											<td>{f.manifest?.gameVersion ?? '—'}</td>
											<td>{formatSize(f.size)}</td>
											<td title={dateFromUnix(f.modified)?.toLocaleString()}>{formatDateRelative(dateFromUnix(f.modified))}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					{/if}
				{/if}
			{/each}
		{/if}
	</div>
</div>

<style>
	.reesabers-files {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.rs-section {
		background-color: #121212;
		padding: 0.75em;
		border-radius: 8px;
	}

	.rs-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5em;
	}

	h3 {
		font-size: 1.2em;
		font-weight: bold;
	}

	h4 {
		font-weight: bold;
		margin: 0.75em 0 0.3em;
	}

	.dropzone {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75em;
		flex-wrap: wrap;
		padding: 1.5em;
		border: 2px dashed var(--faded, #555);
		border-radius: 8px;
		text-align: center;
	}

	.dropzone.dragging {
		border-color: var(--beatleader-primary);
		background-color: rgba(255, 255, 255, 0.04);
	}

	.upload-options {
		display: flex;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
		margin: 0.75em 0 0.5em;
	}

	.archive-option {
		display: flex;
		align-items: center;
		gap: 0.4em;
		cursor: pointer;
	}

	.files-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9em;
	}

	.files-table th {
		text-align: left;
		color: var(--faded);
		font-weight: normal;
		padding: 0.3em 0.5em;
	}

	.files-table td {
		padding: 0.4em 0.5em;
		border-top: 1px solid var(--row-separator, #333);
		vertical-align: top;
	}

	.files-table tr.has-problem td {
		background-color: rgba(255, 60, 60, 0.06);
	}

	.files-table.archived {
		opacity: 0.8;
	}

	.rs-file-name {
		word-break: break-all;
	}

	.platform {
		padding: 0.1em 0.45em;
		border-radius: 4px;
		font-size: 0.85em;
		white-space: nowrap;
	}

	.platform.pc {
		background-color: #2c4a7a;
	}

	.platform.quest {
		background-color: #5b2c7a;
	}

	.target {
		display: flex;
		gap: 0.4em;
		flex-wrap: wrap;
	}

	.target select,
	.new-slot {
		background-color: var(--background, #222);
		color: var(--textColor, white);
		border: 1px solid var(--faded, #555);
		border-radius: 4px;
		padding: 0.2em 0.4em;
	}

	.new-slot {
		width: 7em;
	}

	.muted {
		color: var(--faded, #999);
		font-size: 0.9em;
	}

	.confidence {
		font-size: 0.85em;
		margin-top: 0.2em;
	}

	.confidence.high,
	.ok,
	.success {
		color: #6fd36f;
	}

	.confidence.low,
	.warning {
		color: #e8c34a;
		font-size: 0.85em;
	}

	.confidence.new {
		color: #6fb3e8;
	}

	.problem {
		color: #ff6b6b;
		font-size: 0.9em;
	}

	.publish-row {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.5em;
	}

	.success {
		margin-top: 0.5em;
	}

	.archived-toggle {
		display: inline-block;
		margin-top: 0.4em;
		color: var(--faded, #999);
		font-size: 0.9em;
	}
</style>
