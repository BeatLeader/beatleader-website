<script>
	import Select from '../Settings/Select.svelte';
	import {Chart as ChartJS, Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale} from 'chart.js';

	ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale);
	import {Bar} from 'svelte-chartjs';
	import DashedLine from './DashedLine.svelte';

	export let censusData;

	let ipdData = censusData.find(x => x.name == 'Anthropometrics').categories.find(x => x.name == 'IPD').values;
	let ipd = ipdData[0];

	let heightData = censusData.find(x => x.name == 'Anthropometrics').categories.find(x => x.name == 'Height').values;
	let height = heightData[0];

	let wingspanData = censusData.find(x => x.name == 'Anthropometrics').categories.find(x => x.name == 'Wingspan').values;
	let wingspan = wingspanData[0];

	let gripData = censusData.find(x => x.name == 'Behavior Patterns').categories.find(x => x.name == 'Grip').values;
	let grip = gripData[0];

	let handednessData = censusData.find(x => x.name == 'Anthropometrics').categories.find(x => x.name == 'Handedness').values;
	let handedness = handednessData[0];

	let upperBodyData = censusData.find(x => x.name == 'Clothing').categories.find(x => x.name == 'Upper Body').values;
	let upperBody = upperBodyData[0];

	let lowerBodyData = censusData.find(x => x.name == 'Clothing').categories.find(x => x.name == 'Lower Body').values;
	let lowerBody = lowerBodyData[0];

	let footwearData = censusData.find(x => x.name == 'Clothing').categories.find(x => x.name == 'Footwear').values;
	let footwear = footwearData[0];

	let ageData = censusData.find(x => x.name == 'Demographics').categories.find(x => x.name == 'Age').values;
	let age = ageData[0];

	let employmentData = censusData.find(x => x.name == 'Demographics').categories.find(x => x.name == 'Employment Status').values;
	let employment = employmentData[0];
	let educationalData = censusData.find(x => x.name == 'Demographics').categories.find(x => x.name == 'Educational Status').values;
	let educational = educationalData[0];
	let politicalData = censusData.find(x => x.name == 'Demographics').categories.find(x => x.name == 'Political Orientation').values;
	let political = politicalData[0];
	let languageData = censusData.find(x => x.name == 'Demographics').categories.find(x => x.name == 'Language').values;
	let language = languageData[0];
	let stationsData = censusData
		.find(x => x.name == 'Technical Specifications')
		.categories.find(x => x.name == 'Base stations count').values;
	let stations = stationsData[0];
	let anyRhythmGamesData = censusData.find(x => x.name == 'Background').categories.find(x => x.name == 'Any Rhythm Games').values;
	let anyRhythmGames = anyRhythmGamesData[0];
	let rhythmGamesData = censusData.find(x => x.name == 'Background').categories.find(x => x.name == 'Rhythm Games').values;
	let rhythmGames = rhythmGamesData[0];
	let anyAthleticsData = censusData.find(x => x.name == 'Background').categories.find(x => x.name == 'Any Athletics').values;
	let anyAthletics = anyAthleticsData[0];
	let coffeeData = censusData.find(x => x.name == 'Behavior Patterns').categories.find(x => x.name == 'Caffinated Beverages').values;
	let coffee = coffeeData[0];
	let athleticsData = censusData.find(x => x.name == 'Background').categories.find(x => x.name == 'Athletics').values;
	let athletics = athleticsData[0];
	let preparationData = censusData.find(x => x.name == 'Behavior Patterns').categories.find(x => x.name == 'Preparation').values;
	let preparation = preparationData[0];

	let basePp = 5000;
	let modelPp = basePp;

	function recalculatePp(effects, fullSuite) {
		var multiplier = 1;
		effects.forEach(element => {
			if (element.effect) {
				multiplier += element.effect / 70;
			}
		});

		modelPp = basePp + basePp * multiplier;
		if (fullSuite) {
			modelPp = (modelPp / 1000).toFixed(0) * 1000 + 727.69;
		}
	}

	var graphData;

	function updateGraphData(modelPp) {
		let ppRanges = [
			{
				name: 0,
				count: 80,
			},
			{
				name: 2500,
				count: 72,
			},
			{
				name: 5000,
				count: 110,
			},
			{
				name: 7500,
				count: 130,
			},
			{
				name: 10000,
				count: 138,
			},
			{
				name: 12500,
				count: 128,
			},
			{
				name: 15000,
				count: 85,
			},
			{
				name: 17500,
				count: 85,
			},
			{
				name: 20000,
				count: 5,
			},
		];

		graphData = {
			labels: [],
			datasets: [
				{
					data: [],
					backgroundColor: [],
				},
			],
		};

		var dataset = graphData.datasets[0];

		for (let i = 0; i < ppRanges.length; i++) {
			const element = ppRanges[i];

			graphData.labels.push(element.name);
			dataset.data.push(element.count);
			if ((i == 0 || ppRanges[i - 1].name < modelPp) && (i == ppRanges.length - 1 || ppRanges[i + 1].name > modelPp)) {
				dataset.backgroundColor.push('rgba(75, 192, 192, 0.9)');
			} else {
				dataset.backgroundColor.push('rgba(54, 162, 235, 0.9)');
			}
		}
	}

	let innerWidth;
	let innerHeight;

	$: fullSuite =
		political.name == 'Other' &&
		upperBody.name == 'Inconsistent/Varies' &&
		lowerBody.name == 'Inconsistent/Varies' &&
		footwear.name == 'Inconsistent/Varies';
	$: recalculatePp(
		[
			ipd,
			wingspan,
			grip,
			handedness,
			lowerBody,
			upperBody,
			footwear,
			anyAthletics,
			age,
			employment,
			educational,
			political,
			language,
			stations,
			anyRhythmGames,
			rhythmGames,
			athletics,
			coffee,
			preparation,
		],
		fullSuite
	);
	$: updateGraphData(modelPp);

	$: heightIndex = heightData.indexOf(height);
	$: wingspanIndex = wingspanData.indexOf(wingspan);

	$: ipdIndex = ipdData.indexOf(ipd);

	$: cofeeIndex = coffeeData.indexOf(coffee);
	$: educationalIndex = educationalData.indexOf(educational);

	$: widthUnit = innerWidth < 700 ? innerWidth / 50 : innerWidth / 100;
	$: fontSize = widthUnit / 15;
	$: left = innerWidth < 700 ? 9 * widthUnit : 0;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="top-container">
	<div
		class="body-container"
		style="
			width: {40 * widthUnit}px;
			height: {40 * widthUnit}px;
			margin-top: {8 * widthUnit}px;
			left: {left}px">
		<div
			style="
                top: {0.6 * widthUnit}px;
                left: {-4 * widthUnit}px;
                position: absolute;">
			<Select bind:value={ipd} options={ipdData} valueSelector={x => x} {fontSize} />
		</div>
		<div
			class="eye"
			style="
				background-color: rgb({cofeeIndex * (255 / (coffeeData.length - 1))}, 0, 0);
                top: {1.6 * widthUnit}px; 
                left: {(9.5 - (ipdIndex + 3) * 0.15) * widthUnit}px;
				width: {0.5 * widthUnit}px;
				height: {0.5 * widthUnit}px;
				border-radius: {0.25 * widthUnit}px;" />
		<div
			class="eye"
			style="
				background-color: rgb({cofeeIndex * (255 / (coffeeData.length - 1))}, 0, 0);
                top: {1.6 * widthUnit}px; 
                left: {(9.5 + (ipdIndex + 3) * 0.15) * widthUnit}px;
				width: {0.5 * widthUnit}px;
				height: {0.5 * widthUnit}px;
				border-radius: {0.25 * widthUnit}px;" />
		{#if fullSuite}
			<span
				style="
			color: black;
			font-size: {2 * widthUnit}px;
			left: {9.3 * widthUnit}px;
			top: {1.7 * widthUnit}px;
			position: absolute;
			transform: rotate(90deg);
			z-index: 3;">3</span>
		{/if}
		<div
			style="
            top: {1.7 * widthUnit}px;
            left: {5 * widthUnit}px;
            position: absolute;
            z-index: 2;">
			<DashedLine lineLength={3 * widthUnit + 'px'} />
		</div>

		<div
			style="
            top: {-0.2 * widthUnit}px;
            left: {22 * widthUnit}px;
            position: absolute;">
			<Select bind:value={height} options={heightData} valueSelector={x => x} {fontSize} />
		</div>
		<div
			style="
            top: {17.7 * widthUnit + heightIndex * widthUnit}px;
            left: {widthUnit * 12 - (heightIndex * widthUnit) / 3}px;
            position: absolute;
            z-index: 2;">
			<DashedLine lineLength={36 * widthUnit * (1 + heightIndex * 0.03) + 'px'} gapLength={0} angle="90" borderWidth="0.2em" />
		</div>

		<div
			style="
            top: {-3.5 * widthUnit}px;
			left: {widthUnit * 21.5}px;
			position: absolute;">
			<Select bind:value={wingspan} options={wingspanData} valueSelector={x => x} {fontSize} />
		</div>
		<div
			style="
            top: {-1.1 * widthUnit}px;
			left: {widthUnit * -7}px;
			position: absolute;
			z-index: 2;">
			<DashedLine lineLength={36 * widthUnit + 'px'} gapLength={0} borderWidth="0.2em" />
		</div>

		<div
			style="
            top: {12.5 * widthUnit}px;
			left: {widthUnit * -7.8}px;
			position: absolute;">
			<Select bind:value={grip} options={gripData} valueSelector={x => x} {fontSize} />
		</div>

		<img
			style="
				width: {widthUnit * 6}px;
				position: absolute;
				top: {16 * widthUnit}px;
				left: {-7.8 * widthUnit}px;"
			src={grip.image}
			alt="" />

		<div
			style="
            top: {9 * widthUnit}px;
    		left: {widthUnit * -7.8}px;
			position: absolute;">
			<Select bind:value={handedness} options={handednessData} valueSelector={x => x} {fontSize} />
		</div>

		<div
			class="handiness-ring"
			style="
				width: {5 * widthUnit}px;
				height: {5 * widthUnit}px;
				
				border-radius: {3 * widthUnit}px;
				position: absolute;
				top: {2.8 * widthUnit + (heightIndex * widthUnit) / 10}px;
				border-color: {handedness.color};
				left: {widthUnit * (-7.7 - wingspanIndex)}px;" />

		<div
			style="
				top: {15.5 * widthUnit}px;
				left: {widthUnit * 15}px;
				position: absolute;">
			<Select bind:value={upperBody} options={upperBodyData} valueSelector={x => x} {fontSize} fontPadding={0.2} />
		</div>

		{#if upperBody.image}
			<img
				style="
				width: {widthUnit * 44.4}px;
				position: absolute;
				top: {-0.7 * widthUnit + (heightIndex * widthUnit) / 2}px;
				left: {widthUnit * -12.9}px;
				z-index: 3;
				max-width: unset;
				pointer-events: none;
				transform: scaleY({1 + heightIndex * 0.1})"
				src={upperBody.image}
				alt="" />
		{/if}

		<div
			style="
				top: {19.5 * widthUnit}px;
				left: {widthUnit * 15}px;
				position: absolute;">
			<Select bind:value={lowerBody} options={lowerBodyData} valueSelector={x => x} {fontSize} fontPadding={0.2} />
		</div>

		{#if lowerBody.image}
			<img
				style="
				width: {widthUnit * 42}px;
				position: absolute;
				top: {16.3 * widthUnit + heightIndex * widthUnit * 1.3}px;
				left: {widthUnit * -11.4}px;
				z-index: 2;
				max-width: unset;
				pointer-events: none;
				transform: scaleY({1 + heightIndex * 0.1})"
				src={lowerBody.image}
				alt="" />
		{/if}

		<div
			style="
				top: {32.5 * widthUnit}px;
				left: {widthUnit * 15}px;
				position: absolute;">
			<Select bind:value={footwear} options={footwearData} valueSelector={x => x} {fontSize} fontPadding={0.2} />
		</div>

		{#if footwear.image}
			<img
				style="
				position: absolute;
				width: {widthUnit * 8.6}px;
				top: {31 * widthUnit + heightIndex * widthUnit * 2.36}px;
				left: {7.8 * widthUnit}px;
				z-index: 2;
				max-width: unset;
				pointer-events: none;"
				src={footwear.image}
				alt="" />
			<img
				style="
				position: absolute;
				width: {widthUnit * 9.15}px;
				top: {30.59 * widthUnit + heightIndex * widthUnit * 2.36}px;
				left: {2.84 * widthUnit}px;
				z-index: 2;
				max-width: unset;
				pointer-events: none;
				transform: rotateY(180deg)"
				src={footwear.image}
				alt="" />
		{/if}

		{#if political.image}
			<img
				style="
				width: {widthUnit * 8}px;
				position: absolute;
				top: {-3 * widthUnit}px;
				left: {widthUnit * 5.7}px;
				z-index: 2;
				max-width: unset;
				pointer-events: none;"
				src={political.image}
				alt="" />
		{/if}

		<img
			class="body-part"
			style="
                width: {widthUnit * 4 * (1.0 + educationalIndex * 0.03)}px;
                left: {widthUnit * 8.8 - widthUnit * (1.0 + educationalIndex * 0.04)}px;
				top: {-widthUnit * educationalIndex * 0.1}px"
			src="/assets/body/head.svg"
			alt="" />
		<img
			class="body-part"
			style="width: 
                {10 * widthUnit}px;
                left: {widthUnit * 5}px;
                top: {4 * widthUnit + (heightIndex * widthUnit) / 2}px;
				transform: scaleY({1 + heightIndex * 0.1})"
			src="/assets/body/torso.svg"
			alt="" />
		<img
			class="body-part"
			style="
                top: {0.7 * widthUnit + (heightIndex * widthUnit) / 10}px;
                width: {widthUnit * 3}px;
                left: {(16 + wingspanIndex / 2) * widthUnit}px;
                transform: rotate(90deg) rotateX(180deg) scaleY({1 + 0.1 * wingspanIndex});"
			src="/assets/body/hand.svg"
			alt="" />
		<img
			class="body-part"
			style="
                top: {0.7 * widthUnit + (heightIndex * widthUnit) / 10}px;
                width: {widthUnit * 3}px;
                left: {(-wingspanIndex / 2) * widthUnit}px;
                transform: rotate(90deg) scaleY({1 + 0.1 * wingspanIndex});"
			src="/assets/body/hand.svg"
			alt="" />
		<img
			class="body-part"
			style="
                width: {widthUnit * 2}px;
                top: {3.2 * widthUnit + (heightIndex * widthUnit) / 10}px;
                left: {(24.2 + wingspanIndex) * widthUnit}px;
                transform: rotateZ(270deg);"
			src="/assets/body/wrist.svg"
			alt="" />
		<img
			class="body-part"
			style="
                width: {widthUnit * 2}px;
                top: {3.2 * widthUnit + (heightIndex * widthUnit) / 10}px;
                left: {(-6.2 - wingspanIndex) * widthUnit}px;
                transform: rotateZ(90deg) rotateY(180deg);"
			src="/assets/body/wrist.svg"
			alt="" />
		<img
			class="body-part"
			style="
                width: {widthUnit * 8}px;
                top: {17 * widthUnit + heightIndex * widthUnit * 1.5}px;
                left: {widthUnit * 5.7}px;
				transform: scaleY({1 + heightIndex * 0.1})"
			src="/assets/body/legs.svg"
			alt="" />
	</div>
	<div>
		<span><b>Construct your hypotetical player<br />with desired parameters to predict PP count! </b><br /><br /></span>
		<div class="other-selectors">
			<div class="other-selector">
				<span>Age:</span>
				<Select bind:value={age} options={ageData} valueSelector={x => x} fontPadding={0.15} />
			</div>
			<div class="other-selector">
				<span>Employment Status:</span>
				<Select bind:value={employment} options={employmentData} valueSelector={x => x} fontPadding={0.15} />
			</div>
			<div class="other-selector">
				<span>Educational Status:</span>
				<Select bind:value={educational} options={educationalData} valueSelector={x => x} fontPadding={0.15} />
			</div>
			<div class="other-selector">
				<span>Political Orientation:</span>
				<Select bind:value={political} options={politicalData} valueSelector={x => x} fontPadding={0.15} />
			</div>
			<div class="other-selector">
				<span>Primary Language:</span>
				<Select bind:value={language} options={languageData} valueSelector={x => x} fontPadding={0.15} />
			</div>
			<div class="other-selector">
				<span>Base Stations:</span>
				<Select bind:value={stations} options={stationsData} valueSelector={x => x} fontPadding={0.15} />
			</div>
			<div class="other-selector">
				<span>Rhythm Games:</span>
				<Select bind:value={anyRhythmGames} options={anyRhythmGamesData} valueSelector={x => x} fontPadding={0.15} />
				{#if anyRhythmGames?.name == 'Yes'}
					: <Select bind:value={rhythmGames} options={rhythmGamesData} valueSelector={x => x} fontPadding={0.15} />
				{/if}
			</div>

			<div class="other-selector">
				<span>Athletics:</span>
				<Select bind:value={anyAthletics} options={anyAthleticsData} valueSelector={x => x} fontPadding={0.15} />
				{#if anyAthletics?.name == 'Yes'}
					: <Select bind:value={athletics} options={athleticsData} valueSelector={x => x} fontPadding={0.15} />
				{/if}
			</div>

			<div class="other-selector">
				<span>Coffee:</span>
				<Select bind:value={coffee} options={coffeeData} valueSelector={x => x} fontPadding={0.15} />
			</div>

			<div class="other-selector">
				<span>Preparation:</span>
				<Select bind:value={preparation} options={preparationData} valueSelector={x => x} fontPadding={0.15} />
			</div>
		</div>
		<span><b>Model player: </b><b style="color: var(--ppColour)">{modelPp.toFixed(2)}PP</b></span>
		<div class="chart-container">
			<Bar
				options={{
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						x: {
							ticks: {
								color: 'white',
								fontSize: 14,
							},
						},
						y: {
							ticks: {
								color: 'white',
								fontSize: 14,
							},
						},
					},
					plugins: {legend: {display: false}},
				}}
				data={graphData} />
		</div>
	</div>
</div>

<style>
	.top-container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
	}

	.body-container {
		position: relative;
	}

	.eye {
		position: absolute;
		z-index: 1;
	}

	.body-part {
		position: absolute;
		filter: invert(0.5) sepia(1) saturate(5) hue-rotate(175deg);
	}

	.chart-container {
		position: relative;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}

	.handiness-ring {
		border: 0.2em solid;
		z-index: 2;
	}

	.other-selectors {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}
</style>
