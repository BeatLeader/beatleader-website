<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import Spinner from '../Common/Spinner.svelte';

	export let songId;
	export let criteriaCheck = null;

	let criteriaKeys = [
		'modsRequired',
		'noteHotStarts',
		'wallHotStarts',
		'noteColdEnds',
		'wallColdEnds',
		'noteIntersections',
		'wallIntersections',
		'noteOutOfRange',
		'wallOutOfRange',
		'noteFailSwings',
	];

	function checkCriteria(songId) {
		fetch(BL_API_URL + 'criteria/check/' + songId)
			.then(r => r.json())
			.then(d => {
				criteriaCheck = d;
			});
	}

	$: if (!criteriaCheck) checkCriteria(songId);
</script>

{#if criteriaCheck}
	<div>
		<div class="check-container">
			<span>Profanity check:</span>
			{#if criteriaCheck.profanityCheck.length}
				{#each criteriaCheck.profanityCheck as profanity}
					<div class="profanity">
						<i style="color: red" class="fa fa-xmark" />
						"{profanity.value}" <b>Type:</b>
						{profanity.type} <b>Intensity:</b>
						{profanity.intensity}
					</div>
					<div>
						<b>In</b>
						{profanity.line}
					</div>
				{/each}
			{:else}
				<b><i class="fa fa-check" /> Ok</b>
			{/if}
			{#each criteriaCheck.diffs as diff}
				<b>{diff.diff}</b>
				{#each criteriaKeys as key}
					{#if diff.criteriaReport[key].length}
						<div class="criteria-check">
							<div>
								{key}:
								<i style="color: red" class="fa fa-xmark" />
							</div>

							<div>
								{#each diff.criteriaReport[key] as report}
									{#if report._duration}
										<div>
											<a
												title="{report.realTime}sec"
												href="https://skystudioapps.com/bs-viewer/?id={songId}&t={report.realTime}&diffName={diff.diff}"
												>Time: {report._time}</a>
											X: {report._lineIndex}
											Type: {report._type}
											Duration: {report._duration}
										</div>
									{:else}
										<div>
											<a
												title="{report.realTime}sec"
												href="https://skystudioapps.com/bs-viewer/?id={songId}&t={report.realTime}&diffName={diff.diff}"
												>Time: {report._time}</a>
											X: {report._lineIndex}
											Y: {report._lineLayer}
											Type: {report._type}
											Direction: {report._cutDirection}
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			{/each}
		</div>
	</div>
{:else}
	<Spinner />
{/if}

<style>
	.check-container {
		display: flex;
		flex-direction: column;
	}

	.profanity {
		display: flex;
		grid-gap: 0.5em;
	}
</style>
