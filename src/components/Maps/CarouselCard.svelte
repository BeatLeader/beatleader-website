<script>
  export let title = "";
  export let body = "";
  export let imageUrl = "";


  let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

  console.log(imageUrl);
  
	$: drawCinematics(cinematicsCanvas, imageUrl);

  
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="grid-item" on:click|preventDefault>
  <div class="card" style="background-image: url({imageUrl});">

    <div class="cinematics">
      <div class="cinematics-canvas">
        <canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
      </div>
    </div>

    <div class="content">
      <h1>{title}</h1>
      <p>{body}</p>

    </div>

  </div>
</div>

<style>
  .grid-item {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    padding: 1em;
	}

  .card {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    background-color: rgb(21, 38, 29) !important;
    position: relative;
    overflow: visible;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    border-radius: 12px;

  }

  .content {
    padding: 1em;
    padding-left: 1.25em;
    text-align: left;
  }

  .content h1 {

  }

  .content p {
    color: white;
  }

  .cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

  .cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.05) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
	}

</style>