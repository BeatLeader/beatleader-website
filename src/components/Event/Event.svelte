<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import Button from '../Common/Button.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let event;
	export let withLeader = true;

	const dispatch = createEventDispatcher();
</script>

{#if event}
	<section class="event">
		<img src={event.image} />
		<h2 class="event-name">{event.name}</h2>

		{#if event.leader && withLeader}
			{#if event.leader2}
				<div class="metric">
					<label>Leaders</label>
					<div class="leaders">
						<PlayerNameWithFlag
							player={event.leader}
							playerClickFilter={`eventId=${event.id}`}
							playerClickFilterFull={event.id == 81
								? `${BL_API_URL.replace('api', 'leftleader')}u/${event?.leader?.alias ?? event?.leader?.playerId}`
								: null}
							on:click={e => {
								navigate(
									event.id == 81
										? `${BL_API_URL.replace('api', 'leftleader')}u/${event?.leader?.alias ?? event?.leader?.playerId}`
										: `/u/${event?.leader?.id}?eventId=${event.id}`
								);
								e.stopPropagation();
							}} />
						<PlayerNameWithFlag
							player={event.leader2}
							playerClickFilter={`eventId=${event.id}`}
							playerClickFilterFull={event.id == 81
								? `${BL_API_URL.replace('api', 'leftleader')}u/${event?.leader2?.alias ?? event?.leader2?.playerId}`
								: null}
							on:click={e => {
								navigate(
									event.id == 81
										? `${BL_API_URL.replace('api', 'leftleader')}u/${event?.leader2?.alias ?? event?.leader2?.playerId}`
										: `/u/${event?.leader2?.id}?eventId=${event.id}`
								);
								e.stopPropagation();
							}} />
					</div>
				</div>
			{:else}
				<div class="metric">
					<label>Leader</label>
					<PlayerNameWithFlag
						player={event.leader}
						playerClickFilter={`eventId=${event.id}`}
						playerClickFilterFull={event.id == 81
							? `${BL_API_URL.replace('api', 'leftleader')}u/${event?.leader?.alias ?? event?.leader?.playerId}`
							: null}
						on:click={e => {
							navigate(
								event.id == 81
									? `${BL_API_URL.replace('api', 'leftleader')}u/${event?.leader?.alias ?? event?.leader?.playerId}`
									: `/u/${event?.leader?.id}?eventId=${event.id}`
							);
							e.stopPropagation();
						}} />
				</div>
			{/if}
		{/if}

		{#if event.playerCount && withLeader}
			<div class="metric">
				<label>Players participating</label>
				<span>{event.playerCount}</span>
			</div>
		{/if}

		<span style="color: white;" title={formatDate(dateFromUnix(event.endDate))}>
			{#if Date.now() / 1000 < event.endDate}
				Will end {formatDateRelative(dateFromUnix(event.endDate))}
			{:else}
				Ended {formatDateRelative(dateFromUnix(event.endDate))}
			{/if}
		</span>
		{#if event.id != 32 && event.id != 48 && event.id != 81 && event.id != 84}
			<Button label="Show playlist" preventDefault={true} on:click={() => dispatch('show-playlist', event)} />
		{/if}
	</section>
{/if}

<style>
	.event {
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 1em;
	}

	.event-name {
		text-align: center;
	}

	img {
		height: 200px;
	}

	h2 {
		font-weight: 500;
		font-size: 1.1em;
	}

	.metric {
		text-align: center;
	}

	.metric > label {
		display: block;
		margin-bottom: 0.125em;
		font-weight: 400;
	}

	.metric > span {
		display: block;
		color: var(--textColor);
		font-size: 1.2em;
		font-weight: 900;
	}

	.leaders {
		display: flex;
		gap: 0.5em;
		flex-direction: column;
	}
</style>
