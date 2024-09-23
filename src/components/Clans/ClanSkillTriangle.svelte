<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import Value from '../Common/Value.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {navigate} from 'svelte-routing';

	export let clanId = null;
	export let height = '25em';

	const DEFAULT_MAX_TECH_PP = 1300;
	const DEFAULT_MAX_ACC_PP = 15000;
	const DEFAULT_MAX_PASS_PP = 6000;

	const gypL = 57.74;
	const avatarRadius = 30;
	const avatarRadiusHover = 45;

	let clanTriangle = null;
	let canvas = null;
	let ctx;

	let techPp, accPp, passPp;
	let techScale, accScale, passScale;
	let triangleScale;
	let maxTechPp, maxAccPp, maxPassPp;
	let totalNormalizedPp, normalizedTechPp, normalizedAccPp, normalizedPassPp;
	let techPpPart, accPpPart, passPpPart;
	let corner1, corner2, corner3;

	let animationFrameId = null;

	let scale = 0.8;
	let offsetX = null;
	let offsetY = 44;
	let isDragging = false;
	let lastX = 0;
	let lastY = 0;

	let lastTouchDistance = 0;

	function fetchClanTriangle(clanId) {
		clanTriangle = null;
		fetch(`${BL_API_URL}clan/id/${clanId}/triangle`)
			.then(r => r.json())
			.then(triangle => {
				clanTriangle = triangle;

				techPp = clanTriangle.techPp;
				accPp = clanTriangle.accPp;
				passPp = clanTriangle.passPp;

				techScale = techPp > DEFAULT_MAX_TECH_PP ? techPp / DEFAULT_MAX_TECH_PP : 1;
				accScale = accPp > DEFAULT_MAX_ACC_PP ? accPp / DEFAULT_MAX_ACC_PP : 1;
				passScale = passPp > DEFAULT_MAX_PASS_PP ? passPp / DEFAULT_MAX_PASS_PP : 1;

				triangleScale = accScale;

				maxTechPp = DEFAULT_MAX_TECH_PP * triangleScale;
				maxAccPp = DEFAULT_MAX_ACC_PP * triangleScale;
				maxPassPp = DEFAULT_MAX_PASS_PP * triangleScale;

				totalNormalizedPp = techPp * (maxAccPp / maxTechPp) + accPp + passPp * (maxAccPp / maxPassPp);
				normalizedTechPp = techPp / maxTechPp;
				normalizedAccPp = accPp / maxAccPp;
				normalizedPassPp = passPp / maxPassPp;

				techPpPart = (techPp * (maxAccPp / maxTechPp)) / totalNormalizedPp;
				accPpPart = accPp / totalNormalizedPp;
				passPpPart = (passPp * (maxAccPp / maxPassPp)) / totalNormalizedPp;

				corner1 = {
					x: (gypL - normalizedTechPp * gypL) * 0.866,
					y: 86.6 - (gypL - normalizedTechPp * gypL) / 2,
				};
				corner2 = {
					x: 100 - (gypL - normalizedAccPp * gypL) * 0.866,
					y: 86.6 - (gypL - normalizedAccPp * gypL) / 2,
				};
				corner3 = {x: 50, y: (86.6 - gypL / 2) * (1 - normalizedPassPp)};

				// Calculate and save player positions
				clanTriangle.players.forEach(player => {
					player.normalizedTechPp = player.techPp / maxTechPp;
					player.normalizedAccPp = player.accPp / maxAccPp;
					player.normalizedPassPp = player.passPp / maxPassPp;

					player.corner1 = {
						x: (gypL - player.normalizedTechPp * gypL) * 0.866,
						y: 86.6 - (gypL - player.normalizedTechPp * gypL) / 2,
					};
					player.corner2 = {
						x: 100 - (gypL - player.normalizedAccPp * gypL) * 0.866,
						y: 86.6 - (gypL - player.normalizedAccPp * gypL) / 2,
					};
					player.corner3 = {
						x: 50,
						y: (86.6 - gypL / 2) * (1 - player.normalizedPassPp),
					};

					const exaggeration = 1.6;
					const centerX = (player.corner1.x + player.corner2.x + player.corner3.x) / 3;
					const centerY = (player.corner1.y + player.corner2.y + player.corner3.y) / 3;
					const defaultCenterX = 50;
					const defaultCenterY = 86.6 - gypL / 2;
					player.x = centerX + exaggeration * (centerX - defaultCenterX);
					player.y = centerY + exaggeration * (centerY - defaultCenterY);

					player.image = new Image();
					player.image.onload = () => drawTriangle(canvas);
					player.image.src = player.avatar;

					player.radius = avatarRadius * ((player.techPp + player.accPp + player.passPp) / 20000);
					player.animatedRadius = player.radius;
					player.targetRadius = player.radius;
				});
			});
	}

	function drawInnerTriangle(ctx, rect, corner1, corner2, corner3, normalizedTechPp, normalizedAccPp, normalizedPassPp, opacityMultiplier) {
		const scaleY = rect.height / 86.6;
		const scaleX = scaleY;
		const centerX = rect.width / 2;
		const leftX = centerX - rect.height / 2;
		// Draw the filled triangle with gradients
		ctx.beginPath();
		ctx.moveTo(leftX + corner3.x * scaleX, rect.height - corner3.y * scaleY);
		ctx.lineTo(leftX + corner1.x * scaleX, rect.height - corner1.y * scaleY);
		ctx.lineTo(leftX + corner2.x * scaleX, rect.height - corner2.y * scaleY);
		ctx.closePath();
		let gradientTech = ctx.createLinearGradient(
			leftX + corner1.x * scaleX,
			rect.height - corner1.y * scaleY,
			leftX + ((corner2.x + corner3.x) / 2) * scaleX,
			rect.height - ((corner2.y + corner3.y) / 2) * scaleY
		);
		gradientTech.addColorStop(0, `rgba(255, 0, 0, ${normalizedTechPp * opacityMultiplier})`);
		gradientTech.addColorStop(1, `rgba(255, 0, 0, ${normalizedTechPp * 0.25 * opacityMultiplier})`);

		ctx.fillStyle = gradientTech;
		ctx.fill();

		// Create gradient for pass
		let gradientPass = ctx.createLinearGradient(
			leftX + corner3.x * scaleX,
			rect.height - corner3.y * scaleY,
			leftX + ((corner1.x + corner2.x) / 2) * scaleX,
			rect.height - ((corner1.y + corner2.y) / 2) * scaleY
		);
		gradientPass.addColorStop(0, `rgba(0, 255, 0, ${normalizedPassPp * opacityMultiplier})`);
		gradientPass.addColorStop(1, `rgba(0, 255, 0, ${normalizedPassPp * 0.25 * opacityMultiplier})`);

		ctx.fillStyle = gradientPass;
		ctx.fill();

		// Create gradient for acc
		let gradientAcc = ctx.createLinearGradient(
			leftX + corner2.x * scaleX,
			rect.height - corner2.y * scaleY,
			leftX + ((corner3.x + corner1.x) / 2) * scaleX,
			rect.height - ((corner1.y + corner3.y) / 2) * scaleY
		);
		gradientAcc.addColorStop(0, `rgba(0, 0, 255, ${normalizedAccPp * opacityMultiplier})`);
		gradientAcc.addColorStop(1, `rgba(0, 0, 255, ${normalizedAccPp * 0.25 * opacityMultiplier})`);

		ctx.fillStyle = gradientAcc;
		ctx.fill();
	}

	function drawTriangle(canvas) {
		ctx = canvas.getContext('2d');
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		// canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;

		const scaleY = rect.height / 86.6;
		const scaleX = scaleY;
		const centerX = rect.width / 2;
		const leftX = centerX - rect.height / 2;

		if (offsetX === null) {
			offsetX = offsetY + (rect.width - 700) / 10;
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Apply zoom and pan transformations
		ctx.save();
		ctx.translate(offsetX, offsetY);
		ctx.scale(scale, scale);

		let opacityMultiplier = 1;

		drawInnerTriangle(ctx, rect, corner1, corner2, corner3, normalizedTechPp, normalizedAccPp, normalizedPassPp, opacityMultiplier);

		// Draw the triangle outline
		ctx.beginPath();
		ctx.moveTo(leftX + 50 * scaleX, rect.height);
		ctx.lineTo(leftX, 0);
		ctx.lineTo(leftX + 100 * scaleX, 0);
		ctx.closePath();
		ctx.strokeStyle = '#FFF';
		ctx.lineWidth = 2 / scale; // Adjust line width based on zoom
		ctx.setLineDash([4 / scale]); // Adjust dash based on zoom
		ctx.stroke();

		// Draw player avatars
		if (clanTriangle && clanTriangle.players) {
			clanTriangle.players.forEach(player => {
				if (player.image && player.animatedRadius <= player.radius) {
					const playerX = leftX + player.x * scaleX;
					const playerY = rect.height - player.y * scaleY;

					const size = player.animatedRadius / scale; // Adjust size based on zoom
					ctx.save();
					ctx.beginPath();
					ctx.arc(playerX, playerY, size / 2, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(player.image, playerX - size / 2, playerY - size / 2, size, size);
					ctx.restore();
				}
			});

			clanTriangle.players.forEach(player => {
				if (player.image && player.animatedRadius > player.radius) {
					const hoverProgress = Math.abs(player.animatedRadius - player.radius) / Math.abs(avatarRadiusHover - player.radius);
					drawInnerTriangle(
						ctx,
						rect,
						player.corner1,
						player.corner2,
						player.corner3,
						player.normalizedTechPp,
						player.normalizedAccPp,
						player.normalizedPassPp,
						hoverProgress
					);
				}
			});

			clanTriangle.players.forEach(player => {
				if (player.image && player.animatedRadius > player.radius) {
					const playerX = leftX + player.x * scaleX;
					const playerY = rect.height - player.y * scaleY;

					const size = player.animatedRadius / scale; // Adjust size based on zoom
					ctx.save();
					ctx.beginPath();
					ctx.arc(playerX, playerY, size / 2, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(player.image, playerX - size / 2, playerY - size / 2, size, size);
					ctx.restore();
				}
			});
		}

		ctx.restore();
	}

	function handleCanvasClick(event) {
		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left - offsetX) / scale;
		const y = (event.clientY - rect.top - offsetY) / scale;
		const centerX = rect.width / 2;
		const leftX = centerX - rect.height / 2;
		const scaleY = rect.height / 86.6;
		const scaleX = scaleY;

		clanTriangle.players.forEach(player => {
			const playerX = leftX + player.x * scaleX;
			const playerY = rect.height - player.y * scaleY;

			if (Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2) <= avatarRadius / (2 * scale)) {
				navigate(`/u/${player.id}`);
			}
		});
	}

	function handleCanvasMouseMove(event) {
		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left - offsetX) / scale;
		const y = (event.clientY - rect.top - offsetY) / scale;
		const centerX = rect.width / 2;
		const leftX = centerX - rect.height / 2;
		const scaleY = rect.height / 86.6;
		const scaleX = scaleY;

		let isPlayerHovered = false;

		clanTriangle.players.forEach(player => {
			const playerX = leftX + player.x * scaleX;
			const playerY = rect.height - player.y * scaleY;

			if (Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2) <= avatarRadius / (2 * scale)) {
				player.targetRadius = avatarRadiusHover;
				isPlayerHovered = true;
			} else {
				player.targetRadius = player.radius;
			}
		});

		canvas.style.cursor = isPlayerHovered ? 'pointer' : 'default';

		if (isDragging) {
			offsetX += event.clientX - lastX;
			offsetY += event.clientY - lastY;
			lastX = event.clientX;
			lastY = event.clientY;
			drawTriangle(canvas);
		}
	}

	function handleCanvasMouseDown(event) {
		isDragging = true;
		lastX = event.clientX;
		lastY = event.clientY;
	}

	function handleCanvasMouseUp() {
		isDragging = false;
	}

	function handleCanvasWheel(event) {
		event.preventDefault();
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		const zoom = event.deltaY < 0 ? 1.1 : 0.9;

		scale *= zoom;
		offsetX = mouseX - (mouseX - offsetX) * zoom;
		offsetY = mouseY - (mouseY - offsetY) * zoom;

		drawTriangle(canvas);
	}

	function animateRadii() {
		let needsAnimation = false;

		clanTriangle.players.forEach(player => {
			const diff = player.targetRadius - player.animatedRadius;
			if (Math.abs(diff) > 0.1) {
				player.animatedRadius += diff * 0.2;
				needsAnimation = true;
			} else {
				player.animatedRadius = player.targetRadius;
			}
		});

		drawTriangle(canvas);

		if (needsAnimation) {
			animationFrameId = requestAnimationFrame(animateRadii);
		} else {
			animationFrameId = null;
		}
	}

	function startAnimation() {
		if (!animationFrameId) {
			animationFrameId = requestAnimationFrame(animateRadii);
		}
	}

	function handleCanvasTouchStart(event) {
		if (event.touches.length === 1) {
			isDragging = true;
			lastX = event.touches[0].clientX;
			lastY = event.touches[0].clientY;
		} else if (event.touches.length === 2) {
			lastTouchDistance = Math.hypot(
				event.touches[0].clientX - event.touches[1].clientX,
				event.touches[0].clientY - event.touches[1].clientY
			);
		}
	}

	function handleCanvasTouchMove(event) {
		event.preventDefault();
		if (event.touches.length === 1 && isDragging) {
			const touch = event.touches[0];
			offsetX += touch.clientX - lastX;
			offsetY += touch.clientY - lastY;
			lastX = touch.clientX;
			lastY = touch.clientY;
			drawTriangle(canvas);
		} else if (event.touches.length === 2) {
			const touchDistance = Math.hypot(
				event.touches[0].clientX - event.touches[1].clientX,
				event.touches[0].clientY - event.touches[1].clientY
			);
			const zoom = touchDistance / lastTouchDistance;

			const rect = canvas.getBoundingClientRect();
			const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
			const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;

			scale *= zoom;
			offsetX = centerX - (centerX - offsetX) * zoom;
			offsetY = centerY - (centerY - offsetY) * zoom;

			lastTouchDistance = touchDistance;
			drawTriangle(canvas);
		}
	}

	function handleCanvasTouchEnd() {
		isDragging = false;
	}

	$: fetchClanTriangle(clanId);
	$: canvas && clanTriangle && drawTriangle(canvas);
</script>

{#if clanTriangle}
	<div class="triangle-container" style="height: {height};">
		{#if passPp}
			<div class="pass">
				<Value value={passPp} digits={2} zero="" prefix="AVG Pass: " suffix="pp" />
				<div class="pp-part">
					<Value value={passPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
				</div>
			</div>
		{/if}
		{#if accPp}
			<div class="acc">
				<Value value={accPp} digits={2} zero="" prefix="AVG Acc: " suffix="pp" />
				<div class="pp-part">
					<Value value={accPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
				</div>
			</div>
		{/if}
		{#if techPp}
			<div class="tech">
				<Value value={techPp} digits={2} zero="" prefix="AVG Tech: " suffix="pp" />
				<div class="pp-part">
					<Value value={techPpPart * 100} digits={2} zero="" prefix="(" suffix="%)" />
				</div>
			</div>
		{/if}

		<canvas
			bind:this={canvas}
			style="height: {height};"
			on:click={handleCanvasClick}
			on:mousemove={e => {
				handleCanvasMouseMove(e);
				startAnimation();
			}}
			on:mousedown={handleCanvasMouseDown}
			on:mouseup={handleCanvasMouseUp}
			on:mouseleave={handleCanvasMouseUp}
			on:wheel={handleCanvasWheel}
			on:touchstart={handleCanvasTouchStart}
			on:touchmove={handleCanvasTouchMove}
			on:touchend={handleCanvasTouchEnd}></canvas>
	</div>
{:else}
	<Spinner />
{/if}

<style>
	canvas {
		touch-action: none;
		width: 100%;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
	.triangle-container {
		position: relative;
		display: grid;
		align-items: center;
		justify-items: center;
		margin: -1em;
	}
	.pass {
		display: flex;
		grid-gap: 0.4em;
		position: absolute;
		color: white;
		bottom: 1em;
	}
	.acc {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.4em;
		position: absolute;
		color: white;
		top: 1em;
		right: 1em;
	}
	.tech {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.4em;
		position: absolute;
		color: white;
		top: 1em;
		left: 1em;
	}
	.pp-part {
		color: yellow;
	}

	@media screen and (max-width: 767px) {
		.pass {
			font-size: 0.7em;
		}
		.acc {
			font-size: 0.7em;
		}
		.tech {
			font-size: 0.7em;
		}
	}
</style>
