<script>
	import {onMount} from 'svelte';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import SearchPicker from '../components/ResetPassword/SearchPicker.svelte';
	import NoPassword from '../components/ResetPassword/NoPassword.svelte';
	import AccountStep from '../components/ResetPassword/AccountStep.svelte';
	import LinkedSignIn from '../components/ResetPassword/LinkedSignIn.svelte';
	import VerifyStep from '../components/ResetPassword/VerifyStep.svelte';
	import NewPassword from '../components/ResetPassword/NewPassword.svelte';
	import StaffForm from '../components/ResetPassword/StaffForm.svelte';
	import {
		session,
		notice,
		getToken,
		setToken,
		getSession,
		adopt,
		start,
		startOver,
		searchPlayers,
		copyContinueLink,
		PLATFORM_NAMES,
	} from '../components/ResetPassword/api';

	document.body.classList.add('slim');
	document.body.scrollIntoView({behavior: 'smooth'});

	const OAUTH_MESSAGES = {
		mismatch: "That account isn't the one linked to this profile.",
		failed: "The sign-in didn't go through, please try again.",
		limit: 'No more accounts can be checked in this session.',
		expired: 'The reset session expired or was moved to another browser, please start over.',
		unavailable: "This sign-in isn't available right now.",
	};

	let loading = true;
	let verifying = false;
	let method = null;
	let staffForm = false;
	let starting = null;
	let copied = false;

	const findPlayers = async term =>
		(await searchPlayers(term)).map(p => ({
			id: p.id,
			image: p.avatar,
			title: p.name,
			subtitle: `${PLATFORM_NAMES[p.platform] ?? 'BeatLeader'} profile · ${p.rank > 0 ? `#${p.rank} · ${Math.round(p.pp)}pp` : 'no ranked scores'}`,
		}));

	async function pick(player) {
		starting = player.id;
		try {
			await start(player.id);
			verifying = false;
		} catch (e) {
			$notice = e.message;
		}
		starting = null;
	}

	function restart() {
		if (request?.status == 'open' && !confirm('The answer to your staff request only shows up for this profile. Start over anyway?'))
			return;
		startOver();
	}

	async function copyLink() {
		copied = await copyContinueLink();
		setTimeout(() => (copied = false), 2000);
	}

	onMount(async () => {
		const params = new URLSearchParams(location.search);
		const oauth = params.get('oauth');
		const linkToken = params.get('token');
		if (linkToken || oauth) history.replaceState(null, '', location.pathname);

		if (linkToken) setToken(linkToken);
		if (getToken()) {
			try {
				await (linkToken ? adopt() : getSession());
			} catch (e) {
				if (e.status != 410) $notice = e.message;
				else if (linkToken) $notice = 'This link was already opened somewhere else, or it expired.';
			}
		}

		if (oauth && !$notice) $notice = OAUTH_MESSAGES[oauth] ?? null;
		verifying = !!oauth || !!($session?.declaredLoggedOut || $session?.challenge || $session?.identityProvider);
		if (oauth) method = 'background';
		loading = false;
	});

	$: player = $session?.player;
	$: request = $session?.request;
	$: linked = $session?.linkedProviders ?? [];
	$: view = !player
		? 'search'
		: $session.completed || $session.canComplete
			? 'password'
			: !$session.hasPassword
				? 'nopassword'
				: linked.includes('Steam') || (verifying && linked.length)
					? 'linked'
					: verifying
						? 'verify'
						: 'account';
</script>

<svelte:head>
	<title>Reset password - {ssrConfig.name}</title>
</svelte:head>

<article class="reset-page" transition:fade|global>
	<ContentBox>
		<div class="flow">
			<h1 class="title is-3">Reset password</h1>

			{#if loading}
				<Spinner />
			{:else if staffForm}
				<StaffForm on:close={() => (staffForm = false)} />
			{:else}
				{#if request && view != 'password'}
					<p class="inset request {request.status}">
						{#if request.status == 'open'}
							<b>Your request #{request.id} is with the staff.</b>
							The answer shows up on this page, in this browser. To follow it on another device,
							<button class="link" on:click={copyLink}>{copied ? 'copied!' : 'copy a private link'}</button> and open it there.
						{:else}
							<b>The staff answered your request #{request.id}:</b>
							{request.adminNote || "we couldn't confirm the profile is yours."}
						{/if}
					</p>
				{/if}

				{#if $notice}
					<p class="bad">{$notice}</p>
				{/if}

				{#if view == 'search'}
					<h2 class="title is-5">Find your profile</h2>
					<p>Search by name, or paste the link or ID of the profile. Previous names work too.</p>
					<SearchPicker
						placeholder="Profile name, link or ID"
						search={findPlayers}
						round={true}
						busy={starting}
						empty="Nobody found. Your profile name is the one next to your scores on the leaderboards in the game."
						on:select={e => pick(e.detail)} />
					<p class="hint">
						Only profiles made in the Quest mod, or Oculus PC profiles with a website login, have a password. Steam profiles log in through
						Steam.
					</p>
				{:else}
					<div class="inset profile">
						<img src={player.avatar} alt="" />
						<div>
							<a href="/u/{player.id}" target="_blank" rel="noreferrer">{player.name}</a>
							<span class="hint"
								>{PLATFORM_NAMES[$session.platform] ?? $session.platform} profile{player.rank > 0 ? ` · #${player.rank}` : ''}</span>
						</div>
						{#if !$session.completed}
							<button class="link" on:click={restart}>Not your profile?</button>
						{/if}
					</div>

					{#if view == 'nopassword'}
						<NoPassword on:search={restart} />
					{:else if view == 'account'}
						<AccountStep on:continue={() => (verifying = true)} />
					{:else if view == 'linked'}
						<LinkedSignIn on:staff={() => (staffForm = true)} />
					{:else if view == 'verify'}
						<VerifyStep {method} />
					{:else}
						<NewPassword />
					{/if}
				{/if}

				{#if !$session?.completed}
					<p class="hint contact">
						Stuck?
						<button class="link" on:click={() => (staffForm = true)}>
							{request?.status == 'open' ? 'Update your request to the staff' : 'Contact the staff'}
						</button>
					</p>
				{/if}
			{/if}
		</div>
	</ContentBox>
</article>

<style>
	.reset-page {
		--inset: color-mix(in srgb, var(--textColor) 6%, transparent);
		max-width: 42em;
		margin: 0 auto;
	}

	.request {
		align-self: stretch;
		border-left: 3px solid var(--selected);
	}

	.request.rejected,
	.request.closed {
		border-left-color: var(--decrease);
	}

	.profile {
		display: flex;
		align-items: center;
		gap: 0.75em;
		align-self: stretch;
	}

	.profile img {
		width: 2.75em;
		height: 2.75em;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile div {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.profile a {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--textColor);
		font-weight: 600;
	}

	.contact {
		align-self: stretch;
		margin-top: 0.75em;
		padding-top: 0.75em;
		border-top: 1px solid var(--row-separator);
	}

	.reset-page :global(.flow) {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75em;
	}

	.reset-page :global(.title) {
		margin: 0;
	}

	.reset-page :global(.hint) {
		color: var(--faded);
		font-size: 0.875em;
	}

	.reset-page :global(.good) {
		color: var(--increase);
	}

	.reset-page :global(.bad) {
		color: var(--decrease);
	}

	.reset-page :global(.link) {
		padding: 0;
		border: none;
		background: none;
		color: var(--linkColor);
		font: inherit;
		cursor: pointer;
	}

	.reset-page :global(.row) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
	}

	.reset-page :global(.inset) {
		padding: 0.6em 0.8em;
		border-radius: 6px;
		background-color: var(--inset);
	}

	.reset-page :global(.status) {
		display: flex;
		align-items: center;
		gap: 0.5em;
		color: var(--faded);
	}

	.reset-page :global(.status > svg) {
		flex: none;
	}

	.reset-page :global(ol.steps) {
		margin-left: 1.25em;
	}

	.reset-page :global(ol.steps li:not(:last-child)) {
		margin-bottom: 0.4em;
	}

	.reset-page :global(input[type='text']),
	.reset-page :global(input[type='password']),
	.reset-page :global(textarea) {
		max-width: 100%;
		padding: 0.4em 0.6em;
		border: 1px solid var(--faded);
		border-radius: 4px;
		background-color: transparent;
		color: var(--textColor);
		font: inherit;
		outline: none;
	}

	.reset-page :global(input:focus),
	.reset-page :global(textarea:focus) {
		border-color: var(--selected);
	}

	.reset-page :global(input::placeholder),
	.reset-page :global(textarea::placeholder) {
		color: var(--faded);
	}
</style>
