# 4.0.4.1 / 2014-11-18

* Update the bundled Highmaps module to 1.0.4 (#21)

# 4.0.4 / 2014-09-02

* Updated Highcharts to 4.0.4
  * Added more date parsing logic to the data module. Now integrates with Date.js, and uses Date.parse. Tries to parse all dates, but falls back to categories if dates are not sorted (which may be a sign that parsing went wrong).
  * Added support for setting marker image dimensions. Closes #1807. Closes #1817.
  * Added a better default value for xAxis.allowDecimals. Don't allow decimals in X value ranges that look like years. Closes #3363.
  * Added warning on trying to plot negative points on a logarithmic axis.
  * Allow changing "Date" class used to support other calendars. Added new option global.Date.
  * Allow overriding Highcharts.numberFormat from the outside. Closes #3284.
  * Made point.click event work in combination with drilldown charts.
  * Fixed #3381 3D pies, wrong z index applied to sides
  * Fixed #3279, column z issues in 3d
  * Fixed #3397, footerFormat does not replace variables
  * Speed optimization of Series.setData, related to #3260.
  * Fixed #2909, a regression causing chart click event not to fire when zoom enabled on touch devices.
  * Fixed #3334, missing animations in 3d pies
  * Fixed issue causing markers to show even on dense line series, in spite of new logic in 4.x where it should depend on series density.
  * Fixed #3202, tick marks being drawn in unwanted positions when tickInterval was set on categorized axis.
  * Fixed #424, wrong tooltip position for column series in a pane position
  * Fixed #3352, JavaScript errors on clicking category labels on async drilldown.
  * Fixed #3344, drilldown axis label style inconsistent after redraw.
  * Fixed #3353, wrong axis minimum and maximum on thresholded series when switching from linear to logarithmic axes type.
  * Fixed #3342, memory leaks in jQuery 2.x when repeatedly reinstanciating charts or destroying and recreating renderer primitives.
  * Fixed memory leak on addPoint caused by adding empty names to the Axis.names lookup table.
  * Fixed #3328, 3D Columns and null values
  * Fixes #3317, extra tick added when there are only two ticks (start and end)
  * Fixed #3315 by disallowing duplicate ids in drilldown.
  * Fixed #3182, three level drilldown broken when drilling up and down again on the same series.
  * Fixed #3276 with HTML markup in element titles when a label is shortened by ellipsis.
  * Fixed #3088, tooltip blocking new mouse interaction after hiding when useHTML is true.
  * Fixed #3285, funnel and pyramid center option not working for vertical dimension.
  * Fixed #3300 where data labels would remain semi-transparent when chart updated in the middle of labels fading in.
  * Fixed #3295, labels do not render 0 as value
  * Fixed #3282, plotBorder width changed sign, causing a strange animation
  * Fixed #3245, waterfall series failed when first element was Sum or IntermediateSum

# 4.0.3 / 2014-07-03

* Updated Highcharts to 4.0.3
  * Added 3d options edgeColor and edgeWidth to distinguish from borders that have different defaults.
  * Added option, chart.panKey, to allow panning and zooming on the same chart. The chart can now be configured so the user can pan by holding down the shift key while dragging.
  * Added features zMin and zMax for bubble series, to set the Z value corresponding to minSize and maxSize independently from the data.
  * Changed default top position for loading label to 45%, which results in a vertically centered label.
  * Better handling of data label heights on pie charts, related to #2630.
  * Better handling of dynamic font sizes. Adjust tooltip text-wrapping. Apply dynamic font size (em) on line breaks. Fixed placement of title and axis labels when using ems for font size. Added support for em font-size in legend.itemStyle.
  * Fixed #2251, a regression since 3.0.8 causing text and graphic elements to become selected while zooming in old IE.
  * Fixed #3195 where a short axis with startOnTick and endOnTick set to false would display no ticks at all.
  * Fixed #2694 causing columns to overlap by one pixel in some cases when pointPadding is 0.
  * Fixed #2227, waterfall breaking with more than one intermediate sum.
  * Fixed #3163, pie chart data labels displaying outside plot area.
  * Fixed #1991, a regression causing area stacks with null or missing values to draw incorrectly.
  * Fixed #3158 causing wrong line wraps on text containing markup.
  * Fixed #3151, waterfall columns not displaying a border when the rendered height was 0.
  * Downloadbuilder missing metatags in SVG, added filterset, fixes #3106
  * Fixed #3072 causing unexpected borders after hover on column series when borderWidth was 0.
  * Fixed #3132 causing wrong line breaks in SVG text (pseudo HTML) containing markup.
  * Enabled mouse tracking on data labels for some series types where it had been mistakenly disabled.
  * Fixed #2697, JavaScript error in IE11 on destroying a chart containing useHTML elements after the chart container has first been emptied.
  * Fixed #3126, waterfall graph getting wider on hover. Introduced new options, lineWidthPlus, radiusPlus for hover state of graphs and markers.
  * Fixed #3116, halo failing to animate when a point was updated to a new position. Removed redundant pointer.reset call on Axis.redraw because Chart.redraw also calls the same method.
  * Fixed #3113, roundoff error throwing off calculations of extremes on log axis.
  * Fixed #3104, touch panning not being able to pan outside the data range even if the axis min and max options were outside the range.
  * Fixed #3098, plot area size of a pie chart not being recalculated after the legend size changed.
  * Fixed #3090 causing default 3d options not to be interpreted correctly.
  * Fixed #3094 causing series Z index to change after Series.update.
  * Fixed regression issue #3095, semi-transparent fills coming out as black in exports created by Batik.
  * Fixed #3082, positioning of 3d pie datalabels.
  * Fixed #3080 causing JS error on low chart due to negative height of the legend clip rectangle.
  * Fixed #3051 causing wrong Z indexes for slices in 3d pie charts.
  * Fixed #3075 causing touch panning on a categorized axis to alter range.
  * Fixed #3039, series options was not read for 3D.
  * Fixed #2893 causing heatmap point colors not to update after updating the color axis coloring.
  * Fixed #1080, loading text not reflowing to changed chart size.
  * Fixed #3056 with tooltip chevron not pointing exactly on the right point of the graph when animating between close positions.
  * Fixed #3044 causing JS errors in some cases when axis label formatter returned null or undefined. Closes #3050.
  * Fixed #3053 causing series to be cropped too tight on logarithmic X axis when the number of points exceeded the crop threshold.
  * Fixed #2240 causing the point mouse out event not to fire when the tooltip is shared.
  * Fixed #2997, solidgauge issue with points past ±360° or below yAxis.min.
  * Fixed #3028 causing the last series to become unlinked when calling Series.update on several linked series in succession.
  * Fixed #3027 causing truncation of axis labels when the axis title offset is set and the axis title is shorter than the labels.
  * Fixed #3023 causing defered data labels to show even if series was hidden in the meantime while animating.
  * Fixed #3003 causing rotated data labels to be misaligned after redraw when using Standalone Framework.
  * Fixed #3017 causing centering of data labels on inverted range series not to work.
  * Fixed #3007, with halo showing on invisible points in pies.
  * Fixed #3016 causing halo on sliced pie series to diplay incorrectly.
  * Fixed #3000, labels wrongly aligned on plot lines with multiple axes.
  * Fixed #3014 causing wrong tooltip position in waterfall charts in Highcharts 4.
  * Fixed #3006, prevent null and 0 points from rendering in 3D Pies.
  * Fixed #2982 by returning the added plot line or plot band object after Axis.addPlotLine or Axis.addPlotBand.
  * Fixed #2977, set mimimum view point distance for 3D.
  * Fixed #2975 with clipping not being updated on column series and derived series types after chart resize.
  * Fixed #2968, 3d columns not drawn correctly when equal to max.
  * Fixed #2963 where columns were badly drawn in Chrome due to a rendering bug.
  * Fixed #2962 causing data labels on gauges not to display unless defer is set to true.
  * Fixed #2954 that caused invalid SVG attributes on animating in and out grid lines when running older jQuery versions or the Standalone Framework.

# 4.0.1 / 2014-04-24

* Updated Highcharts to 4.0.1
  * Fixed #2945, a regression causing pie data label formatter to be ignored unless the format option is set to null.
  * Fixed #2941 causing columns to be Z-sorted in the wrong direction.
  * Fixed #2940 causing gradient colors not to apply on strokes in Highcharts 4.
  * Fixed #2939 causing wrong clipping of 3D charts rendered with highstock.js.
  * Fixed #2930 causing JS errors on gauges in Highcharts 4.0.
  * Fixed #2936 causing wrong Z index on 3D column.
  * Fixed #2928 causing the halo to be misplaced on multiple pane positions and inverted line charts.

# 4.0.0 / 2014-04-22

* Updated Highcharts to 4.0.0
  * See [the release announcement](http://www.highcharts.com/component/content/article/2-news/134-announcing-highcharts-4/)

# 3.0.10 / 2014-03-11

* Updated Highcharts to 3.0.10
  * Improved performance by 35% in our benchmark suite.
  * Added new option, plotOptions.gauge.overshoot, that takes a value in degrees for how much the dial should overshoot when the value is off the chart.
  * Added smarter logic to Series.setData, where instead of re-creating all the data points, existing points are updated. This allows animation, performs faster and is less prone to memory issues.
  * Added option, yAxis.reversedStacks, to choose whether to stack from the top down or from the bottom of the stack and up.
  * Added support for drilldown on multi-series column charts. Closes #2604.
  * Added 'pyramid' type of series
  * Added 'reversed' option to funnel series.
  * Fixed #2755 where attributes in pseudo-HTML were applied outside elements.
  * Fixed #2753 which caused errors and broken behaviour on drilldown containing null points.
  * Fixed #2770 where data labels on error bars were not displayed.
  * Fixed #2681 where the Pointer object leaked memory after Chart.destroy.
  * Fixed #2763 where series on log axes would disappear alltogether when the axis became too short.
  * Fixed #2760 where the ignoreHiddenSeries setting had no effect on bubble sizes.
  * Fixed issue with Chart.setTitle not causing the chart to redraw to adapt to changed size of the title. Closes #2719. Closes #2744.
  * Fixed #2738 where legend navigation would add one page too many when the last page had two items.
  * Fixed #2722 where pie slice data label connectors would have the wrong Z index after hiding and showing the slice.
  * Made chart.style option take effect on chart instances, not only globally. Closes #2723.
  * Fixed #2713 where series connected to a dynamically added X axis would fail.
  * Fixed issue with horizontal axis labels being clipped instead of justified into chart area. Closes #2703.
  * Fixed #2700 causing data labels to not render inside columns if the actual value of the column was cropped.
  * Fixed #2693 with drilling up from drilldown caused interference between charts.
  * Added sparkline demo
  * Fixed memory leaks in IE11 due to implementation of touch support. Closes #2691.
  * Export server: Fixed jar location lookup on Windows, closes #2869
  * Fixed issue with disappearing bar chart data labels in certain chart widths. Closes #2683.
  * Fixed issue with showLoading not displaying in IE9. Closes #2686.
  * Fixed issue with Axis.update not removing all associated series. Closes #2687.
  * Fixed failure in updating stacking from percent to normal. Closes #2682.
  * Fixed issue with misalignment of rotated axis labels with useHTML in IE11. Closes #2684.
  * Fixed issue with wrapping horizontal legends not taking the x option into account. Closes #2680.
  * Fixed issue with JS errors on hovering chart when running IE11 in combination with the Standalone Framework. Closes #2672.
  * Fixed issue with wrong rotation of polar charts when X axis was reversed. Closes #2570.
  * Fixed issue with tooltip position and hover point on polar chart where startAngle was < 0. Closes #2665.
  * Fixed issue with empty tooltip boxes visible in tall pages in IE10.
  * Fixed issue with showLoading not working in Standalone Framework. Closes #2653.
  * Fixed issues with pie slices and data labels remaining visible after hiding the pie series itself. Closes #2315. Closes #2656.
  * Fixed issue with automatic line height on labels with em font sizes. Closes #2651.
  * Fixed issue in 3.0.9 where wrong vertical axis labels would be skipped when they were of varying height. Closes #2642.
  * Provided reasonable default column width and group width for column charts with only one X value when minRange was set. Closes #2610.
  * Fixed issue with too many pages in the legend when using legend navigation. Closes #2617.
  * Fixed unexpected effects of zooming outside the data range. Closes #1734.
  * Fixed issue with line graphs not being vertically centered when there was only one value which exceeded the upper limit of 44bit values. Closes #2619.
  * Worked around Firefox 26 drawing issue where legend items would not redraw after resizing the chart. Closes #2580.
  * Fixed issue with mispositioned data label on single pie slice with certain pie sizes, caused by JavaScript rounding error. Closes #2650.
  * Fixed issue with text bounding boxes not being correctly computed when the chart was added to a container with display:none !important. Closes #2631.
  * Fixed issue with gauge pane background color not taking effect on multiple panes, or respecting changes. Closes #2257. Closes #2649.
  * Fixed error in Standalone Framework where calling destroy on an animating element would result in endless error messages. Caused errors when a chart was destroyed while fading out the tooltip. Closes #2616.
  * Fixed pie chart issue with messed up data labels with certain combinations of start and end angle. Closes #2645.
  * Fixed issue with pies ignoring endAngle when it was set to 0.
  * Performance improvement for updating tick labels. Closes #2640.
  * Fixed issue with tooltip header not displaying relevant time resolution when points where added at minute or hour resolution with a day between them. Closes #2637.
  * Fixed issue with wrong bounding box detection of numeric texts when they were of number type instead of strings. Closes #2316.
  * Fixed issue with JS errors and failing to activate charts in pages that are saved to disk from the browser. Closes #2609.
  * Fixed issue with followPointer not working correctly for line charts.
  * Fixed issue with numerical legend items crashing chart when navigation was enabled. Removed unsafe internal use of elemWrapper.bBox, used elemWrapper.getBBox() instead. Closes #2605.
  * Fixed regression with pie slice hover color becoming increasingly brightened after repeated redraws. Closes #1619.
  * Fixed issue with positioning of markers in oldIE in inverted charts. Closes #1111.
  * Fixed oldIE issue with box plots and error bars not showing in inverted charts. Closed #1680. Closed #1806.
  * Fixed missing stack percentage in normal stacks. Closes #2551.
  * Fixed issue in Standalone Framework with getting the right mouse position inside a scrollable div. Closes #2205.
  * Fixed JS error on hovering over a chart after running Chart.setData without redrawing. Closes #2594.
  * Fixed issue with tooltip position if data is NaN.

# 3.0.9 / 2014-01-15

* Updated Highcharts to 3.0.9
  * Added bower.json file. Closes #2244.
  * Fixed JS error on quickly moving the mouse out of a chart. Related to #2499.
  * Fixed issue with text positioning in modern IE when CSS line height was much smaller than font size. Closes #2444. Closes #2568. Closes #2569. Affects #2591.
  * Fixed issue with crosshairs not exactly following the tooltip, mostly visible ou touch devices. Closes #2582
  * Fixed issue with categorized Y axis on gauges being positioned wrong. Closes #2593.
  * Reverted optimization that skipped individual handling of point attributes. Closes #2549. Closes #2587.
  * Fixed issue with adding a point in the middle of a line series failing. Issue #1109.
  * Fixed regression with datetime tooltip header format falling back to full years. Closes #2581.
  * Fixed rounding error in stack labels. Closes #2576.
  * Implemented new option, switchRowsAndColumns, in the data module.
  * Fixed regression in 3.0.8 with hover color of columns having individual color option. Closes #2579.
  * Fixed issue with fillColor on box plots not honored when colorByPoint is true. Closes #2574.

# 3.0.8 / 2014-01-09

* Updated Highcharts to 3.0.8

# 3.0.7 / 2013-10-24

* Updated Highcharts to 3.0.7

# 3.0.6 / 2013-10-04

* Updated Highcharts to 3.0.6

# 3.0.5 / 2013-08-27

* Updated Highcharts to 3.0.5

# 3.0.3 / 2013-08-01

* Updated Highcharts to 3.0.3

# 3.0.2 / 2013-06-07

* Updated Highcharts to 3.0.2
* Removed the Rack endpoint
  (https://github.com/PerfectlyNormal/highcharts-rails/issues/9)

# 3.0.1.5 / 2013-05-08

* Add a Rack endpoint for exporting charts to image files

# 3.0.1 / 2013-04-09

* Updated Highcharts to 3.0.1
* Moved assets from vendor/assets to app/assets, since the entire point of the
  gem is to deliver those assets.

# 3.0.0 / 2013-03-25

* Updated Highcharts to 3.0.0

# 2.3.5 / 2013-01-16

* Updated Highcharts to 2.3.5

# 2.3.3.1 / 2012-12-14

* Relaxed railties dependency to prepare for Rails 4

# 2.3.3 / 2012-10-04

* Updated Highcharts to 2.3.3

# 2.3.2 / 2012-08-31

* Updated Highcharts to 2.3.2

# 2.3.0 / 2012-08-27

* Updated Highcharts to 2.3.0

# 2.2.4 / 2012-05-31

* Updated Highcharts to 2.2.4

# 2.2.3 / 2012-05-07

* Updated Highcharts to 2.2.3

# 2.2.2 / 2012-04-26

* Updated Highcharts to 2.2.2
* Relaxed development dependency on Bundler from ~> 1.0.0 to ~> 1.0

# 2.2.1 / 2012-04-15

* Updated Highcharts to 2.2.1
* Added the skies theme (graphic hardcoded to `/assets/highcharts/skies.jpg`)
