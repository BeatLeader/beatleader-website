export default {
	id: 'regions',
	beforeDatasetDraw(chart, args, options) {
		if (!options?.regions || !Array.isArray(options.regions)) return;

		const {
			ctx,
			chartArea: {left, top, right, bottom},
			scales: {x, y},
		} = chart;
		const height = bottom - top;

		ctx.save();
		let fontSize = 11;
		ctx.font = `bold ${fontSize}pt Arial`;

		options.regions.forEach(region => {
			if (x.min <= region.max && x.max >= region.min) {
				const minX = Math.max(region.min, x.min);
				const maxX = Math.min(region.max, x.max);
				const left = x.getPixelForValue(minX);
				const width = region.min === region.max ? 1 : x.getPixelForValue(maxX) - x.getPixelForValue(minX);

				ctx.fillStyle = region.color;
				ctx.fillRect(left, top, width, height);

				if (region.label) {
					const labelWidth = ctx.measureText(region.label)?.width ?? 0;

					ctx.save();
					ctx.translate(
						region?.position?.horizontal === 'right' ? left + 4 : left - fontSize - 4,
						region?.position?.vertical === 'bottom' ? bottom : labelWidth + fontSize
					);
					ctx.rotate(-0.5 * Math.PI);
					ctx.textBaseline = 'top';
					ctx.fillText(region.label, 0, 0);
					ctx.restore();
				}
			}
		});

		ctx.restore();
	},
};
