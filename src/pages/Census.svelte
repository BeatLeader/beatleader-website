<script>
	import {MetaTags} from 'svelte-meta-tags';
	import CensusMenu from '../components/Census/CensusMenu.svelte';
	import CensusPlayer from '../components/Census/CensusPlayer.svelte';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import {censusData} from '../others/census';
	import ssrConfig from '../ssr-config';

	document.body.scrollIntoView({behavior: 'smooth'});

	let title = 'Beat Saber in Numbers';
	let metaDescription = '2023 Player Census results';
</script>

<svelte:head>
	<title>{title} - {ssrConfig.name}</title>
</svelte:head>

<div>
	<ContentBox>
		<div class="survey-header">
			<h1 class="title is-3" style="text-align: center;">Beat Saber in Numbers</h1>
		</div>

		<div class="survey-header">
			<img class="bl-icon" src="/assets/favicon.svg" />
			<i class="fa-solid fa-xmark" />
			<img class="berkeley-icon" src="/assets/berkeley.svg" />
		</div>

		<p class="survey-description">
			BeatLeader together with University of California, Berkeley conducted a large-scale comprehensive survey of 1,006 Beat Saber players
			that sheds light on several important aspects of playerbase, including their background, biometrics, demographics, health information,
			behavioral patterns, and technical device specifications. This further provide insights into the ranking community and potential
			correlation with player performance.
		</p>

		<div class="survey-header">
			<Button url="https://arxiv.org/abs/2305.14320" onlyurl={true} label="Read Paper on arXiv" iconFa="fas fa-graduation-cap" />
			<a href="https://arxiv.org/pdf/2305.14320" style="margin-top: -0.4em;">PDF</a>
		</div>
	</ContentBox>
	<ContentBox>
		<CensusMenu {censusData} />
	</ContentBox>
	<ContentBox>
		<CensusPlayer {censusData} />
	</ContentBox>
	<ContentBox>
		<p>
			The survey was conducted among ranked players, and the results might not be representative of all Beat Saber players. Additionally,
			the survey relied on self-reported data, which can be subject to bias. And correlation does not imply causation, so these findings
			should be interpreted with caution.
		</p>

		<h2>Key findings</h2>
		<ul>
			<li>
				<strong>Age:</strong> Younger players outperform older players on average, with 18-19 being the best performing age group. Possible explanations
				include a reduction with age of eyesight, reaction time, physical fitness, and neuroplasticity.
			</li>
			<li>
				<strong>Physical Fitness:</strong> We found that users with any experience playing an individual or team sport perform 11.9% better than
				those without such experience on average. Sports requiring a high degree of hand-eye coordination, such as Badminton, Tennis, and Golf,
				appear to have the highest positive effect on Beat Saber performance.
			</li>
			<li>
				<strong>Behavior Patterns:</strong> Warming up and being healthy generally improves performance in the game.
			</li>
		</ul>
		<h2>Unexpected Correlations with Performance</h2>
		<ul>
			<li>
				<strong>Experience with Rhythm Games:</strong> Having experience with rhythm games other than Beat Saber has a slight negative effect
				on Beat Saber performance.
			</li>
			<li>
				<strong>Musical Background:</strong> Also experience with musical instruments or dancing has a slight negative effect on Beat Saber performance.
				Beat Saber in fact is more like an athletic sport than a typical rhythm game.
			</li>

			<li>
				<strong>Operating System:</strong> Windows 10 users outperform Windows 11 users by an average of 10.2%. A possible explanation for this
				may be that those who primarily use their PC for gaming may prefer Windows 10.
			</li>
			<li>
				<strong>Clothing:</strong> In general, less clothing appears to correlate with better performance, with fewer garments on the upper body,
				lower body, and feet all being associated with better average scores. This could be explained by the fact that clothing may serve to
				limit range of motion, or to reduce heat dissipation.
			</li>
			<li>
				<strong>Political Orientation:</strong> Self-identified conservatives outperform self-identified liberals by an average of 20.8%. This
				trend is particularly significant as it runs contrary to the finding that younger players generally perform better ¯\_(ツ)_/¯
			</li>
		</ul>
		<br /><br /><br />
		<p>Thanks to everyone who took part in the survey! Your responses provided insights on things we always wondered about.</p>

		<p>
			Achievements were updated according to the quality of the data you provided. Contact NSGolova if you don't have achievement in your
			profile, but took part in the survey.
		</p>

		<p>Good luck, don't forget to warm up and may the 115s be with you! (✿◠‿◠)</p>
	</ContentBox>
</div>

<MetaTags
	{title}
	description={metaDescription}
	openGraph={{
		title,
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/census2023.webp'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary_large_image',
		title,
		description: metaDescription,
		image: CURRENT_URL + '/assets/census2023.webp',
		imageAlt: metaDescription,
	}} />

<style>
	.survey-header {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: row;
		grid-gap: 1em;
	}

	.survey-description {
		padding: 2em;
	}

	.bl-icon {
		width: 10em;
		height: 10em;
	}

	.berkeley-icon {
		width: 7em;
		height: 7em;
		box-shadow: rgb(3 0 89 / 71%) 0 0 1.2em;
		border-radius: 50%;
		margin: 1.5em;
	}

	.fa-xmark {
		font-size: 2.5em;
	}

	h2 {
		margin-top: 1.2em;
		font-size: larger;
	}

	p {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	ul {
		list-style-type: square;
		padding-left: 20px;
	}

	li {
		line-height: 1.6;
	}
</style>
