<script>
	import {onMount} from 'svelte';
	import * as d3 from 'd3';
	import {clansData} from './response';
	import {navigate} from 'svelte-routing';

	let container; // Reference to the container div
	let canvas,
		context,
		currentZoom,
		width = 1200,
		height = 800;
	let allData, simulation;
	let currentScale = 0.24999999999999994;
	const hoverRadius = 28;

	var circles = [];
	var clanLabels = [];
	var links = [];

	var clanMap = {};
	var clans = [];

	onMount(() => {
		// Initialize canvas
		canvas = d3.select('#clan-map-container').append('canvas').attr('width', width).attr('height', height).node();
		context = canvas.getContext('2d');

		// Process your data
		processData();

		// Initialize canvas elements and interactions
		initializeCanvas();

		// Start simulation
		startSimulation();

		// Clean up
		return () => {
			resizeObserver.disconnect();
		};
	});

	function processData() {
		const data = clansData.map(m => {
			return {...m, id: m.leaderboardId};
		});

		for (let i = 0; i < data.length; i++) {
			const map = data[i];
			for (let j = 0; j < map.clans.length; j++) {
				var clan = map.clans[j];
				if (!clanMap[clan.clan.id]) {
					const clanPoint = {...clan, id: clan.clan.id, topCount: j == 0 ? 1 : 0};
					clanMap[clan.clan.id] = clanPoint;
					clans.push(clanPoint);
				} else if (j == 0) {
					clanMap[clan.clan.id].topCount++;
				}
			}
		}

		allData = data.concat(clans);

		for (let i = 0; i < data.length; i++) {
			const map = data[i];
			links.push({
				source: map.leaderboardId,
				target: map.clans[0].clan.id,
				strength: map.tie ? map.clans[0].pp * 0.2 : map.clans[0].pp, // you can later use this strength for adjusting the link
			});
			if (map.clans.length > 1) {
				links.push({
					source: map.leaderboardId,
					target: map.clans[1].clan.id,
					strength: map.clans[1].pp * 0.2, // you can later use this strength for adjusting the link
				});
			}
			if (map.clans.length > 2) {
				links.push({
					source: map.leaderboardId,
					target: map.clans[2].clan.id,
					strength: map.clans[2].pp * 0.2, // you can later use this strength for adjusting the link
				});
			}
		}

		// For each leaderboard/map
		data.forEach(map => {
			const topClan = map.clans[0]; // Assuming the clans are sorted by their 'pp'

			circles.push({
				id: map.leaderboardId,
				x: Math.random() * width,
				y: Math.random() * height,
				r: map.stars,
				color: map.tie ? 'grey' : topClan.clan.color,
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
			clanLabels.push({
				x: Math.random() * width,
				y: Math.random() * height,
				label: clan.clan.tag,
				fontSize: Math.sqrt(clan.topCount) * 10,
			});
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
					.strength(d => d.strength * 0.0001)
			)
			.force('x', d3.forceX(width / 2).strength(0.05))
			.force('y', d3.forceY(height / 2).strength(0.05))
			// .force(
			// 	'collide',
			// 	d3.forceCollide(d => (d.name ? 0.1 : 0.15))
			// )
			// Adjust the multiplier as needed
			.force(
				'charge',
				d3.forceManyBody().strength(d => (d.name ? -200 : -100))
			)
			.on('tick', () => {
				for (let i = 0; i < circles.length; i++) {
					var circle = circles[i];
					circle.x = allData[i].x;
					circle.y = allData[i].y;
				}
				for (let i = 0; i < clanLabels.length; i++) {
					var label = clanLabels[i];
					const lwidth = label.label.length * label.fontSize;
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

		circles.forEach(c => {
			if (c.toIncrease != 0) {
				animating = true;
			}
			if (isCircleVisible(c)) {
				drawMap(c);
			}
		});

		clanLabels.forEach(l => {
			drawClan(l);
		});

		// links.forEach(link => {
		// 	if (isLinkVisible(link)) {
		// 		drawLink(link);
		// 	}
		// });
		context.restore();

		if (animating) {
			requestAnimationFrame(renderCanvas);
		}
	}

	function isCircleVisible(element) {
		return true;
		const scaledWidth = width / currentZoom.k;
		const scaledHeight = height / currentZoom.k;
		const x = (element.x - currentZoom.x) / currentZoom.k;
		const y = (element.y - currentZoom.y) / currentZoom.k;

		return x >= 0 && x <= scaledWidth && y >= 0 && y <= scaledHeight;
	}

	function isLinkVisible(link) {
		return true;
		// Similar logic to isElementVisible to determine if the link is visible
		// ...
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
			circle.clans.forEach(clan => {
				const pp = clan.pp;
				const lineWidth = ((pp / circle.clans[0].pp) * 20) / currentScale;

				// Draw a line between the map and the clan
				drawLink(circle, clanMap[clan.clan.id], lineWidth);

				// Draw text along the link
				drawLinkText(circle, clanMap[clan.clan.id], lineWidth, pp);
			});
		}

		// Draw map elements (like circles)
		context.beginPath();
		context.arc(circle.x, circle.y, circle.animatedRadius, 0, 2 * Math.PI);
		context.fillStyle = circle.color; // Replace with actual logic to determine color
		context.fill();
		if (circle.hovered && circle.coverImageUrl && !circle.image) {
			// Load the image if not already loaded
			circle.image = new Image();
			circle.image.onload = () => renderCanvas(); // Re-render when the image is loaded
			circle.image.src = circle.coverImageUrl;
		}

		if (circle.hovered && circle.image) {
			// Draw the image
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

	function drawClan(label) {
		// Draw clan elements (like labels)
		context.fillStyle = 'white'; // Example style
		context.font = label.fontSize + 'px Arial'; // Example font, adjust as needed
		context.fillText(label.label, label.x, label.y);
		// Additional drawing details for clans
	}

	function drawLink(mapData, clan, lineWidth) {
		context.beginPath();
		context.moveTo(mapData.x, mapData.y);
		context.lineTo(clan.x, clan.y);
		context.strokeStyle = 'white';
		context.lineWidth = lineWidth;
		context.stroke();
	}

	function drawLinkText(mapData, clan, lineWidth, pp) {
		const angle = Math.atan2(clan.y - mapData.y, clan.x - mapData.x);
		context.save();
		context.translate(mapData.x, mapData.y);
		context.rotate(angle);
		context.fillStyle = 'purple';
		context.font = `${lineWidth * 0.8}px Arial`;
		context.fillText(`${Math.round(pp)}pp`, 30 / currentScale, lineWidth / 2);
		context.restore();
	}

	// Additional functions for drawing lines, text, etc.

	function setupInteractions() {
		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('click', handleClick);

		const zoom = d3
			.zoom()
			.scaleExtent([0.1, 10])
			.on('zoom', event => {
				currentZoom = event.transform;
				currentScale = event.transform.k;
				renderCanvas();
			});

		d3.select(canvas).call(zoom);
		const initialTransform = d3.zoomIdentity.translate(346.64996337890625, 303.4814766674457).scale(currentScale);
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
		canvas.style.cursor = foundHovered ? 'pointer' : 'default';

		renderCanvas();
	}

	function handleClick(event) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = (event.clientX - rect.left) / currentZoom.k - currentZoom.x / currentZoom.k;
		const mouseY = (event.clientY - rect.top) / currentZoom.k - currentZoom.y / currentZoom.k;

		circles.forEach(circle => {
			const dx = mouseX - circle.x;
			const dy = mouseY - circle.y;
			const isHovered = dx * dx + dy * dy <= circle.animatedRadius * circle.animatedRadius;

			if (isHovered) {
				navigate(`/leaderboard/clanranking/${circle.id}/1`, '_blank');
			}
		});
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

	let newWidth;
	let newHeight;

	$: canvas && updateCanvasSize(newWidth, newHeight);
</script>

<div bind:offsetWidth={newWidth} bind:offsetHeight={newHeight} id="clan-map-container" />

<style>
	#clan-map-container {
		width: 100%;
		height: 100%;
	}
</style>
