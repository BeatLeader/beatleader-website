<script>
	import Country from './Country.svelte'

	export let countries = [];

	let items = [];
	function updateCountries() {
		items = Array.isArray(countries) ? countries : [];
	}

	$: updateCountries(countries)

	$: console.log(items);
</script>

<section>
	<span class="add-country badge-bg" on:click={() => items = [...items, null]}><span class="fas fa-plus-circle"></span> add</span>

	{#each items as country}
		<Country {country}/>
	{/each}

</section>

<style>
		section {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				gap: .25rem;
		}
    .add-country {
        display: inline-flex;
        align-items: center;
        gap: .5rem;
        cursor: pointer;
    }
    .add-country:hover {
        border-bottom: 2px solid var(--beatleader-primary);
    }

    section :global(.badge-bg) {
        background: rgba(255, 255, 255, 0.123);
        border-bottom: 2px solid transparent;
        border-radius: 0.1rem;
        padding: .5rem;
        filter: saturate(0.5) brightness(1.4);
        transform: scale(0.8);
        font-weight: 400 !important;
        color: white !important;
        margin: 0 0;
    }
</style>