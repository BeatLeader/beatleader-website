export const onLegendClick = (event, legendItem, legend) => {
  const idx = legendItem.datasetIndex;
  const ci = legend.chart;

  const scales = legend?.chart?.config?.options?.scales;
  if (!scales) return;

  const { x: xAxis, ...yAxes } = scales;

  if (ci.isDatasetVisible(idx)) {
    ci.hide(idx);
    legendItem.hidden = true;
  } else {
    ci.show(idx);
    legendItem.hidden = false;
  }

  if (legend?.chart) {
    const yAxisIdsToShow = (legend?.legendItems ?? [])
      .sort((a, b) => (ci?.config?.data?.datasets?.[a?.datasetIndex]?.axisOrder ?? a?.datasetIndex) - (ci?.config?.data?.datasets?.[b?.datasetIndex]?.axisOrder ?? b?.datasetIndex))
      .reduce((cum, legendItem) => {
        // done
        if (cum.second) return cum;

        // skip hidden legend items
        if (legendItem?.hidden) return cum;

        const yAxisId = ci?.getDatasetMeta(legendItem?.datasetIndex)?.yAxisID ?? null;
        if (!yAxisId) return cum;

        if (!cum.first) {
          cum.first = yAxisId;
        } else if (yAxisId !== cum.first) {
          cum.second = yAxisId;
        }

        return cum;
      }, { first: null, second: null });

    Object.keys(yAxes).forEach(currentAxisKey => {
      if (![yAxisIdsToShow.first, yAxisIdsToShow.second].includes(currentAxisKey)) {
        yAxes[currentAxisKey].display = false;
        return;
      }

      yAxes[currentAxisKey].display = true;
      if (yAxisIdsToShow.first === currentAxisKey) yAxes[currentAxisKey].position = 'left';
      if (yAxisIdsToShow.second === currentAxisKey) yAxes[currentAxisKey].position = 'right';
    });

    legend.chart.options.scales = { x: xAxis, ...yAxes }
    legend.chart.update();
  }
}