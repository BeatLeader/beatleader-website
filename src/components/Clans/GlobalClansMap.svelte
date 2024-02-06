<script>
	import {onMount} from 'svelte';
	import * as d3 from 'd3';
	import Chart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import {clansData} from './response';
	import {navigate} from 'svelte-routing';
	import {mapTypeListFromMask} from '../../utils/beatleader/format';

	const width = 1200;
	const height = 800;

	onMount(() => {
		const svg = d3.select('#clan-map-container').append('svg').attr('width', width).attr('height', height);

		const data = clansData.map(m => {
			return {...m, id: m.leaderboardId};
		});

		var clans = [];
		var clanMap = {};
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

		const allData = data.concat(clans);

		var links = [];
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

		var circles = [];
		const animationDuration = 300;
		const hoverRadius = 28;
		const contentGroup = svg.append('g');
		const lineGroup = contentGroup.append('g').attr('id', 'line-group');
		const circleGroup = contentGroup.append('g').attr('id', 'circle-group');
		let currentScale = 0.24999999999999994; // To store the current global scale

		// For each leaderboard/map
		data.forEach(map => {
			const topClan = map.clans[0]; // Assuming the clans are sorted by their 'pp'

			const circle = circleGroup
				.append('circle')
				.attr('cx', Math.random() * width)
				.attr('cy', Math.random() * height)
				.attr('r', map.stars)
				.attr('fill', map.tie ? 'grey' : topClan.clan.color)
				.on('mouseover', function () {
					// Enlarge circle on hover with animation
					d3.select(this)
						.transition()
						.duration(animationDuration) // Animation duration in milliseconds
						.attr('r', hoverRadius / currentScale);
					// Show coverImage when hovered
					const xPos = d3.select(this).attr('cx');
					const yPos = d3.select(this).attr('cy');

					const imageRadius = hoverRadius * 0.9;
					circleGroup
						.append('clipPath')
						.attr('id', 'rounded-clip')
						.append('circle')
						.attr('cx', xPos)
						.attr('cy', yPos)
						.attr('r', imageRadius / currentScale);
					circleGroup
						.append('image')
						.attr('xlink:href', map.coverImage)
						.attr('x', xPos - imageRadius / currentScale)
						.attr('y', yPos - imageRadius / currentScale)
						.attr('width', (imageRadius * 2) / currentScale)
						.attr('height', (imageRadius * 2) / currentScale)
						.attr('pointer-events', 'none')
						.attr('id', 'hover-image')
						.attr('clip-path', 'url(#rounded-clip)')
						.attr('opacity', 0) // initial opacity
						.transition()
						.duration(animationDuration * 1.4) // adjust as needed
						.attr('opacity', 1); // final opacity

					for (let i = 0; i < map.clans.length; i++) {
						const link = clanMap[map.clans[i].clan.id];
						const pp = map.clans[i].pp;
						const width = ((pp / map.clans[0].pp) * 20) / currentScale;

						// Draw a line between the map and the clan
						lineGroup
							.append('line')
							.attr('x1', map.x)
							.attr('y1', map.y)
							.attr('x2', link.x)
							.attr('y2', link.y)
							.attr('pointer-events', 'none')
							.attr('stroke', 'white') // Color of the line, can be customized
							.attr('stroke-width', width) // Width based on the link's strength
							.classed('hover-line', true); // Assign a class for easier removal

						// Calculate the angle of rotation
						var angle = Math.atan2(link.y - map.y, link.x - map.x) * (180 / Math.PI);
						var offset = 30 / currentScale;
						if (angle < -90 || angle > 90) {
							offset *= 2.5;
						}
						const textX = map.x + Math.cos((Math.PI / 180) * angle) * offset;
						const textY = map.y + width / 2 + Math.sin((Math.PI / 180) * angle) * offset;
						if (angle < -90 || angle > 90) {
							angle += 180;
						}

						lineGroup
							.append('text')
							.attr('x', textX)
							.attr('y', textY)
							.attr('fill', 'purple')
							.attr('pointer-events', 'none')
							.attr('font-size', width * 0.8)
							.attr('transform', `rotate(${angle}, ${textX}, ${textY})`) // Apply the rotation here
							.text(Math.round(pp) + 'pp')
							.classed('hover-text', true); // Assign a class for easier removal
					}
				})
				.on('mouseout', function () {
					// Reset circle size with animation
					d3.select(this).transition().duration(animationDuration).attr('r', map.stars);
					// Remove the image when the mouse is moved away
					d3.select('#hover-image').remove();
					d3.select('#rounded-clip').remove();
					lineGroup.selectAll('.hover-line').remove();
					lineGroup.selectAll('.hover-text').remove();
				})
				.attr('cursor', 'pointer')
				.on('click', function () {
					// Open the desired link in a new tab
					navigate(`/leaderboard/clanranking/${map.id}/1`, '_blank');
				});
			circles.push(circle);
		});

		var clanLabels = [];
		// For each clan
		clans.forEach(clan => {
			clanLabels.push(
				circleGroup
					.append('text')
					.attr('x', Math.random() * width)
					.attr('y', Math.random() * height)
					.text(clan.clan.tag)
					.attr('font-size', Math.sqrt(clan.topCount) * 10 + 'px')
					.attr('fill', 'white')
			);
		});

		// Create a force layout to separate the points (clans)
		const simulation = d3
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
			); // Clans repel stronger than maps
		// .force('center', d3.forceCenter(width / 2, height / 2))
		// .force(
		// 	'collide',
		// 	d3.forceCollide(d => (d.name ? 30 : 15))
		// ) // Assuming clans have a bigger radius
		// for (let i = 0; i < 1000; i++) {
		// 	simulation.tick();
		// }
		simulation.on('tick', () => {
			for (let i = 0; i < circles.length; i++) {
				const circle = circles[i];
				circle.attr('cx', allData[i].x).attr('cy', allData[i].y);
			}
			for (let i = 0; i < clanLabels.length; i++) {
				const label = clanLabels[i];
				const bbox = label.node().getBBox();
				label.attr('x', clans[i].x - bbox.width / 2).attr('y', clans[i].y + bbox.height / 4);
			}
		});

		const zoom = d3.zoom().scaleExtent([0.1, 10]).on('zoom', zoomed);

		function zoomed(event) {
			contentGroup.attr('transform', event.transform);
			currentScale = event.transform.k;
		}

		// Assuming 'svg' is your main visualization canvas
		svg.call(zoom);
		const initialTransform = d3.zoomIdentity.translate(346.64996337890625, 303.4814766674457).scale(currentScale);
		svg.call(zoom.transform, initialTransform);
	});
</script>

<div id="clan-map-container" style="--height: {height}px; --width: {width}px;" />

<style>
	section {
		position: relative;
		margin: 1rem auto 0 auto;
		height: var(--height, 300px);
	}

	section :global(svg) {
		position: absolute;
		top: calc((100% - 10em) / 2);
		left: calc((100% - 10em) / 2);
	}

	canvas {
		width: 100% !important;
	}

	:global(.chart-new-playlist) {
		top: 0.4em;
		right: 2%;
		position: absolute !important;
		font-size: 0.8em !important;
		height: 1.5em;
	}

	@media screen and (max-width: 650px) {
		:global(.chart-new-playlist) {
			display: none !important;
		}
	}
</style>
