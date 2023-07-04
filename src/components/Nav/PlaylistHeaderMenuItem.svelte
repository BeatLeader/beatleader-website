<script>
	import {navigate} from 'svelte-routing';
</script>

<a href="/playlists" on:click|preventDefault|stopPropagation={() => navigate('/playlists')}>
	<i class="fas fa-list-ul" />
	Playlists
</a>

<style>
	a {
		display: block;
		color: inherit !important;
	}
</style>
