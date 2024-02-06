<script>
	import * as d3 from 'd3';
	import {navigate} from 'svelte-routing';

	export let leaderboardId;
	export let clanTag;

	let clansData;
	let canvas, context, currentZoom, width, height;
	let allData, simulation;

	const defaultScale = 0.25;
	var zoom;
	let currentScale = defaultScale;
	const hoverRadius = 38;

	var circles = [];
	var clanLabels = [];
	var labelsMap = {};
	var links = [];
	let simulated = false;

	var clanMap = {};
	var clans = [];

	function fetchClanData() {
		fetch('https://cdn.assets.beatleader.xyz/global-map-file.json')
			.then(d => d.json())
			.then(data => {
				clansData = data;
			});
	}

	function init(newWidth, newHeight) {
		width = newWidth;
		height = newHeight;

		// Initialize canvas
		canvas = d3.select('#clan-map-container').append('canvas').attr('width', width).attr('height', height).node();
		context = canvas.getContext('2d');

		if (leaderboardId || clanTag) {
			fetch('https://cdn.assets.beatleader.xyz/clansmap-globalcache.json')
				.then(r => r.json())
				.then(cache => {
					processData(cache);

					// Initialize canvas elements and interactions
					initializeCanvas();

					simulated = true;
				});
		} else {
			// Process your data
			processData();

			// Initialize canvas elements and interactions
			initializeCanvas();

			// Start simulation
			startSimulation();
		}
	}

	function processData(cache) {
		const data = clansData.points.map(m => {
			return {...m, id: m.leaderboardId};
		});

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

		allData = data.concat(clans);

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

		// For each leaderboard/map
		data.forEach(map => {
			const topClan = clanMap[map.clans[0].id];

			circles.push({
				id: map.leaderboardId,
				x: cache ? (cache.circles[map.leaderboardId]?.x ?? 0) : topClan.x,
				y: cache ? (cache.circles[map.leaderboardId]?.y ?? 0) : topClan.y,
				r: map.stars,
				color: map.tie
					? 'grey'
					: convertHexToRGBA(topClan.color, map.clans.length > 1 ? Math.max((1 - map.clans[1].pp / map.clans[0].pp) * 8, 0.3) : 1),
				hoverColor: map.tie ? 'grey' : topClan.color,
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

	function initializeCanvas() {
		// Set up any necessary canvas elements (circles, labels)
		// ...

		// Add interaction listeners
		setupInteractions();

		// Initial rendering of the canvas
		renderCanvas();
	}

	function startSimulation() {
		// Initialize D3 Force Simulation
		simulation = d3
			.forceSimulation(allData)
			.force(
				'link',
				d3
					.forceLink(links)
					.id(d => d.id)
					.strength(d => d.strength * 0.0004)
			)
			.force('x', d3.forceX(width / 2).strength(0.05))
			.force('y', d3.forceY(height / 2).strength(0.05))
			// Adjust the multiplier as needed
			.force(
				'charge',
				d3.forceManyBody().strength(d => (d.color ? -1000 : -400))
			);

		if (leaderboardId || clanTag) {
			for (let i = 0; i < 20; i++) {
				simulation.tick();
			}
			renderCanvas();
			simulated = true;
		}
		simulation.on('tick', () => {
			for (let i = 0; i < circles.length; i++) {
				var circle = circles[i];
				circle.x = allData[i].x;
				circle.y = allData[i].y;
			}
			for (let i = 0; i < clanLabels.length; i++) {
				var label = clanLabels[i];
				const lwidth = label.label.length * (label.fontSize / 2);
				const lheight = label.fontSize;
				label.x = clans[i].x - lwidth / 2;
				label.y = clans[i].y + lheight / 4;
			}
			renderCanvas();
		}); // Re-render canvas on each tick
	}

	function renderCanvas() {
		context.save();
		context.clearRect(0, 0, width, height); // Clear the canvas

		context.translate(currentZoom.x, currentZoom.y); // Apply translation
		context.scale(currentZoom.k, currentZoom.k); // Apply scale

		var animating = false;

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

		if (animating) {
			requestAnimationFrame(renderCanvas);
		}
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

	function isMobileDevice() {
		var hasTouchCapabilities = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
		var isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

		return hasTouchCapabilities && isMobileUserAgent;
	}

	function setupInteractions() {
		if (isMobileDevice()) {
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
		const initialTransform = d3.zoomIdentity.translate(346.64996337890625, 303.4814766674457).scale(defaultScale);
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
			} else if (circle.id != leaderboardId) {
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
				} else if (label.label != clanTag) {
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

	let newWidth;
	let newHeight;

	$: !clansData && fetchClanData();
	$: !canvas && newWidth && newHeight && clansData && init(newWidth, newHeight);
	$: canvas && updateCanvasSize(newWidth, newHeight);

	$: leaderboardId && simulated && animateZoomMap(leaderboardId);
	$: clanTag && simulated && animateZoomClan(clanTag);
</script>

<svelte:window bind:innerWidth={newWidth} bind:innerHeight={newHeight} />
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
</style>
