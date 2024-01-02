<script>
	import * as d3 from 'd3';
	import {clansData} from './response';
	import {navigate} from 'svelte-routing';

	export let leaderboardId;

	let container; // Reference to the container div
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
		const data = clansData.map(m => {
			return {...m, id: m.leaderboardId};
		});

		for (let i = 0; i < data.length; i++) {
			const map = data[i];
			for (let j = 0; j < map.clans.length; j++) {
				var clan = map.clans[j];
				if (!clanMap[clan.clan.id]) {
					const clanPoint = {
						...clan,
						x: cache ? cache.clans[clan.clan.id].x : 0,
						y: cache ? cache.clans[clan.clan.id].y : 0,
						id: clan.clan.id,
						topCount: j == 0 ? 1 : 0,
					};
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
				strength: map.tie ? map.clans[0].pp * 0.23 : map.clans[0].pp, // you can later use this strength for adjusting the link
			});
			if (map.clans.length > 1) {
				links.push({
					source: map.leaderboardId,
					target: map.clans[1].clan.id,
					strength: map.clans[1].pp * 0.23, // you can later use this strength for adjusting the link
				});
			}
			if (map.clans.length > 2) {
				links.push({
					source: map.leaderboardId,
					target: map.clans[2].clan.id,
					strength: map.clans[2].pp * 0.23, // you can later use this strength for adjusting the link
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

			/* Backward compatibility for whole number based opacity values. */
			if (opacity > 1 && opacity <= 100) {
				opacity = opacity / 100;
			}

			return `rgba(${r},${g},${b},${opacity})`;
		};

		// For each leaderboard/map
		data.forEach(map => {
			const topClan = map.clans[0];

			circles.push({
				id: map.leaderboardId,
				x: cache ? cache.circles[map.leaderboardId].x : 0,
				y: cache ? cache.circles[map.leaderboardId].y : 0,
				r: map.stars,
				color: map.tie ? 'grey' : convertHexToRGBA(topClan.clan.color, (1 - map.clans[1].pp / map.clans[0].pp) * 8),
				hoverColor: map.tie ? 'grey' : topClan.clan.color,
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
			const clanLabel = {
				id: clan.clan.id,
				x: cache ? cache.clans[clan.clan.id].x : 0,
				y: cache ? cache.clans[clan.clan.id].y : 0,
				label: clan.clan.tag,
				fontSize: Math.sqrt(clan.topCount) * 10,
			};
			clanLabels.push(clanLabel);
			labelsMap[clan.clan.id] = clanLabel;
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
				d3.forceManyBody().strength(d => (d.clan ? -1000 : -150))
			);

		if (leaderboardId) {
			for (let i = 0; i < 200; i++) {
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
	// 	clanLabels.forEach(clan => {
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

		clanLabels.forEach(l => {
			drawClan(l);
		});

		circles.forEach(c => {
			if (c.hovered) return;
			if (c.toIncrease != 0) {
				animating = true;
			}
			if (isCircleVisible(c)) {
				drawMap(c);
			}
		});

		circles.forEach(c => {
			if (!c.hovered) return;
			if (c.toIncrease != 0) {
				animating = true;
			}
			if (isCircleVisible(c)) {
				drawMap(c);
			}
		});

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
			if (circle.toIncrease === 0 && circle.hovered) {
				circle.animatedRadius = hoverRadius / currentScale;
			}
			circle.clans.forEach(clan => {
				const pp = clan.pp;
				const lineWidth = ((pp / circle.clans[0].pp) * 20) / currentScale;

				drawClan(labelsMap[clan.clan.id], true);

				// Draw a line between the map and the clan
				drawLink(circle, clanMap[clan.clan.id], lineWidth);

				// Draw text along the link
				drawLinkText(circle, clanMap[clan.clan.id], lineWidth, pp);
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

	function drawLink(mapData, clan, lineWidth) {
		context.beginPath();
		context.moveTo(mapData.x, mapData.y);
		context.lineTo(clan.x, clan.y);
		context.strokeStyle = 'white';
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

	// Additional functions for drawing lines, text, etc.

	function setupInteractions() {
		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('click', handleClick);

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
				const textMetrics = context.measureText(label.label);
				const textWidth = textMetrics.width;
				const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

				if (mouseX > label.x && mouseX < label.x + textWidth && mouseY > label.y - textHeight && mouseY < label.y) {
					// Check the color at the mouse position
					const pixel = context.getImageData(mouseX, mouseY, 1, 1).data;
					const rgba = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;

					console.log(rgba);

					if (rgba === 'rgba(255, 255, 255, 0.6)') {
						// The mouse is over a clan label
						// TODO: Implement what should happen when a label is hovered
						console.log(label.label);
						foundHovered = true;
					}
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

		circles.forEach(circle => {
			const dx = mouseX - circle.x;
			const dy = mouseY - circle.y;
			const isHovered = dx * dx + dy * dy <= circle.animatedRadius * circle.animatedRadius;

			if (isHovered) {
				navigate(`/leaderboard/clanranking/${circle.id}/1`);
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

	let animating = false;
	let animationStartTime;

	function animateZoom(targetMapId, duration = 4000) {
		const targetMap = circles.find(d => d.id == targetMapId);
		if (!targetMap) return;

		const initialTransform = d3.zoomIdentity.translate(346.64996337890625, 303.4814766674457).scale(defaultScale);
		d3.select(canvas).call(zoom.transform, initialTransform);

		const targetZoomLevel = 2; // Desired zoom level
		const targetTransform = d3.zoomIdentity
			.translate(width / 2, height / 2)
			.scale(targetZoomLevel)
			.translate(-targetMap.x, -targetMap.y);

		console.log(width + '  ' + height);
		console.log(-targetMap.x + '  ' + -targetMap.y);

		animationStartTime = performance.now();
		animating = true;

		function zoomStep(timestamp) {
			if (!animating) return;

			const elapsedTime = timestamp - animationStartTime;
			const t = Math.min(1, elapsedTime / duration);

			d3.select(canvas).call(zoom.transform, interpolateZoom(currentZoom, targetTransform, t));

			if (t > 0.14 && !targetMap.hovered) {
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

	$: !canvas && newWidth && newHeight && init(newWidth, newHeight);
	$: canvas && updateCanvasSize(newWidth, newHeight);
	$: leaderboardId && simulated && animateZoom(leaderboardId);
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
	}
</style>
