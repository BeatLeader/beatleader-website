<script>
	import * as d3 from 'd3';
	import {navigate} from 'svelte-routing';

	export let leaderboardId;

	let linksList, maps;

	let canvas, context, currentZoom, width, height;
	let allData, simulation;

	const defaultScale = 0.25;
	var zoom;
	let currentScale = defaultScale;
	const hoverRadius = 38;

	var circles = [];
	var clanLabels = [];

	var circlesMap = {};

	var labelsMap = {};
	var links = [];
	let simulated = false;

	var clanMap = {};
	var clans = [];

	function fetchData() {
		fetch('/assets/maps.json')
			.then(r => r.json())
			.then(cache => {
				maps = cache;
			});
		fetch('/assets/edges.json')
			.then(r => r.json())
			.then(cache => {
				linksList = cache;
			});
	}

	function init(newWidth, newHeight) {
		width = newWidth;
		height = newHeight;

		// Initialize canvas
		canvas = d3.select('#clan-map-container').append('canvas').attr('width', width).attr('height', height).node();
		context = canvas.getContext('2d');

		if (leaderboardId) {
			fetch('/assets/clansMap.json')
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
		// For each leaderboard/map
		maps.forEach(map => {
			const circle = {
				id: map.id,
				x: Math.random() * width,
				y: Math.random() * height,
				links: [],
				r: map.stars,
				color: `rgb(${Math.round((map.accRating / 15) * 255)}, ${Math.round((map.passRating / 15) * 255)}, ${Math.round(
					(map.techRating / 15) * 255
				)})`,
				alpha: map.time > 0 ? (map.time - 1641323993) / 31536000 : 0,
				hoverColor: 'purple',
				coverImageUrl: map.cover,
				image: null, // Placeholder for the image object
				hovered: false,
				animatedRadius: map.stars,
				toIncrease: 0, // 0: No change, positive: Increasing, negative: Decreasing
			};
			circles.push(circle);

			circlesMap[map.id] = circle;
		});

		for (let i = 0; i < linksList.length; i++) {
			const link = linksList[i];
			links.push({
				source: link.id1,
				target: link.id2,
				strength: link.s,
			});

			circlesMap[link.id1].links.push({
				id: link.id2,
				strength: link.s,
			});
		}

		circles.forEach(element => {
			element.links = element.links.sort((a, b) => b.strength - a.strength);

			const length = Math.max(
				element.links.reduce((cum, l) => {
					return cum + l.strength;
				}, 0),
				2
			);

			element.r = length;
			element.animatedRadius = length;
		});

		allData = maps;
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
					.strength(d => d.strength * 0.5)
			)
			.force('x', d3.forceX(width / 2).strength(0.05))
			.force('y', d3.forceY(height / 2).strength(0.05))
			// .force(
			// 	'collide',
			// 	d3.forceCollide(d => d.r)
			// )
			// Adjust the multiplier as needed
			.force(
				'charge',
				d3.forceManyBody().strength(d => {
					return circlesMap[d.id].r * -100;
				})
			);
		simulation.on('tick', () => {
			for (let i = 0; i < circles.length; i++) {
				var circle = circles[i];
				circle.x = allData[i].x;
				circle.y = allData[i].y;
			}
			renderCanvas();
		}); // Re-render canvas on each tick
	}

	// setTimeout(() => {
	// 	function saveJSONAsFile(json, fileName) {
	// 		var link = document.createElement('a');

	// 		document.body.appendChild(link); // for Firefox

	// 		link.setAttribute('href', URL.createObjectURL(new Blob([json], {type: 'application/json'})));
	// 		link.setAttribute('download', fileName);
	// 		link.click();
	// 	}

	// 	var localCirclesMap = {};
	// 	circles.forEach(circle => {
	// 		localCirclesMap[circle.id] = {x: circle.x, y: circle.y};
	// 	});

	// 	var localClansMap = {};
	// 	clans.forEach(clan => {
	// 		localClansMap[clan.id] = {x: clan.x, y: clan.y};
	// 	});

	// 	const serializedState = JSON.stringify({circles: localCirclesMap, clans: localClansMap});
	// 	saveJSONAsFile(serializedState, 'clansmap.json');
	// }, 20000);

	function renderCanvas() {
		context.save();
		context.clearRect(0, 0, width, height); // Clear the canvas

		context.translate(currentZoom.x, currentZoom.y); // Apply translation
		context.scale(currentZoom.k, currentZoom.k); // Apply scale

		var animating = false;

		circles.forEach(c => {
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
		if (circle.alpha) {
			const lineWidth = 1 / currentScale;

			context.beginPath();
			context.arc(circle.x, circle.y, circle.animatedRadius + lineWidth * 0.4, 0, 2 * Math.PI);
			context.lineWidth = lineWidth;
			context.strokeStyle = `rgba(255, 255, 255, ${circle.alpha})`;
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
			circle.links.forEach(link => {
				const strength = link.strength;
				const lineWidth = ((strength / circle.links[0].strength) * 20) / currentScale;

				// Draw a line between the map and the clan
				drawLink(circle, circlesMap[link.id], lineWidth, strength);

				// Draw text along the link
				drawLinkText(circle, circlesMap[link.id], lineWidth, strength);
			});
		}

		context.beginPath();
		context.arc(circle.x, circle.y, circle.animatedRadius, 0, 2 * Math.PI);
		context.fillStyle = circle.hovered ? circle.hoverColor : circle.color;
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
		const text = `${pp.toFixed(2)}`;
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

	// Additional functions for drawing lines, text, etc.

	function isMobileDevice() {
		return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
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
				navigate(`/leaderboard/${circle.id}/1`);
				foundHovered = true;
			}
		});
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

	$: !linksList && fetchData();
	$: !canvas && newWidth && newHeight && linksList && maps && init(newWidth, newHeight);
	$: canvas && updateCanvasSize(newWidth, newHeight);

	$: leaderboardId && simulated && animateZoomMap(leaderboardId);
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
