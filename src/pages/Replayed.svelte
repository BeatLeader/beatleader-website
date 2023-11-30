<script>
	import { fade } from "svelte/transition";
	import ContentBox from "../components/Common/ContentBox.svelte";
	import FeaturedCarousel from "../components/Maps/FeaturedCarousel.svelte";
	import ReplayedCard from "../components/Replayed/ReplayedCard.svelte";

  let cards = [
    {
      component: ReplayedCard,
      props: {
        title: 'Test Card',
				body: 'hi',
				imageUrl: '/assets/landing-big.jpg',
      }
    },
    {
      component: ReplayedCard,
      props: {
        title: 'Test Card 2',
				body: 'hi',
				imageUrl: '/assets/landing-big.jpg',
      }
    }
  ]

</script>

<svelte:head>
	<title>BeatLeader re:played 2023</title>
</svelte:head>

<section class="align-content">
  <article class="page-content align-content" transition:fade|global>
    <ContentBox cls="main-content-replayed">
      <div class="items">
        <FeaturedCarousel cards={cards} showFillerCards={false} height={"120%"} cardWidthRatio={0.80}/>
      </div>
      

    </ContentBox>
  </article>

</section>

<style>
  .align-content {
		display: flex;
		justify-content: center !important;
	}

  :global(.main-content-replayed) {
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 0.6 / 1;
  }

	.page-content {
    width: 100%;
    height: 100%;
    overflow: visible;
	}

	article {
		width: 100%;
    height: 100%;
		overflow-x: visible;
	}

  .items {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.5em;
    margin: 0.5em;
    height: 100%;
  }

</style>