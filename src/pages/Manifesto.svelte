<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';

	document.body.classList.add('slim');
	document.body.scrollIntoView({behavior: 'smooth'});
</script>

<svelte:head>
	<title>OurSaber Manifesto - {ssrConfig.name}</title>
</svelte:head>

<article transition:fade|global>
	<ContentBox>
		<div class="manifesto-container">
			<div class="newspaper-header">
				<h1 class="newspaper-title">ПРАВДА</h1>
				<h2 class="newspaper-subtitle">PP GRINDERS OF ALL LEADERBOARDS, UNITE!</h2>
				<div class="newspaper-date">Issue No. 1917 | The Player's Voice | 4/1/2025</div>
			</div>
			<div class="newspaper-banner">
				<div class="hammer-sickle">☭</div>
				<h1 class="headline">REVOLUTIONARY ANNOUNCEMENT</h1>
				<div class="hammer-sickle">☭</div>
			</div>

			<div class="article-content">
				<h2 class="article-title">BEATLEADER RANKING IS CHANGING!</h2>

				<div class="article-paragraph">
					<p>
						We tried to build a system that would fairly represent map difficulty and reward skilled players respectfully. But with time our
						system became filled with foreign spies and double agents, which led to a small group of players consolidating the majority of
						the PP of the leaderboards.
					</p>
				</div>

				<div class="article-callout">
					<p>PP grinder, cast off the shackles of the class system! Everyone should have high PP plays!</p>
				</div>

				<div class="article-paragraph">
					<p>
						From now on stars will represent only our destination to the bright future without misses and bad cuts. PP curve will represent
						the success of the dictatorship of PP grinder and eternal elimination of acc struggle.
					</p>
				</div>

				<div class="article-announcement">
					<p>From today, all ranked scores cost 500PP!</p>
				</div>

				<div class="article-paragraph">
					<p>Imperialistic BeatLeader is dead, now it's only OurSaber!</p>
					<p>But because of the limited nature of the PP resource, we have to introduce temporary ration measures:</p>
					<p>
						Only 1st and Every 5th score on the leaderboard has PP. Also only scores from 2025 are counted. Let's tighten our belts today to
						ensure a great, well-fed future.
					</p>
				</div>

				<div class="article-slogan">
					<p>PP grinders of all leaderboards unite! OurSaber will lead the way!</p>
				</div>

				<div class="article-footer">
					<div class="red-star">★</div>
					<div class="hammer-sickle">☭</div>
					<div class="red-star">★</div>
				</div>
			</div>
		</div>
	</ContentBox>
</article>

<style>
	.manifesto-container {
		font-family: 'Times New Roman', serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		background-color: #f5e7c1;
		color: #660000;
		border: 2px solid #660000;
	}

	.newspaper-header {
		text-align: center;
		border-bottom: 2px solid #660000;
		margin-bottom: 20px;
		padding-bottom: 10px;
	}

	.newspaper-title {
		font-size: 3.5rem;
		font-weight: bold;
		margin: 0;
		color: #cc0000;
		letter-spacing: 0.2em;
		font-family: 'Arial Black', sans-serif;
	}

	.newspaper-subtitle {
		font-size: 1.2rem;
		margin: 5px 0;
		font-weight: bold;
		letter-spacing: 0.1em;
	}

	.newspaper-date {
		font-size: 0.9rem;
		font-style: italic;
	}

	.newspaper-banner {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 20px 0;
		gap: 15px;
	}

	.headline {
		font-size: 2rem;
		text-align: center;
		margin: 0;
		font-weight: bold;
		color: #cc0000;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.article-content {
		line-height: 1.6;
	}

	.article-title {
		font-size: 1.8rem;
		font-weight: bold;
		margin: 20px 0;
		text-align: center;
		text-transform: uppercase;
	}

	.article-paragraph {
		margin: 15px 0;
		text-align: justify;
		font-size: 1.1rem;
	}

	.article-callout {
		font-size: 1.3rem;
		font-weight: bold;
		border-left: 4px solid #cc0000;
		padding-left: 15px;
		margin: 20px 0;
		color: #cc0000;
	}

	.article-announcement {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 25px 0;
		gap: 10px;
		font-size: 1.5rem;
		font-weight: bold;
		color: #cc0000;
	}

	.saberege {
		font-size: 1.8rem;
	}

	.article-slogan {
		font-size: 1.4rem;
		font-weight: bold;
		text-align: center;
		margin: 30px 0;
		border-top: 1px solid #660000;
		border-bottom: 1px solid #660000;
		padding: 15px 0;
		color: #cc0000;
	}

	.article-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 30px;
		gap: 20px;
	}

	.hammer-sickle {
		font-size: 2rem;
		color: #cc0000;
	}

	.red-star {
		font-size: 2rem;
		color: #cc0000;
	}

	p.back {
		margin-top: 20px;
		text-align: center;
	}

	p.back a {
		color: #660000;
		text-decoration: underline;
	}

	@media (max-width: 600px) {
		.newspaper-title {
			font-size: 2.5rem;
		}

		.headline {
			font-size: 1.5rem;
		}

		.article-title {
			font-size: 1.5rem;
		}
	}
</style>
