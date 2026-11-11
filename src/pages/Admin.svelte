<script>
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher} from 'svelte';
	import {fade, fly} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import {debounce} from '../utils/debounce';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import AliasRequests from '../components/Admin/AliasRequests.svelte';
	import FailedScores from '../components/Admin/FailedScores.svelte';
	import ReeSabersFiles from '../components/Admin/ReeSabersFiles.svelte';
	import ProfileReviews from '../components/Admin/ProfileReviews.svelte';
	import ProfileFlags from '../components/Admin/ProfileFlags.svelte';
	import PasswordResets from '../components/Admin/PasswordResets.svelte';

	export let location;
	export let initialType;

	document.body.classList.remove('slim');

	let type;

	function getCurrentType(initialType) {
		type = initialType?.length ? initialType : 'failedScores';
		sortValue = sortValues.find(v => v.id == type);
	}

	let sortValues1 = [
		{id: 'failedScores', label: 'Failed scores', title: 'Sort by PP', iconFa: 'fa fa-file-excel'},
		{id: 'aliasRequests', label: 'Alias requests', title: 'Sort by accuracy clans with 3 players or more', iconFa: 'fa fa-user'},
		{id: 'countryRequests', label: 'Country requests', title: 'Sort by maps captured', iconFa: 'fa fa-flag'},
		{id: 'reeSabers', label: 'ReeSabers files', title: 'Manage ReeSabers release and beta builds', iconFa: 'fas fa-file-zipper'},
		{id: 'profileReviews', label: 'Profile reviews', title: 'Name, avatar and cover changes reviewed by Claude', iconFa: 'fas fa-user-shield'},
		{id: 'profileFlags', label: 'Profile flags', title: 'Proxy sign-ups, sign-up bursts and shared IPs', iconFa: 'fas fa-user-secret'},
		{id: 'passwordResets', label: 'Password resets', title: 'Requests to the staff from the password reset and the log of resets', iconFa: 'fas fa-key'},
	];
	let sortValues = sortValues1;
	let sortValue = sortValues[0];

	function onSortChange(event) {
		type = event?.detail?.id;
		sortValue = sortValues.find(v => v.id == type);
	}

	$: getCurrentType(initialType);
</script>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<Switcher values={sortValues} value={sortValue} on:change={onSortChange} />
		<ContentBox>
			{#if type == 'failedScores'}
				<FailedScores />
			{:else if type == 'aliasRequests'}
				<AliasRequests />
			{:else if type == 'reeSabers'}
				<ReeSabersFiles />
			{:else if type == 'profileReviews'}
				<ProfileReviews />
			{:else if type == 'profileFlags'}
				<ProfileFlags />
			{:else if type == 'passwordResets'}
				<PasswordResets />
			{/if}
		</ContentBox>
	</article>
</section>
