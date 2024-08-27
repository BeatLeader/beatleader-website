<script>
	import * as d3 from 'd3';
	import {navigate} from 'svelte-routing';
	import {isTouchDevice} from '../../utils/is-touch';
	import {onMount} from 'svelte';
	import {dateFromUnix} from '../../utils/date';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let startTimeset;
	export let finishTimeset;

	let clansData;
	let canvas, context, currentZoom, width, height;

	const defaultScale = 0.15;
	var zoom;
	let currentScale = defaultScale;
	const hoverRadius = 38;

	var circles = [];
	var clanLabels = [];
	var labelsMap = {};
	var links = [];

	var clanMap = {};
	var clans = [];

	let transitionProgress = 0;
	const transitionDuration = 400000;
	let transitionStartTime;
	let transitionCache;
	let finishClansData;

	function fetchClanData(startTimeset) {
		fetch(`https://cdn.assets.beatleader.xyz/global-map-file-${startTimeset}.json`)
			.then(d => d.json())
			.then(data => {
				clansData = data;
			});
	}

	function getFinishData(finishTimeset) {
		fetch(`https://cdn.assets.beatleader.xyz/global-map-file-${finishTimeset}.json`)
			.then(d => d.json())
			.then(data => {
				// Store the finish timeset data for later use in the transition
				finishClansData = data;
				fetch(`https://cdn.assets.beatleader.xyz/clansmap-globalcache-${finishTimeset}.json`)
					.then(r => r.json())
					.then(update => {
						transitionCache = update;
						startTransition();
					});
			});
	}

	function init(newWidth, newHeight, startTimeset, finishTimeset) {
		width = newWidth;
		height = newHeight;

		// Initialize canvas
		canvas = d3.select('#clan-map-container').append('canvas').attr('width', width).attr('height', height).node();
		context = canvas.getContext('2d');

		fetch(`https://cdn.assets.beatleader.xyz/clansmap-globalcache-${startTimeset}.json`)
			.then(r => r.json())
			.then(cache => {
				setTimeout(() => {
					processData(cache);

					// Initialize canvas elements and interactions
					initializeCanvas();
					if (finishTimeset) {
						getFinishData(finishTimeset);
					} else {
						renderCanvas();
					}
				}, 900);
			});
	}

	const convertHexToRGBA = (hexCode, opacity = 1) => {
		let hex = hexCode.replace('#', '');

		if (hex.length === 3) {
			hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
		}

		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		return `rgba(${r},${g},${b},${opacity})`;
	};

	function processData(cache) {
		const data = clansData.points.map(m => {
			return {...m, id: m.leaderboardId};
		});

		circles = [];
		clanLabels = [];
		labelsMap = {};
		links = [];

		clanMap = {};
		clans = [];

		for (let i = 0; i < clansData.clans.length; i++) {
			var clan = clansData.clans[i];
			clan.topCount = 0;

			if (cache) {
				clan.x = cache.clans[clan.id]?.x ?? 0;
				clan.y = cache.clans[clan.id]?.y ?? 0;
			}
			clanMap[clan.id] = clan;
			clans.push(clan);
		}

		for (let i = 0; i < data.length; i++) {
			clanMap[data[i].clans[0].id].topCount++;
		}
		for (let i = 0; i < data.length; i++) {
			const map = data[i];
			links.push({
				source: map.leaderboardId,
				target: map.clans[0].id,
				strength: map.tie ? map.clans[0].pp * 3 : map.clans[0].pp * 2.5, // you can later use this strength for adjusting the link
			});
			if (map.clans.length > 1) {
				links.push({
					source: map.leaderboardId,
					target: map.clans[1].id,
					strength: map.tie ? map.clans[1].pp * 3 : map.clans[1].pp * 0.45, // you can later use this strength for adjusting the link
				});
			}
			if (map.clans.length > 2) {
				links.push({
					source: map.leaderboardId,
					target: map.clans[2].id,
					strength: map.tie ? map.clans[2].pp * 3 : map.clans[2].pp * 0.45, // you can later use this strength for adjusting the link
				});
			}
		}

		// For each leaderboard/map
		data.forEach(map => {
			const topClan = clanMap[map.clans[0].id];

			circles.push({
				id: map.leaderboardId,
				x: cache ? cache.circles[map.leaderboardId]?.x ?? 0 : topClan.x,
				y: cache ? cache.circles[map.leaderboardId]?.y ?? 0 : topClan.y,
				r: map.stars,
				color: map.tie
					? 'rgba(128, 128, 128, 1)'
					: convertHexToRGBA(topClan.color, map.clans.length > 1 ? Math.max((1 - map.clans[1].pp / map.clans[0].pp) * 8, 0.3) : 1),
				hoverColor: map.tie ? 'rgba(128, 128, 128, 1)' : topClan.color,
				coverImageUrl: map.coverImage, // Add the URL of the cover image
				clans: map.clans,
				image: null, // Placeholder for the image object
				hovered: false,
				animatedRadius: map.stars,
				toIncrease: 0, // 0: No change, positive: Increasing, negative: Decreasing
			});
		});

		// For each clan
		clans.forEach(clan => {
			const label = clan.tag;
			const fontSize = Math.sqrt(clan.topCount) * 10;

			const lwidth = clan.tag.length * (fontSize * 0.65);
			const lheight = fontSize * 0.9;

			const clanLabel = {
				id: clan.id,
				x: clan.x - lwidth / 2,
				y: clan.y + lheight / 4,
				label,
				fontSize,
			};
			clanLabels.push(clanLabel);
			labelsMap[clan.id] = clanLabel;
		});
	}

	function startTransition() {
		transitionStartTime = performance.now();
		requestAnimationFrame(animateUpdate);
	}

	function interpolate(start, end, progress) {
		return start + (end - start) * progress;
	}

	function interpolateColor(start, end, progress) {
		const startMatch = start.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
		const endMatch = end.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);

		if (!startMatch || !endMatch) {
			console.log(start + ' ' + end);
			return start;
		}

		const r = interpolate(parseInt(startMatch[1]), parseInt(endMatch[1]), progress);
		const g = interpolate(parseInt(startMatch[2]), parseInt(endMatch[2]), progress);
		const b = interpolate(parseInt(startMatch[3]), parseInt(endMatch[3]), progress);
		const a = interpolate(parseFloat(startMatch[4] || '1'), parseFloat(endMatch[4] || '1'), progress);

		return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`;
	}

	function animateUpdate(timestamp) {
		const elapsed = timestamp - transitionStartTime;
		transitionProgress = elapsed / transitionDuration;
		console.log(transitionProgress);

		if (transitionProgress < 0.2) {
			requestAnimationFrame(animateUpdate);
		} else {
			console.log('processData');
			clansData = finishClansData;
			processData(transitionCache);
			renderCanvas();
			return;
		}

		circles.forEach(c => {
			// Get the corresponding map data from finishClansData
			const finishMap = finishClansData.points.find(p => p.leaderboardId === c.id);
			let finishColor = 'rgba(128, 128, 128, 1)';
			if (finishMap) {
				const topClan = clanMap[finishMap.clans[0].id];

				finishColor =
					!topClan || finishMap.tie
						? 'rgba(128, 128, 128, 1)'
						: convertHexToRGBA(
								topClan.color,
								finishMap.clans.length > 1 ? Math.max((1 - finishMap.clans[1].pp / finishMap.clans[0].pp) * 8, 0.3) : 1
							);
			}

			c.x = interpolate(c.x, transitionCache.circles[c.id]?.x ?? 0, transitionProgress);
			c.y = interpolate(c.y, transitionCache.circles[c.id]?.y ?? 0, transitionProgress);
			c.color = interpolateColor(c.color, finishColor, transitionProgress);
		});
		clanLabels.forEach(label => {
			const clan = finishClansData.clans.find(c => label.id === c.id);
			if (clan) {
				const lwidth = clan.tag.length * (label.fontSize * 0.65);
				const lheight = label.fontSize * 0.9;

				label.x = interpolate(label.x, (transitionCache.clans[label.id]?.x ?? 0) - lwidth / 2, transitionProgress);
				label.y = interpolate(label.y, (transitionCache.clans[label.id]?.y ?? 0) + lheight / 4, transitionProgress);
				// label.fontSize = interpolate(label.fontSize, Math.sqrt(clan.topCount) * 10, transitionProgress);
			}
		});

		renderCanvas();
	}

	function initializeCanvas() {
		// Set up any necessary canvas elements (circles, labels)
		// ...

		// Add interaction listeners
		setupInteractions();

		// Initial rendering of the canvas
		renderCanvas();
	}

	function renderCanvas() {
		context.save();
		context.clearRect(0, 0, width, height); // Clear the canvas

		context.translate(currentZoom.x, currentZoom.y); // Apply translation
		context.scale(currentZoom.k, currentZoom.k); // Apply scale

		clanLabels.forEach(l => {
			drawClan(l, l.hovered);
		});

		circles.forEach(c => {
			if (!labelsMap[c.clans[0].id].hovered) return;
			drawOutlines(c);
		});

		circles.forEach(c => {
			if (c.hovered) return;
			if (c.toIncrease != 0) {
				animating = true;
			}
			drawMap(c);
		});

		circles.forEach(c => {
			if (!c.hovered) return;
			if (c.toIncrease != 0) {
				animating = true;
			}
			drawMap(c);
		});

		context.restore();
	}

	function drawOutlines(circle) {
		if (labelsMap[circle.clans[0].id].hovered) {
			const lineWidth = 2 / currentScale;

			context.beginPath();
			context.arc(circle.x, circle.y, circle.animatedRadius + lineWidth * 0.4, 0, 2 * Math.PI);
			context.lineWidth = lineWidth;
			context.strokeStyle = 'white';
			context.stroke();
		}
	}

	function drawMap(circle) {
		if (circle.toIncrease !== 0) {
			circle.animatedRadius += circle.toIncrease * (hoverRadius / (circle.r * currentScale));
			if (circle.toIncrease > 0 && circle.animatedRadius >= hoverRadius / currentScale) {
				circle.animatedRadius = hoverRadius / currentScale;
				circle.toIncrease = 0;
			} else if (circle.toIncrease < 0 && circle.animatedRadius <= circle.r) {
				circle.animatedRadius = circle.r;
				circle.toIncrease = 0;
			}
		}

		if (circle.hovered) {
			if (circle.toIncrease === 0 && circle.hovered) {
				circle.animatedRadius = hoverRadius / currentScale;
			}
			circle.clans.forEach(clan => {
				const pp = clan.pp;
				const lineWidth = ((pp / circle.clans[0].pp) * 20) / currentScale;

				drawClan(labelsMap[clan.id], true);

				// Draw a line between the map and the clan
				drawLink(circle, clanMap[clan.id], lineWidth, pp / circle.clans[0].pp);

				// Draw text along the link
				drawLinkText(circle, clanMap[clan.id], lineWidth, pp);
			});
		}

		context.beginPath();
		context.arc(circle.x, circle.y, circle.animatedRadius, 0, 2 * Math.PI);
		context.fillStyle = circle.hovered || labelsMap[circle.clans[0].id].hovered ? circle.hoverColor : circle.color;
		context.fill();

		if (circle.hovered && circle.coverImageUrl && !circle.image) {
			circle.image = new Image();
			circle.image.onload = () => renderCanvas();
			circle.image.src = circle.coverImageUrl;
		}

		if (circle.hovered && circle.image) {
			drawCoverImage(circle);
		}
	}

	function drawCoverImage(mapData) {
		const radius = mapData.animatedRadius * 0.9; // 90% of animated radius
		context.save();
		context.beginPath();
		context.arc(mapData.x, mapData.y, radius, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();

		// Draw the image centered in the circle
		context.drawImage(mapData.image, mapData.x - radius, mapData.y - radius, radius * 2, radius * 2);

		context.restore(); // Restore the context to draw other elements
	}

	function drawClan(label, hovered) {
		// Draw clan elements (like labels)
		context.fillStyle = hovered ? 'white' : 'rgba(255, 255, 255, 0.6)'; // Example style
		context.font = label.fontSize + 'px Arial'; // Example font, adjust as needed
		context.fillText(label.label, label.x, label.y);
		// Additional drawing details for clans
	}

	function drawLink(mapData, clan, lineWidth, alpha) {
		context.beginPath();
		context.moveTo(mapData.x, mapData.y);
		context.lineTo(clan.x, clan.y);
		context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
		context.lineWidth = lineWidth;
		context.stroke();
	}

	function drawLinkText(mapData, clan, lineWidth, pp) {
		var angle = Math.atan2(clan.y - mapData.y, clan.x - mapData.x);
		const text = `${Math.round(pp)}pp`;
		var flipped = false;
		if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
			angle += Math.PI;
			flipped = true;
		}
		context.save();
		context.translate(mapData.x, mapData.y);
		context.rotate(angle);
		context.translate(flipped ? -20 - lineWidth * text.length : 20, -lineWidth * 0.25);

		context.fillStyle = 'purple';
		context.font = `${lineWidth * 0.8}px Arial`;
		context.fillText(text, 30 / currentScale, lineWidth / 2);
		context.restore();
	}

	function setupInteractions() {
		if (isTouchDevice()) {
			// Mobile interactions
			canvas.addEventListener('touchstart', handleTouchStart, false);
			canvas.addEventListener('touchend', handleTouchEnd, false);
		} else {
			// Desktop interactions
			canvas.addEventListener('mousemove', handleMouseMove);
			canvas.addEventListener('click', handleClick);
		}

		zoom = d3
			.zoom()
			.scaleExtent([0.1, 10])
			.on('zoom', event => {
				currentZoom = event.transform;
				currentScale = event.transform.k;
				renderCanvas();
			});

		d3.select(canvas).call(zoom);
		const initialTransform = d3.zoomIdentity.translate(226.64996337890625, 203.4814766674457).scale(defaultScale);
		d3.select(canvas).call(zoom.transform, initialTransform);
	}

	function handleMouseMove(event) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = (event.clientX - rect.left) / currentZoom.k - currentZoom.x / currentZoom.k;
		const mouseY = (event.clientY - rect.top) / currentZoom.k - currentZoom.y / currentZoom.k;

		checkCircleHover(mouseX, mouseY);
	}

	function checkCircleHover(mouseX, mouseY) {
		let foundHovered = false;
		circles.forEach(circle => {
			const dx = mouseX - circle.x;
			const dy = mouseY - circle.y;
			const isHovered = dx * dx + dy * dy <= circle.animatedRadius * circle.animatedRadius;

			if (isHovered && !foundHovered) {
				circle.hovered = true;
				circle.toIncrease = circle.hovered && circle.animatedRadius < hoverRadius / currentScale ? 1 : 0;
				foundHovered = true;
			} else {
				if (circle.hovered) {
					circle.toIncrease = -1; // Start decreasing radius
				}
				circle.hovered = false;
			}
		});
		if (!foundHovered) {
			clanLabels.forEach(label => {
				const lwidth = label.label.length * (label.fontSize * 0.65);
				const lheight = label.fontSize * 0.9;
				const isHovered = mouseX > label.x && mouseX < label.x + lwidth && mouseY > label.y - lheight && mouseY < label.y;

				if (isHovered && !foundHovered) {
					label.hovered = true;

					foundHovered = true;
				} else {
					label.hovered = false;
				}
			});
		}

		canvas.style.cursor = foundHovered ? 'pointer' : 'default';

		renderCanvas();
	}

	function handleClick(event) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = (event.clientX - rect.left) / currentZoom.k - currentZoom.x / currentZoom.k;
		const mouseY = (event.clientY - rect.top) / currentZoom.k - currentZoom.y / currentZoom.k;
		let foundHovered = false;

		circles.forEach(circle => {
			const dx = mouseX - circle.x;
			const dy = mouseY - circle.y;
			const isHovered = dx * dx + dy * dy <= circle.animatedRadius * circle.animatedRadius;

			if (isHovered && !foundHovered) {
				navigate(`/leaderboard/clanranking/${circle.id}/1`);
				foundHovered = true;
			}
		});

		if (!foundHovered) {
			clanLabels.forEach(label => {
				const lwidth = label.label.length * (label.fontSize * 0.65);
				const lheight = label.fontSize * 0.9;
				const isHovered = mouseX > label.x && mouseX < label.x + lwidth && mouseY > label.y - lheight && mouseY < label.y;

				if (isHovered && !foundHovered) {
					navigate(`/clan/${label.label}/1`);
				}
			});
		}
	}

	let touchStartTimer;

	function handleTouchStart(event) {
		event.preventDefault();
		const touch = event.touches[0];
		const mouseX = (touch.clientX - canvas.getBoundingClientRect().left) / currentZoom.k - currentZoom.x / currentZoom.k;
		const mouseY = (touch.clientY - canvas.getBoundingClientRect().top) / currentZoom.k - currentZoom.y / currentZoom.k;

		checkCircleHover(mouseX, mouseY);

		touchStartTimer = setTimeout(() => {
			handleClick(touch);
		}, 2000); // Long tap duration
	}

	function handleTouchEnd(event) {
		event.preventDefault();
		clearTimeout(touchStartTimer);
	}

	function updateCanvasSize(newWidth, newHeight) {
		if (Math.abs(newWidth - width) > 10 || Math.abs(newHeight - height) > 10) {
			width = newWidth;
			height = newHeight;
			canvas.width = width;
			canvas.height = height;
			renderCanvas();
		}
	}

	let animating = false;
	let animationStartTime;

	function animateZoomMap(targetMapId, duration = 800) {
		const targetMap = circles.find(d => d.id == targetMapId);
		if (!targetMap) return;

		const initialTransform = d3.zoomIdentity.translate(346.64996337890625, 303.4814766674457).scale(defaultScale);
		d3.select(canvas).call(zoom.transform, initialTransform);

		const targetZoomLevel = 2; // Desired zoom level
		const targetTransform = d3.zoomIdentity
			.translate(width / 2, height / 2)
			.scale(targetZoomLevel)
			.translate(-targetMap.x, -targetMap.y);

		animationStartTime = performance.now();
		animating = true;

		function zoomStep(timestamp) {
			if (!animating) return;

			const elapsedTime = timestamp - animationStartTime;
			const t = Math.min(1, elapsedTime / duration);

			d3.select(canvas).call(zoom.transform, interpolateZoom(initialTransform, targetTransform, t));

			if (t > 0.8 && !targetMap.hovered) {
				targetMap.hovered = true;
				targetMap.toIncrease = 1;
			}

			if (t < 1) {
				requestAnimationFrame(zoomStep);
			} else {
				animating = false;
			}
		}

		requestAnimationFrame(zoomStep);
	}

	function animateZoomClan(targetClanTag, duration = 800) {
		const targetClan = clanLabels.find(d => d.label == targetClanTag);
		if (!targetClan) return;

		const initialTransform = d3.zoomIdentity.translate(346.64996337890625, 303.4814766674457).scale(defaultScale);
		d3.select(canvas).call(zoom.transform, initialTransform);

		const targetZoomLevel = 0.6; // Desired zoom level
		const lwidth = targetClan.label.length * (targetClan.fontSize * 0.65);
		const lheight = targetClan.fontSize * 0.9;
		const targetTransform = d3.zoomIdentity
			.translate(width / 2, height / 2)
			.scale(targetZoomLevel)
			.translate(-targetClan.x - lwidth / 2, -targetClan.y + lheight / 2);

		animationStartTime = performance.now();
		animating = true;

		function zoomStep(timestamp) {
			if (!animating) return;

			const elapsedTime = timestamp - animationStartTime;
			const t = Math.min(1, elapsedTime / duration);

			d3.select(canvas).call(zoom.transform, interpolateZoom(initialTransform, targetTransform, t));

			if (t > 0.8 && !targetClan.hovered) {
				targetClan.hovered = true;
			}

			if (t < 1) {
				requestAnimationFrame(zoomStep);
			} else {
				animating = false;
			}
		}

		requestAnimationFrame(zoomStep);
	}

	function interpolateZoom(startTransform, endTransform, t) {
		// Interpolate scale and translation
		const interpolatedScale = d3.interpolate(startTransform.k, endTransform.k)(t);
		const interpolatedTranslate = [
			d3.interpolate(startTransform.x, endTransform.x)(t),
			d3.interpolate(startTransform.y, endTransform.y)(t),
		];

		return d3.zoomIdentity.translate(interpolatedTranslate[0], interpolatedTranslate[1]).scale(interpolatedScale);
	}

	let timelineData = [];
	let showTimeline = false;

	let selectedTimestamp;
	let previousTimestamp;

	onMount(async () => {
		if (!startTimeset || !finishTimeset) {
			showTimeline = true;
			await fetchTimelineData();
			if (timelineData.length > 0) {
				if (startTimeset) {
					selectedTimestamp = parseInt(startTimeset);
				} else {
					selectedTimestamp = timelineData[timelineData.length - 1].timestamp;
					startTimeset = previousTimestamp;
				}

				fetchClanData(startTimeset);
			}
		}
	});

	async function fetchTimelineData() {
		try {
			const response = await fetch(BL_API_URL + 'clan/461/history');
			const data = await response.json();
			timelineData = data.sort((a, b) => a.timestamp - b.timestamp);
		} catch (error) {
			console.error('Error fetching timeline data:', error);
		}
	}

	function selectTimestamp(timestamp) {
		previousTimestamp = selectedTimestamp;
		selectedTimestamp = timestamp;
		startTimeset = previousTimestamp;
		finishTimeset = selectedTimestamp;

		getFinishData(finishTimeset);
	}

	function handleTimelineChange(event) {
		const newIndex = parseInt(event.target.value);
		selectTimestamp(timelineData[newIndex].timestamp);
	}

	let newWidth;
	let newHeight;

	$: !clansData && startTimeset && finishTimeset && fetchClanData(startTimeset);
	$: !canvas && newWidth && newHeight && clansData && init(newWidth, newHeight, startTimeset, finishTimeset);
	$: canvas && updateCanvasSize(newWidth, newHeight);
</script>

<svelte:window bind:innerWidth={newWidth} bind:innerHeight={newHeight} />

{#if showTimeline && timelineData.length > 1 && selectedTimestamp}
	<div class="timeline-container">
		<div class="timeline-labels">
			{#each timelineData as data, index}
				<span
					class="timeline-label {data.timestamp === selectedTimestamp ? 'selected' : ''}"
					style="left: {(index / (timelineData.length - 1)) * 100}%"
					on:click={() => selectTimestamp(data.timestamp)}>
					{dateFromUnix(data.timestamp).toLocaleDateString()}
				</span>
			{/each}
		</div>
		<input
			type="range"
			min="0"
			max={timelineData.length - 1}
			value={timelineData.findIndex(d => d.timestamp === selectedTimestamp)}
			on:input={handleTimelineChange} />
	</div>
{/if}
<div id="clan-map-container" />

<style>
	#clan-map-container {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: black;
	}
	.timeline-container {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		width: 80%;
		z-index: 10;
	}

	.timeline-container input {
		width: 100%;
	}

	.timeline-labels {
		position: relative;
		height: 20px;
		margin-bottom: 5px;
	}

	.timeline-label {
		position: absolute;
		transform: translateX(-85%) rotate(45deg);
		font-size: 10px;
		color: white;
		white-space: nowrap;
	}

	.timeline-label.selected {
		color: red;
	}
</style>
