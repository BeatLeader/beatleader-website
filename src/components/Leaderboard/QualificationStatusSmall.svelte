<script>
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';

	export let qualification;
</script>

{#if qualification}
	<div class="qualification-description">
		{#if !qualification.approved}
			<div class="timeset">
				<span style="color: {getTimeStringColor(qualification?.timeset)}; ">
					Qualified {formatDateRelative(dateFromUnix(qualification.timeset))}
				</span>
			</div>
		{/if}

		{#if qualification.mapperAllowed}
			<span style="color: green;"><i class="fa fa-check" /> Mapper</span>
		{:else}
			<span style="color: gray;"><i class="fa fa-xmark" /> Mapper</span>
		{/if}

		{#if qualification.criteriaMet == 1}
			<span style="color: green;"><i class="fa fa-check" /> Criteria</span>
		{:else if qualification.criteriaMet == 2}
			<span style="color: red;"><i class="fa fa-xmark" /> Criteria</span>
		{:else}
			<span style="color: gray;"><i class="fa fa-xmark" /> Criteria</span>
		{/if}

		{#if qualification.approvers}
			{#if qualification.approved}
				<span style="color: green;"><i class="fa fa-check" /> RT</span>

				<div class="timeset">
					<span>
						Ready to rank {formatDateRelative(dateFromUnix(qualification.approvalTimeset + 60 * 60 * 24 * 7))}
					</span>
				</div>
			{:else}
				<span style="color: red;"><i class="fa fa-xmark" /> RT</span>
			{/if}
		{:else}
			<span style="color: gray;"><i class="fa fa-xmark" /> RT</span>
		{/if}
	</div>
{/if}

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.8em;
		align-items: center;
	}
</style>
