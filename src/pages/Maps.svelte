<script>
  import ContentBox from "../components/Common/ContentBox.svelte";
	import DiscoverCard from "../components/Maps/DiscoverCard.svelte";
	import FeaturedCarousel from "../components/Maps/FeaturedCarousel.svelte";
	import MapsCategoryCard from "../components/Maps/MapsCategoryCard.svelte";
  import {fade} from 'svelte/transition';

  let categoryCardHeight = 400;

</script>

<svelte:head>
	<title>Maps</title>
</svelte:head>

<section class="align-content">
  <article class="page-content" transition:fade|global>
    <ContentBox class="main-content">
      <h1 class="header">MAPS</h1>

      <div class="categories">
        <MapsCategoryCard categoryName="Ranked" showRankedCounter cardHeight={categoryCardHeight} bgColor = "#292823" />
        <MapsCategoryCard categoryName="Trending" cardHeight={categoryCardHeight} bgColor = "#15261D"/>
        <MapsCategoryCard categoryName="Curated" cardHeight={categoryCardHeight} bgColor = "#240C2D"/>
      </div>

      <div class="items">
        <DiscoverCard />
        <FeaturedCarousel />

      </div>
      

    </ContentBox>
  </article>

</section>

<style>
  .align-content {
		display: flex;
		justify-content: center !important;
	}

	.page-content {
		max-width: 75em;
		width: 100%;
    overflow: hidden;
	}

	article {
		width: 100%;
		overflow-x: hidden;
	}

  .header {
    position: absolute;
    left: 50%;
    top: -0.375em;
    transform: translateX(-50%);

    color: rgba(255, 255, 255, 0.50) !important;
    font-family: Audiowide;
    font-size: 150px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
  }

  .categories {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 3.25em;
    margin: 3.25em;
    margin-top: 4.25em;
  }

  @media screen and (max-width: 950px) {
    .categories {
      display: flex;
      flex-direction: column;
      gap: 1.5em;
      margin: 1.5em;
      margin-top: 4.25em;
    }
  }

  .items {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.5em;
    margin: 3.25em;
  }

</style>