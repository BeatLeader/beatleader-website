export let mapBlock = (editor, options) => {
	var comps = editor.DomComponents;
	var dType = comps.getType('iframe');
	var dModel = dType.model;

	comps.addType('bsmap', {
		isComponent: el => {
			if (el.tagName == 'IFRAME' && el.getAttribute('bl-type') == 'bsmap') {
				return {
					type: 'bsmap',
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

				mapId: '1e6ff',

				traits: [
					{
						type: 'text',
						label: 'Map ID (bsr)',
						name: 'mapId',
						changeProp: 1,
					},
				],
			}),
			init() {
				this.on('change:mapId', this.changeMapId);
			},
			changeMapId() {
				var newId = this.get('mapId');
				this.set({mapId: newId});
				this.addAttributes({src: `https://beatsaver.com/maps/${newId}/embed`});
			},
		},
	});

	editor.BlockManager.add('bsmap', {
		label: 'Map',
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
                d="M 3,3 C 2.000004,3 1,4.000004 1,5 v 14 c 0,1.104565 0.8954349,2 2,2 h 18 c 0.999996,0 2,-1.000004 2,-2 V 5 C 23,4.000004 21.999996,3 21,3 Z m 3.3808594,1.6621094 c 0.1644477,0 0.3278313,0.062206 0.453125,0.1875 l 3.3027346,3.3007812 c 0.250587,0.2505871 0.250587,0.657616 0,0.9082032 L 6.8339844,12.361328 c -0.2505871,0.250587 -0.657616,0.250587 -0.9082032,0 L 2.625,9.0585938 C 2.3744128,8.8080066 2.3744128,8.4009777 2.625,8.1503906 L 5.9257812,4.8496094 c 0.1252935,-0.1252936 0.2906302,-0.1875 0.4550782,-0.1875 z M 11.791016,5.3300781 21.46875,5.375 v 2 L 11.791016,7.3300781 Z M 8.7011719,8.3105469 6.765625,8.8457031 A 0.20986718,0.20986718 0 0 0 6.625,8.9902344 L 6.0898438,10.923828 c -0.056382,0.197337 0.1867645,0.340579 0.3339843,0.19336 L 8.8964844,8.6464844 C 9.0405718,8.5023966 8.8985095,8.257297 8.7011719,8.3105469 Z M 2.515625,13.84375 h 18.96875 v 2 H 2.515625 Z M 2.5,16.96875 h 18.96875 v 2 H 2.5 Z" /></svg>
            `,
		content: {
			type: 'bsmap',
			style: {border: 'none', width: '600px', height: '145px', 'border-radius': '8px'},
			attributes: {
				src: 'https://beatsaver.com/maps/1e6ff/embed',
				'bl-type': 'bsmap',
			},
		},
		category: 'Basic',
	});
};
