# 6.0.3 / 2017-11-14

* Updated Highcharts to 6.0.3 (2017-11-14)
  * Added new option, dataLabels.filter, for a declarative way of filtering data labels without using the formatter.
  * Bug fixes
    * Fixed #1841, bad animation when adding points in area ranges.
    * Fixed #4994, improved documentation on loading Highcharts in ES6.
    * Fixed #6183, small tick interval caused ticks to be merged to one.
    * Fixed #6895, zoomed heat map wastn't clipped properly in boost mode.
    * Fixed #6907, no focus indicator on some browsers.
    * Fixed #7300, font-size in wordcloud was not set as pixels, causing Firefox to render all words equal size.
    * Fixed #7311, minPointLength wasn't correct for some cases.
    * Fixed #7315, marker was listed as a column series option.
    * Fixed #7315, removed wrong docs for series.column.marker and for shadow in hover and select states in column.states.
    * Fixed #7316, null text with useHTML was throwing an error on getBBox().
    * Fixed #7320, a regression causing responsive options for axes and series not being unset.
    * Fixed #7326, setData with equal data length caused badly drawn stacked area series with null points.
    * Fixed #7332, X-range data labels were not hidden for off-screen elements.
    * Fixed #7339, removed doubled axis ticks in case of too dense ticks.
    * Fixed #7342, improved documentation for xAxis.
    * Fixed #7351, dynamically added checkboxes didn't respect scrolling after update.
    * Fixed #7357, a chart without a title threw an error when trying to export data.
    * Fixed #7369, scatter chart with series containing points with null and negative X didn't render.
    * Fixed #7371, sunburst chart failed in styled mode.
    * Fixed #7377, approximation averages wasn't returning undefined values as it should.
    * Fixed issue with date parsing error appearing when not necessary.
    * Fixed issue with markup passing unfiltered into aria-label attributes, causing invalid SVG.
    * Fixed jsdoc plugin. Load highcharts assembler from npm.
    * Fixed keyboard navigation for maps and heatmaps.
    * Fixed navigator update issue. See #5846.

# 6.0.2 / 2017-11-10

* Update Highcharts to 6.0.2 (2017-10-20)
  * Added nodeFormatter property to data labels and tooltips in the sankey diagram. Closes #7284.
  * Added center algorithm, square and rectangular spirals to Wordcloud. See #7241.
  * Bug fixes
    * Fixed #7272, regression with columnStart in data module.
    * Fixed #6103, reset zoom button not playing well with drill up button.
    * Fixed #7224, legend item text not positioned properly when useHTML is enabled. Closes #7254.
    * Fixed #7238, useHTML didn't have an effect with split tooltip.
    * Fixed #7243, updating pie series point color didn't update connector color.
    * Fixed #7260, a regression causing the legend box not being resized when dynamically adding and removing series.
    * Fixed #7264, wordcloud did not support the no-data-to-display module.
    * Fixed #7265, a regression with causing data.endRow to be offset by one.
    * Fixed #7280, a regression causing mispositioned HTML data labels on pie charts.

# 6.0.1 / 2017-11-10

* Update Highcharts to 6.0.1 (2017-10-05)
  * Bug fixes
    * Fixed #7223, regression in v6 causing stock charts and certain features to crash in IE.
    * Fixed #7228, regression in v6 causing columns with only negative values not to render.

# 6.0.0 / 2017-11-10

* Updated Highcharts to 6.0.0 (2017-10-04)
  * Added Annotations module for annotating a chart with labels or shapes.
  * Added the Boost module for WebGL rendering of millions of points.
  * Added the Series labels module for organic positioning of labels next to the data.
  * Decoupled old IE code into a separate module.
  * Added new series type, bell curve.
  * Added new series type, bullet chart.
  * Added new series type, histogram.
  * Added new chart layout, parallel coordinates chart.
  * Added new series type, pareto chart.
  * Added new series type, sankey chart.
  * Added new series type, 3D scatter chart.
  * Added new series type, stream graph.
  * Added new series type, sunburst.
  * Added new series type, variable pie.
  * Added new series type, variwide.
  * Added new series type, vector plot.
  * Added new series type, wind barbs.
  * Added new series type, word cloud.
  * Added new series type, X range.
  * Improved CSV parser of the data module.
  * Bug fixes
    * Fixed #5909, plotband border on top was missing.
    * Fixed #6005, selected pie slice had wrong color in styled mode.
    * Fixed #6261, a regression causing charts to draw at small heights if container size was small.
    * Fixed #6268, Chart.update() did not update parameters of the data module.
    * Fixed #6302, chart was not rendered when xAxis.max and rangeselector.selected were defined
    * Fixed #6648, the redraw parameter in Series.setVisible was not respected when Boost module was loaded.
    * Fixed #6679, a regression causing drilldown not to fire the second time in certain cases.
    * Fixed #6957, when tooltip.useHTML was true on a map and other series types, the shape would flicker and tooltip hide in IE and Edge.
    * Fixed #6992, error in data label positioning with really small pies.
    * Fixed #7012, series group was wrongly translated when 3d columns were added to graph.
    * Fixed #7021, cleared duplicated marker reference.
    * Fixed #7024, regression causing charts not to show when preliminary rendering within a child of a detached node.
    * Fixed #7025, treemap with color axis didn't work in styled mode.
    * Fixed #7030, added highcharts.scss to distribution.
    * Fixed #7031, could not set up Highcharts with a custom window object.
    * Fixed #7034, color tweening from a named (unrecognized) color to a hex color failed.
    * Fixed #7046, a zero value point using minPointLength was always shown as a positive value point.
    * Fixed #7061, line was missing after zooming between points.
    * Fixed #7080, JS error on adding rotated data labels with shadow applied.
    * Fixed #7084, high or non-ASCII characters in CSV file were not exported correctly in IE.
    * Fixed #7088, series didn't hide dynamically in Boost mode.
    * Fixed #7090, offline generated PDF showed hidden series.
    * Fixed #7112, pie chart data labels were visible for negative values.
    * Fixed #7113, updating a pie chart to all negative values didn't clear the slices.
    * Fixed #7115, version format not validated by yarn.
    * Fixed #7117, plot line label had wrong position in polar charts with circular grid lines.
    * Fixed #7126, less than sign followed by a space was interpreted as markup.
    * Fixed #7127, exception in Pointer when updating a series from its own mouseOver event handler.
    * Fixed #7128, data export with combined scatter and column series inserted too many rows.
    * Fixed #7160, treemap should not display halo on hover.
    * Fixed #7175, NaN in text position of plot band label after toggling series visibility.
    * Fixed #7180, disabling tooltip caused event flooding.
    * Fixed #7188, null points creates issues for shared tooltip, when there is more than one point with same x value.
    * Fixed #7193, fixed #7159, hoverPoints in boost mode was not usable for Tooltip.
    * Fixed #7028, axis label width style wasn't respected if there was enough space to render wider labels.

# 5.0.14 / 2017-11-10

* Updated Highcharts to 5.0.14 (2017-07-28)
  * Bug fixes
    * Fixed #7014, a regression causing JS error when writing a new chart to a node that was originally detached.
    * Fixed JS error on inverted, bosted charts.

# 5.0.13 / 2017-11-10

* Updated Highcharts to 5.0.13 (2017-07-27)
  * Added pos, axis position, to axis label formats. Closes #6859.
  * Added accessibility.keyboardNavigation.tabThroughPoints option, ref #6886.
  * Added legend.keyboardNavigation.enabled option, ref #6838.
  * Added color animation on state change for non-marker based series like columns and tree maps.
  * Added feature to line-wrap long axis titles by default. Fixed #6893, causing multiline axis titles to overlap axis labels.
  * Added new option, exporting.menuItemDefinitions, and allow string keys to be used in the menuItems instead of redefining full objects.
  * Added new option, yAxis.stackLabels.allowOverlap, to prevent stack labels from overlapping. Closes #6876.
  * Added new parameter oneToOne to the chart.update function. This allows for easier integration of Highcharts into dashboard solutions and wrapper APIs.
  * Added markers to arearange and areapsplinerange series. Closed #6736.
  * Removed error message 27 because of conflict when using highcharts-more with maps module. See #6686.
  * Bug fixes
    * Fixes #6981, wrong layout on inverted heatmaps.
    * Fixed #3946, stackLabels were not working in 3D column chart.
    * Fixed #4853, legend's border wasn't respecting checkboxes.
    * Fixed #5783, the chart width and text bounding boxes were not picked up when the chart was rendered to an element that was detached from the DOM.
    * Fixed #6115, returning an array from tooltip formatter with false value didn't hide split tooltip item.
    * Fixed #6342, class names were not updated on HTML elements.
    * Fixed #6418, HTML data labels and refreshing and deleting caused JavaScript exceptions.
    * Fixed #6616, the border was drawn in a full circle pie slice.
    * Fixed #6695, cursor pointer was missing on drilldown line charts.
    * Fixed #6708, 0 value bars were incorrectly drawn in 3D chart.
    * Fixed #6740, tooltip not hidden when tabbing out of chart.
    * Fixed #6746, events for legacy IE (6-8) didn't have unique keys.
    * Fixed #6747, crosshairs in column charts caused flickering on mouse move in IE and Edge.
    * Fixed #6752, activeDataLabelStyle used to override dataLabel's styles set on a point.
    * Fixed #6760, tooltip.enabled: false did not respond to responsive configuration.
    * Fixed #6761, scatter series data was not correctly exported in the export-data module.
    * Fixed #6763, treemap was missing directTouch property, causing color axis marker to disappear.
    * Fixed #6764, fixed #6791, fixed #6808, addition #6687. Series with noSharedTooltip was unaccessible when tooltip was shared.
    * Fixed #6769, hidden series legend had invalid stroke-width attribute.
    * Fixed #6773, updating xAxis.range didn't change extremes.
    * Fixed #6774, exponential numbers were not correctly handled by number formatter.
    * Fixed #6776, color animation was not working correctly for flags and 3D columns.
    * Fixed #6778, new ellipsis functionality did not account for rotation.
    * Fixed #6781, dataLabels were misaligned on inverted chart when configured xAxis.height.
    * Fixed #6784, 3D draggable scatter demo didn't work on touch devices.
    * Fixed #6792, updating point.marker.symbol to null didn't restore default point's marker.
    * Fixed #6803, charts inside display:none divs became visible in Edge and IE.
    * Fixed #6804, not able to touch-scroll the page on chart with zoom.
    * Fixed #6831, tooltip border color was ignored by split option.
    * Fixed #6835, columnrange disappeared when zooming too far in.
    * Fixed #6838, consider hidden series in keyboard navigation.
    * Fixed #6841, the dataLabels.crop option had no effect on pie charts.
    * Fixed #6860, crosshairs on multiple axis was drawn on wrong position.
    * Fixed #6879, shadow was not applied for split toolip.
    * Fixed #6888, legend.update caused color axis to disappear in heat maps.
    * Fixed #6897, prevented axis extremes change in case of a single point if multiple ticks are set.
    * Fixed #6898, 3d pie chart had wrong color for sides in styled mode.
    * Fixed #6900, column border radius was not respected in styled mode.
    * Fixed #6912, responsive rules affecting series killed animation and data labels.
    * Fixed #6956, improved colors and treemap for IE8.
    * Fixed #6968, chart height didn't reflow when chart.width was set.
    * Fixed #6970, flags were not filled in styled mode.
    * Fixed #6971, rounding errors caused flickering of solid gauge backgrounds in semi circles.
    * Fixed #6988, dataClass.color should be ignored in styled mode.

# 5.0.12 / 2017-11-10

* Updated Highcharts to 5.0.12 (2017-05-24)
  * Added core support for color animation.
  * Added error message on trying to define the same series type twice. Fixes #6686.
  * Let Series.update fall back to the optimized Series.setData if only the data is updated.
  * Bug fixes
    * Fixed #223, pie chart data labels were not truncated to chart area when pie size was explicitly set.
    * Fixed #3160, let the xAxis.offset option modify the clip area to avoid clipping line graphs.
    * Fixed #4588, loading and "no data" labels overlapped.
    * Fixed #4921, ignoreHiddenSeries caused wrong column position and width after hiding and showing all series.
    * Fixed #6307, offline export issues with styled mode in IE and Edge.
    * Fixed #6517, regression with shared tooltip and columns. Tooltip not following mouse move.
    * Fixed #6659, long series name in legend broke the geometry of the chart. Added textOverflow and max width to default itemStyle.
    * Fixed #6659, long series names made tooltip overflow the chart.
    * Fixed #6664, no-data label remained in heat maps after adding points.
    * Fixed #6670, visible: false didn't work correctly on funnel chart points.
    * Fixed #6687, wrong hover points with columns and shared tooltip.
    * Fixed #6700, axis label font size wrongly detected in styled mode.
    * Fixed #6704, series names were not grouped for two series after drilldown.
    * Fixed #6705, bubble chart click events and point select was broken.
    * Fixed #6706, crash with heatmap and boost-canvas.
    * Fixed #6721, area range fill was broken with null values and connectNulls: true.
    * Fixed #6731, category axis allowed zooming outside range.
    * Fixed AT announcing clickable for some a11y demos.
    * Fixed Firefox issue with styled export, ref #6307.
    * Fixed bug with inserting multiple data tables in export-data.
    * Fixed issue where chart container height was not respected when initially hidden. See #6693.
    * Fixed issue with data labels not appearing on exported charts in styled mode.
    * Fixed issue with missing gridLines in 3D.
    * Fixed issue with mouseOver event in column chart with shared tooltip.

# 5.0.11 / 2017-11-10

* Updated Highcharts to 5.0.11 (2017-05-04)
  * Added export-data as an experimental module in the main repo.
  * Bug fixes
    * Fixed #1174, added dataLabels distance option for single pie point.
    * Fixed #4743, updating 3D columns with z stacking failed.
    * Fixed #5045, line series should be broken on axis breaks. Moved gapSize logic to the broken-axis module.
    * Fixed #5297, 3D columns were overlapping.
    * Fixed #5424, crosshairs overlapping when there is multiple axis with equal positions.
    * Fixed #5863, panning didn't allow panning back to the extreme data values.
    * Fixed #5911, inverted waterfall was rendered incorrectly.
    * Fixed #6046, copy classes by reference in stead of a hard copy in merge.
    * Fixed #6218, some tooltip options were not updated through chart.update().
    * Fixed #6296, regression causing bubbles not to be clipped.
    * Fixed #6350, solid gauge series did not have CSS point class.
    * Fixed #6420, when multiple axes, show only one snapping crosshair at the same time.
    * Fixed #6440, callout anchor was mispositioned in an inverted chart.
    * Fixed #6441, callout animated to wrong position on point update.
    * Fixed #6488, destroying colorAxis caused error and left legend.
    * Fixed #6527, point.color of negative column was less important than series.negativeColor.
    * Fixed #6549, Y-values of 0 caused the point to be skipped in boost mode.
    * Fixed #6550, a regression causing sprites in meteogram sample not being clipped after animation, resulting in weather symbols all over.
    * Fixed #6563, a regression causing flat integer data to draw on the X axis when allowDecimals was false.
    * Fixed #6566, zAxis wasn't updated through chart.update().
    * Fixed #6569, chart.exportChart() left undefined item in the Highcharts.charts array.
    * Fixed #6574, subtitle was rendered outside the chart when setting subtitle.verticalAlign to 'bottom'.
    * Fixed #6580, blending in boost caused barely visible markers in scatter charts.
    * Fixed #6585, zero-value column's dataLabel was misplaced when using logarithmic yAxis.
    * Fixed #6586, directTouch did not work with shared tooltip.
    * Fixed #6589, pie chart didn't accept undefined values.
    * Fixed #6597, PointerEvent was used unnecessarily, causing bad behaviour on Android.
    * Fixed #6606, no legend keyboard navigation when heatmap module loaded.
    * Fixed #6608, small maxHeight didn't hide all legend items.
    * Fixed #6609, entities in the legend title were not translated.
    * Fixed #6617, rendering a chart in a hidden container with box-sizing. Rewrote the functionality to avoid rendering in a hidden div, so that instead of cloning the div we make the current div temporary visible.
    * Fixed #6627, marker symbol wasn't checked properly.
    * Fixed #6636, a regression causing missing ticks with negative timezone offset.
    * Fixed #6637, null point broke chart.
    * Fixed #6639, accessibility issues with new export-csv versions.
    * Fixed #6641, pane axis caused the error in defualt charts.
    * Fixed #6646, item title was not wrapped in styled item.
    * Fixed #6650, boost module failed with styled mode and heatmap.
    * Fixed #6653, exporting error with IE8.
    * Fixed #6660, changing colorIndex did not update all series styles.
    * Fixed issue in tooltip-outside-box study with narrow windows. Touch #6658.
    * Fixed merge problems with #6576.

# 5.0.10 / 2017-11-10

* Updated Highcharts to 5.0.10 (2017-03-31)
  * Added !default statement to SASS variables for easier configuration. Closes #6436.
  * Added new option, plotOptions.column.crisp, to allow disabling crisp columns and subsequent rendering issues with densely packed items. Closes #5755.
  * Added new option, findNearestPointBy to declare how the tooltip searches for points. #6231.
  * Refactored the Pane object to keep track of its own backgrounds, more decoupled from Axis.
  * Bug fixes
    * Fixed #3481, title and subtitle were not resizing chart correctly when using useHTML on true.
    * Fixed #3936, colorAxis was not updated through chart.update.
    * Fixed #4964, missing plotband when small range.
    * Fixed #6007, exporting after chart.update() threw errors.
    * Fixed #6144, empty categories caused wrong render of tooltip.
    * Fixed #6191, dead clip path references.
    * Fixed #6203, yAxis extremes were wrong calculated for visible scatter points
    * Fixed #6258, text labels with ellipsis had inconsistent behavior.
    * Fixed #6279, error when hiding series of line polar using data module.
    * Fixed #6359, softMin/softMax didn't work in combination with floor/ceiling.
    * Fixed #6430, areasplinerange polar curve path was wrongly rendered.
    * Fixed #6431, addition to #6476, stickyTracking should default to true when there is a shared tooltip.
    * Fixed #6433, updating Axis with plotBands rendered redundant nodes.
    * Fixed #6437, 3D pie chart disappeared when drilling down after resize.
    * Fixed #6444, exporting the second time failed with axis extremes.
    * Fixed #6449, series with noSharedTooltip was inaccessible with shared tooltip.
    * Fixed #6452, chart.update was not redrawing axes when setting alignTicks to false.
    * Fixed #6456, tooltip didn't show on hovering outside candlestick and OHLC series.
    * Fixed #6458, named color deduction was case sensitive.
    * Fixed #6459, colors of boxplot series points would not update.
    * Fixed #6463, missing closing sign in RegEx caused wrong handling of pseudo attributes.
    * Fixed #6465, first data label in polar charts was not visible.
    * Fixed #6469, series got lost when mixing category data in a dual axis chart.
    * Fixed #6470, exporting failed in IE8 when data labels were enabled.
    * Fixed #6473, wrong text wrapping with textOutline: none.
    * Fixed #6474, custom CSS property was injected into the DOM. Added to blacklist.
    * Fixed #6474, text outlines were not properly cleaned up on resizing.
    * Fixed #6476, shared tooltip with disabled stickyTracking did not work.
    * Fixed #6477, regression on crosshairs with snap in a bubble chart.
    * Fixed #6479, responsive rules didn't apply to panes.
    * Fixed #6481, offline export of pie charts to PDF not working in Firefox and Safari.
    * Fixed #6487, contrast color was not applied for a justified label on a column.
    * Fixed #6497, horizontal legend layout didn't respect spacing setting.
    * Fixed #6499, offline export fails with allowHTML despite no HTML in chart.
    * Fixed #6502, missing chart series and axis in combined logarithmic chart.
    * Fixed #6518, wrong marker positions when hovering after redrawing in boost module.
    * Fixed #6519, empty space caused overlapping in legend.
    * Fixed #6521, missing label for narrow plot band.
    * * Fixed #6089, chart.update not taking effect on panes. Also closes #6438.

# 5.0.9 / 2017-11-10

* Updated Highcharts to 5.0.9 (2017-03-08)
  * Worked around a Closure Compiler error that made 3D charts fail.

# 5.0.8 / 2017-11-10

* Updated Highcharts to 5.0.8 (2017-03-08)
  * Added a refactored Boost module based on WebGL. Details and API to be announced.
  * Added animation on graph mouse over and mouse out.
  * Added hooks so that users can define their own log axis conversion functions, and can advertise that the log axis should allow negative values.
  * Added new option, solidgauge.rounded.
  * Added support for relative chart.height as a percentage of the width. This allows for fixed aspect ratio.
  * Bug fixes
    * Fixed #223, pie chart data labels overflowed after pie reached minimum size.
    * Fixed #2322, updating series type caused remnants of the original series type after multiple updates.
    * Fixed #4916, data values were lost in export after updating a point from a numeric or array configuration to an object configuration.
    * Fixed #5915, returning false from tooltip formatter only hid the tooltip when it was present from before.
    * Fixed #6087, minPointLength shifted next points rendering.
    * Fixed #6173, another case of unwanted inline CSS in style mode.
    * Fixed #6187, navigator jumped back after dragging on touch devices.
    * Fixed #6254, Point.update did not apply new class names.
    * Fixed #6264, enabling individual bubble markers did not work.
    * Fixed #6272, inverted stack area chart was badly drawn when containing nulls.
    * Fixed #6274, allowDecimals: false was ignored with flat data.
    * Fixed #6278, missing ticks before DST crossover in some cases.
    * Fixed #6282, text-align did not take effect on data labels with useHTML.
    * Fixed #6291, multiple responsive rules were applied an unapplied in wrong order when resizing.
    * Fixed #6301, legend width option caused wrong alignment when aligned right.
    * Fixed #6305, accessible keyboard navigation in polar charts not working correctly.
    * Fixed #6314, treemap series failed with error in styled mode.
    * Fixed #6321, bubbles were hidden when close and marker.enabled set to null.
    * Fixed #6322, legend navigation arrows did not update correctly on responsiveness.
    * Fixed #6328, issue with disabled tooltip in accessibility module.
    * Fixed #6330, minor ticks affecting the computed extremes of Y axes in some cases.
    * Fixed #6330, minor ticks were not applied outside major ticks on a logarithmic axis.
    * Fixed #6347, error on applying responsive rules where series or axis length was greater than the existing chart.
    * Fixed #6356, legend.maxHeight not respected after chart update.
    * Fixed #6361, accessibility failing for IE8 and older.
    * Fixed #6370, category axis with breaks was rendered incorrectly.
    * Fixed #6384, Point.update didn't work with slice: false.
    * Fixed #6387, graph and area rendered differently on area splines next to null points.
    * Fixed #6399, treemap legend item had incorrect color after point was hidden.
    * Fixed #6401, point.states didn't work for maps.
    * Fixed #6402, treemap ignoreHiddenPoint is now true by default.

# 5.0.7 / 2017-01-25

* Updated Highcharts to 5.0.7 (2017-01-17)
  * Added Legend keyboard navigation to accessibility module.
  * Added chart render and predraw events needed by the new Boost module.
  * Added new option, global.timezone, as a convenient shortcut to timezones defined with moment.js.
  * Added optional redraw to drillToNode, related to #6180.
  * Added support for marker.symbol setting on bubble charts.
  * Changed the Highcharts.addEvent function to return a callback to be used to remove the same event.
  * Changed the Highcharts.error function to handle strings.
  * Bug fixes
    * Fixed compliance with Checkmarx security checker.
    * Fixed #6108, issue with big data in offline exporting.
    * Fixed #5672, X values in tooltip in Boost module was wrong.
    * Fixed #5553, disabled trackByArea did not hide tooltip, when moving mouse out of the area shape.
    * Fixed #5757, empty chart throws error with accessibility module.
    * Fixed #5766, halo was not rendered for shared tooltip when density of points was high.
    * Fixed #5818, render halo in a series group, not under all of the groups.
    * Fixed #5819, crosshair width can now be set on category axes also.
    * Fixed #5833, split tooltip tried to remove series tooltip again after destruction.
    * Fixed #5835, exported SVG didn't validate, width and height attributes were set on group elements.
    * Fixed #5837, could not style null points with CSS.
    * Fixed #5855, split tooltip was not destroyed properly.
    * Fixed #5862, wrong hover point, when tooltip was shared.
    * Fixed #5866, treemap point.isNull was always true.
    * Fixed #5868, dataLabels.softConnector was always set to true.
    * Fixed #5873, bubbles were hidden in small charts when maxSize was percentage.
    * Fixed #5884, optimizing addSeries.
    * Fixed #6085, floating point errors on Y axis labels.
    * Fixed #6088, rounding issue in tooltips.
    * Fixed #6107, error with negative width in xrange study.
    * Fixed #6112, issue and regression with swapping series indexes.
    * Fixed #6113, long legend items were unresponsive due to heavy HTML parsing in SVG. Implemented caching.
    * Fixed #6127, pie chart data label overlapped after drill up.
    * Fixed #6128, tooltip caret was not drawn after updating from shared to non-shared.
    * Fixed #6130, Chart.update didn't trigger responsive rules to be re-evaluated.
    * Fixed #6138, reset colorCounter and symbolCounter when all series are removed.
    * Fixed #6147, error in Chart.get when called between redraws.
    * Fixed #6157, offline exporting was not working for Edge.
    * Fixed #6158, duplicate ID of navigator series.
    * Fixed #6171, drawDataLabels did not use updated options when data label already existed.
    * Fixed #6173, no inline CSS should be allowed in styled mode.
    * Fixed #6180, treemap crashed when the root node did not exist.
    * Fixed #6184, polar arearange was misshaped when connectEnds was not set.
    * Fixed #6196, dead clip path references.
    * Fixed #6200, modified treemap setPointValues to only add crisping correction when needed.
    * Fixed #6202, legend icons overflowed legend with large radius.
    * Fixed #6207, when point X was given, point names did not show on category axis after hiding and showing series.
    * Fixed #6208, error on responsive rules for plotOptions.series and series.xAxis.
    * Fixed #6213, wrong text bounding box reported in Chrome for Windows, resulting in asymmetric label padding.
    * Fixed #6217, container sizes below 20px height needed explicit chart height to be set.
    * Fixed issue in offline exporting where libURL option was not picked up.
    * Fixed issue with duplicate highcharts-negative class. Ref #6114.

# 5.0.6 / 2017-01-25

* Updated Highcharts to 5.0.6 (2016-12-07)
  * Added a common hook, Highcharts.error, for user defined error handling.
  * Bug fixes
    * Fixed #4175, missed ticks when xAxis.reversed was used
    * Fixed #4507, 3D scatter points were not rendered if z-value was not set.
    * Fixed #5950, broken axis module caused errors when rendering funnel series.
    * Fixed #6003, regression with pie chart selection border width.
    * Fixed #6016, zones weren't applied for point elements in styled mode.
    * Fixed #6018, 3D column not rendered in styled mode.
    * Fixed #6020, stacked waterfall didn't render any points.
    * Fixed #6021, chart.alignTicks on logarithmic axis should not be applied.
    * Fixed #6045, multiple charts exporting demos failed with other width/height settings.
    * Fixed #6054, regression which disabled selecting bubble points.
    * Fixed #6055, halo sometimes animated to another point when hiding.
    * Fixed #6062, minPointLength was applied for null points in a waterfall series.
    * Fixed #6065, text outline was off with multiline text.
    * Fixed #6067, bubble halo stayed forever per series.
    * Fixed #6068, JS error on destroying chart from its own callback.
    * Fixed #6077, legend title disappeared after legend update.
    * Fixed #6080, stray data labels for empty points in column and bar series.
    * Fixed #6094, a regression causing allowPointSelect not to work with 3D pies.
    * Fixed JS errors on path animations in pies. Related to #6051.
    * Fixed border issue on hovered points in map and heatmap. Related to #6064.
    * Fixed issue with split tooltip anchors and panes.


# 5.0.5 / 2017-01-25

* Updated Highcharts to 5.0.5 (2016-11-29)
  * Fixed #5997, panning not working with reversed axes. Also closes #3278.
  * Fixed #3398, click event for dataLabels when useHTML was set to true didn't work.
  * Fixed #4338, incorrect minPointLength for negative values in waterfall series.
  * Fixed #5860, bubble series in styled mode caused errors.
  * Fixed #5892, errors in console on animating in splines as they are added.
  * Fixed #5947, HTML dataLabels didn't show tooltip on mouseover.
  * Fixed #6014, issue with zooming out of bounds.
  * Fixed #6033, threshold ignored when chart.reflow was used.
  * Fixed issue with build settings of Highcharts themes, and added a minimum of test.
  * Fixed regression related to animation, where the complete step was not executed. This specifically affected drilldown, solid gauge and color axis updates. Closes #6017, 6032, #6023.
  * Fixed wrong product name in license headers.


# 5.0.4 / 2017-01-25

* Updated Highcharts to 5.0.4 (2016-11-22)
  * Refactored animation and attr logic to always stop the single property being set. This prevents an animation from continuing after the same property has been set either through .attr or .animate.
  * Bug fixes
    * Fixed #5788, artifacts when animating splines before previous animation was done.
    * Fixed #5982, additional series options were not set in exporting.
    * Fixed #5985, issue with allowHTML in offline exporting.
    * Fixed #5989, tooltip did not hide on touch.
    * Fixed #6008, regression causing rotated data labels to break chart in Firefox.

# 5.0.3 / 2017-01-25

* Updated Highcharts to 5.0.3 (2016-11-18)
  * Added new option, lang.numericSymbolMagnitude, to support numeric symbol shortening in Japanese, Korean and certain Chinese locales.
  * Added new option, threshold, for solid gauge series.
  * Added new CSS custom property, textOutline, and at the same time removed the textShadow shim. Closes #5849.
  * Better implementation of the chart.pinchType option. Allow pinchType and zoomType to be set independently. When tooltip.followTouchMove is true, pinchType only applies to two-finger touches. Closes #5840.
  * Changed the Highcharts.addEvent function to return a callback to be used to remove the same event.
  * Implemented bubbles in the Boost module.
  * Improved alignment of ticks on multiple axes by allowing ticks to be placed at less strict intervals.
  * Refactored split tooltip connectors to use common callback shape instead.
  * Bug fixes
    * Fixed #3802, yAxis.opposite ignored when setOptions was used.
    * Fixed #3949, added zIndex calculation for scatter in 3D chart.
    * Fixed #5838, split tooltip ignored style options.
    * Fixed #5859, tooltip display problems in styled mode.
    * Fixed #5868, dataLabels.softConnector was always set to true.
    * Fixed #5873, bubbles hidden in small charts when maxSize is percentage.
    * Fixed #5873, bubbles hidden in small charts when maxSize is percentage.
    * Fixed #5889, pointPlacement did not respect individual series pointRange.
    * Fixed #5895, Axis.update failed with solid gauge Y axis.
    * Fixed #5897, Series.pointAttribs ignored some lineWidth options.
    * Fixed #5899, HTML label bounding box was cached when a width was set in inner HTML.
    * Fixed #5903, a regression causing the halo to cover bubbles so the bubbles weren't clickable.
    * Fixed #5909, plotBand border was only drawn on three out of four sides of the rectangle.
    * Fixed #5912, legend clipping was not removed after resizing to larger size.
    * Fixed #5915, returning false from tooltip formatter only hid the tooltip when it was present from before.
    * Fixed #5919, default exporting.libURL used insecure HTTP.
    * Fixed #5921, horizontal legend has height limit even when floating.
    * Fixed #5922, Tooltip.refresh crashed when formatter returned undefined.
    * Fixed #5926, more unique id's for clipping and other internal defs. Prevents conflicts when SVGs from different sources are pasted in the same page.
    * Fixed #5928, first tick disappeared when redrawing chart with type category and uniqueNames = false.
    * Fixed #5931 and #5957, refactured updateButtonStates to fix issues with states of Rangeselector buttons.
    * Fixed #5932, line height was wrong in tooltip with nested em units.
    * Fixed #5934, series.className was missing a trailing space in the legend item.
    * Fixed #5935, a regression when axis was crossing DST in a timezone west of UTC.
    * Fixed #5938, dynamic inversion didn't work without setting certain other properties at the same time.
    * Fixed #5940, disabling the legend via Legend.update did not reclaim legend space.
    * Fixed #5944, offline exporting and styled mode resulted in unstyled, black chart.
    * Fixed #5951, responsive.rules.condition.callback did not work according to documentation.
    * Fixed #5959, hidden series affecting axis closest point calculation.
    * Fixed #5960, incorrect series order after removing and adding series.
    * Fixed #5968, xAxis labels did not have ellipsis when rotation was set to 0, in Firefox and Edge.
    * Partially fixed #5047. Workaround with was given static width and height.

# 5.0.2 / 2017-01-25

* Updated Highcharts to 5.0.2 (2016-10-26)
  * Fixed two regressions.
    * Fixed #5887, a regression causing bubbles to move on hover.
    * Fixed regression in v5.0.1 where the halo would be mispositioned in inverted charts.

# 5.0.1 / 2017-01-25

* Updated Highcharts to 5.0.1 (2016-10-26)
  * Added new options, axis.softMin and axis.softMax. Closes #5824.
  * Added Legend keyboard navigation to the accessibility module.
  * Added animation on hovering point markers.
  * Added offline PDF export support.
  * Bug fixes
    * Refactored tooltip delay the generation of the empty label container. This prevents the empty label from being present in exported SVG.
    * Fixed #1880, individual column borderColor.
    * Fixed #4951, issue with placing tick marks on round times when using getTimezoneOffset.
    * Fixed #5427, JS error on async destroy when triggered from custom exporting menu.
    * Fixed #5483 without breaking #5823.
    * Fixed #5538, pie series was not redrawn after modifying title and other elements.
    * Fixed #5553, disabled trackByArea did not hide tooltip, when moving mouse out of the area shape.
    * Fixed #5736, zooming in multiple X axes with crosshairs and snap false caused JS error.
    * Fixed #5745, a regression causing chart.style not to apply to the container.
    * Fixed #5750, null points on categorized axis caused blank chart when drilldown module was present.
    * Fixed #5757, empty chart throws error with accessibility module.
    * Fixed #5764, drilldown not working with Highstock.
    * Fixed #5765, a regression causing 3D pie slices not to update on show/hide when animation was set.
    * Fixed #5766, halo was not rendered for shared tooltip when density of points was high.
    * Fixed #5768, regression since v4.2.7 causing setData with xAxis.type = category to break categories.
    * Fixed #5770, regression causing individual box plot fill not to apply.
    * Fixed #5773, a regression causing axis events not to be called after axis update.
    * Fixed #5777, selected class name remained after unselecting a point by selecting another.
    * Fixed #5779, zoom-out button not working on first touch on touch devices.
    * Fixed #5787, a regression causing the chart.reflow option to never take effect.
    * Fixed #5790, zoom button appeared on swiping already zoomed-out line chart.
    * Fixed #5794, header on tooltip.split was cut off near the ends of the axis.
    * Fixed #5801, artefacts when updating series with tooltip.split.
    * Fixed #5817, a regression causing point-specific marker radius not to be applied. Refactored point sizing logic for initial render, updates and states.
    * Fixed #5818, render halo in a series group, not under all of the groups.
    * Fixed #5819, crosshair width can now be set on category axes also.
    * Fixed #5822, a regression causing drilldown to fail the second time when allowPointDrilldown was false.
    * Fixed #5832, shared tooltip failed with points of the same X value but different pointPlacement.
    * Fixed #5833, split tooltip tried to remove series tooltip again after destruction.
    * Fixed #5837, could not style null points with CSS.
    * Fixed #5839, errors on touch-dragging on mobile devices after dynamically adding a series with visible false.
    * Fixed #5842, image marker symbols were misplaced and missing from exported charts.
    * Fixed #5850, hideLoading didn't work right after calling showLoading in styled mode.
    * Fixed #5855, split tooltip was not destroyed properly.
    * Fixed #5862, wrong hover point, when tooltip was shared.
    * Fixed #5866, treemap point.isNull was always true.
    * Fixed duplicate setting of halo path since HC5. Added animation to hiding halo.
    * Fixed eternal loop when setting a new chart.height in a responsive rule.

# 5.0.0 / 2017-01-25

* Updated Highcharts to 5.0.0 (2016-09-29)
  * Added styled mode for optional separation of SVG and CSS.
  * Added responsive option set.
  * Added accessibility option set.
  * Added new function, Chart.update in order to update the chart options after render time.
  * Added new function, Chart.addCredits.
  * Added new function, Chart.title.update.
  * Added new function, Chart.credits.update.
  * Added new function, Legend.update.
  * Added new option, Renderer.definition.
  * Added new option, exporting.error for catching errors in offline exporting.
  * Added new option, exporting.libURL for use with offline exporting.
  * Added new option, pane.background.className.
  * Added new option, xAxis.className.
  * Added new option, xAxis.crosshair.className.
  * Added new option, plotOptions.series.dataLabels.className.
  * Added new option, plotOptions.series.className for styling individual series.
  * Added new option, xAxis.plotBands.className.
  * Added new option, xAxis.plotLines.className.
  * Added new option, plotOptions.series.zones.className.
  * Added new option, chart.colorCount for use in styled mode.
  * Added new option, defs for defining reusable elements in styled mode.
  * Added new option, tooltip.padding.
  * Added new option, series<line>.data.colorIndex for coloring points in styled mode.
  * Added new option, tooltip.split.
  * Added new option, chart.description for use with the accessibility module.
  * Added new option, chart.typeDescription for use with the accessibility module.
  * Added new option, xAxis.description for use with the accessibility module.
  * Added new option, plotOptions.series.description for use with the accessibility module.
  * Refactored build system to use ES6 imports and node-based build script.
  * Changed all default colors (except series data colors) to a simplified color scheme based on just a few shared colors.

# 4.2.7 / 2017-01-25

* Updated Highcharts to 4.2.7 (2016-09-21)
  * Added new feature, yAxis.angle, allowing positioning the axis line and labels in polar chart Y axes. This makes it practical to use multiple axes in polar charts.
  * Added option, xAxis.nameToX, allowing points to have the same name but different axis positions on an axis of type category.
  * Bug fixes
    * Fixed #1011, ignoreHiddenSeries with ordinal axis caused artefacts on a chart.
    * Fixed #1041, gaps in the area fill of stacked areasplines.
    * Fixed #3169, error on drilldown from a null point.
    * Fixed #3341, exceeded stack size on mutually linked series.
    * Fixed #3571, NaN in the beginning of data broke series.
    * Fixed #4778, wrong rendering waterfall series, when yAxis.max was set.
    * Fixed #5186, gaps in the fill of areasplinerange.
    * Fixed #5383, mouse position detection with pointPlacement.
    * Fixed #5528, a regression causing polar arearanges to fail.
    * Fixed #5533, stickyTracking when set to false caused highlighting wrong point.
    * Fixed #5552, linejoins in boost module lines.
    * Fixed #5556, JS error on polygon with empty data.
    * Fixed #5563, JS error in treemap with zero values.
    * Fixed #5568, pointIntervalUnit broke when using more data points than turboThreshold.
    * Fixed #5569, generic options set on the yAxis affected the colorAxis.
    * Fixed #5570 and #5590, regression causing blank export on Batik based export servers.
    * Fixed #5572, pie slices were not hidden in 3D pie charts on legend click.
    * Fixed #5595, HTML tooltip did not hide on point mouse out via the tooltip.
    * Fixed #5605, error on async onload of destroyed chart.
    * Fixed #5618, updating master series caused wrong visibility on linked series.
    * Fixed #5619, the Series remove event was fired when updating a series.
    * Fixed #5620, text was mispositioned when loading a chart in a hidden iframe in certain browsers.
    * Fixed #5622, click event for line series point was not called when column was rendered below.
    * Fixed #5631, zeroes in logarithmic chart made the whole graph crash.
    * Fixed #5632, gaps were broken in arearange and areasplinerange.
    * Fixed #5646, waterfall did not work correctly with logarithmic axis.
    * Fixed #5647, xrange points disappeared if x was outside plot but x2 inside.
    * Fixed #5647, xrange points disappeared when x was outside visible range.
    * Fixed #5655, animation: true on a series config caused animation to jump from the middle.
    * Fixed #5658, error on updating series from its own mouseOver event.
    * Fixed #5662, setExtremes on polar chart caused padded max value.
    * Fixed #5665, addPoint animation parameter was not used.
    * Fixed #5679, handle isArray for ES6 iterator.
    * Fixed #5681, JS error on adding custom group to points.
    * Fixed #5689, text had soft line wraps when white-space: nowrap was used in combination with text-overflow: ellipsis.
    * Fixed issue #4133, error bar data labels positions failing on redraw.
    * Fixed issue #5205, color axis changed colors when legend was disabled.
    * Fixed issue #5567, wrong clipping of offline exported SVG in IE11/Edge.
    * Fixed wrong handling of minRange on logarithmic axis, related to #1227.

# 4.2.6 / 2017-01-25

* Updated Highcharts to 4.2.6 (2016-08-02)
  * Added crisp correction for crisper treemap points.
  * Added support for animating graphs to the right when updating data or setting axis extremes. Related to #5294.
  * Refactored sideways animation logic for graphs to better reflect shifting data. Closed #5294.
  * Bug fixes
    * Fixed tick animation when showFirstLabel or showLastLabel were set to false.
    * Fixed #2522, point names should fill up categories when X is not set.
    * Fixed #2597, data labels remained visible even though container was hidden.
    * Fixed #3571, treat NaN in data as null.
    * Fixed #4204, hover.brightness wasn't used for positive bars in waterfall.
    * Fixed #4216, connectEnds with null as first point failed.
    * Fixed #5052, wrong placement of ticks on opposite axis on 3D charts.
    * Fixed #5197, JS error on hovering chart after setData before redraw.
    * Fixed #5215, JS error when legend configuration object was set to false.
    * Fixed #5280, stacked area was wrong with non-zero Y axis threshold and data points at 0.
    * Fixed #5287, unsnapped crossshair was hidden after adding points.
    * Fixed #5298, empty cells in Google Spreadsheet made the graph disappear.
    * Fixed #5302, dateFormat didn't handle Date objects like before.
    * Fixed #5310, global stacking affected polygon series.
    * Fixed #5311, JS error when setting an event config to null.
    * Fixed #5322, negative values in pie series was rendered incorrectly.
    * Fixed #5324, calling Renderer.label with a shape of rect failed.
    * Fixed #5332, last axis label was stuck when doing repetetive redraws.
    * Fixed #5337, tooltip for polygon should not behave like scatter points.
    * Fixed #5339, plot area disappeared when categories were too long.
    * Fixed #5348, error in arearange series when trackByArea was false.
    * Fixed #5350, 3D pies failed redraw when animation was off.
    * Fixed #5352, treemap tooltip did not format point value.
    * Fixed #5354, noSharedTooltip was undefined for gauge and solid gauge, which caused errors when shared tooltip was enabled.
    * Fixed #5376, axis title position was wrong with font-size text values.
    * Fixed #5396, drilldown activeDataLabelStyle color contrast did not work.
    * Fixed #5417, regression causing HTML axis labels to misbehave with useHTML and rotation.
    * Fixed #5442, incorrect clipRect counter causing points to disappear on series update.
    * Fixed #5480, axis showed 0k or 0M. Suffix not needed for zero.
    * Fixed #5486, threshold null caused wrong fill on all-negative axis.
    * Fixed #5495, shared tooltips not always working because of rounding error.
    * Fixed #5500, pyramid height caused wrong position.
    * Fixed #5504, exporting module default settings was not compatible with https.
    * Fixed #5513, Chart.setSize required both width and height to be set.
    * Fixed #5519, issues with setting null colors in drilldown.
    * Fixed #5522, 3D charts scale differently first time versus subsequent redraws.
    * Fixed #5523, marker radius was incorrect when values were of type string.
    * Fixed issues with PNG/JEPG in IE and Edge in offline exporting, ref #5410.
    * Fixed issue #5410, offline exporting in IE/Edge failed with embedded images for PNG/JPEG.

# 4.2.5 / 2016-05-06

* Updated Highcharts to 4.2.5 (2016-05-06)
  * Added new option, exporting.printMaxWidth, to prevent printed charts cut off on the right side. Closes #2088.
  * Added new option, title.widthAdjust and subtitle.widthAdjust, to prevent titles from flowing over elements.
  * Added support for JPEG in offline download module, ref #5157
  * Fixed #3070, verticalAlign didn't work with rotated data labels on column series.
  * Fixed #4087, error 11 was not described on the website.
  * Fixed #4670, zones colors were not applied for markers on hover.
  * Fixed #5211, titleSetter in combination with buildText added duplicate content to the title.
  * Fixed #5220, a regression causing JS error when resizing polar charts.
  * Fixed #5221, support for minPointLength in xrange study.
  * Fixed #5226, polar chart with no data failed with error.
  * Fixed #5228, scroller.getUnionExtremes did not consider navigation axis min and max.
  * Fixed #5230, a horizontal and opposite axis used to have wrong alignment for its title.
  * Fixed #5234, x value of null cancelled rendering of all points.
  * Fixed #5236, last point was not always visible due to rounding errors.
  * Fixed #5237, inverted should not have an effect on polar charts.
  * Fixed #5250, columns were not visible in IE10.
  * Fixed #5254, data labels were not aligned to the point box in heatmaps.
  * Fixed #5259, crosshair prevented point hover when drawn above points.
  * Fixed #5261, break at the end of a label caused wrong bounding box.
  * Fixed #5266, pinchDown was sometimes empty on Android.
  * Fixed #5269, crosshairs on wrong point with multiple series and non-shared tooltip.
  * Fixed #5274, dataLabels.overflow not always respected on heatmaps.
  * Fixed issue in the xrange study with axis extremes when there were other, more extended series in the same chart.

# 4.2.4 / 2016-05-06

* Updated Highcharts to 4.2.4 (2016-04-14)
  * Added support for polar columnrange series.
  * Added e.originalEvent to drilldown event in order to catch modifier keys and other properties. Closes #5113.
  * Added new drilldown event, chart.events.drillupall, that is triggered after multiple single drillup events. Closes #5158. Closes #5159.
  * Added new option, chart.options3d.fitToPlot to fit 3D charts into the available plotting area. This may affect the layout of existing 3D charts if the layout was adjusted by chart.margin. The chart.margin setting can now normally be removed. Closes #4933.
  * Added new option, lang.shortWeekdays, to specify short weekdays other than the first three letters of the weekday.
  * Added new value, day, for pointIntervalUnit.
  * Added option, legend.navigation.enabled, to allow disabling legend scroll.
  * Fixed #3450, tooltip did not display after zooming on Android.
  * Fixed #3916, halo and tooltip visible for points outside the plot area.
  * Fixed #4552, mouse interaction and tooltip positions didn't match on 3D scatter chart.
  * Fixed #4631, treemap series displayed no data even when data existed.
  * Fixed #4679, when series are overlapping, the tooltip should show the topmost point.
  * Fixed #4700, users can set and modify opacity on parent nodes in treemap.
  * Fixed #474, vertical label alignment on top axis was off when labels were on multiple lines.
  * Fixed #4751, inconsistent data label behaviour after redraw.
  * Fixed #4784, setting allAreas to false does not center map.
  * Fixed #4812, dataLabels which was supposed to be hidden were still visible.
  * Fixed #4856, zooming did not work in Treemap.
  * Fixed #4866, space was not reserved for tick marks, allowing ticks to overflow the chart when axis labels were not present.
  * Fixed #4868, axis breaks were not applied for a range series.
  * Fixed #4891, pie slice's graphics were not fully hidden, when slice was hidden.
  * Fixed #4954, corrected floating values with isSum and isIntermediateSum in Waterfall series.
  * Fixed #4961, placement of tooltip on flags for inverted charts.
  * Fixed #4984, tooltip jiggling on arearange even when followPointer was true.
  * Fixed #5007, JS error from tooltip when running in strict mode.
  * Fixed #5010, stacked areas didn't work with Date objects as X values.
  * Fixed #5029, runtime error on empty data set.
  * Fixed #5030, bars were shaking on initial animation.
  * Fixed #5034, a regression causing axis labels on vertical axis not to wrap.
  * Fixed #5053, regressions related to chart callbacks firing async.
  * Fixed #5060, date format for %e was not consistent with docs.
  * Fixed #5063, solid gauge tooltip showed wrong series the first time.
  * Fixed #5066, crosshair with snap: false only appeared when hovering a point.
  * Fixed #5075, display was not deferred on data labels with useHTML.
  * Fixed #5079, a regression causing vertical axis title to disappear in IE8.
  * Fixed #5084, wrong Heatmap Intro was set in parts.js, which made the Download Builder fail.
  * Fixed #5085, tooltip showed for points immediately outside the plot area on the X axis.
  * Fixed #5086, X axis labels overlapped when added via Chart.addSeries.
  * Fixed #5087, container with padding caused error with printing in IE8.
  * Fixed #5099, single point marker was not displaying when surrounded by null points.
  * Fixed #5101, click events did not fire on pie slices after Point.update.
  * Fixed #5112, returning false from event handlers didn't cancel default function.
  * Fixed #5133, data labels disappeared on chart redraw when defer was explicitly set to true.
  * Fixed #5134, a regression causing wrong aniation on pie labels when moving from one side to the other.
  * Fixed #5137, boost module threw JS error when doing mouse interaction after removing series.
  * Fixed #5144, problem with percentage stack with null points.
  * Fixed #5146, columns with zero value and no border on negative chart were visible even though they shouldn't.
  * Fixed #5156, funnel did not respect the color set for selected state.
  * Fixed #5160, data grouping and boost module did not play well together.
  * Fixed #5167, wrong padding in bubble charts made point disappear after setting axis extremes.
  * Fixed #5171, log scale transformation functions were not accessible from the outside.
  * Fixed #5174, invalid CSS because of division by zero.

# 4.2.3 / 2016-04-09

* Updated Highcharts to 4.2.3 (2016-02-08)
  * Fixed #4989, Chart.getSVG function produced invalid SVG.
  * Fixed #4999, a regression causing JS error on hovering columns having a shadow.
  * Fixed #5001, a regression causing empty arearange series to fail with JS error.
  * Fixed #5004, a regression causing stacked step areas to render incorrectly.
  * Fixed #5015, a regression causing splines with null points and connectNulls: true not to render.
  * Fixed #5016, a regression where a spline with equal X values failed to show.

# 4.2.2 / 2016-04-09

* Updated Highcharts to 4.2.2 (2016-02-04)
  * Added new option, linecap, to allow round corners on solid gauge.
  * Changed chart.load event to wait for external symbol images, so that their size is set correctly in the SVG. This comes in handy for export and server generated images.
  * Fixed #1977, bubble series shadow was not moved when moving bubbles.
  * Fixed #4077, panning was not supported on inverted charts.
  * Fixed #4086, tick marks and labels were not trimmed to axis extremes when tickPositions option was used.
  * Fixed #4573, wrong number rounding in some cases.
  * Fixed #4622, updating point didn't change legend's item.
  * Fixed #4759, a regression which did not update point markers in point.update().
  * Fixed #4779, data labels were not cropped when rotated.
  * Fixed #4859, no easy way to catch offline export failed exception.
  * Fixed #4861, where offline export would fail in some cases with embedded images.
  * Fixed #4870, column width calculation not correct on logarithmic X axis.
  * Fixed #4886, pie slicing failed and tooltip disappeared too quickly on Windows phone.
  * Fixed #4888, fillOpacity of 0 did not take effect on area charts.
  * Fixed #4889, plotLine and plotBand should be rendered with higher zIndex than frames in 3D view.
  * Fixed #4890, originalEvent was missing from selection event since 4.2.0.
  * Fixed #4898, rounding issues with Y axis causing columns to exceed threshold value, and plot lines to be filtered out.
  * Fixed #4904, async loading of points kept running after chart was destroyed in boost module.
  * Fixed #4905, pie data labels were not hidden when scaling down.
  * Fixed #4906, chart did not zoom when drag and drop was dropped on a different chart.
  * Fixed #4911, false detection of overlapping data labels in multiple panes.
  * Fixed #4912, specific export data label style didn't take effect for pies.
  * Fixed #4913, regression in box size detection causing chart to overflow the container in some cases.
  * Fixed #4914, boost module loadingDiv was destroyed before redraw was finished.
  * Fixed #4918, spline curved wrongly when plotX or Y had a value of 0.
  * Fixed #4920, polar X axis labels misaligned after chart redraw.
  * Fixed #4927, crosshair only worked for one Y axis.
  * Fixed #4928, HTML label lengths were not reset on resize.
  * Fixed #4929, halo covered point and disallowed point click in IE8.
  * Fixed #4938, HTML elements were missing visibility and opacity setters.
  * Fixed #4951, X axis daily ticks did not render on midnight around a DST crossover when the getTimezoneOffset callback was used.
  * Fixed #4955, export button was hidden by category crosshair.
  * Fixed #2069, null points in stacked areas were rendered as zero instead of gaps.

# 4.2.0 / 2016-04-09

* Updated Highcharts to 4.2.0 (2015-12-15)
  * Included the Standalone Framework in Highcharts and removed the concept of adapters.
  * Removed global properties in Highcharts and modules. Closes #4389.
  * Added new constructor, Highcharts.chart, that allows instanciating a chart without the new keyword.
  * Added an option to set the renderTo div as the first argument to the constructor, like Highcharts.chart(renderTo, options);
  * Added support for fill-opacity and stroke-opacity attributes on VML renderer. Support semi-transparent fill with named colors on area series.
  * Breaking change: Easing functions from jQuery UI no longer work. They will fall back to the default "swing" easing. With Highcharts 4.2, the easing function must be defined on the Math object itself.
  * Breaking change: The sparkline demo has some changes in the constructor.
  * Fixed #3372, tooltip for columnrange series was misplaced.
  * Fixed #4667, column was left semi-opaque after drill up with the Standalone Framework.
  * Fixed #4782, marker image width and height didn't apply to legend.
  * Fixed #4799, wrong position of columns when setting grouping:false in charts with multiple columns.
  * Fixed #4801, setting visibility by series.update() didn't update series group.
  * Fixed #4811, legend checkbox position was wrong with legend title present.

# 4.1.10 / 2016-04-09

* Updated Highcharts to 4.1.10 (2015-12-07)
  * Added new feature, borderColor: null for pies, which inherits the slice color. This allows a simple workaround for antialiasing gaps between slices when not using a real border (#1828).
  * Added new option, xAxis.labels.reserveSpace, to control whether the labels should take up space in the layout. Closes #3479.
  * Added new option, treemap.sortIndex.
  * Better animation on 3D pie drilldown (#3534).
  * Fixed #2409, allowing x/yLow and y/yHigh in range charts to work across orientation.
  * Fixed #2597, in Firefox, some elements stayed visible even when the container was hidden by visibility: hidden.
  * Fixed #2995, series color with gradient was not correct in tooltip.
  * Fixed #3140, wrong placement and axis margin when using rotated labels on a vertical axis.
  * Fixed #3737, column/bar order inside group did not match the xAxis.reversed setting.
  * Fixed #3745, added missing right shape of the slice when using startAngle.
  * Fixed #4088, proper shapes and dataLabels positions for 3D pie chart. Minor refactoring and commenting.
  * Fixed #4184, tickInterval not taking precedence over auto point range.
  * Fixed #4267, updated points didn't update negativeColor until hover.
  * Fixed #4309, crash in Firefox inside hidden iframe using standalone framework.
  * Fixed #4369, yAxis.reversedStacks rendered wrong order for 3D columns.
  * Fixed #4374, ticks became misaligned after updating the chart, even when chart.alignTicks was set to true.
  * Fixed #4388, axis titles sometimes overlapping with axis labels in 3D charts.
  * Fixed #4391, white areas in area stacks with multiple points on same X value.
  * Fixed #4415, X axis label overlapped when step was set to 1.
  * Fixed #4453, tooltip was sometimes visible in printed charts.
  * Fixed #4533, pointBreak event was not called for xAxis and different series types than column.
  * Fixed #4584, 3d pie with null data slices getting plotted.
  * Fixed #4605, data labels were not shown if a column or column range extended far outside the plot area.
  * Fixed #4638, bubble legend icon not tolerating relative font size units.
  * Fixed #4640, exporting failed in IE7
  * Fixed #4641, pie slices with null values should not have a data label.
  * Fixed #4645, shared tooltip did't show all of the points.
  * Fixed #4652, wrong alignment of labels in the left side of pies.
  * Fixed #4656, bar border was visible on zero values for reversed Y axis.
  * Fixed #4660, regression caused missing last alternate plotBand when using categorized xAxis.
  * Fixed #4663, treemap drillUp button is now visible when the chart has no titles.
  * Fixed #4671, switching from normal to boost mode left duplicate graph.
  * Fixed #4675, boost module did not remove tracker path after zooming out from SVG renderer.
  * Fixed #4678, resetting zoom didn't reapply ellipses to all axis labels.
  * Fixed #4681, memory leak on dynamic charts due to increasing bounding box cache.
  * Fixed #4686, halo was not centered on the point.
  * Fixed #4691, wrong default text alignment of axis title on opposite side when the title was in low or high position.
  * Fixed #4694, xAxis labels were improperly positioned with opposite xAxis and staggerLines.
  * Fixed #4701, Point.update changed types of items in series.options.data, causing issues with turboThreshold.
  * Fixed #4704, setting new data on a pie chart didn't update color of the slice.
  * Fixed #4721, hyphenated attribute names were not correctly animated.
  * Fixed #4732, halo opacity not taking effect with named colors.
  * Fixed #4736, tooltip x position was NaN when zooming in certain cases.
  * Fixed #4737, crosshair's stroke-width should be updated after chart's resize.
  * Fixed #4738, funnel chart not rendered correctly when center was specified.
  * Fixed #4749, data.decimalPoint didn't work with negative values.
  * Fixed #4756, wrong position of rotated axis labels on left side.
  * Fixed #4768, hidden data labels visible in tall charts.
  * Fixed #4769, plot bands didn't animate properly.
  * Fixed #4789, dynamically added gauge dial was drawn on top of pivot.
  * Full drilldown functionality for 3D pies. Closes #3534.

# 4.1.9 / 2015-12-04

* Updated Highcharts to 4.1.9 (2015-10-07)
  * Added new option, axis.visible.
  * Added new option, bubble.sizeByAbsoluteValue, to allow negative bubbles sizes to be based on the absolute value rather than a scalar difference from smallest to greatest. Closes #4498.
  * Added new series option, softThreshold, to prevent showing subzero axis ticks for line series that consist of positive data only.
  * Added support for legendType: 'point' on more series types than just pie and its derivatives.
  * Fixed #2473, allowHTML should not affect the forExport flag.
  * Fixed #2711, set proper order of data labels inside columns.
  * Fixed #2854, SVG images in symbol URL's did not display in IE11.
  * Fixed #3529, selected point changed color after updating.
  * Fixed #3542, tooltip with useHTML did not fade out smoothly.
  * Fixed #3632, pie inner size shouldn't be allowed to be greater than outer size.
  * Fixed #3636, negativeColor wasn't set for marker on hover.
  * Fixed #3801, pie chart radial gradient position did not update on chart resize.
  * Fixed #3971, X axis label step was not honoured when rotation was set.
  * Fixed #4136, treemap did not export correctly after drillToNode.
  * Fixed #4298, treemap did not update axis extremes after updated data.
  * Fixed #4431, tooltip was broken when changing from column series to a different type.
  * Fixed #4442, alignTicks forced axes to align, even when only one of them contained data.
  * Fixed #4465, tooltip disappeared on point when stickyTracking was false.
  * Fixed #4482, line disappeared during animation when series.step was enabled.
  * Fixed #4485, ticks were added inside axis break on datetime axis.
  * Fixed #4502, wrong bounding box detection of rotated labels caused overlapping text in old IE.
  * Fixed #4504, bars were misplaced when using reversed yAxis.
  * Fixed #4510, point search along X axis failed in boost module.
  * Fixed #4511, tooltip was not displayed, when yAxis.max cut off top part of the column.
  * Fixed #4519, updatating pie data immediately failed with Standalone Framework.
  * Fixed #4525, errors in exported SVG when allowHTML was true.
  * Fixed #4526, series used the same clip-paths, which caused wrong clipping when using different axes.
  * Fixed #4529, boost module produced error with pie charts.
  * Fixed #4530, heatmap with single point and large colsize caused the point not to display.
  * Fixed #4532, stack ID's as strings caused JS error in Highcharts 3D.
  * Fixed #4536, unable to zoom in closely on first category when minRange was less than closest point range.
  * Fixed #4543, null value bubbles should not be drawn.
  * Fixed #4546, pie and flag series not showing tooltip correctly when displayed in a chart with shared tooltip.
  * Fixed #4558, when resizing chart during addPoint animation cause error in stacking.
  * Fixed #4562, logarithmic zAxis for 3D scatter did not render properly points.
  * Fixed #4586, some markers moved by 1px after hovering.
  * Fixed #4594, errors when stacking two series with different data lengths on a log axis.
  * Fixed #4599, cropThreshold should be ignored when getExtremesFromAll is enabled.
  * Fixed #4615, labels on color axis were wrongly positioned when useHTML.
  * Fixed #4627, data labels exported twice in IE and Edge. Text shadows not rendered in Edge.
  * Fixed issue with duplicated pane backgrounds after the #3176 fix.
  * Fixed issue with offline export in Firefox. Closes #4550.
  * Fixed regression with global animation and timing of calls.
  * Fixed #2801, whiskerLength for boxplot can be set in pixels.
  * Fixed #3323, 3d pie parts have better zIndexes, out part of slice crossing sides created, normalization of alpha and beta to (-360, 360) range.
  * Partly fixed #1686, tooltip not hiding when mouse enters over it then out from series.
  * Refactored columns. Separated the crisping logic from the rest of the translation logic. Related to #4179.

# 4.1.8 / 2015-08-31

* Updated Highcharts to 4.1.8 (2015-08-20)
  * Added experimental support for using HTML in exported charts through the exporting.allowHTML option. Discussed in #2473.
  * Added new option, maxPointWidth, to the column chart type and its derivatives.
  * Add %k, hours with no padding, in dateFormat.
  * Don't cache undefined bounding box key. Closes #4328.
  * Fixed #4448, which causes duplicated event calls for column series.
  * Fixed #1498, minor ticks were missing when using column series.
  * Fixed #1655, where setExtremes event could be called with undefined extremes.
  * Fixed #2775, click on custom button propagated and caused JS errors when destroying chart.
  * Fixed #3379, minPadding and maxPadding was wrong on color axis.
  * Fixed #3737, points within a group were not reversed in a reversed bar chart X axis.
  * Fixed #3879, where linked series didn't inherit initial visibility from a parent.
  * Fixed #3909, HTML data label was invisible after drilling up.
  * Fixed #4149, tooltip went off plot area when data was clipped.
  * Fixed #4189, wrong position of the legend in IE7.
  * Fixed #4219, enconding problem with ellipsis. Better fix for #4079.
  * Fixed #4246, pie slices with null values should not be rendered.
  * Fixed #4313, setting one of the extremes removed both, min and max, axis paddings for bubble series.
  * Fixed #4320, stack items building up and creating memory leak when adding and removing points.
  * Fixed #4333, data label overlapping detection was too aggressive. Don't handle padding when the label doesn't have a border or background.
  * Fixed #4339, touch-dragging in IE11 on a zoom enabled chart caused JS errors.
  * Fixed #4343, axis lines missing when 3D was loaded.
  * Fixed #4347, legend item click of heatmap with data classes should hide items.
  * Fixed #4349, updating point.x prevented point from being hidden from legend.
  * Fixed #4350, pie chart failing with StockChart constructor.
  * Fixed #4356, pointBreak wasn't called for values below the threshold.
  * Fixed #4356, series with null threshold now calls breakPoint correctly
  * Fixed #4359, drilldown pie selected slices had wrong color.
  * Fixed #4360, float error on logarithmic axis label.
  * Fixed #4364, chart click event fired when clicking menu items in the export menu.
  * Fixed #4365, pie chart connectors were not hidden when data labels used HTML and hiding the series.
  * Fixed #4371, where negative Axis offset miscalculated clip-path for series.
  * Fixed #4390, JS error in some cases on updating a series with no data.
  * Fixed #4396, different minSize and maxSize per separate series didn't work.
  * Fixed #4401, better handling categories based on a point.name.
  * Fixed #4410, a regression causing incorrect mouseover events in column charts.
  * Fixed #4411, setting axis.labels.step to 1 didn't result in 1:1 labels.
  * Fixed #4420, generic X axis gridline width with 3d columns.
  * Fixed #4421, overlapping upper data labels on arearange series.
  * Fixed #4430, point color was not set on positive points when negativeColor was set.
  * Fixed #4434, regression causing failure with reversed solid gauge.
  * Fixed #4443, auto rotation was not reset after widening chart when labels used HTML.
  * Fixed #4449, a regression causing wrong alignment on legend items when rtl was combined with useHTML.
  * Fixed #4477, too dense ticks when setting staggerLines, caused browser crash.
  * Fixed #4313, setting one of the extremes removed both, min and max, paddings.
  * Fixed #4351, setSize with standalone adapter didn't resize inner container.
  * Fixed animation on updating map colors.
  * Fixed issue with displayNegative not working with all data. Closes #4419
  * Fixed issue with pie and data labels producing JS error in IE6.
  * Fixed issue with updating mapbubble point to null.
  * Fixed regression with JS error on updating pie slice value to null.
  * Improve logic for pointBreaks, touch #4356
  * Partial fix for #3861, bubble series not working with logarithmic axes. It now displays, but the bubbles are clipped unless the user sets a padding.

# 4.1.7 / 2015-08-31

* Updated Highcharts to 4.1.7 (2015-06-26)
  * Added new option, drilldown.allowPointDrilldown, that can be set to false to allow only drilling to categories. Closes #4295.
  * Added support for useHTML in legend navigation.
  * Added useHTML option to no-data-to-display module. Closes #4316.
  * Fixed #2911, JS error when drilldown and allowPointSelect were enabled at the same time.
  * Fixed #3318, gauge background altered background on polar charts in the same page.
  * Fixed #3650, updating a point from zero in 3d pies.
  * Fixed #3709, crash when showing/hiding linked series and setting data at the same time.
  * Fixed #3941, added option to turn off axis label ellipsis through text-overflow style.
  * Fixed #4130, errors when running Series.update from the series' own events.
  * Fixed #4170, halo was still visible after hiding pie slice.
  * Fixed #4233, columns and areas ascended from botton when threshold was null and all values negative. Closed #4282.
  * Fixed #4275, when null points were present inside an axis break, connectNulls: false did not have an effect.
  * Fixed #4280, 3D for inverted charts was disabled.
  * Fixed #4284, a regression causing columns to disappear after Point.update with an object argument.
  * Fixed #4291, number suffixes like k and M was applied to non-round tick labels.
  * Fixed #4301, point update on solid gauge gave wrong animation.
  * Fixed #4308, graphs were clipped to axis line even when it was offset.
  * Fixed #4309, JS error in Firefox when rendering chart inside an iframe with display:none.
  * Fixed #4310, point hovering was unstable when stickyTracking was false and point markers disabled in normal state.
  * Fixed #4318, ignoreHiddenPoint didn't take effect for funnels.
  * Fixed #4319, tooltip was broken on canvas heatmap demo.
  * Fixed bad translation from broken axis pixels to values. Part of #4229.
  * Fixed issue with Batik powered exporting and IE8. Invalid SVG tag.

# 4.1.6 / 2015-08-31

* Updated Highcharts to 4.1.6 (2015-06-12)
  * Added new option, series.getExtremesFromAll, that tells the y axis to be scaled to the whole series range, not only the visible part.
  * Added scaling support for Z axis on 3D charts.
  * Added xAxis.title.x and xAxis.title.y options for positioning.
  * Fixed #4160, 3D should be disabled for inverted charts
  * Fixed #4160, 3D should be disabled for inverted charts.
  * Fixed #1457, columnrange did not render with reversed Y axis.
  * Fixed #182, browser hangs when updating chart from series mouseOut event.
  * Fixed #2077, innerSize of pies was not correct when size was dynamic.
  * Fixed #2088, crosshair shown on multiple axes.
  * Fixed #3923, crash in Chrome when extending a dashed line to extreme length.
  * Fixed #3974, duplicated data labels on Retina displays when text-shadow is applied.
  * Fixed #3977, tooltip content sometimes displayed outside tooltip.
  * Fixed #4069, slow updating of multiple pie slices.
  * Fixed #4108, line wrap dataLabels in tree maps.
  * Fixed #4116, cannot disable tooltip on polar chart.
  * Fixed #4117, broken tooltips in pie charts when useHTML was enabled.
  * Fixed #4124, treemap click on legend item returned error.
  * Fixed #4128, tooltip only looked at X value for line series
  * Fixed #4146, point marker stayed after updating point to null when connectNulls was true.
  * Fixed #4161, a regression causing wrong position of tooltip in top row of heatmap.
  * Fixed #4163, tooltip broken on pie in combo chart.
  * Fixed #4166, resetting point state was coupled to tooltip, resulting in state not reset when the tooltip was empty.
  * Fixed #4167, chart crashed on Y axis breaks in stock chart.
  * Fixed #4177, X axis label ellipsis overlapped when in the middle of the axis.
  * Fixed #4197, ignoreHiddenPoint didn't work.
  * Fixed #4200, unresponsive tooltip on tight column chart with shared tooltip.
  * Fixed #4201, redundant tick alignment to empty axes.
  * Fixed #4203, radial gradient rendered wrong in 3D Pies
  * Fixed #4208, click events did not bubble.
  * Fixed #4210, touch scroll was trapped when zoomType enabled.
  * Fixed #4217, tickInterval on linked axis did not follow that of parent.
  * Fixed #4221, negative color and zones not working with logarithmic axis.
  * Fixed #4223, tooltips showed year when data resolution was less than 1 millisecond.
  * Fixed #4247, X zooming within an Y axis break resulted in empty chart.
  * Fixed #4256, summary columns on waterfall, including data labels, extended below the plot area if an Y axis minimum was set.
  * Fixed #4261, added namespace to drillToNode on click event in tree maps.
  * Fixed #4264, column in stacked chart was mispositioned in some cases.
  * Fixed issue with wrong data label being hidden on overlap in columns.
  * Fixed issues with ellipsis on first and last label on X axis. Closes #3975.
  * Export: Added missing treemaps.js, fixes #4092.
  * Export: Added support for Map constructor.
  * Export: Added treemaps for serverside rendering.
  * Export: Enable loading of maps.js.

# 4.1.5 / 2015-04-13

* Updated Highcharts to 4.1.5
  * Added new option, series.keys.
  * Added now option, autoRotationLimit, as an upper limit for when to apply auto rotation. Closes #3941.
  * Added options to solidgauge, radius and innerRadius on individual points.
  * Changed tooltip behaviour in line charts and derivatives. This made swithching between series easier when the other series was covered by the tooltip.
  * Fixed #2922, redundant drilldown event on clicking data label.
  * Fixed #3355, causing misaligned bars around the threshold value.
  * Fixed #3758, setData on heatmap caused X axis to lose point range.
  * Fixed #3839, axis labels not using available space after resize.
  * Fixed #3867, errors on drill up on multi-series multi-level chart.
  * Fixed #3912, shared tooltips not working well with pointPlacement.
  * Fixed #3935, time axes got wrong extremes in rare cases.
  * Fixed #3951, drilldown activeLabelStyle was lost after setting extremes.
  * Fixed #3962, tooltip covered stacked columns near edges of the chart.
  * Fixed #3967, shared tooltip not working with two datetime axes.
  * Fixed #3969, legend indicator not displayed on colorAxis for 0 values.
  * Fixed #3976, one legend item's height influenced all subsequent boxes.
  * Fixed #3985, clicks registering incorrectly on column charts.
  * Fixed #3988, column legend markers were not aligned to baseline.
  * Fixed #3990, drilldown failed after destroying and re-initialising chart.
  * Fixed #3995, all points were black after drilling in treemap with a coloraxis.
  * Fixed #3996, font-style not taking effect with useHTML.
  * Fixed #4001, errors thrown on area with a single point and zones.
  * Fixed #4003, text replacement in export replaced content in label.
  * Fixed #4006, wrong rendering of zones with values less then the minimum.
  * Fixed #4014, touch scrolling not working on charts since the default followTouchMove changed.
  * Fixed #4015, solid gauge color not updating in IE8.
  * Fixed #4035, lineWidthPlus adding to states.hover.lineWidth.
  * Fixed #4046, treemap issue with drillToNode and redraw of the chart.
  * Fixed #4051, minPointLength gave wrong position on reversed Y axis.
  * Fixed #4055, unable to set borderWidth to 0 for 3d columns.
  * Fixed #4056, stack labels on reversed axis not vertically aligned correctly.
  * Fixed #4062, 3d zIndex incorrect on chart resize.
  * Fixed #4067, 3d columns datalabels not aligned.
  * Fixed #4068, null colors rendered as black in columns and white in pies.
  * Fixed #4069, setVisible was very slow on pies with many legend items.
  * Fixed #4070, label ellipsis lost on vertical axis after redraw.
  * Fixed #4075, zone elements were not destroyed on series update.
  * Fixed #4079, bullets in tooltips had wrong encoding in IE8 on non-UTC pages.
  * Fixed #4082, series with zones didn't apply hover line width.
  * Fixed #4083, series with zones animated wrong on addPoint.
  * Fixed #4085, wrong usage of momentjs in demo.
  * Fixed #3832, bundled PhantomJS scripts not copied to filesystem on Windows.

# 4.1.4 / 2015-03-10

* Updated Highcharts to 4.1.4
  * Added originalEvent to wrapped event argument for point and series click. Closed #3913.
  * Changed description for error 23 (related to #3920).
  * Fixed data.parseDate callback.
  * Fixed #1093, chart was resized after cancelling print.
  * Fixed #3890, errors on box plots and error bar series when stacking was set in general plot options.
  * Fixed #3891, axis label rotation not working outside -90 to 90.
  * Fixed #3899, tooltip on column range only working on one point per X value.
  * Fixed #3901, tooltip displaying for null points.
  * Fixed #3904, shared tooltip gave errors with null points.
  * Fixed #3911, data label duplication on WebKit with Retina displays.
  * Fixed #3919, click event always triggered on the same point with a shared tooltip.
  * Fixed #3920, color tweening with gradient fills caused black result.
  * Fixed #3926, tooltip not showing when entering the plot directly on a column.
  * Fixed #3932, shadow was not applied when negativeColor was used.
  * Fixed #3934, pie chart did not update when legend was hidden.
  * Fixed #3937, pointer events not reset after chart destroy.
  * Fixed #3945, tooltip did't work afer resize.
  * Fixed regression causing mouseover to not work with a single series.

# 4.1.3 / 2015-02-27

* Updated Highcharts to 4.1.3
  * Fixed #3900, duplicated Y axis in exported charts. Made export module more testable so it would have caught this error.
  * Fixed #3898, zones incorrectly applied if outside axis range.
  * Fixed #3895, error in title setter when setting a non-string value.

# 4.1.2 / 2015-02-27

* Updated Highcharts to 4.1.2
  * Added new option to tree maps: interactByLeaf
  * Added new dataLabel option, shape, in order to allow callouts and connectors on data labels.
  * Fixed #3567, Safari failed at exporting charts with images.
  * Fixed #3898, zones incorrectly applied if outside axis range.
  * Fixed #3895, JS error when setting element title to a non-string value.
  * Fixed #3886, wrong rendering of waterfall with a non-zero Y axis minimum.
  * Fixed #3873, series.points array order was modified when building the k-d tree.
  * Fixed #3866, data labels not re-appearing in remaining series after hiding another series.
  * Fixed #3875, eternal loop and crash in Chrome when using minorTickInterval on an axis with very close data points.
  * Fixed #3842 and #3872, data labels with text shadow are mispositioned in Firefox and modern IE.
  * Fixed #3849, duplicated text on data labels in export. Closes #3864.
  * Fixed #3868, setData broke tooltip.
  * Fixed issue with tooltip not hiding after hiding a series from a floating legend.
  * Hide tooltip on mouse leaving the plot area, also when a hoverSeries is not defined.
  * Fixed #3860, a regression causing onMouseOver event not to work on line series.
  * Fixed #3856, shared tooltip in polar charts.
  * Fixed #3863, pointer with data grouping and addSeries.
  * Fixed #3844, colorByPoint not working on tree maps.
  * Fixed #2202, chartOptions.xAxis options not added in export.
  * Fixed #3852, a regression causing logarithmic axis on gauges to fail.
  * Fixed #3845, problems with addPoint on 3D pies.
  * Fixed #3841, 3d column layering issue.
  * Fixed #3793, charts with huge numbers fail at Number.toFixed.
  * Fixed #3841, issue with multiple columns in 3d.
  * Fixed #3830, point names in category axis were lost after Axis.update.
  * Fixed #3836, a regression causing plot band labels to always be visible.
  * Fixed #3840, isIntermediateSum miscalculation.
  * Fixed drilldown issue with labels having both drilldown and static points.
  * Fixed #3839, a regression causing columns not to be clipped while animating in.
  * Fixed #3837, too aggressive data label collision detection in heat maps.
  * Fixed #3834, crosshair drawn incorrectly on dynamically added yAxes.
  * Fixed #3806, JS errors on clicking on non-drillable axis label after drilldown.

# 4.1.1 / 2015-02-17

* Updated Highcharts to 4.1.1
  * Fixed #3826, a 4.1 regression causing markers to be clipped after setSize.

# 4.1.0 / 2015-02-16

* Updated Highcharts to 4.1.0
  * Added polygon series type
  * Added e.category event argument in drilldown events to make it clear when a category is clicked. Related to #3771.
  * Added new option to the data module, firstRowAsNames.
  * Added new option, pointIntervalUnit, in order to allow months and years as point intervals. Closes #3329.
  * Added beforePrint and afterPrint events. Related to #2284 and #3729.
  * Added new method, Series.removePoint, to allow removing points that are not instanciated on demand.
  * Added new option, global.getTimezoneOffset, to allow integration with third party timezone libraries like moment-timezone.js.
  * Added new Axis option, tickAmount. Refactored alignTicks on multi-axis charts to first compute a tickAmount, then make all axes comply with that.
  * Added new Axis option, autoRotation as an array of possible values.
  * Added new callback option, tooltip.pointFormatter.
  * Added polar support for arearange. Issue #3419.
  * In solid gauges, added support for initial animation as well as setting animation object for updates. Closes #3135.
  * Made the entire numberFormat method settable and wrappable from the outside.
  * Made tooltip.followTouchMove true by default, and allowed page scroll at the same time.
  * Implemented support for "contrast" color setting in data labels. When the data label is inside a shape (like a column), this will ensure the best readability.
  * On category axes, let the crosshair width cover the whole category like a band.
  * Refactored zIndex handling on SVGElements so that the zIndex can also be modified after the element is first added.
  * Changed the Axis.tickPositioner callback so that the default tick positioning logic runs first, to allow modification in the tick positioner instead of creating positions from scratch. Closes #3538.
  * Made the legend draw below or above the plot area in cases where it is placed in a corner and the layout is horizontal.
  * Implemented algorithm for setting precise tooltip xDateFormat when needed, but general format like year, month, day etc. when the time falls on midnight and the closest point range dictates it. Related to #3329.
  * New default behaviour for the xAxis.minTickInterval option on datetime axis. It now goes to the closest point range by default.
  * Implemented silent degradation instead of error 19 when user options dictate too many ticks on an axis.
  * Removed overflow:justify logic. Instead, move labels and add ellipsis in case of overflow.
  * Export server: Adapted to PhantomJS 2
  * Export server: Implemented XSS filter
  * Fixed #3778, redundant legend paging visible after redraw
  * Fixed error on applying stacking to area range series.
  * Fixed #3743, minor ticks rendered outside plot area
  * Partly fixed #3506, overlapping axis labels on polar chart
  * Fixed #3728, Point.update not updating category name.
  * Fixed waterfall issue where the upColor stayed after updating point to negative. Related to #3710.
  * Fixed #3724, JS error on preventing the selection event and running setExtremes immediately.
  * Don't allow decimals on yearly X axis.
  * Fixed #3197, drilldown with hidden series.
  * Fixed #3719, updating areaspline to area failed
  * Fixed #3703, show no-data message on hidden series also.
  * Fixed #3679, no-data label not realigning after showing hidden container.
  * Fixed #3710, update point did not update sum in waterfalls.
  * Fixed #3712, checkboxClick not handled for pie charts.
  * Fixed #3708, color disappearing on redraw of solid gauge.
  * Fixed #3702, JS error when running setData on a hidden series
  * Fixed #3670, funnel ignored point specific border settings on init.
  * Fixed #3648, data label posision for column incorrect when using custom positioned Y axis in inverted chart.
  * Fixed #3654, millisecond ticks not placed correctly
  * Fixed #3652, minor grid lines sometimes rendering outside the plot area to the right.
  * Fixed #3201, crashes when zooming too far in on a dashed series.
  * Fixed data module issue with blank chart when using forced categories with data longer than turboThreshold.
  * Fixed #3635, markers overlapping in cases where they should not, according to the default behaviour.
  * Fixed #2361, plot bands disappearing under certain conditions when zooming in so that parts are clipped.
  * Fixed #3636, negative colors not applied on hover.
  * Fixed #3623, negative values in pies causing bad drawing after running setData.
  * Fixed #3575, huge columns not rendering on Chrome.
  * Fixed #3608, reversed Y axis in gauges causing arcs to be drawn inside out.
  * Fixed #3600, errors raised in modules when a chart was destroyed in its own callback.
  * Fixed #3346, tooltip failed for two Y axes side by side.
  * Fixed #3579, mixed up levels in multidimensional drilldown.
  * Fixed #3569, reset zoom button disappeared after multiple zoom operations in empty area.
  * Fixed #3390, single heatmap point getting huge size and causing rendering defects. Better axis metrics for single points. Closes #2515.
  * Fixed #3544, drilling up failed when top series data was added dynamically.
  * Fixed #3536, implemented error message on wrong color definitions in heat maps.
  * Fixed #3525, error 12 in master-detail demo.
  * Fixed #3295 and #3514 label box not rendered correctly with 0 values.
  * Fixed #3507, fixed width tooltip with a single word on the last line was clipped horizontally.
  * Fixed #3501, long axis labels taking up too much space instead of wrapping in drilldown charts.
  * Fixed #3500, monthly and yearly X axis ticks having the wrong distribution when using timezoneOffset.
  * Fixed #3449, export menu not working on touch devices when zoomType was set.
  * Fixed #3391, halo not hidden on hiding a pie slice from legend
  * Fixed #2889, tooltip not displayed on line series when followPointer was true. Closes #3258.
  * Fixed #3176, updating gauge axis caused background to disappear.
  * Fixed #2919, errors and wrong behaviours on multi-level drilldown.
  * Fixed #3445, pie charts showing wrong bullet color in tooltip.
  * Fixed #2919, errors on drilldown with multiple axes.
  * Fixed #2912, JS error on drawing hidden waterfall
  * Fixed #3437, data module failing with numeric data in first column
  * Fixed #3436 causing round linecaps on median lines in box plots. Reverted fix for #1638, a workaround for a Firefox bug regarding linecaps. Newer Firefox versions don't have the bug.
  * Fixed #3431, regression causing error 16 not to be triggered.
  * Fixed #3434, error 10 throwed with null values on logarithmic axis.
  * Fixed #3380, a regression causing Series.update not to honour updated zIndex.
  * Fixed #3240, 3d pie labels with 0 values
  * Fixed #3418, wrong default tooltip header date format when passing points every two days, two months etc.
  * Fixed #3416, broken tooltip on colorAxis
  * Fixed #3152, tooltip didn't display on the far left of a zoomed axis with categories.
  * Fixed #3382, line series disappering when a negativeColor was applied and the threshold was way beyond the chart.
  * Fixed #3411, align ticks fails without ticks
  * Fixed #3402, redundant halo on heatmap.
  * Fixed #3404, regression causing canvas heatmap to white out.
  * Fixed #3402, issue with updating bar to pie.
  * Fixed #3389, JS error when drilling up multi-level too quickly.

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
