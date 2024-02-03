<script>
	import * as d3 from 'd3';
	import {navigate} from 'svelte-routing';

	export let leaderboardId;
	export let topCount;

	let maps, players, scores, fetched;

	let search;

	let canvas, context, currentZoom, width, height;
	let allData, simulation;

	const defaultScale = 0.051;
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
		fetch(`https://cdn.assets.beatleader.xyz/gigalistfile${topCount}.json`)
			.then(r => r.json())
			.then(cache => {
				maps = cache.Maps;
				players = cache.Players;
				scores = cache.Scores;

				fetched = true;
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
				links: [],
				r: map.stars * 2,
				color: `rgb(${Math.round((map.accRating / 15) * 255)}, ${Math.round((map.passRating / 15) * 255)}, ${Math.round(
					(map.techRating / 15) * 255
				)})`,
				alpha: map.time > 0 ? (map.time - 1641323993) / 31536000 : 0,
				name: map.name,
				subname: map.difficulty,
				hoverColor: 'purple',
				coverImageUrl: map.cover,
				image: null, // Placeholder for the image object
				hovered: false,
				animatedRadius: map.stars * 2,
				toIncrease: 0, // 0: No change, positive: Increasing, negative: Decreasing
			};
			circles.push(circle);

			circlesMap[map.id] = circle;
		});

		players.forEach(player => {
			const playerCircle = {
				id: player.id,
				links: [],
				r: 30,
				animatedRadius: 30,
				alpha: 1,
				color: 'black',
				hoverColor: 'black',
				player: true,
				name: player.N,
				subname: '#' + player.R,
				coverImageUrl: player.A,
				image: null, // Placeholder for the image object
				hovered: false,
				toIncrease: 0, // 0: No change, positive: Increasing, negative: Decreasing
			};

			circles.push(playerCircle);

			circlesMap[player.id] = playerCircle;
		});

		for (let i = 0; i < scores.length; i++) {
			const link = scores[i];
			links.push({
				source: link.I,
				target: link.LI,
				strength: link.P * link.W,
			});

			circlesMap[link.I].links.push({
				id: link.LI,
				strength: link.P * link.W,
			});
		}

		// circles.forEach(element => {
		// 	element.links = element.links.sort((a, b) => b.strength - a.strength);

		// 	const length = Math.max(
		// 		element.links.reduce((cum, l) => {
		// 			return cum + l.strength;
		// 		}, 0),
		// 		2
		// 	);

		// 	element.r = length;
		// 	element.animatedRadius = length;
		// });

		links.forEach(element => {
			if (element.W == 1) {
				var player = players.find(p => p.id == element.I);
				player.top = element.LI;
			}
		});

		const decimalHash = string => {
			let sum = 0;
			for (let i = 0; i < string.length; i++) sum += ((i + 1) * string.codePointAt(i)) / (1 << 8);
			return sum % 1;
		};

		maps.forEach(element => {
			element.x = -(width * 4 * decimalHash(element.id) * 15) / 5;
			element.y = (height * 4 * element.stars) / 5;

			players.forEach(player => {
				if (player.top == element.id) {
					player.x = element.x;
					player.y = element.y;
				}
			});
		});

		allData = maps.concat(players);

		for (let i = 0; i < circles.length; i++) {
			var circle = circles[i];
			circle.x = allData[i].x;
			circle.y = allData[i].y;
		}
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
					.strength(d => d.strength * 0.002)
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
					return circlesMap[d.id].player ? circlesMap[d.id].r * -800 : circlesMap[d.id].r * -10;
				})
			);
		// 	for (let i = 0; i < 10000; i++) {
		// 	simulation.tick();
		// }
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

		circles.forEach(c => {});

		circles.forEach(c => {
			if (c.hovered) return;
			if (c.toIncrease != 0) {
				animating = true;
			}
			drawMap(c);
			drawOutlines(c);
		});

		circles.forEach(c => {
			if (!c.hovered) return;
			if (c.toIncrease != 0) {
				animating = true;
			}
			drawMap(c);
			drawOutlines(c);
		});

		context.restore();

		if (animating) {
			requestAnimationFrame(renderCanvas);
		}
	}

	function drawOutlines(circle) {
		if (circle.alpha) {
			const lineWidth = 2.5 / currentScale;
			const radius = circle.animatedRadius + lineWidth * 0.4;
			if (radius > 0) {
			context.beginPath();
			context.arc(circle.x, circle.y, radius, 0, 2 * Math.PI);
			context.lineWidth = lineWidth;
			context.strokeStyle = `rgba(255, 255, 255, ${circle.alpha})`;
			context.stroke();
			}
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
			if (circle.links) {
				circle.links.forEach(link => {
					const strength = link.strength;
					const lineWidth = ((strength / circle.links[0].strength) * 20) / currentScale;

					// Draw a line between the map and the clan
					drawLink(circle, circlesMap[link.id], lineWidth, strength);

					// Draw text along the link
					drawLinkText(circle, circlesMap[link.id], lineWidth, strength);
				});
			}
		}

		if (circle.hovered && circle.links && circle.player && circle.toIncrease == 0) {
			circle.links.forEach(link => {
				var linkedMap = circlesMap[link.id];

				if (!linkedMap.image) {
					linkedMap.image = new Image();
					linkedMap.image.onload = () => renderCanvas();
					linkedMap.image.src = linkedMap.coverImageUrl;
				} else {
					// Draw a line between the map and the clan
					drawCoverImage(circlesMap[link.id], hoverRadius * 0.7 / currentScale);
				}
			});
		}

		if (circle.animatedRadius > 0) {
		context.beginPath();
		context.arc(circle.x, circle.y, circle.animatedRadius, 0, 2 * Math.PI);
		context.fillStyle = circle.hovered ? circle.hoverColor : circle.color;
		context.fill();
		}

		if ((circle.hovered || (circle.player && currentScale > 0.2)) && circle.coverImageUrl && !circle.image) {
			circle.image = new Image();
			circle.image.onload = () => renderCanvas();
			circle.image.src = circle.coverImageUrl;
		}

		if ((circle.hovered || (circle.player && currentScale > 0.2)) && circle.image) {
			drawCoverImage(circle);
		}
		
		if (circle.hovered) {
			const fontSize = circle.animatedRadius / 2;

			context.font = 'bold ' + fontSize + 'px Arial'; // Example font, adjust as needed
			context.strokeStyle = 'white';
			context.lineWidth = 4 / currentScale;
			context.fillStyle = 'black'; // Example style

			context.strokeText(circle.name, circle.x - (fontSize * circle.name.length) / 4, circle.y - circle.animatedRadius * 1.5);
			context.fillText(circle.name, circle.x - (fontSize * circle.name.length) / 4, circle.y - circle.animatedRadius * 1.5);

			context.strokeText(circle.subname, circle.x - (fontSize * circle.subname.length) / 4, circle.y + circle.animatedRadius * 1.8);
			context.fillText(circle.subname, circle.x - (fontSize * circle.subname.length) / 4, circle.y + circle.animatedRadius * 1.8);
		}
	}

	function drawCoverImage(mapData, radiusOverride) {
		const radius = (radiusOverride ?? mapData.animatedRadius) * 0.9; // 90% of animated radius
		if (radius <= 0) return;
		
		context.save();
		context.beginPath();
		context.arc(mapData.x, mapData.y, radius, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();

		if (mapData.image && mapData.image.complete && mapData.image.naturalWidth !== 0) {
		// Draw the image centered in the circle
		context.drawImage(mapData.image, mapData.x - radius, mapData.y - radius, radius * 2, radius * 2);
		}

		context.restore(); // Restore the context to draw other elements
	}

	function drawClan(label, hovered) {
		// Draw clan elements (like labels)
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
		context.translate(flipped ? -40 - lineWidth * text.length : 40, -lineWidth * 0.25);

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
		// if (isMobileDevice()) {
		// 	// Mobile interactions
		// 	canvas.addEventListener('touchstart', handleTouchStart, false);
		// 	canvas.addEventListener('touchend', handleTouchEnd, false);
		// } else {
		// Desktop interactions
		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('click', handleClick);
		// }

		zoom = d3
			.zoom()
			.scaleExtent([0.001, 4])
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
				if (circle.player) {
					navigate(`/u/${circle.id}`);
				} else {
					navigate(`/leaderboard/${circle.id}/1`);
				}
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

	function animateZoomMap(targetMap, duration = 800) {
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

	let searchList = [];
	function performSearch(term) {
		searchList = circles.filter(c => c.name.toLowerCase().includes(term.toLowerCase())).slice(0, 10)
	}

	$: !fetched && fetchData();
	$: !canvas && newWidth && newHeight && fetched && init(newWidth, newHeight);
	$: canvas && updateCanvasSize(newWidth, newHeight);
	
	$: search && circles && performSearch(search);
</script>

<svelte:window bind:innerWidth={newWidth} bind:innerHeight={newHeight} />
<div id="clan-map-container" />

<div class="search-bar">
	<input type="text" bind:value={search} placeholder="Player or map name..." />
</div>
{#if searchList.length}
<div class="search-list">
{#each searchList as comp}
	<button on:click={() => animateZoomMap(comp)}>{comp.name} - {comp.subname}</button>
{/each}
</div>
{/if}

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

	.search-bar {
		position: absolute;
		top: 5em;
		left: 1.2em;
		color: black;
	}

	.search-list {
		position: absolute;
    top: 7em;
    display: flex;
    left: 1.2em;
    flex-direction: column;
    gap: 0.3em;
	}
</style>
