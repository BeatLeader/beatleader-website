<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {bestiesCategoriesNames, DifficultyStatus, requirementsMap} from '../../utils/beatleader/format';
	import DialogContent from '../Common/DialogContent.svelte';
	import Select from '../Settings/Select.svelte';
	import {dateFromUnix, formatDate} from '../../utils/date';
	import Spinner from '../Common/Spinner.svelte';

	export let leaderboard;
	export let diffs;
	export let currentNominations;
	export let confirm;
	export let cancel;
	export let wasNominated;

	let applicapleCategories = [];
	let selectedCategory = null;

	function filterCategories(leaderboard) {
		applicapleCategories = [];

		if (leaderboard.stats.status == DifficultyStatus.ost) {
			applicapleCategories.push({
				id: 'Gen-OST',
			});
		} else {
			if (leaderboard.stats.status == DifficultyStatus.ranked) {
				applicapleCategories.push({
					id: 'Ranked-RankedMap',
				});
			}

			if (leaderboard.stats.requirements & requirementsMap.noodles) {
				applicapleCategories.push({
					id: 'Mods-Modchart',
				});
			}

			if (leaderboard.stats.requirements & requirementsMap.noodles || leaderboard.stats.requirements & requirementsMap.chroma) {
				applicapleCategories.push({
					id: 'Mods-ArtMap',
				});
			}

			if (diffs.find(d => d.type == '90Degree' || d.type == '360Degree' || d.type == 'OneSaber' || d.type == 'NoArrows')) {
				applicapleCategories.push({
					id: 'Gen-Alternative',
				});
			}

			if (diffs.filter(d => d.type == 'Standard').length == 5) {
				applicapleCategories.push({
					id: 'Gen-FullSpread',
				});
			}

			[
				'Mods-Lightshow',
				'Style-Balanced',
				'Style-Tech',
				'Style-Speed',
				'Style-Dance',
				'Style-Fitness',
				'Style-Challenge',
				'Style-Acc',
				'Style-Poodle',
				'Style-Gimmick',
			].forEach(element => {
				applicapleCategories.push({
					id: element,
				});
			});
		}

		applicapleCategories.forEach(element => {
			element.name = bestiesCategoriesNames[element.id];
		});

		applicapleCategories = applicapleCategories.filter(c => !currentNominations.find(cn => cn.category == c.id));
		selectedCategory = applicapleCategories[0];
	}

	let nominating = false;
	let nominated = false;
	let error = null;
	function nominate() {
		nominating = true;
		error = null;

		fetch(`${BL_API_URL}beasties/nominate?leaderboardId=${leaderboard.leaderboardId}&category=${selectedCategory.id}`, {
			method: 'POST',
			credentials: 'include',
		})
			.then(r => r.json())
			.then(response => {
				nominating = false;
				if (response?.message != 'Map submitted.') {
					error = response?.message;
				} else {
					nominated = true;
					wasNominated();
					setTimeout(() => {
						confirm();
					}, 2500);
				}
			});
	}

	$: filterCategories(leaderboard);
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Nominate map for Besties awards"
		okButton="Nominate!"
		okButtonType="green"
		cancelButton="Cancel"
		okButtonDisabled={!applicapleCategories.length || nominating}
		on:confirm={() => {
			nominate();
		}}
		on:cancel={cancel}>
		<div slot="content">
			{#if nominated}
				<span style="color: green;">Map sucessfully nominated!</span>
			{:else}
				<div class="description-and-select">
					<span style="margin-bottom: 1.5em;"
						>The <a href="https://bsaber.com/the-beastsaber-mapping-awards">BeastSaber Mapping Awards</a>, also called "The Beasties," are
						annual awards that seek to celebrate the best of the best of Beat Saber mapping across multiple categories. Maps that were
						released between December 1, 2023 and November 30, 2024 are eligible for this year's nominations.</span>

					{#if nominating}
						<Spinner />
					{:else}
						{#if currentNominations?.length}
							<span>Already nominated in:</span>
							<div class="existing-nominations">
								{#each currentNominations as currentNomination}
									{bestiesCategoriesNames[currentNomination.category]} - {formatDate(dateFromUnix(currentNomination.timepost))}
								{/each}
							</div>
						{/if}
						<span>Available categories:</span>
						{#if applicapleCategories.length}
							<Select bind:value={selectedCategory} options={applicapleCategories} valueSelector={x => x} />
						{:else}
							<span style="color: grey;">No applicable category left. Thank you for your nomination!</span>
						{/if}
						{#if error}
							<span style="color: red;">{error}</span>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}
	.description-and-select {
		display: flex;
		flex-direction: column;
		max-width: 30em;
	}
	.existing-nominations {
		margin-bottom: 1em;
		color: gray;
	}
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
