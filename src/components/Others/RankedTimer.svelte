<script>
	import rankedTimer from '../../stores/ranked-timer';
	import {padNumber} from '../../utils/format';
</script>

{#if $rankedTimer}
	<section>
		<h2 class="title is-5">New ranked batch in</h2>

		<div class="timer">
			<div>
				<span>{$rankedTimer.days}</span>
				<label>Days</label>
			</div>

			<div>
				<span>{padNumber($rankedTimer.hours)}</span>
				<label>Hours</label>
			</div>

			<div>
				<span>{padNumber($rankedTimer.minutes)}</span>
				<label>Minutes</label>
			</div>

			<div>
				<span>{padNumber(parseInt($rankedTimer.seconds, 10))}</span>
				<label>Seconds</label>
			</div>
		</div>
	</section>
{/if}

<style>
	section {
		margin-bottom: 1rem;
		text-align: center;
	}

	h2 {
		text-transform: uppercase;
	}

	.timer {
		display: inline-flex;
		justify-content: space-evenly;
		gap: 3rem;
	}

	.timer > div > * {
		display: block;
		text-align: center;
	}

	.timer > div span {
		font-size: 2em;
		font-weight: 700;
	}

	.timer > div label {
		text-transform: uppercase;
		color: var(--faded) !important;
	}

	@media screen and (max-width: 400px) {
		.timer {
			gap: 2rem;
		}
	}
</style>
