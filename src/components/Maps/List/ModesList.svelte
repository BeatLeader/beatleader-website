<script>
	import {diffColors, difficultyDescriptions, modeDescriptions} from '../../../utils/beatleader/format';

	export let song;
	export let isHovered;

	let modes;

	function groupDiffs(song) {
		var result = [];

		for (let i = 0; i < song.difficulties.length; i++) {
			var diff = song.difficulties[i];

			if (diff.mode < 10) {
				var characteristic = result.find(d => d.mode == diff.mode);
				console.log(characteristic);

				if (!characteristic) {
					characteristic = {
						mode: diff.mode,
						modeName: diff.modeName,
						diffs: [],
						description: modeDescriptions[diff.modeName],
					};
					result.push(characteristic);
				}
				diff.color = diffColors[diff.difficultyName.toLowerCase()];
				characteristic.diffs.push(diff);
			}
		}

		modes = result;
	}

	$: groupDiffs(song);
</script>

{#if modes?.length}
	<div class="modes-list" class:isHovered>
		{#each modes as mode}
			<div class="mode-container" class:isHovered>
				<div class="mode-icon-name" class:isHovered>
					<i class="mode-icon {mode.description.icon}" />
					{#if isHovered}
						<span class="mode-name">{mode.modeName}</span>
					{/if}
				</div>
				<div class="diffs-container" class:isHovered>
					{#each mode.diffs as diff, idx}
						<div class="diff-container" class:isHovered>
							{#if isHovered}
								<span class="diff-name">{diff.difficultyName}</span>
							{/if}
							<div
								class="diff-orb"
								style="background-color: {diff.color}; margin-right: {!isHovered && idx == mode.diffs.length - 1 && !diff.stars
									? '0.3em'
									: '0'};">
								{#if diff.stars}
									<span>{diff.stars.toFixed(1)}</span><span>★</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.modes-list {
		display: flex;
		gap: 0.3em;
		transition: all 0.3s ease-in-out;
		overflow: hidden;
		width: 19em;
		overflow: hidden;
		mask-image: linear-gradient(90deg, white 0%, white 90%, transparent);
	}
	.modes-list.isHovered {
		flex-direction: column;
		flex: 1;
		gap: 0.4em;
		width: unset;
		mask-image: unset;
		overflow: visible;
	}
	.mode-container {
		border-radius: 12px;
		background-color: #00000069;
		padding: 0.2em 0.2em 0.2em 0.4em;
		display: flex;
		gap: 0.2em;
		align-items: center;
		transition: all 0.3s ease-in-out;
	}

	.mode-container.isHovered {
		display: flex;
		flex-direction: column;
		align-items: baseline;
	}

	.mode-icon-name.isHovered {
		display: flex;
		padding-top: 0.2em;
		gap: 0.4em;
		font-weight: 600;
	}

	.diff-container {
		display: flex;
		transition: all 0.3s ease-in-out;
	}

	.diff-container.isHovered {
		display: grid;
		grid-template-columns: 6em 3em auto;
		gap: 0.2em;
	}

	.diffs-container {
		display: flex;
		gap: 0.2em;
		transition: all 0.3s ease-in-out;
	}

	.diffs-container.isHovered {
		flex-direction: column;
	}

	.mode-icon {
		width: 1.4em;
		height: 1.4em;
		display: block;
	}

	.diff-orb {
		color: white;
		font-weight: 600;
		padding: 0.25em 0.3em 0.2em 0.4em;
		font-size: 0.8em;
		border-radius: 0.7em;
		display: flex;
		align-items: center;
		gap: 0.1em;
		min-height: 1.6em;
	}
</style>
