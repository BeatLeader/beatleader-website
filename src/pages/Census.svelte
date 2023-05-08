<script>
	import {onMount} from 'svelte';
	import {Pie} from 'svelte-chartjs';
	import CensusGroup from '../components/Census/CensusGroup.svelte';
	import CensusPlayer from '../components/Census/CensusPlayer.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Select from '../components/Settings/Select.svelte';

	export let results = [
		{
			name: 'Demographics',
			categories: [
				{
					name: 'Playtime',
					question: 'To the nearest hour, how many total hours have you spent playing Beat Saber?',
					values: [
						{
							name: '< 100 Hours',
							count: 200,
							percentage: 19.9,
							effect: -39.2,
						},
						{
							name: '100-499 Hours',
							count: 358,
							percentage: 35.6,
							effect: -18.8,
						},
						{
							name: '500-999 Hours',
							count: 358,
							percentage: 35.6,
							effect: 13.3,
						},
					],
				},
				{
					name: 'Age',
					question: 'What is your age in years?',
					values: [
						{
							name: '18-20',
							count: 532,
							percentage: 48.3,
						},
						{
							name: '21-24',
							count: 123,
							percentage: 11.7,
						},
					],
				},
			],
		},
		{
			name: 'Background',
			categories: [
				{
					name: 'Musical instrument',
					question: 'Have you ever skillfully played a musical instrument?',
					values: [
						{
							name: 'No',
							count: 543,
							percentage: 48.9,
						},
						{
							name: 'Yes',
							count: 358,
							percentage: 35.6,
						},
					],
				},
				{
					name: 'Rhythm Games',
					question: 'If you have ever played a rhythm game other than Beat Saber, list the game(s)',
					values: [
						{
							name: 'osu',
							count: 532,
							percentage: 48.3,
						},
						{
							name: 'Guitar hero',
							count: 123,
							percentage: 11.7,
						},
					],
				},
			],
		},
	];
</script>

<ContentBox>
	<div class="title-container">
		<span class="main-title">Beat Saber in Data</span>
	</div>

	{#each results as result}
		<CensusGroup group={result} />
	{/each}
	<CensusPlayer />
</ContentBox>

<style>
	.title-container {
		display: flex;
		justify-content: center;
	}

	.main-title {
		font-size: xx-large;
		font-weight: bold;
	}
</style>
