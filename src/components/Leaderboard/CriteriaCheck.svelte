<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {padNumber} from '../../utils/format';
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

	let criteriaKeysLabels = {
		modsRequired: 'Mods required',
		noteHotStarts: 'Note hot starts',
		wallHotStarts: 'Wall hot starts',
		noteColdEnds: 'Note cold ends',
		wallColdEnds: 'Wall cold ends',
		noteIntersections: 'Note intersections',
		wallIntersections: 'Wall intersections',
		noteOutOfRange: 'Note outside song',
		wallOutOfRange: 'Wall outside song',
		noteFailSwings: 'Swing intersection',
	};

	function checkCriteria(songId) {
		fetch(BL_API_URL + 'criteria/check/' + songId)
			.then(r => r.json())
			.then(d => {
				criteriaCheck = d;
			});
	}

	function checkDiffErrors(criteriaCheck) {
		criteriaCheck.diffs.forEach(diff => {
			diff.reported = criteriaKeys.find(key => diff.criteriaReport[key].length);
		});
	}

	function formatSeconds(value) {
		return Math.floor(value / 60) + ':' + padNumber(Math.round(value % 60));
	}

	$: if (!criteriaCheck) checkCriteria(songId);
	$: if (criteriaCheck) checkDiffErrors(criteriaCheck);
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
				{#if diff.reported}
					<b>{diff.diff}</b>
					{#each criteriaKeys as key}
						{#if diff.criteriaReport[key].length}
							<div class="criteria-check">
								<div>
									<a href="https://beatleader.wiki/en/criteria/check-glossary#{key.toLowerCase()}">{criteriaKeysLabels[key]}:</a>

									<i style="color: red" class="fa fa-xmark" />
								</div>

								<div>
									{#each diff.criteriaReport[key] as report}
										{#if report._duration}
											<div>
												<a
													title="{formatSeconds(report.realTime)}m"
													href="https://skystudioapps.com/bs-viewer/?id={songId.replaceAll(
														'x',
														''
													)}&t={report.realTime}&diffName={diff.diff}">Time: {report._time}</a>
												X: {report._lineIndex}
												Type: {report._type}
												Duration: {report._duration}
											</div>
										{:else}
											<div>
												<a
													title="{formatSeconds(report.realTime)}m"
													href="https://skystudioapps.com/bs-viewer/?id={songId.replaceAll(
														'x',
														''
													)}&t={report.realTime}&diffName={diff.diff}">Time: {report._time}</a>
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
				{/if}
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
