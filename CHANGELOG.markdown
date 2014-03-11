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
