export default {
  id: 'regions',
  beforeDraw(chart, args, options) {
    if (!options?.regions || !Array.isArray(options.regions)) return;

    const {ctx, chartArea: {left, top, right, bottom}, scales: {y}} = chart;
    const width = right - left;

    ctx.save();

    options.regions.forEach(region => {
      if (y.min <= region.max && y.max >= region.min) {
        const minY = Math.max(region.min, y.min);
        const maxY = Math.min(region.max, y.max);
        const top = y.getPixelForValue(maxY);
        const height = y.getPixelForValue(minY) - y.getPixelForValue(maxY);

        ctx.fillStyle = region.color;
        ctx.fillRect(left, top, width, height);
      }
    })

    ctx.restore();
  }
}