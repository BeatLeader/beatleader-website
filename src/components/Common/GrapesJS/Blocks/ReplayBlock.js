export let replayBlock = (editor, options) => {
	var comps = editor.DomComponents;
	var dType = comps.getType('iframe');
	var dModel = dType.model;

	comps.addType('replay', {
		isComponent: el => {
			if (el.tagName == 'IFRAME' && el.getAttribute('bl-type') == 'replay') {
				return {
					type: 'replay',
					components: [],
				};
			}
		},
		model: {
			defaults: Object.assign({}, dModel.prototype.defaults, {
				// Can't drop other elements inside it
				droppable: false,
				resizable: true,
				editable: true,

				scoreId: '1',

				traits: [
					{
						type: 'text',
						label: 'Score ID',
						name: 'scoreId',
						changeProp: 1,
					},
				],
			}),
			init() {
				this.on('change:scoreId', this.changeMapId);
			},
			changeMapId() {
				var newId = this.get('scoreId');
				this.set({scoreId: newId});
				this.addAttributes({src: `https://replay.beatleader.com/?scoreId=${newId}`});
			},
		},
	});

	editor.BlockManager.add('replay', {
		label: 'Replay',
		media: `<svg
			viewBox="0 0 24 24"><defs
				id="defs8" /><sodipodi:namedview
				id="namedview6"
				pagecolor="#ffffff"
				bordercolor="#000000"
				borderopacity="0.25"
				inkscape:showpageshadow="2"
				inkscape:pageopacity="0.0"
				inkscape:pagecheckerboard="0"
				inkscape:deskcolor="#d1d1d1"
				showgrid="false"
				inkscape:zoom="45.254834"
				inkscape:cx="19.754796"
				inkscape:cy="7.5793008"
				inkscape:window-width="3840"
				inkscape:window-height="2054"
				inkscape:window-x="-11"
				inkscape:window-y="-11"
				inkscape:window-maximized="1"
				inkscape:current-layer="svg4" /><path
				id="path2"
				d="M 3,3 C 2.000006,3 1,4.000006 1,5 v 14 c 0,1.104563 0.8954371,2 2,2 h 18 c 0.999994,0 2,-1.000006 2,-2 V 5 C 23,4.000006 21.999994,3 21,3 Z m 4.5546875,1.3359375 c 0,-0.00329 8.8457035,-0.00329 8.8457035,0 0.691516,-0.00329 1.251953,0.5551895 1.251953,1.25 v 8.8496095 c 0,0.690858 -0.560437,1.251295 -1.251953,1.251953 0,-6.58e-4 -8.8457035,-6.58e-4 -8.8457035,0 -0.6915177,-6.58e-4 -1.25,-0.561095 -1.25,-1.251953 V 5.5859375 c 0,-0.6948105 0.5584823,-1.25329 1.25,-1.25 z m 0,0.8554687 C 7.3241815,5.1881136 7.1601563,5.3653104 7.1601562,5.5859375 v 8.8496095 c 0,0.21009 0.1640253,0.393872 0.3945313,0.394531 0,-6.59e-4 8.8457035,-6.59e-4 8.8457035,0 0.217331,-6.59e-4 0.394531,-0.184441 0.394531,-0.394531 V 5.5898438 c 0,-0.2232615 -0.1772,-0.4024144 -0.394531,-0.3964844 v -0.00195 c 0,-0.00329 -8.8457035,-0.00329 -8.8457035,0 z M 10.908203,7.171875 c 0.02964,0 0.05859,6.381e-4 0.05859,0.00195 0.263436,-0.00263 0.474609,0.14188 0.474609,0.3164063 v 5.2167967 c 0,0.147525 -0.197454,0.272138 -0.408203,0.273438 0,-0.0013 -0.185547,-0.0013 -0.185547,0 -0.197577,-0.0013 -0.341841,-0.066 -0.394531,-0.158203 l -1.2519531,-2.53711 c -0.065859,-0.131718 -0.065859,-0.3014209 0,-0.4160155 0,-0.017123 1.2519531,-2.5542323 1.2519531,-2.5371094 0.05269,-0.096154 0.196954,-0.1608331 0.394531,-0.1582031 0,-0.00131 0.03091,-0.00195 0.06055,-0.00195 z m 3.095703,0 c 0.02964,0 0.05859,6.381e-4 0.05859,0.00195 0.263436,-0.00263 0.480469,0.1418801 0.480469,0.3164063 v 5.2167967 c 0,0.147525 -0.196728,0.272138 -0.414063,0.273438 0,-0.0013 -0.185547,-0.0013 -0.185547,0 -0.190989,-0.0013 -0.342573,-0.066 -0.388671,-0.158203 l -1.25,-2.53711 c -0.06586,-0.131718 -0.06586,-0.301421 0,-0.4160155 0,-0.017123 1.25,-2.5542322 1.25,-2.5371094 0.0461,-0.096154 0.197682,-0.1608331 0.388671,-0.1582031 0,-0.00131 0.03091,-0.00195 0.06055,-0.00195 z M 2.5,16.96875 h 18.96875 v 2 H 2.5 Z" /></svg>`,
		content: {
			type: 'replay',
			style: {border: 'none', width: '300px', height: '185px', 'border-radius': '8px'},
			attributes: {
				src: 'https://replay.beatleader.com/?scoreId=1',
				'bl-type': 'replay',
			},
		},
		category: 'Basic',
	});
};
