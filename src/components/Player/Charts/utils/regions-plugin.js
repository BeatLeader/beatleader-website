export default {
  id: 'regions',
  beforeDraw(chart, args, options) {
    if (!options?.regions || !Array.isArray(options.regions)) return;

    const {ctx, chartArea: {left, top, right, bottom}, scales: {y}} = chart;
    const width = right - left;

    let fontSize = parseInt(ctx.font,10);
    if (isNaN(fontSize)) fontSize = 12;

    ctx.save();

    options.regions.forEach(region => {
      if (y.min <= region.max && y.max >= region.min) {
        const minY = Math.max(region.min, y.min);
        const maxY = Math.min(region.max, y.max);
        const top = y.getPixelForValue(maxY);
        const height = region.min === region.max ? 1 : y.getPixelForValue(minY) - y.getPixelForValue(maxY);

        ctx.fillStyle = region.color;
        ctx.fillRect(left, top, width, height);

        if (region.label) {
          const labelWidth = ctx.measureText(region.label)?.width ?? 0;

          ctx.textBaseline = 'top';
          ctx.fillText(
            region.label,
            region?.position?.horizontal === 'right' ? right - labelWidth - 3 : left + 3,
            region?.position?.vertical === 'bottom' ? top + 2 : top - fontSize - 1
          );
        }
      }
    })

    ctx.restore();
  }
}