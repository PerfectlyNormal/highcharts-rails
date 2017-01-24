/**
 * @license Highcharts JS v5.0.7 (2017-01-17)
 * Highstock as a plugin for Highcharts
 *
 * (c) 2017 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */
(function(factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }
}(function(Highcharts) {
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            Axis = H.Axis,
            Chart = H.Chart,
            css = H.css,
            dateFormat = H.dateFormat,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            noop = H.noop,
            Series = H.Series,
            timeUnits = H.timeUnits,
            wrap = H.wrap;

        /* ****************************************************************************
         * Start ordinal axis logic                                                   *
         *****************************************************************************/


        wrap(Series.prototype, 'init', function(proceed) {
            var series = this,
                xAxis;

            // call the original function
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));

            xAxis = series.xAxis;

            // Destroy the extended ordinal index on updated data
            if (xAxis && xAxis.options.ordinal) {
                addEvent(series, 'updatedData', function() {
                    delete xAxis.ordinalIndex;
                });
            }
        });

        /**
         * In an ordinal axis, there might be areas with dense consentrations of points, then large
         * gaps between some. Creating equally distributed ticks over this entire range
         * may lead to a huge number of ticks that will later be removed. So instead, break the
         * positions up in segments, find the tick positions for each segment then concatenize them.
         * This method is used from both data grouping logic and X axis tick position logic.
         */
        wrap(Axis.prototype, 'getTimeTicks', function(proceed, normalizedInterval, min, max, startOfWeek, positions, closestDistance, findHigherRanks) {

            var start = 0,
                end,
                segmentPositions,
                higherRanks = {},
                hasCrossedHigherRank,
                info,
                posLength,
                outsideMax,
                groupPositions = [],
                lastGroupPosition = -Number.MAX_VALUE,
                tickPixelIntervalOption = this.options.tickPixelInterval;

            // The positions are not always defined, for example for ordinal positions when data
            // has regular interval (#1557, #2090)
            if ((!this.options.ordinal && !this.options.breaks) || !positions || positions.length < 3 || min === undefined) {
                return proceed.call(this, normalizedInterval, min, max, startOfWeek);
            }

            // Analyze the positions array to split it into segments on gaps larger than 5 times
            // the closest distance. The closest distance is already found at this point, so
            // we reuse that instead of computing it again.
            posLength = positions.length;

            for (end = 0; end < posLength; end++) {

                outsideMax = end && positions[end - 1] > max;

                if (positions[end] < min) { // Set the last position before min
                    start = end;
                }

                if (end === posLength - 1 || positions[end + 1] - positions[end] > closestDistance * 5 || outsideMax) {

                    // For each segment, calculate the tick positions from the getTimeTicks utility
                    // function. The interval will be the same regardless of how long the segment is.
                    if (positions[end] > lastGroupPosition) { // #1475

                        segmentPositions = proceed.call(this, normalizedInterval, positions[start], positions[end], startOfWeek);

                        // Prevent duplicate groups, for example for multiple segments within one larger time frame (#1475)
                        while (segmentPositions.length && segmentPositions[0] <= lastGroupPosition) {
                            segmentPositions.shift();
                        }
                        if (segmentPositions.length) {
                            lastGroupPosition = segmentPositions[segmentPositions.length - 1];
                        }

                        groupPositions = groupPositions.concat(segmentPositions);
                    }
                    // Set start of next segment
                    start = end + 1;
                }

                if (outsideMax) {
                    break;
                }
            }

            // Get the grouping info from the last of the segments. The info is the same for
            // all segments.
            info = segmentPositions.info;

            // Optionally identify ticks with higher rank, for example when the ticks
            // have crossed midnight.
            if (findHigherRanks && info.unitRange <= timeUnits.hour) {
                end = groupPositions.length - 1;

                // Compare points two by two
                for (start = 1; start < end; start++) {
                    if (dateFormat('%d', groupPositions[start]) !== dateFormat('%d', groupPositions[start - 1])) {
                        higherRanks[groupPositions[start]] = 'day';
                        hasCrossedHigherRank = true;
                    }
                }

                // If the complete array has crossed midnight, we want to mark the first
                // positions also as higher rank
                if (hasCrossedHigherRank) {
                    higherRanks[groupPositions[0]] = 'day';
                }
                info.higherRanks = higherRanks;
            }

            // Save the info
            groupPositions.info = info;



            // Don't show ticks within a gap in the ordinal axis, where the space between
            // two points is greater than a portion of the tick pixel interval
            if (findHigherRanks && defined(tickPixelIntervalOption)) { // check for squashed ticks

                var length = groupPositions.length,
                    i = length,
                    itemToRemove,
                    translated,
                    translatedArr = [],
                    lastTranslated,
                    medianDistance,
                    distance,
                    distances = [];

                // Find median pixel distance in order to keep a reasonably even distance between
                // ticks (#748)
                while (i--) {
                    translated = this.translate(groupPositions[i]);
                    if (lastTranslated) {
                        distances[i] = lastTranslated - translated;
                    }
                    translatedArr[i] = lastTranslated = translated;
                }
                distances.sort();
                medianDistance = distances[Math.floor(distances.length / 2)];
                if (medianDistance < tickPixelIntervalOption * 0.6) {
                    medianDistance = null;
                }

                // Now loop over again and remove ticks where needed
                i = groupPositions[length - 1] > max ? length - 1 : length; // #817
                lastTranslated = undefined;
                while (i--) {
                    translated = translatedArr[i];
                    distance = Math.abs(lastTranslated - translated);
                    // #4175 - when axis is reversed, the distance, is negative but 
                    // tickPixelIntervalOption positive, so we need to compare the same values

                    // Remove ticks that are closer than 0.6 times the pixel interval from the one to the right,
                    // but not if it is close to the median distance (#748).
                    if (lastTranslated && distance < tickPixelIntervalOption * 0.8 &&
                        (medianDistance === null || distance < medianDistance * 0.8)) {

                        // Is this a higher ranked position with a normal position to the right?
                        if (higherRanks[groupPositions[i]] && !higherRanks[groupPositions[i + 1]]) {

                            // Yes: remove the lower ranked neighbour to the right
                            itemToRemove = i + 1;
                            lastTranslated = translated; // #709

                        } else {

                            // No: remove this one
                            itemToRemove = i;
                        }

                        groupPositions.splice(itemToRemove, 1);

                    } else {
                        lastTranslated = translated;
                    }
                }
            }
            return groupPositions;
        });

        // Extend the Axis prototype
        extend(Axis.prototype, /** @lends Axis.prototype */ {

            /**
             * Calculate the ordinal positions before tick positions are calculated.
             */
            beforeSetTickPositions: function() {
                var axis = this,
                    len,
                    ordinalPositions = [],
                    useOrdinal = false,
                    dist,
                    extremes = axis.getExtremes(),
                    min = extremes.min,
                    max = extremes.max,
                    minIndex,
                    maxIndex,
                    slope,
                    hasBreaks = axis.isXAxis && !!axis.options.breaks,
                    isOrdinal = axis.options.ordinal,
                    ignoreHiddenSeries = axis.chart.options.chart.ignoreHiddenSeries,
                    i;

                // apply the ordinal logic
                if (isOrdinal || hasBreaks) { // #4167 YAxis is never ordinal ?

                    each(axis.series, function(series, i) {

                        if ((!ignoreHiddenSeries || series.visible !== false) && (series.takeOrdinalPosition !== false || hasBreaks)) {

                            // concatenate the processed X data into the existing positions, or the empty array
                            ordinalPositions = ordinalPositions.concat(series.processedXData);
                            len = ordinalPositions.length;

                            // remove duplicates (#1588)
                            ordinalPositions.sort(function(a, b) {
                                return a - b; // without a custom function it is sorted as strings
                            });

                            if (len) {
                                i = len - 1;
                                while (i--) {
                                    if (ordinalPositions[i] === ordinalPositions[i + 1]) {
                                        ordinalPositions.splice(i, 1);
                                    }
                                }
                            }
                        }

                    });

                    // cache the length
                    len = ordinalPositions.length;

                    // Check if we really need the overhead of mapping axis data against the ordinal positions.
                    // If the series consist of evenly spaced data any way, we don't need any ordinal logic.
                    if (len > 2) { // two points have equal distance by default
                        dist = ordinalPositions[1] - ordinalPositions[0];
                        i = len - 1;
                        while (i-- && !useOrdinal) {
                            if (ordinalPositions[i + 1] - ordinalPositions[i] !== dist) {
                                useOrdinal = true;
                            }
                        }

                        // When zooming in on a week, prevent axis padding for weekends even though the data within
                        // the week is evenly spaced.
                        if (!axis.options.keepOrdinalPadding && (ordinalPositions[0] - min > dist || max - ordinalPositions[ordinalPositions.length - 1] > dist)) {
                            useOrdinal = true;
                        }
                    }

                    // Record the slope and offset to compute the linear values from the array index.
                    // Since the ordinal positions may exceed the current range, get the start and
                    // end positions within it (#719, #665b)
                    if (useOrdinal) {

                        // Register
                        axis.ordinalPositions = ordinalPositions;

                        // This relies on the ordinalPositions being set. Use Math.max
                        // and Math.min to prevent padding on either sides of the data.
                        minIndex = axis.ordinal2lin( // #5979
                            Math.max(
                                min,
                                ordinalPositions[0]
                            ),
                            true
                        );
                        maxIndex = Math.max(axis.ordinal2lin(
                            Math.min(
                                max,
                                ordinalPositions[ordinalPositions.length - 1]
                            ),
                            true
                        ), 1); // #3339

                        // Set the slope and offset of the values compared to the indices in the ordinal positions
                        axis.ordinalSlope = slope = (max - min) / (maxIndex - minIndex);
                        axis.ordinalOffset = min - (minIndex * slope);

                    } else {
                        axis.ordinalPositions = axis.ordinalSlope = axis.ordinalOffset = undefined;
                    }
                }
                axis.isOrdinal = isOrdinal && useOrdinal; // #3818, #4196, #4926
                axis.groupIntervalFactor = null; // reset for next run
            },
            /**
             * Translate from a linear axis value to the corresponding ordinal axis position. If there
             * are no gaps in the ordinal axis this will be the same. The translated value is the value
             * that the point would have if the axis were linear, using the same min and max.
             *
             * @param Number val The axis value
             * @param Boolean toIndex Whether to return the index in the ordinalPositions or the new value
             */
            val2lin: function(val, toIndex) {
                var axis = this,
                    ordinalPositions = axis.ordinalPositions,
                    ret;

                if (!ordinalPositions) {
                    ret = val;

                } else {

                    var ordinalLength = ordinalPositions.length,
                        i,
                        distance,
                        ordinalIndex;

                    // first look for an exact match in the ordinalpositions array
                    i = ordinalLength;
                    while (i--) {
                        if (ordinalPositions[i] === val) {
                            ordinalIndex = i;
                            break;
                        }
                    }

                    // if that failed, find the intermediate position between the two nearest values
                    i = ordinalLength - 1;
                    while (i--) {
                        if (val > ordinalPositions[i] || i === 0) { // interpolate
                            distance = (val - ordinalPositions[i]) / (ordinalPositions[i + 1] - ordinalPositions[i]); // something between 0 and 1
                            ordinalIndex = i + distance;
                            break;
                        }
                    }
                    ret = toIndex ?
                        ordinalIndex :
                        axis.ordinalSlope * (ordinalIndex || 0) + axis.ordinalOffset;
                }
                return ret;
            },
            /**
             * Translate from linear (internal) to axis value
             *
             * @param Number val The linear abstracted value
             * @param Boolean fromIndex Translate from an index in the ordinal positions rather than a value
             */
            lin2val: function(val, fromIndex) {
                var axis = this,
                    ordinalPositions = axis.ordinalPositions,
                    ret;

                if (!ordinalPositions) { // the visible range contains only equally spaced values
                    ret = val;

                } else {

                    var ordinalSlope = axis.ordinalSlope,
                        ordinalOffset = axis.ordinalOffset,
                        i = ordinalPositions.length - 1,
                        linearEquivalentLeft,
                        linearEquivalentRight,
                        distance;


                    // Handle the case where we translate from the index directly, used only
                    // when panning an ordinal axis
                    if (fromIndex) {

                        if (val < 0) { // out of range, in effect panning to the left
                            val = ordinalPositions[0];
                        } else if (val > i) { // out of range, panning to the right
                            val = ordinalPositions[i];
                        } else { // split it up
                            i = Math.floor(val);
                            distance = val - i; // the decimal
                        }

                        // Loop down along the ordinal positions. When the linear equivalent of i matches
                        // an ordinal position, interpolate between the left and right values.
                    } else {
                        while (i--) {
                            linearEquivalentLeft = (ordinalSlope * i) + ordinalOffset;
                            if (val >= linearEquivalentLeft) {
                                linearEquivalentRight = (ordinalSlope * (i + 1)) + ordinalOffset;
                                distance = (val - linearEquivalentLeft) / (linearEquivalentRight - linearEquivalentLeft); // something between 0 and 1
                                break;
                            }
                        }
                    }

                    // If the index is within the range of the ordinal positions, return the associated
                    // or interpolated value. If not, just return the value
                    return distance !== undefined && ordinalPositions[i] !== undefined ?
                        ordinalPositions[i] + (distance ? distance * (ordinalPositions[i + 1] - ordinalPositions[i]) : 0) :
                        val;
                }
                return ret;
            },
            /**
             * Get the ordinal positions for the entire data set. This is necessary in chart panning
             * because we need to find out what points or data groups are available outside the
             * visible range. When a panning operation starts, if an index for the given grouping
             * does not exists, it is created and cached. This index is deleted on updated data, so
             * it will be regenerated the next time a panning operation starts.
             */
            getExtendedPositions: function() {
                var axis = this,
                    chart = axis.chart,
                    grouping = axis.series[0].currentDataGrouping,
                    ordinalIndex = axis.ordinalIndex,
                    key = grouping ? grouping.count + grouping.unitName : 'raw',
                    extremes = axis.getExtremes(),
                    fakeAxis,
                    fakeSeries;

                // If this is the first time, or the ordinal index is deleted by updatedData,
                // create it.
                if (!ordinalIndex) {
                    ordinalIndex = axis.ordinalIndex = {};
                }


                if (!ordinalIndex[key]) {

                    // Create a fake axis object where the extended ordinal positions are emulated
                    fakeAxis = {
                        series: [],
                        chart: chart,
                        getExtremes: function() {
                            return {
                                min: extremes.dataMin,
                                max: extremes.dataMax
                            };
                        },
                        options: {
                            ordinal: true
                        },
                        val2lin: Axis.prototype.val2lin // #2590
                    };

                    // Add the fake series to hold the full data, then apply processData to it
                    each(axis.series, function(series) {
                        fakeSeries = {
                            xAxis: fakeAxis,
                            xData: series.xData,
                            chart: chart,
                            destroyGroupedData: noop
                        };
                        fakeSeries.options = {
                            dataGrouping: grouping ? {
                                enabled: true,
                                forced: true,
                                approximation: 'open', // doesn't matter which, use the fastest
                                units: [
                                    [grouping.unitName, [grouping.count]]
                                ]
                            } : {
                                enabled: false
                            }
                        };
                        series.processData.apply(fakeSeries);

                        fakeAxis.series.push(fakeSeries);
                    });

                    // Run beforeSetTickPositions to compute the ordinalPositions
                    axis.beforeSetTickPositions.apply(fakeAxis);

                    // Cache it
                    ordinalIndex[key] = fakeAxis.ordinalPositions;
                }
                return ordinalIndex[key];
            },

            /**
             * Find the factor to estimate how wide the plot area would have been if ordinal
             * gaps were included. This value is used to compute an imagined plot width in order
             * to establish the data grouping interval.
             *
             * A real world case is the intraday-candlestick
             * example. Without this logic, it would show the correct data grouping when viewing
             * a range within each day, but once moving the range to include the gap between two
             * days, the interval would include the cut-away night hours and the data grouping
             * would be wrong. So the below method tries to compensate by identifying the most
             * common point interval, in this case days.
             *
             * An opposite case is presented in issue #718. We have a long array of daily data,
             * then one point is appended one hour after the last point. We expect the data grouping
             * not to change.
             *
             * In the future, if we find cases where this estimation doesn't work optimally, we
             * might need to add a second pass to the data grouping logic, where we do another run
             * with a greater interval if the number of data groups is more than a certain fraction
             * of the desired group count.
             */
            getGroupIntervalFactor: function(xMin, xMax, series) {
                var i,
                    processedXData = series.processedXData,
                    len = processedXData.length,
                    distances = [],
                    median,
                    groupIntervalFactor = this.groupIntervalFactor;

                // Only do this computation for the first series, let the other inherit it (#2416)
                if (!groupIntervalFactor) {

                    // Register all the distances in an array
                    for (i = 0; i < len - 1; i++) {
                        distances[i] = processedXData[i + 1] - processedXData[i];
                    }

                    // Sort them and find the median
                    distances.sort(function(a, b) {
                        return a - b;
                    });
                    median = distances[Math.floor(len / 2)];

                    // Compensate for series that don't extend through the entire axis extent. #1675.
                    xMin = Math.max(xMin, processedXData[0]);
                    xMax = Math.min(xMax, processedXData[len - 1]);

                    this.groupIntervalFactor = groupIntervalFactor = (len * median) / (xMax - xMin);
                }

                // Return the factor needed for data grouping
                return groupIntervalFactor;
            },

            /**
             * Make the tick intervals closer because the ordinal gaps make the ticks spread out or cluster
             */
            postProcessTickInterval: function(tickInterval) {
                // Problem: http://jsfiddle.net/highcharts/FQm4E/1/
                // This is a case where this algorithm doesn't work optimally. In this case, the
                // tick labels are spread out per week, but all the gaps reside within weeks. So
                // we have a situation where the labels are courser than the ordinal gaps, and
                // thus the tick interval should not be altered
                var ordinalSlope = this.ordinalSlope,
                    ret;


                if (ordinalSlope) {
                    if (!this.options.breaks) {
                        ret = tickInterval / (ordinalSlope / this.closestPointRange);
                    } else {
                        ret = this.closestPointRange;
                    }
                } else {
                    ret = tickInterval;
                }
                return ret;
            }
        });

        // Record this to prevent overwriting by broken-axis module (#5979)
        Axis.prototype.ordinal2lin = Axis.prototype.val2lin;

        // Extending the Chart.pan method for ordinal axes
        wrap(Chart.prototype, 'pan', function(proceed, e) {
            var chart = this,
                xAxis = chart.xAxis[0],
                chartX = e.chartX,
                runBase = false;

            if (xAxis.options.ordinal && xAxis.series.length) {

                var mouseDownX = chart.mouseDownX,
                    extremes = xAxis.getExtremes(),
                    dataMax = extremes.dataMax,
                    min = extremes.min,
                    max = extremes.max,
                    trimmedRange,
                    hoverPoints = chart.hoverPoints,
                    closestPointRange = xAxis.closestPointRange,
                    pointPixelWidth = xAxis.translationSlope * (xAxis.ordinalSlope || closestPointRange),
                    movedUnits = (mouseDownX - chartX) / pointPixelWidth, // how many ordinal units did we move?
                    extendedAxis = {
                        ordinalPositions: xAxis.getExtendedPositions()
                    }, // get index of all the chart's points
                    ordinalPositions,
                    searchAxisLeft,
                    lin2val = xAxis.lin2val,
                    val2lin = xAxis.val2lin,
                    searchAxisRight;

                if (!extendedAxis.ordinalPositions) { // we have an ordinal axis, but the data is equally spaced
                    runBase = true;

                } else if (Math.abs(movedUnits) > 1) {

                    // Remove active points for shared tooltip
                    if (hoverPoints) {
                        each(hoverPoints, function(point) {
                            point.setState();
                        });
                    }

                    if (movedUnits < 0) {
                        searchAxisLeft = extendedAxis;
                        searchAxisRight = xAxis.ordinalPositions ? xAxis : extendedAxis;
                    } else {
                        searchAxisLeft = xAxis.ordinalPositions ? xAxis : extendedAxis;
                        searchAxisRight = extendedAxis;
                    }

                    // In grouped data series, the last ordinal position represents the grouped data, which is
                    // to the left of the real data max. If we don't compensate for this, we will be allowed
                    // to pan grouped data series passed the right of the plot area.
                    ordinalPositions = searchAxisRight.ordinalPositions;
                    if (dataMax > ordinalPositions[ordinalPositions.length - 1]) {
                        ordinalPositions.push(dataMax);
                    }

                    // Get the new min and max values by getting the ordinal index for the current extreme,
                    // then add the moved units and translate back to values. This happens on the
                    // extended ordinal positions if the new position is out of range, else it happens
                    // on the current x axis which is smaller and faster.
                    chart.fixedRange = max - min;
                    trimmedRange = xAxis.toFixedRange(null, null,
                        lin2val.apply(searchAxisLeft, [
                            val2lin.apply(searchAxisLeft, [min, true]) + movedUnits, // the new index
                            true // translate from index
                        ]),
                        lin2val.apply(searchAxisRight, [
                            val2lin.apply(searchAxisRight, [max, true]) + movedUnits, // the new index
                            true // translate from index
                        ])
                    );

                    // Apply it if it is within the available data range
                    if (trimmedRange.min >= Math.min(extremes.dataMin, min) && trimmedRange.max <= Math.max(dataMax, max)) {
                        xAxis.setExtremes(trimmedRange.min, trimmedRange.max, true, false, {
                            trigger: 'pan'
                        });
                    }

                    chart.mouseDownX = chartX; // set new reference for next run
                    css(chart.container, {
                        cursor: 'move'
                    });
                }

            } else {
                runBase = true;
            }

            // revert to the linear chart.pan version
            if (runBase) {
                // call the original function
                proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            }
        });



        /**
         * Extend getGraphPath by identifying gaps in the ordinal data so that we can draw a gap in the
         * line or area
         */
        Series.prototype.gappedPath = function() {
            var gapSize = this.options.gapSize,
                points = this.points.slice(),
                i = points.length - 1;

            if (gapSize && i > 0) { // #5008

                // extension for ordinal breaks
                while (i--) {
                    if (points[i + 1].x - points[i].x > this.closestPointRange * gapSize) {
                        points.splice( // insert after this one
                            i + 1,
                            0, {
                                isNull: true
                            }
                        );
                    }
                }
            }

            // Call base method
            //return proceed.call(this, points, a, b);
            return this.getGraphPath(points);
        };

        /* ****************************************************************************
         * End ordinal axis logic                                                   *
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2009-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';

        var pick = H.pick,
            wrap = H.wrap,
            each = H.each,
            extend = H.extend,
            isArray = H.isArray,
            fireEvent = H.fireEvent,
            Axis = H.Axis,
            Series = H.Series;

        function stripArguments() {
            return Array.prototype.slice.call(arguments, 1);
        }

        extend(Axis.prototype, {
            isInBreak: function(brk, val) {
                var ret,
                    repeat = brk.repeat || Infinity,
                    from = brk.from,
                    length = brk.to - brk.from,
                    test = (val >= from ? (val - from) % repeat : repeat - ((from - val) % repeat));

                if (!brk.inclusive) {
                    ret = test < length && test !== 0;
                } else {
                    ret = test <= length;
                }
                return ret;
            },

            isInAnyBreak: function(val, testKeep) {

                var breaks = this.options.breaks,
                    i = breaks && breaks.length,
                    inbrk,
                    keep,
                    ret;


                if (i) {

                    while (i--) {
                        if (this.isInBreak(breaks[i], val)) {
                            inbrk = true;
                            if (!keep) {
                                keep = pick(breaks[i].showPoints, this.isXAxis ? false : true);
                            }
                        }
                    }

                    if (inbrk && testKeep) {
                        ret = inbrk && !keep;
                    } else {
                        ret = inbrk;
                    }
                }
                return ret;
            }
        });

        wrap(Axis.prototype, 'setTickPositions', function(proceed) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));

            if (this.options.breaks) {
                var axis = this,
                    tickPositions = this.tickPositions,
                    info = this.tickPositions.info,
                    newPositions = [],
                    i;

                for (i = 0; i < tickPositions.length; i++) {
                    if (!axis.isInAnyBreak(tickPositions[i])) {
                        newPositions.push(tickPositions[i]);
                    }
                }

                this.tickPositions = newPositions;
                this.tickPositions.info = info;
            }
        });

        wrap(Axis.prototype, 'init', function(proceed, chart, userOptions) {
            var axis = this,
                breaks;
            // Force Axis to be not-ordinal when breaks are defined
            if (userOptions.breaks && userOptions.breaks.length) {
                userOptions.ordinal = false;
            }
            proceed.call(this, chart, userOptions);
            breaks = this.options.breaks;
            axis.isBroken = (isArray(breaks) && !!breaks.length);
            if (axis.isBroken) {
                axis.val2lin = function(val) {
                    var nval = val,
                        brk,
                        i;

                    for (i = 0; i < axis.breakArray.length; i++) {
                        brk = axis.breakArray[i];
                        if (brk.to <= val) {
                            nval -= brk.len;
                        } else if (brk.from >= val) {
                            break;
                        } else if (axis.isInBreak(brk, val)) {
                            nval -= (val - brk.from);
                            break;
                        }
                    }

                    return nval;
                };

                axis.lin2val = function(val) {
                    var nval = val,
                        brk,
                        i;

                    for (i = 0; i < axis.breakArray.length; i++) {
                        brk = axis.breakArray[i];
                        if (brk.from >= nval) {
                            break;
                        } else if (brk.to < nval) {
                            nval += brk.len;
                        } else if (axis.isInBreak(brk, nval)) {
                            nval += brk.len;
                        }
                    }
                    return nval;
                };

                axis.setExtremes = function(newMin, newMax, redraw, animation, eventArguments) {
                    // If trying to set extremes inside a break, extend it to before and after the break ( #3857 )
                    while (this.isInAnyBreak(newMin)) {
                        newMin -= this.closestPointRange;
                    }
                    while (this.isInAnyBreak(newMax)) {
                        newMax -= this.closestPointRange;
                    }
                    Axis.prototype.setExtremes.call(this, newMin, newMax, redraw, animation, eventArguments);
                };

                axis.setAxisTranslation = function(saveOld) {
                    Axis.prototype.setAxisTranslation.call(this, saveOld);

                    var breaks = axis.options.breaks,
                        breakArrayT = [], // Temporary one
                        breakArray = [],
                        length = 0,
                        inBrk,
                        repeat,
                        brk,
                        min = axis.userMin || axis.min,
                        max = axis.userMax || axis.max,
                        start,
                        i,
                        j;

                    // Min & max check (#4247)
                    for (i in breaks) {
                        brk = breaks[i];
                        repeat = brk.repeat || Infinity;
                        if (axis.isInBreak(brk, min)) {
                            min += (brk.to % repeat) - (min % repeat);
                        }
                        if (axis.isInBreak(brk, max)) {
                            max -= (max % repeat) - (brk.from % repeat);
                        }
                    }

                    // Construct an array holding all breaks in the axis
                    for (i in breaks) {
                        brk = breaks[i];
                        start = brk.from;
                        repeat = brk.repeat || Infinity;

                        while (start - repeat > min) {
                            start -= repeat;
                        }
                        while (start < min) {
                            start += repeat;
                        }

                        for (j = start; j < max; j += repeat) {
                            breakArrayT.push({
                                value: j,
                                move: 'in'
                            });
                            breakArrayT.push({
                                value: j + (brk.to - brk.from),
                                move: 'out',
                                size: brk.breakSize
                            });
                        }
                    }

                    breakArrayT.sort(function(a, b) {
                        var ret;
                        if (a.value === b.value) {
                            ret = (a.move === 'in' ? 0 : 1) - (b.move === 'in' ? 0 : 1);
                        } else {
                            ret = a.value - b.value;
                        }
                        return ret;
                    });

                    // Simplify the breaks
                    inBrk = 0;
                    start = min;

                    for (i in breakArrayT) {
                        brk = breakArrayT[i];
                        inBrk += (brk.move === 'in' ? 1 : -1);

                        if (inBrk === 1 && brk.move === 'in') {
                            start = brk.value;
                        }
                        if (inBrk === 0) {
                            breakArray.push({
                                from: start,
                                to: brk.value,
                                len: brk.value - start - (brk.size || 0)
                            });
                            length += brk.value - start - (brk.size || 0);
                        }
                    }

                    axis.breakArray = breakArray;

                    fireEvent(axis, 'afterBreaks');

                    axis.transA *= ((max - axis.min) / (max - min - length));

                    axis.min = min;
                    axis.max = max;
                };
            }
        });

        wrap(Series.prototype, 'generatePoints', function(proceed) {

            proceed.apply(this, stripArguments(arguments));

            var series = this,
                xAxis = series.xAxis,
                yAxis = series.yAxis,
                points = series.points,
                point,
                i = points.length,
                connectNulls = series.options.connectNulls,
                nullGap;


            if (xAxis && yAxis && (xAxis.options.breaks || yAxis.options.breaks)) {
                while (i--) {
                    point = points[i];

                    nullGap = point.y === null && connectNulls === false; // respect nulls inside the break (#4275)
                    if (!nullGap && (xAxis.isInAnyBreak(point.x, true) || yAxis.isInAnyBreak(point.y, true))) {
                        points.splice(i, 1);
                        if (this.data[i]) {
                            this.data[i].destroyElements(); // removes the graphics for this point if they exist
                        }
                    }
                }
            }

        });

        function drawPointsWrapped(proceed) {
            proceed.apply(this);
            this.drawBreaks(this.xAxis, ['x']);
            this.drawBreaks(this.yAxis, pick(this.pointArrayMap, ['y']));
        }

        H.Series.prototype.drawBreaks = function(axis, keys) {
            var series = this,
                points = series.points,
                breaks,
                threshold,
                eventName,
                y;

            if (!axis) {
                return; // #5950
            }

            each(keys, function(key) {
                breaks = axis.breakArray || [];
                threshold = axis.isXAxis ? axis.min : pick(series.options.threshold, axis.min);
                each(points, function(point) {
                    y = pick(point['stack' + key.toUpperCase()], point[key]);
                    each(breaks, function(brk) {
                        eventName = false;

                        if ((threshold < brk.from && y > brk.to) || (threshold > brk.from && y < brk.from)) {
                            eventName = 'pointBreak';
                        } else if ((threshold < brk.from && y > brk.from && y < brk.to) || (threshold > brk.from && y > brk.to && y < brk.from)) { // point falls inside the break
                            eventName = 'pointInBreak';
                        }
                        if (eventName) {
                            fireEvent(axis, eventName, {
                                point: point,
                                brk: brk
                            });
                        }
                    });
                });
            });
        };

        wrap(H.seriesTypes.column.prototype, 'drawPoints', drawPointsWrapped);
        wrap(H.Series.prototype, 'drawPoints', drawPointsWrapped);

    }(Highcharts));
    (function() {

        'use strict';

    }());
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var arrayMax = H.arrayMax,
            arrayMin = H.arrayMin,
            Axis = H.Axis,
            defaultPlotOptions = H.defaultPlotOptions,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            format = H.format,
            isNumber = H.isNumber,
            merge = H.merge,
            pick = H.pick,
            Point = H.Point,
            Series = H.Series,
            Tooltip = H.Tooltip,
            wrap = H.wrap;

        /* ****************************************************************************
         * Start data grouping module												 *
         ******************************************************************************/

        var seriesProto = Series.prototype,
            baseProcessData = seriesProto.processData,
            baseGeneratePoints = seriesProto.generatePoints,
            baseDestroy = seriesProto.destroy,

            commonOptions = {
                approximation: 'average', // average, open, high, low, close, sum
                //enabled: null, // (true for stock charts, false for basic),
                //forced: undefined,
                groupPixelWidth: 2,
                // the first one is the point or start value, the second is the start value if we're dealing with range,
                // the third one is the end value if dealing with a range
                dateTimeLabelFormats: {
                    millisecond: ['%A, %b %e, %H:%M:%S.%L', '%A, %b %e, %H:%M:%S.%L', '-%H:%M:%S.%L'],
                    second: ['%A, %b %e, %H:%M:%S', '%A, %b %e, %H:%M:%S', '-%H:%M:%S'],
                    minute: ['%A, %b %e, %H:%M', '%A, %b %e, %H:%M', '-%H:%M'],
                    hour: ['%A, %b %e, %H:%M', '%A, %b %e, %H:%M', '-%H:%M'],
                    day: ['%A, %b %e, %Y', '%A, %b %e', '-%A, %b %e, %Y'],
                    week: ['Week from %A, %b %e, %Y', '%A, %b %e', '-%A, %b %e, %Y'],
                    month: ['%B %Y', '%B', '-%B %Y'],
                    year: ['%Y', '%Y', '-%Y']
                }
                // smoothed = false, // enable this for navigator series only
            },

            specificOptions = { // extends common options
                line: {},
                spline: {},
                area: {},
                areaspline: {},
                column: {
                    approximation: 'sum',
                    groupPixelWidth: 10
                },
                arearange: {
                    approximation: 'range'
                },
                areasplinerange: {
                    approximation: 'range'
                },
                columnrange: {
                    approximation: 'range',
                    groupPixelWidth: 10
                },
                candlestick: {
                    approximation: 'ohlc',
                    groupPixelWidth: 10
                },
                ohlc: {
                    approximation: 'ohlc',
                    groupPixelWidth: 5
                }
            },

            // units are defined in a separate array to allow complete overriding in case of a user option
            defaultDataGroupingUnits = H.defaultDataGroupingUnits = [
                [
                    'millisecond', // unit name
                    [1, 2, 5, 10, 20, 25, 50, 100, 200, 500] // allowed multiples
                ],
                [
                    'second', [1, 2, 5, 10, 15, 30]
                ],
                [
                    'minute', [1, 2, 5, 10, 15, 30]
                ],
                [
                    'hour', [1, 2, 3, 4, 6, 8, 12]
                ],
                [
                    'day', [1]
                ],
                [
                    'week', [1]
                ],
                [
                    'month', [1, 3, 6]
                ],
                [
                    'year',
                    null
                ]
            ],


            /**
             * Define the available approximation types. The data grouping approximations takes an array
             * or numbers as the first parameter. In case of ohlc, four arrays are sent in as four parameters.
             * Each array consists only of numbers. In case null values belong to the group, the property
             * .hasNulls will be set to true on the array.
             */
            approximations = {
                sum: function(arr) {
                    var len = arr.length,
                        ret;

                    // 1. it consists of nulls exclusively
                    if (!len && arr.hasNulls) {
                        ret = null;
                        // 2. it has a length and real values
                    } else if (len) {
                        ret = 0;
                        while (len--) {
                            ret += arr[len];
                        }
                    }
                    // 3. it has zero length, so just return undefined
                    // => doNothing()

                    return ret;
                },
                average: function(arr) {
                    var len = arr.length,
                        ret = approximations.sum(arr);

                    // If we have a number, return it divided by the length. If not, return
                    // null or undefined based on what the sum method finds.
                    if (isNumber(ret) && len) {
                        ret = ret / len;
                    }

                    return ret;
                },
                open: function(arr) {
                    return arr.length ? arr[0] : (arr.hasNulls ? null : undefined);
                },
                high: function(arr) {
                    return arr.length ? arrayMax(arr) : (arr.hasNulls ? null : undefined);
                },
                low: function(arr) {
                    return arr.length ? arrayMin(arr) : (arr.hasNulls ? null : undefined);
                },
                close: function(arr) {
                    return arr.length ? arr[arr.length - 1] : (arr.hasNulls ? null : undefined);
                },
                // ohlc and range are special cases where a multidimensional array is input and an array is output
                ohlc: function(open, high, low, close) {
                    open = approximations.open(open);
                    high = approximations.high(high);
                    low = approximations.low(low);
                    close = approximations.close(close);

                    if (isNumber(open) || isNumber(high) || isNumber(low) || isNumber(close)) {
                        return [open, high, low, close];
                    }
                    // else, return is undefined
                },
                range: function(low, high) {
                    low = approximations.low(low);
                    high = approximations.high(high);

                    if (isNumber(low) || isNumber(high)) {
                        return [low, high];
                    }
                    // else, return is undefined
                }
            };


        /**
         * Takes parallel arrays of x and y data and groups the data into intervals defined by groupPositions, a collection
         * of starting x values for each group.
         */
        seriesProto.groupData = function(xData, yData, groupPositions, approximation) {
            var series = this,
                data = series.data,
                dataOptions = series.options.data,
                groupedXData = [],
                groupedYData = [],
                groupMap = [],
                dataLength = xData.length,
                pointX,
                pointY,
                groupedY,
                handleYData = !!yData, // when grouping the fake extended axis for panning, we don't need to consider y
                values = [
                    [],
                    [],
                    [],
                    []
                ],
                approximationFn = typeof approximation === 'function' ? approximation : approximations[approximation],
                pointArrayMap = series.pointArrayMap,
                pointArrayMapLength = pointArrayMap && pointArrayMap.length,
                i,
                pos = 0,
                start = 0;

            // Start with the first point within the X axis range (#2696)
            for (i = 0; i <= dataLength; i++) {
                if (xData[i] >= groupPositions[0]) {
                    break;
                }
            }

            for (i; i <= dataLength; i++) {

                // when a new group is entered, summarize and initiate the previous group
                while ((groupPositions[pos + 1] !== undefined && xData[i] >= groupPositions[pos + 1]) ||
                    i === dataLength) { // get the last group

                    // get group x and y
                    pointX = groupPositions[pos];
                    series.dataGroupInfo = {
                        start: start,
                        length: values[0].length
                    };
                    groupedY = approximationFn.apply(series, values);

                    // push the grouped data
                    if (groupedY !== undefined) {
                        groupedXData.push(pointX);
                        groupedYData.push(groupedY);
                        groupMap.push(series.dataGroupInfo);
                    }

                    // reset the aggregate arrays
                    start = i;
                    values[0] = [];
                    values[1] = [];
                    values[2] = [];
                    values[3] = [];

                    // Advance on the group positions
                    pos += 1;

                    // don't loop beyond the last group
                    if (i === dataLength) {
                        break;
                    }
                }

                // break out
                if (i === dataLength) {
                    break;
                }

                // for each raw data point, push it to an array that contains all values for this specific group
                if (pointArrayMap) {

                    var index = series.cropStart + i,
                        point = (data && data[index]) || series.pointClass.prototype.applyOptions.apply({
                            series: series
                        }, [dataOptions[index]]),
                        j,
                        val;

                    for (j = 0; j < pointArrayMapLength; j++) {
                        val = point[pointArrayMap[j]];
                        if (isNumber(val)) {
                            values[j].push(val);
                        } else if (val === null) {
                            values[j].hasNulls = true;
                        }
                    }

                } else {
                    pointY = handleYData ? yData[i] : null;

                    if (isNumber(pointY)) {
                        values[0].push(pointY);
                    } else if (pointY === null) {
                        values[0].hasNulls = true;
                    }
                }
            }

            return [groupedXData, groupedYData, groupMap];
        };

        /**
         * Extend the basic processData method, that crops the data to the current zoom
         * range, with data grouping logic.
         */
        seriesProto.processData = function() {
            var series = this,
                chart = series.chart,
                options = series.options,
                dataGroupingOptions = options.dataGrouping,
                groupingEnabled = series.allowDG !== false && dataGroupingOptions &&
                pick(dataGroupingOptions.enabled, chart.options.isStock),
                visible = series.visible || !chart.options.chart.ignoreHiddenSeries,
                hasGroupedData,
                skip;

            // run base method
            series.forceCrop = groupingEnabled; // #334
            series.groupPixelWidth = null; // #2110
            series.hasProcessed = true; // #2692

            // skip if processData returns false or if grouping is disabled (in that order) or #5493
            skip = baseProcessData.apply(series, arguments) === false ||
                !groupingEnabled || !visible;
            if (!skip) {
                series.destroyGroupedData();

                var i,
                    processedXData = series.processedXData,
                    processedYData = series.processedYData,
                    plotSizeX = chart.plotSizeX,
                    xAxis = series.xAxis,
                    ordinal = xAxis.options.ordinal,
                    groupPixelWidth = series.groupPixelWidth = xAxis.getGroupPixelWidth && xAxis.getGroupPixelWidth();

                // Execute grouping if the amount of points is greater than the limit defined in groupPixelWidth
                if (groupPixelWidth) {
                    hasGroupedData = true;

                    series.isDirty = true; // force recreation of point instances in series.translate, #5699

                    var extremes = xAxis.getExtremes(),
                        xMin = extremes.min,
                        xMax = extremes.max,
                        groupIntervalFactor = (ordinal && xAxis.getGroupIntervalFactor(xMin, xMax, series)) || 1,
                        interval = (groupPixelWidth * (xMax - xMin) / plotSizeX) * groupIntervalFactor,
                        groupPositions = xAxis.getTimeTicks(
                            xAxis.normalizeTimeTickInterval(interval, dataGroupingOptions.units || defaultDataGroupingUnits),
                            Math.min(xMin, processedXData[0]), // Processed data may extend beyond axis (#4907)
                            Math.max(xMax, processedXData[processedXData.length - 1]),
                            xAxis.options.startOfWeek,
                            processedXData,
                            series.closestPointRange
                        ),
                        groupedData = seriesProto.groupData.apply(series, [processedXData, processedYData, groupPositions, dataGroupingOptions.approximation]),
                        groupedXData = groupedData[0],
                        groupedYData = groupedData[1];

                    // prevent the smoothed data to spill out left and right, and make
                    // sure data is not shifted to the left
                    if (dataGroupingOptions.smoothed) {
                        i = groupedXData.length - 1;
                        groupedXData[i] = Math.min(groupedXData[i], xMax);
                        while (i-- && i > 0) {
                            groupedXData[i] += interval / 2;
                        }
                        groupedXData[0] = Math.max(groupedXData[0], xMin);
                    }

                    // record what data grouping values were used
                    series.currentDataGrouping = groupPositions.info;
                    series.closestPointRange = groupPositions.info.totalRange;
                    series.groupMap = groupedData[2];

                    // Make sure the X axis extends to show the first group (#2533)
                    if (defined(groupedXData[0]) && groupedXData[0] < xAxis.dataMin) {
                        if (xAxis.min === xAxis.dataMin) {
                            xAxis.min = groupedXData[0];
                        }
                        xAxis.dataMin = groupedXData[0];
                    }

                    // set series props
                    series.processedXData = groupedXData;
                    series.processedYData = groupedYData;
                } else {
                    series.currentDataGrouping = series.groupMap = null;
                }
                series.hasGroupedData = hasGroupedData;
            }
        };

        /**
         * Destroy the grouped data points. #622, #740
         */
        seriesProto.destroyGroupedData = function() {

            var groupedData = this.groupedData;

            // clear previous groups
            each(groupedData || [], function(point, i) {
                if (point) {
                    groupedData[i] = point.destroy ? point.destroy() : null;
                }
            });
            this.groupedData = null;
        };

        /**
         * Override the generatePoints method by adding a reference to grouped data
         */
        seriesProto.generatePoints = function() {

            baseGeneratePoints.apply(this);

            // record grouped data in order to let it be destroyed the next time processData runs
            this.destroyGroupedData(); // #622
            this.groupedData = this.hasGroupedData ? this.points : null;
        };

        /**
         * Override point prototype to throw a warning when trying to update grouped points
         */
        wrap(Point.prototype, 'update', function(proceed) {
            if (this.dataGroup) {
                H.error(24);
            } else {
                proceed.apply(this, [].slice.call(arguments, 1));
            }
        });

        /**
         * Extend the original method, make the tooltip's header reflect the grouped range
         */
        wrap(Tooltip.prototype, 'tooltipFooterHeaderFormatter', function(proceed, labelConfig, isFooter) {
            var tooltip = this,
                series = labelConfig.series,
                options = series.options,
                tooltipOptions = series.tooltipOptions,
                dataGroupingOptions = options.dataGrouping,
                xDateFormat = tooltipOptions.xDateFormat,
                xDateFormatEnd,
                xAxis = series.xAxis,
                dateFormat = H.dateFormat,
                currentDataGrouping,
                dateTimeLabelFormats,
                labelFormats,
                formattedKey;

            // apply only to grouped series
            if (xAxis && xAxis.options.type === 'datetime' && dataGroupingOptions && isNumber(labelConfig.key)) {

                // set variables
                currentDataGrouping = series.currentDataGrouping;
                dateTimeLabelFormats = dataGroupingOptions.dateTimeLabelFormats;

                // if we have grouped data, use the grouping information to get the right format
                if (currentDataGrouping) {
                    labelFormats = dateTimeLabelFormats[currentDataGrouping.unitName];
                    if (currentDataGrouping.count === 1) {
                        xDateFormat = labelFormats[0];
                    } else {
                        xDateFormat = labelFormats[1];
                        xDateFormatEnd = labelFormats[2];
                    }
                    // if not grouped, and we don't have set the xDateFormat option, get the best fit,
                    // so if the least distance between points is one minute, show it, but if the
                    // least distance is one day, skip hours and minutes etc.
                } else if (!xDateFormat && dateTimeLabelFormats) {
                    xDateFormat = tooltip.getXDateFormat(labelConfig, tooltipOptions, xAxis);
                }

                // now format the key
                formattedKey = dateFormat(xDateFormat, labelConfig.key);
                if (xDateFormatEnd) {
                    formattedKey += dateFormat(xDateFormatEnd, labelConfig.key + currentDataGrouping.totalRange - 1);
                }

                // return the replaced format
                return format(tooltipOptions[(isFooter ? 'footer' : 'header') + 'Format'], {
                    point: extend(labelConfig.point, {
                        key: formattedKey
                    }),
                    series: series
                });

            }

            // else, fall back to the regular formatter
            return proceed.call(tooltip, labelConfig, isFooter);
        });

        /**
         * Extend the series destroyer
         */
        seriesProto.destroy = function() {
            var series = this,
                groupedData = series.groupedData || [],
                i = groupedData.length;

            while (i--) {
                if (groupedData[i]) {
                    groupedData[i].destroy();
                }
            }
            baseDestroy.apply(series);
        };


        // Handle default options for data grouping. This must be set at runtime because some series types are
        // defined after this.
        wrap(seriesProto, 'setOptions', function(proceed, itemOptions) {

            var options = proceed.call(this, itemOptions),
                type = this.type,
                plotOptions = this.chart.options.plotOptions,
                defaultOptions = defaultPlotOptions[type].dataGrouping;

            if (specificOptions[type]) { // #1284
                if (!defaultOptions) {
                    defaultOptions = merge(commonOptions, specificOptions[type]);
                }

                options.dataGrouping = merge(
                    defaultOptions,
                    plotOptions.series && plotOptions.series.dataGrouping, // #1228
                    plotOptions[type].dataGrouping, // Set by the StockChart constructor
                    itemOptions.dataGrouping
                );
            }

            if (this.chart.options.isStock) {
                this.requireSorting = true;
            }

            return options;
        });


        /**
         * When resetting the scale reset the hasProccessed flag to avoid taking previous data grouping
         * of neighbour series into accound when determining group pixel width (#2692).
         */
        wrap(Axis.prototype, 'setScale', function(proceed) {
            proceed.call(this);
            each(this.series, function(series) {
                series.hasProcessed = false;
            });
        });

        /**
         * Get the data grouping pixel width based on the greatest defined individual width
         * of the axis' series, and if whether one of the axes need grouping.
         */
        Axis.prototype.getGroupPixelWidth = function() {

            var series = this.series,
                len = series.length,
                i,
                groupPixelWidth = 0,
                doGrouping = false,
                dataLength,
                dgOptions;

            // If multiple series are compared on the same x axis, give them the same
            // group pixel width (#334)
            i = len;
            while (i--) {
                dgOptions = series[i].options.dataGrouping;
                if (dgOptions) {
                    groupPixelWidth = Math.max(groupPixelWidth, dgOptions.groupPixelWidth);

                }
            }

            // If one of the series needs grouping, apply it to all (#1634)
            i = len;
            while (i--) {
                dgOptions = series[i].options.dataGrouping;

                if (dgOptions && series[i].hasProcessed) { // #2692

                    dataLength = (series[i].processedXData || series[i].data).length;

                    // Execute grouping if the amount of points is greater than the limit defined in groupPixelWidth
                    if (series[i].groupPixelWidth || dataLength > (this.chart.plotSizeX / groupPixelWidth) || (dataLength && dgOptions.forced)) {
                        doGrouping = true;
                    }
                }
            }

            return doGrouping ? groupPixelWidth : 0;
        };

        /**
         * Force data grouping on all the axis' series.
         */
        Axis.prototype.setDataGrouping = function(dataGrouping, redraw) {
            var i;

            redraw = pick(redraw, true);

            if (!dataGrouping) {
                dataGrouping = {
                    forced: false,
                    units: null
                };
            }

            // Axis is instantiated, update all series
            if (this instanceof Axis) {
                i = this.series.length;
                while (i--) {
                    this.series[i].update({
                        dataGrouping: dataGrouping
                    }, false);
                }

                // Axis not yet instanciated, alter series options
            } else {
                each(this.chart.options.series, function(seriesOptions) {
                    seriesOptions.dataGrouping = dataGrouping;
                }, false);
            }

            if (redraw) {
                this.chart.redraw();
            }
        };



        /* ****************************************************************************
         * End data grouping module												   *
         ******************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var each = H.each,
            Point = H.Point,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;

        /**
         * The ohlc series type.
         *
         * @constructor seriesTypes.ohlc
         * @augments seriesTypes.column
         */
        seriesType('ohlc', 'column', {
            lineWidth: 1,
            tooltip: {

                pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {series.name}</b><br/>' +
                    'Open: {point.open}<br/>' +
                    'High: {point.high}<br/>' +
                    'Low: {point.low}<br/>' +
                    'Close: {point.close}<br/>'

            },
            threshold: null,

            states: {
                hover: {
                    lineWidth: 3
                }
            }
            //upColor: undefined


        }, /** @lends seriesTypes.ohlc */ {
            pointArrayMap: ['open', 'high', 'low', 'close'], // array point configs are mapped to this
            toYData: function(point) { // return a plain array for speedy calculation
                return [point.open, point.high, point.low, point.close];
            },
            pointValKey: 'high',


            pointAttrToOptions: {
                'stroke': 'color',
                'stroke-width': 'lineWidth'
            },

            /**
             * Postprocess mapping between options and SVG attributes
             */
            pointAttribs: function(point, state) {
                var attribs = seriesTypes.column.prototype.pointAttribs.call(
                        this,
                        point,
                        state
                    ),
                    options = this.options;

                delete attribs.fill;

                if (!point.options.color &&
                    options.upColor &&
                    point.open < point.close
                ) {
                    attribs.stroke = options.upColor;
                }

                return attribs;
            },


            /**
             * Translate data points from raw values x and y to plotX and plotY
             */
            translate: function() {
                var series = this,
                    yAxis = series.yAxis,
                    hasModifyValue = !!series.modifyValue,
                    translatedOLC = ['plotOpen', 'yBottom', 'plotClose'];

                seriesTypes.column.prototype.translate.apply(series);

                // Do the translation
                each(series.points, function(point) {
                    each([point.open, point.low, point.close], function(value, i) {
                        if (value !== null) {
                            if (hasModifyValue) {
                                value = series.modifyValue(value);
                            }
                            point[translatedOLC[i]] = yAxis.toPixels(value, true);
                        }
                    });
                });
            },

            /**
             * Draw the data points
             */
            drawPoints: function() {
                var series = this,
                    points = series.points,
                    chart = series.chart;


                each(points, function(point) {
                    var plotOpen,
                        plotClose,
                        crispCorr,
                        halfWidth,
                        path,
                        graphic = point.graphic,
                        crispX,
                        isNew = !graphic;

                    if (point.plotY !== undefined) {

                        // Create and/or update the graphic
                        if (!graphic) {
                            point.graphic = graphic = chart.renderer.path()
                                .add(series.group);
                        }


                        graphic.attr(series.pointAttribs(point, point.selected && 'select')); // #3897


                        // crisp vector coordinates
                        crispCorr = (graphic.strokeWidth() % 2) / 2;
                        crispX = Math.round(point.plotX) - crispCorr; // #2596
                        halfWidth = Math.round(point.shapeArgs.width / 2);

                        // the vertical stem
                        path = [
                            'M',
                            crispX, Math.round(point.yBottom),
                            'L',
                            crispX, Math.round(point.plotY)
                        ];

                        // open
                        if (point.open !== null) {
                            plotOpen = Math.round(point.plotOpen) + crispCorr;
                            path.push(
                                'M',
                                crispX,
                                plotOpen,
                                'L',
                                crispX - halfWidth,
                                plotOpen
                            );
                        }

                        // close
                        if (point.close !== null) {
                            plotClose = Math.round(point.plotClose) + crispCorr;
                            path.push(
                                'M',
                                crispX,
                                plotClose,
                                'L',
                                crispX + halfWidth,
                                plotClose
                            );
                        }

                        graphic[isNew ? 'attr' : 'animate']({
                                d: path
                            })
                            .addClass(point.getClassName(), true);

                    }


                });

            },

            animate: null // Disable animation

            /**
             * @constructor seriesTypes.ohlc.prototype.pointClass
             * @extends {Point}
             */
        }, /** @lends seriesTypes.ohlc.prototype.pointClass.prototype */ {
            /**
             * Extend the parent method by adding up or down to the class name.
             */
            getClassName: function() {
                return Point.prototype.getClassName.call(this) +
                    (this.open < this.close ? ' highcharts-point-up' : ' highcharts-point-down');
            }
        });
        /* ****************************************************************************
         * End OHLC series code													   *
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var defaultPlotOptions = H.defaultPlotOptions,
            each = H.each,
            merge = H.merge,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;

        /**
         * The candlestick series type.
         *
         * @constructor seriesTypes.candlestick
         * @augments seriesTypes.ohlc
         */
        seriesType('candlestick', 'ohlc', merge(defaultPlotOptions.column, {
            states: {
                hover: {
                    lineWidth: 2
                }
            },
            tooltip: defaultPlotOptions.ohlc.tooltip,
            threshold: null,

            lineColor: '#000000',
            lineWidth: 1,
            upColor: '#ffffff'
                // upLineColor: null


        }), /** @lends seriesTypes.candlestick */ {

            /**
             * Postprocess mapping between options and SVG attributes
             */
            pointAttribs: function(point, state) {
                var attribs = seriesTypes.column.prototype.pointAttribs.call(this, point, state),
                    options = this.options,
                    isUp = point.open < point.close,
                    stroke = options.lineColor || this.color,
                    stateOptions;

                attribs['stroke-width'] = options.lineWidth;

                attribs.fill = point.options.color || (isUp ? (options.upColor || this.color) : this.color);
                attribs.stroke = point.lineColor || (isUp ? (options.upLineColor || stroke) : stroke);

                // Select or hover states
                if (state) {
                    stateOptions = options.states[state];
                    attribs.fill = stateOptions.color || attribs.fill;
                    attribs.stroke = stateOptions.lineColor || attribs.stroke;
                    attribs['stroke-width'] =
                        stateOptions.lineWidth || attribs['stroke-width'];
                }


                return attribs;
            },

            /**
             * Draw the data points
             */
            drawPoints: function() {
                var series = this, //state = series.state,
                    points = series.points,
                    chart = series.chart;


                each(points, function(point) {

                    var graphic = point.graphic,
                        plotOpen,
                        plotClose,
                        topBox,
                        bottomBox,
                        hasTopWhisker,
                        hasBottomWhisker,
                        crispCorr,
                        crispX,
                        path,
                        halfWidth,
                        isNew = !graphic;

                    if (point.plotY !== undefined) {

                        if (!graphic) {
                            point.graphic = graphic = chart.renderer.path()
                                .add(series.group);
                        }


                        graphic
                            .attr(series.pointAttribs(point, point.selected && 'select')) // #3897
                            .shadow(series.options.shadow);


                        // Crisp vector coordinates
                        crispCorr = (graphic.strokeWidth() % 2) / 2;
                        crispX = Math.round(point.plotX) - crispCorr; // #2596
                        plotOpen = point.plotOpen;
                        plotClose = point.plotClose;
                        topBox = Math.min(plotOpen, plotClose);
                        bottomBox = Math.max(plotOpen, plotClose);
                        halfWidth = Math.round(point.shapeArgs.width / 2);
                        hasTopWhisker = Math.round(topBox) !== Math.round(point.plotY);
                        hasBottomWhisker = bottomBox !== point.yBottom;
                        topBox = Math.round(topBox) + crispCorr;
                        bottomBox = Math.round(bottomBox) + crispCorr;

                        // Create the path. Due to a bug in Chrome 49, the path is first instanciated
                        // with no values, then the values pushed. For unknown reasons, instanciated
                        // the path array with all the values would lead to a crash when updating
                        // frequently (#5193).
                        path = [];
                        path.push(
                            'M',
                            crispX - halfWidth, bottomBox,
                            'L',
                            crispX - halfWidth, topBox,
                            'L',
                            crispX + halfWidth, topBox,
                            'L',
                            crispX + halfWidth, bottomBox,
                            'Z', // Use a close statement to ensure a nice rectangle #2602
                            'M',
                            crispX, topBox,
                            'L',
                            crispX, hasTopWhisker ? Math.round(point.plotY) : topBox, // #460, #2094
                            'M',
                            crispX, bottomBox,
                            'L',
                            crispX, hasBottomWhisker ? Math.round(point.yBottom) : bottomBox // #460, #2094
                        );

                        graphic[isNew ? 'attr' : 'animate']({
                                d: path
                            })
                            .addClass(point.getClassName(), true);

                    }
                });

            }


        });

        /* ****************************************************************************
         * End Candlestick series code												*
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            each = H.each,
            merge = H.merge,
            noop = H.noop,
            Renderer = H.Renderer,
            Series = H.Series,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes,
            SVGRenderer = H.SVGRenderer,
            TrackerMixin = H.TrackerMixin,
            VMLRenderer = H.VMLRenderer,
            symbols = SVGRenderer.prototype.symbols;

        /**
         * The flags series type.
         *
         * @constructor seriesTypes.flags
         * @augments seriesTypes.column
         */
        seriesType('flags', 'column', {
            pointRange: 0, // #673
            //radius: 2,
            shape: 'flag',
            stackDistance: 12,
            textAlign: 'center',
            tooltip: {
                pointFormat: '{point.text}<br/>'
            },
            threshold: null,
            y: -30,

            fillColor: '#ffffff',
            // lineColor: color,
            lineWidth: 1,
            states: {
                hover: {
                    lineColor: '#000000',
                    fillColor: '#ccd6eb'
                }
            },
            style: {
                fontSize: '11px',
                fontWeight: 'bold'
            }


        }, /** @lends seriesTypes.flags.prototype */ {
            sorted: false,
            noSharedTooltip: true,
            allowDG: false,
            takeOrdinalPosition: false, // #1074
            trackerGroups: ['markerGroup'],
            forceCrop: true,
            /**
             * Inherit the initialization from base Series.
             */
            init: Series.prototype.init,


            /**
             * Get presentational attributes
             */
            pointAttribs: function(point, state) {
                var options = this.options,
                    color = (point && point.color) || this.color,
                    lineColor = options.lineColor,
                    lineWidth = (point && point.lineWidth),
                    fill = (point && point.fillColor) || options.fillColor;

                if (state) {
                    fill = options.states[state].fillColor;
                    lineColor = options.states[state].lineColor;
                    lineWidth = options.states[state].lineWidth;
                }

                return {
                    'fill': fill || color,
                    'stroke': lineColor || color,
                    'stroke-width': lineWidth || options.lineWidth || 0
                };
            },


            /**
             * Extend the translate method by placing the point on the related series
             */
            translate: function() {

                seriesTypes.column.prototype.translate.apply(this);

                var series = this,
                    options = series.options,
                    chart = series.chart,
                    points = series.points,
                    cursor = points.length - 1,
                    point,
                    lastPoint,
                    optionsOnSeries = options.onSeries,
                    onSeries = optionsOnSeries && chart.get(optionsOnSeries),
                    onKey = options.onKey || 'y',
                    step = onSeries && onSeries.options.step,
                    onData = onSeries && onSeries.points,
                    i = onData && onData.length,
                    xAxis = series.xAxis,
                    xAxisExt = xAxis.getExtremes(),
                    xOffset = 0,
                    leftPoint,
                    lastX,
                    rightPoint,
                    currentDataGrouping;

                // relate to a master series
                if (onSeries && onSeries.visible && i) {
                    xOffset = (onSeries.pointXOffset || 0) + (onSeries.barW || 0) / 2;
                    currentDataGrouping = onSeries.currentDataGrouping;
                    lastX = onData[i - 1].x + (currentDataGrouping ? currentDataGrouping.totalRange : 0); // #2374

                    // sort the data points
                    points.sort(function(a, b) {
                        return (a.x - b.x);
                    });

                    onKey = 'plot' + onKey[0].toUpperCase() + onKey.substr(1);
                    while (i-- && points[cursor]) {
                        point = points[cursor];
                        leftPoint = onData[i];
                        if (leftPoint.x <= point.x && leftPoint[onKey] !== undefined) {
                            if (point.x <= lastX) { // #803

                                point.plotY = leftPoint[onKey];

                                // interpolate between points, #666
                                if (leftPoint.x < point.x && !step) {
                                    rightPoint = onData[i + 1];
                                    if (rightPoint && rightPoint[onKey] !== undefined) {
                                        point.plotY +=
                                            ((point.x - leftPoint.x) / (rightPoint.x - leftPoint.x)) * // the distance ratio, between 0 and 1
                                            (rightPoint[onKey] - leftPoint[onKey]); // the y distance
                                    }
                                }
                            }
                            cursor--;
                            i++; // check again for points in the same x position
                            if (cursor < 0) {
                                break;
                            }
                        }
                    }
                }

                // Add plotY position and handle stacking
                each(points, function(point, i) {

                    var stackIndex;

                    // Undefined plotY means the point is either on axis, outside series range or hidden series.
                    // If the series is outside the range of the x axis it should fall through with
                    // an undefined plotY, but then we must remove the shapeArgs (#847).
                    if (point.plotY === undefined) {
                        if (point.x >= xAxisExt.min && point.x <= xAxisExt.max) { // we're inside xAxis range
                            point.plotY = chart.chartHeight - xAxis.bottom - (xAxis.opposite ? xAxis.height : 0) + xAxis.offset - chart.plotTop;
                        } else {
                            point.shapeArgs = {}; // 847
                        }
                    }
                    point.plotX += xOffset; // #2049
                    // if multiple flags appear at the same x, order them into a stack
                    lastPoint = points[i - 1];
                    if (lastPoint && lastPoint.plotX === point.plotX) {
                        if (lastPoint.stackIndex === undefined) {
                            lastPoint.stackIndex = 0;
                        }
                        stackIndex = lastPoint.stackIndex + 1;
                    }
                    point.stackIndex = stackIndex; // #3639
                });


            },

            /**
             * Draw the markers
             */
            drawPoints: function() {
                var series = this,
                    points = series.points,
                    chart = series.chart,
                    renderer = chart.renderer,
                    plotX,
                    plotY,
                    options = series.options,
                    optionsY = options.y,
                    shape,
                    i,
                    point,
                    graphic,
                    stackIndex,
                    anchorX,
                    anchorY,
                    outsideRight,
                    yAxis = series.yAxis;

                i = points.length;
                while (i--) {
                    point = points[i];
                    outsideRight = point.plotX > series.xAxis.len;
                    plotX = point.plotX;
                    stackIndex = point.stackIndex;
                    shape = point.options.shape || options.shape;
                    plotY = point.plotY;

                    if (plotY !== undefined) {
                        plotY = point.plotY + optionsY - (stackIndex !== undefined && stackIndex * options.stackDistance);
                    }
                    anchorX = stackIndex ? undefined : point.plotX; // skip connectors for higher level stacked points
                    anchorY = stackIndex ? undefined : point.plotY;

                    graphic = point.graphic;

                    // Only draw the point if y is defined and the flag is within the visible area
                    if (plotY !== undefined && plotX >= 0 && !outsideRight) {

                        // Create the flag
                        if (!graphic) {
                            graphic = point.graphic = renderer.label(
                                '',
                                null,
                                null,
                                shape,
                                null,
                                null,
                                options.useHTML
                            )

                            .attr(series.pointAttribs(point))
                                .css(merge(options.style, point.style))

                            .attr({
                                    align: shape === 'flag' ? 'left' : 'center',
                                    width: options.width,
                                    height: options.height,
                                    'text-align': options.textAlign
                                })
                                .addClass('highcharts-point')
                                .add(series.markerGroup);


                            graphic.shadow(options.shadow);

                        }

                        if (plotX > 0) { // #3119
                            plotX -= graphic.strokeWidth() % 2; // #4285
                        }

                        // Plant the flag
                        graphic.attr({
                            text: point.options.title || options.title || 'A',
                            x: plotX,
                            y: plotY,
                            anchorX: anchorX,
                            anchorY: anchorY
                        });

                        // Set the tooltip anchor position
                        point.tooltipPos = chart.inverted ? [yAxis.len + yAxis.pos - chart.plotLeft - plotY, series.xAxis.len - plotX] : [plotX, plotY];

                    } else if (graphic) {
                        point.graphic = graphic.destroy();
                    }

                }

            },

            /**
             * Extend the column trackers with listeners to expand and contract stacks
             */
            drawTracker: function() {
                var series = this,
                    points = series.points;

                TrackerMixin.drawTrackerPoint.apply(this);

                // Bring each stacked flag up on mouse over, this allows readability of vertically
                // stacked elements as well as tight points on the x axis. #1924.
                each(points, function(point) {
                    var graphic = point.graphic;
                    if (graphic) {
                        addEvent(graphic.element, 'mouseover', function() {

                            // Raise this point
                            if (point.stackIndex > 0 && !point.raised) {
                                point._y = graphic.y;
                                graphic.attr({
                                    y: point._y - 8
                                });
                                point.raised = true;
                            }

                            // Revert other raised points
                            each(points, function(otherPoint) {
                                if (otherPoint !== point && otherPoint.raised && otherPoint.graphic) {
                                    otherPoint.graphic.attr({
                                        y: otherPoint._y
                                    });
                                    otherPoint.raised = false;
                                }
                            });
                        });
                    }
                });
            },

            animate: noop, // Disable animation
            buildKDTree: noop,
            setClip: noop

        });

        // create the flag icon with anchor
        symbols.flag = function(x, y, w, h, options) {
            var anchorX = (options && options.anchorX) || x,
                anchorY = (options && options.anchorY) || y;

            return [
                'M', anchorX, anchorY,
                'L', x, y + h,
                x, y,
                x + w, y,
                x + w, y + h,
                x, y + h,
                'Z'
            ];
        };

        // create the circlepin and squarepin icons with anchor
        each(['circle', 'square'], function(shape) {
            symbols[shape + 'pin'] = function(x, y, w, h, options) {

                var anchorX = options && options.anchorX,
                    anchorY = options && options.anchorY,
                    path,
                    labelTopOrBottomY;

                // For single-letter flags, make sure circular flags are not taller than their width
                if (shape === 'circle' && h > w) {
                    x -= Math.round((h - w) / 2);
                    w = h;
                }

                path = symbols[shape](x, y, w, h);

                if (anchorX && anchorY) {
                    // if the label is below the anchor, draw the connecting line from the top edge of the label
                    // otherwise start drawing from the bottom edge
                    labelTopOrBottomY = (y > anchorY) ? y : y + h;
                    path.push('M', anchorX, labelTopOrBottomY, 'L', anchorX, anchorY);
                }

                return path;
            };
        });


        // The symbol callbacks are generated on the SVGRenderer object in all browsers. Even
        // VML browsers need this in order to generate shapes in export. Now share
        // them with the VMLRenderer.
        if (Renderer === VMLRenderer) {
            each(['flag', 'circlepin', 'squarepin'], function(shape) {
                VMLRenderer.prototype.symbols[shape] = symbols[shape];
            });
        }

        /* ****************************************************************************
         * End Flags series code													  *
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            Axis = H.Axis,
            correctFloat = H.correctFloat,
            defaultOptions = H.defaultOptions,
            defined = H.defined,
            destroyObjectProperties = H.destroyObjectProperties,
            doc = H.doc,
            each = H.each,
            fireEvent = H.fireEvent,
            hasTouch = H.hasTouch,
            isTouchDevice = H.isTouchDevice,
            merge = H.merge,
            pick = H.pick,
            removeEvent = H.removeEvent,
            svg = H.svg,
            wrap = H.wrap,
            swapXY;

        var defaultScrollbarOptions = {
            //enabled: true
            height: isTouchDevice ? 20 : 14,
            // trackBorderRadius: 0
            barBorderRadius: 0,
            buttonBorderRadius: 0,
            liveRedraw: svg && !isTouchDevice,
            margin: 10,
            minWidth: 6,
            //showFull: true,
            //size: null,
            step: 0.2,
            zIndex: 3,

            barBackgroundColor: '#cccccc',
            barBorderWidth: 1,
            barBorderColor: '#cccccc',
            buttonArrowColor: '#333333',
            buttonBackgroundColor: '#e6e6e6',
            buttonBorderColor: '#cccccc',
            buttonBorderWidth: 1,
            rifleColor: '#333333',
            trackBackgroundColor: '#f2f2f2',
            trackBorderColor: '#f2f2f2',
            trackBorderWidth: 1

        };

        defaultOptions.scrollbar = merge(true, defaultScrollbarOptions, defaultOptions.scrollbar);

        /**
         * When we have vertical scrollbar, rifles and arrow in buttons should be rotated.
         * The same method is used in Navigator's handles, to rotate them.
         * @param {Array} path - path to be rotated
         * @param {Boolean} vertical - if vertical scrollbar, swap x-y values
         */
        H.swapXY = swapXY = function(path, vertical) {
            var i,
                len = path.length,
                temp;

            if (vertical) {
                for (i = 0; i < len; i += 3) {
                    temp = path[i + 1];
                    path[i + 1] = path[i + 2];
                    path[i + 2] = temp;
                }
            }

            return path;
        };

        /**
         * A reusable scrollbar, internally used in Highstock's navigator and optionally
         * on individual axes.
         *
         * @class
         * @param {Object} renderer
         * @param {Object} options
         * @param {Object} chart
         */
        function Scrollbar(renderer, options, chart) { // docs
            this.init(renderer, options, chart);
        }

        Scrollbar.prototype = {

            init: function(renderer, options, chart) {

                this.scrollbarButtons = [];

                this.renderer = renderer;

                this.userOptions = options;
                this.options = merge(defaultScrollbarOptions, options);

                this.chart = chart;

                this.size = pick(this.options.size, this.options.height); // backward compatibility

                // Init
                if (options.enabled) {
                    this.render();
                    this.initEvents();
                    this.addEvents();
                }
            },

            /**
             * Render scrollbar with all required items.
             */
            render: function() {
                var scroller = this,
                    renderer = scroller.renderer,
                    options = scroller.options,
                    size = scroller.size,
                    group;

                // Draw the scrollbar group
                scroller.group = group = renderer.g('scrollbar').attr({
                    zIndex: options.zIndex,
                    translateY: -99999
                }).add();

                // Draw the scrollbar track:
                scroller.track = renderer.rect()
                    .addClass('highcharts-scrollbar-track')
                    .attr({
                        x: 0,
                        r: options.trackBorderRadius || 0,
                        height: size,
                        width: size
                    }).add(group);


                scroller.track.attr({
                    fill: options.trackBackgroundColor,
                    stroke: options.trackBorderColor,
                    'stroke-width': options.trackBorderWidth
                });

                this.trackBorderWidth = scroller.track.strokeWidth();
                scroller.track.attr({
                    y: -this.trackBorderWidth % 2 / 2
                });


                // Draw the scrollbar itself
                scroller.scrollbarGroup = renderer.g().add(group);

                scroller.scrollbar = renderer.rect()
                    .addClass('highcharts-scrollbar-thumb')
                    .attr({
                        height: size,
                        width: size,
                        r: options.barBorderRadius || 0
                    }).add(scroller.scrollbarGroup);

                scroller.scrollbarRifles = renderer.path(
                        swapXY([
                            'M', -3, size / 4,
                            'L', -3, 2 * size / 3,
                            'M',
                            0, size / 4,
                            'L',
                            0, 2 * size / 3,
                            'M',
                            3, size / 4,
                            'L',
                            3, 2 * size / 3
                        ], options.vertical))
                    .addClass('highcharts-scrollbar-rifles')
                    .add(scroller.scrollbarGroup);


                scroller.scrollbar.attr({
                    fill: options.barBackgroundColor,
                    stroke: options.barBorderColor,
                    'stroke-width': options.barBorderWidth
                });
                scroller.scrollbarRifles.attr({
                    stroke: options.rifleColor,
                    'stroke-width': 1
                });

                scroller.scrollbarStrokeWidth = scroller.scrollbar.strokeWidth();
                scroller.scrollbarGroup.translate(-scroller.scrollbarStrokeWidth % 2 / 2, -scroller.scrollbarStrokeWidth % 2 / 2);

                // Draw the buttons:
                scroller.drawScrollbarButton(0);
                scroller.drawScrollbarButton(1);
            },

            /**
             * Position the scrollbar, method called from a parent with defined dimensions
             * @param {Number} x - x-position on the chart
             * @param {Number} y - y-position on the chart
             * @param {Number} width - width of the scrollbar
             * @param {Number} height - height of the scorllbar
             */
            position: function(x, y, width, height) {
                var scroller = this,
                    options = scroller.options,
                    vertical = options.vertical,
                    xOffset = height,
                    yOffset = 0,
                    method = scroller.rendered ? 'animate' : 'attr';

                scroller.x = x;
                scroller.y = y + this.trackBorderWidth;
                scroller.width = width; // width with buttons
                scroller.height = height;
                scroller.xOffset = xOffset;
                scroller.yOffset = yOffset;

                // If Scrollbar is a vertical type, swap options:
                if (vertical) {
                    scroller.width = scroller.yOffset = width = yOffset = scroller.size;
                    scroller.xOffset = xOffset = 0;
                    scroller.barWidth = height - width * 2; // width without buttons
                    scroller.x = x = x + scroller.options.margin;
                } else {
                    scroller.height = scroller.xOffset = height = xOffset = scroller.size;
                    scroller.barWidth = width - height * 2; // width without buttons
                    scroller.y = scroller.y + scroller.options.margin;
                }

                // Set general position for a group:
                scroller.group[method]({
                    translateX: x,
                    translateY: scroller.y
                });

                // Resize background/track:
                scroller.track[method]({
                    width: width,
                    height: height
                });

                // Move right/bottom button ot it's place:
                scroller.scrollbarButtons[1][method]({
                    translateX: vertical ? 0 : width - xOffset,
                    translateY: vertical ? height - yOffset : 0
                });
            },

            /**
             * Draw the scrollbar buttons with arrows
             * @param {Number} index 0 is left, 1 is right
             */
            drawScrollbarButton: function(index) {
                var scroller = this,
                    renderer = scroller.renderer,
                    scrollbarButtons = scroller.scrollbarButtons,
                    options = scroller.options,
                    size = scroller.size,
                    group,
                    tempElem;

                group = renderer.g().add(scroller.group);
                scrollbarButtons.push(group);

                // Create a rectangle for the scrollbar button
                tempElem = renderer.rect()
                    .addClass('highcharts-scrollbar-button')
                    .add(group);


                // Presentational attributes
                tempElem.attr({
                    stroke: options.buttonBorderColor,
                    'stroke-width': options.buttonBorderWidth,
                    fill: options.buttonBackgroundColor
                });


                // Place the rectangle based on the rendered stroke width
                tempElem.attr(tempElem.crisp({
                    x: -0.5,
                    y: -0.5,
                    width: size + 1, // +1 to compensate for crispifying in rect method
                    height: size + 1,
                    r: options.buttonBorderRadius
                }, tempElem.strokeWidth()));

                // Button arrow
                tempElem = renderer
                    .path(swapXY([
                        'M',
                        size / 2 + (index ? -1 : 1),
                        size / 2 - 3,
                        'L',
                        size / 2 + (index ? -1 : 1),
                        size / 2 + 3,
                        'L',
                        size / 2 + (index ? 2 : -2),
                        size / 2
                    ], options.vertical))
                    .addClass('highcharts-scrollbar-arrow')
                    .add(scrollbarButtons[index]);


                tempElem.attr({
                    fill: options.buttonArrowColor
                });

            },

            /**
             * Set scrollbar size, with a given scale.
             * @param {Number} from - scale (0-1) where bar should start
             * @param {Number} to - scale (0-1) where bar should end
             */
            setRange: function(from, to) {
                var scroller = this,
                    options = scroller.options,
                    vertical = options.vertical,
                    minWidth = options.minWidth,
                    fullWidth = scroller.barWidth,
                    fromPX,
                    toPX,
                    newPos,
                    newSize,
                    newRiflesPos,
                    method = this.rendered && !this.hasDragged ? 'animate' : 'attr';

                if (!defined(fullWidth)) {
                    return;
                }

                from = Math.max(from, 0);

                fromPX = fullWidth * from;
                toPX = fullWidth * Math.min(to, 1);
                scroller.calculatedWidth = newSize = correctFloat(toPX - fromPX);

                // We need to recalculate position, if minWidth is used
                if (newSize < minWidth) {
                    fromPX = (fullWidth - minWidth + newSize) * from;
                    newSize = minWidth;
                }
                newPos = Math.floor(fromPX + scroller.xOffset + scroller.yOffset);
                newRiflesPos = newSize / 2 - 0.5; // -0.5 -> rifle line width / 2

                // Store current position:
                scroller.from = from;
                scroller.to = to;

                if (!vertical) {
                    scroller.scrollbarGroup[method]({
                        translateX: newPos
                    });
                    scroller.scrollbar[method]({
                        width: newSize
                    });
                    scroller.scrollbarRifles[method]({
                        translateX: newRiflesPos
                    });
                    scroller.scrollbarLeft = newPos;
                    scroller.scrollbarTop = 0;
                } else {
                    scroller.scrollbarGroup[method]({
                        translateY: newPos
                    });
                    scroller.scrollbar[method]({
                        height: newSize
                    });
                    scroller.scrollbarRifles[method]({
                        translateY: newRiflesPos
                    });
                    scroller.scrollbarTop = newPos;
                    scroller.scrollbarLeft = 0;
                }

                if (newSize <= 12) {
                    scroller.scrollbarRifles.hide();
                } else {
                    scroller.scrollbarRifles.show(true);
                }

                // Show or hide the scrollbar based on the showFull setting
                if (options.showFull === false) {
                    if (from <= 0 && to >= 1) {
                        scroller.group.hide();
                    } else {
                        scroller.group.show();
                    }
                }

                scroller.rendered = true;
            },

            /**
             * Init events methods, so we have an access to the Scrollbar itself
             */
            initEvents: function() {
                var scroller = this;
                /**
                 * Event handler for the mouse move event.
                 */
                scroller.mouseMoveHandler = function(e) {
                    var normalizedEvent = scroller.chart.pointer.normalize(e),
                        options = scroller.options,
                        direction = options.vertical ? 'chartY' : 'chartX',
                        initPositions = scroller.initPositions,
                        scrollPosition,
                        chartPosition,
                        change;

                    // In iOS, a mousemove event with e.pageX === 0 is fired when holding the finger
                    // down in the center of the scrollbar. This should be ignored.
                    if (scroller.grabbedCenter && (!e.touches || e.touches[0][direction] !== 0)) { // #4696, scrollbar failed on Android
                        chartPosition = scroller.cursorToScrollbarPosition(normalizedEvent)[direction];
                        scrollPosition = scroller[direction];

                        change = chartPosition - scrollPosition;

                        scroller.hasDragged = true;
                        scroller.updatePosition(initPositions[0] + change, initPositions[1] + change);

                        if (scroller.hasDragged) {
                            fireEvent(scroller, 'changed', {
                                from: scroller.from,
                                to: scroller.to,
                                trigger: 'scrollbar',
                                DOMType: e.type,
                                DOMEvent: e
                            });
                        }
                    }
                };

                /**
                 * Event handler for the mouse up event.
                 */
                scroller.mouseUpHandler = function(e) {
                    if (scroller.hasDragged) {
                        fireEvent(scroller, 'changed', {
                            from: scroller.from,
                            to: scroller.to,
                            trigger: 'scrollbar',
                            DOMType: e.type,
                            DOMEvent: e
                        });
                    }
                    scroller.grabbedCenter = scroller.hasDragged = scroller.chartX = scroller.chartY = null;
                };

                scroller.mouseDownHandler = function(e) {
                    var normalizedEvent = scroller.chart.pointer.normalize(e),
                        mousePosition = scroller.cursorToScrollbarPosition(normalizedEvent);

                    scroller.chartX = mousePosition.chartX;
                    scroller.chartY = mousePosition.chartY;
                    scroller.initPositions = [scroller.from, scroller.to];

                    scroller.grabbedCenter = true;
                };

                scroller.buttonToMinClick = function(e) {
                    var range = correctFloat(scroller.to - scroller.from) * scroller.options.step;
                    scroller.updatePosition(correctFloat(scroller.from - range), correctFloat(scroller.to - range));
                    fireEvent(scroller, 'changed', {
                        from: scroller.from,
                        to: scroller.to,
                        trigger: 'scrollbar',
                        DOMEvent: e
                    });
                };

                scroller.buttonToMaxClick = function(e) {
                    var range = (scroller.to - scroller.from) * scroller.options.step;
                    scroller.updatePosition(scroller.from + range, scroller.to + range);
                    fireEvent(scroller, 'changed', {
                        from: scroller.from,
                        to: scroller.to,
                        trigger: 'scrollbar',
                        DOMEvent: e
                    });
                };

                scroller.trackClick = function(e) {
                    var normalizedEvent = scroller.chart.pointer.normalize(e),
                        range = scroller.to - scroller.from,
                        top = scroller.y + scroller.scrollbarTop,
                        left = scroller.x + scroller.scrollbarLeft;

                    if ((scroller.options.vertical && normalizedEvent.chartY > top) ||
                        (!scroller.options.vertical && normalizedEvent.chartX > left)) {
                        // On the top or on the left side of the track:
                        scroller.updatePosition(scroller.from + range, scroller.to + range);
                    } else {
                        // On the bottom or the right side of the track:
                        scroller.updatePosition(scroller.from - range, scroller.to - range);
                    }

                    fireEvent(scroller, 'changed', {
                        from: scroller.from,
                        to: scroller.to,
                        trigger: 'scrollbar',
                        DOMEvent: e
                    });
                };
            },

            /**
             * Get normalized (0-1) cursor position over the scrollbar
             * @param {Event} normalizedEvent - normalized event, with chartX and chartY values
             * @return {Object} Local position {chartX, chartY}
             */
            cursorToScrollbarPosition: function(normalizedEvent) {
                var scroller = this,
                    options = scroller.options,
                    minWidthDifference = options.minWidth > scroller.calculatedWidth ? options.minWidth : 0; // minWidth distorts translation

                return {
                    chartX: (normalizedEvent.chartX - scroller.x - scroller.xOffset) / (scroller.barWidth - minWidthDifference),
                    chartY: (normalizedEvent.chartY - scroller.y - scroller.yOffset) / (scroller.barWidth - minWidthDifference)
                };
            },

            /**
             * Update position option in the Scrollbar, with normalized 0-1 scale
             */
            updatePosition: function(from, to) {
                if (to > 1) {
                    from = correctFloat(1 - correctFloat(to - from));
                    to = 1;
                }

                if (from < 0) {
                    to = correctFloat(to - from);
                    from = 0;
                }

                this.from = from;
                this.to = to;
            },

            /**
             * Update the scrollbar with new options
             */
            update: function(options) {
                this.destroy();
                this.init(this.chart.renderer, merge(true, this.options, options), this.chart);
            },

            /**
             * Set up the mouse and touch events for the Scrollbar
             */
            addEvents: function() {
                var buttonsOrder = this.options.inverted ? [1, 0] : [0, 1],
                    buttons = this.scrollbarButtons,
                    bar = this.scrollbarGroup.element,
                    track = this.track.element,
                    mouseDownHandler = this.mouseDownHandler,
                    mouseMoveHandler = this.mouseMoveHandler,
                    mouseUpHandler = this.mouseUpHandler,
                    _events;

                // Mouse events
                _events = [
                    [buttons[buttonsOrder[0]].element, 'click', this.buttonToMinClick],
                    [buttons[buttonsOrder[1]].element, 'click', this.buttonToMaxClick],
                    [track, 'click', this.trackClick],
                    [bar, 'mousedown', mouseDownHandler],
                    [doc, 'mousemove', mouseMoveHandler],
                    [doc, 'mouseup', mouseUpHandler]
                ];

                // Touch events
                if (hasTouch) {
                    _events.push(
                        [bar, 'touchstart', mouseDownHandler], [doc, 'touchmove', mouseMoveHandler], [doc, 'touchend', mouseUpHandler]
                    );
                }

                // Add them all
                each(_events, function(args) {
                    addEvent.apply(null, args);
                });
                this._events = _events;
            },

            /**
             * Removes the event handlers attached previously with addEvents.
             */
            removeEvents: function() {
                each(this._events, function(args) {
                    removeEvent.apply(null, args);
                });
                this._events = undefined;
            },

            /**
             * Destroys allocated elements.
             */
            destroy: function() {

                var scroller = this.chart.scroller;

                // Disconnect events added in addEvents
                this.removeEvents();

                // Destroy properties
                each(['track', 'scrollbarRifles', 'scrollbar', 'scrollbarGroup', 'group'], function(prop) {
                    if (this[prop] && this[prop].destroy) {
                        this[prop] = this[prop].destroy();
                    }
                }, this);

                if (scroller) {
                    scroller.scrollbar = null;

                    // Destroy elements in collection
                    destroyObjectProperties(scroller.scrollbarButtons);
                }
            }
        };

        /**
         * Wrap axis initialization and create scrollbar if enabled:
         */
        wrap(Axis.prototype, 'init', function(proceed) {
            var axis = this;
            proceed.apply(axis, [].slice.call(arguments, 1));

            if (axis.options.scrollbar && axis.options.scrollbar.enabled) {
                // Predefined options:
                axis.options.scrollbar.vertical = !axis.horiz;
                axis.options.startOnTick = axis.options.endOnTick = false;

                axis.scrollbar = new Scrollbar(axis.chart.renderer, axis.options.scrollbar, axis.chart);

                addEvent(axis.scrollbar, 'changed', function(e) {
                    var unitedMin = Math.min(pick(axis.options.min, axis.min), axis.min, axis.dataMin),
                        unitedMax = Math.max(pick(axis.options.max, axis.max), axis.max, axis.dataMax),
                        range = unitedMax - unitedMin,
                        to,
                        from;

                    if ((axis.horiz && !axis.reversed) || (!axis.horiz && axis.reversed)) {
                        to = unitedMin + range * this.to;
                        from = unitedMin + range * this.from;
                    } else {
                        // y-values in browser are reversed, but this also applies for reversed horizontal axis:
                        to = unitedMin + range * (1 - this.from);
                        from = unitedMin + range * (1 - this.to);
                    }

                    axis.setExtremes(from, to, true, false, e);
                });
            }
        });

        /**
         * Wrap rendering axis, and update scrollbar if one is created:
         */
        wrap(Axis.prototype, 'render', function(proceed) {
            var axis = this,
                scrollMin = Math.min(pick(axis.options.min, axis.min), axis.min, axis.dataMin),
                scrollMax = Math.max(pick(axis.options.max, axis.max), axis.max, axis.dataMax),
                scrollbar = axis.scrollbar,
                from,
                to;

            proceed.apply(axis, [].slice.call(arguments, 1));

            if (scrollbar) {
                if (axis.horiz) {
                    scrollbar.position(
                        axis.left,
                        axis.top + axis.height + axis.offset + 2 + (axis.opposite ? 0 : axis.axisTitleMargin),
                        axis.width,
                        axis.height
                    );
                } else {
                    scrollbar.position(
                        axis.left + axis.width + 2 + axis.offset + (axis.opposite ? axis.axisTitleMargin : 0),
                        axis.top,
                        axis.width,
                        axis.height
                    );
                }

                if (isNaN(scrollMin) || isNaN(scrollMax) || !defined(axis.min) || !defined(axis.max)) {
                    scrollbar.setRange(0, 0); // default action: when there is not extremes on the axis, but scrollbar exists, make it full size
                } else {
                    from = (axis.min - scrollMin) / (scrollMax - scrollMin);
                    to = (axis.max - scrollMin) / (scrollMax - scrollMin);

                    if ((axis.horiz && !axis.reversed) || (!axis.horiz && axis.reversed)) {
                        scrollbar.setRange(from, to);
                    } else {
                        scrollbar.setRange(1 - to, 1 - from); // inverse vertical axis
                    }
                }
            }
        });

        /**
         * Make space for a scrollbar
         */
        wrap(Axis.prototype, 'getOffset', function(proceed) {
            var axis = this,
                index = axis.horiz ? 2 : 1,
                scrollbar = axis.scrollbar;

            proceed.apply(axis, [].slice.call(arguments, 1));

            if (scrollbar) {
                axis.chart.axisOffset[index] += scrollbar.size + scrollbar.options.margin;
            }
        });

        /**
         * Destroy scrollbar when connected to the specific axis
         */
        wrap(Axis.prototype, 'destroy', function(proceed) {
            if (this.scrollbar) {
                this.scrollbar = this.scrollbar.destroy();
            }

            proceed.apply(this, [].slice.call(arguments, 1));
        });

        H.Scrollbar = Scrollbar;

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        /* ****************************************************************************
         * Start Navigator code														*
         *****************************************************************************/
        var addEvent = H.addEvent,
            Axis = H.Axis,
            Chart = H.Chart,
            color = H.color,
            defaultDataGroupingUnits = H.defaultDataGroupingUnits,
            defaultOptions = H.defaultOptions,
            defined = H.defined,
            destroyObjectProperties = H.destroyObjectProperties,
            doc = H.doc,
            each = H.each,
            erase = H.erase,
            error = H.error,
            extend = H.extend,
            grep = H.grep,
            hasTouch = H.hasTouch,
            isNumber = H.isNumber,
            isObject = H.isObject,
            merge = H.merge,
            pick = H.pick,
            removeEvent = H.removeEvent,
            Scrollbar = H.Scrollbar,
            Series = H.Series,
            seriesTypes = H.seriesTypes,
            wrap = H.wrap,
            swapXY = H.swapXY,

            units = [].concat(defaultDataGroupingUnits), // copy
            defaultSeriesType,

            // Finding the min or max of a set of variables where we don't know if they are defined,
            // is a pattern that is repeated several places in Highcharts. Consider making this
            // a global utility method.
            numExt = function(extreme) {
                var numbers = grep(arguments, isNumber);
                if (numbers.length) {
                    return Math[extreme].apply(0, numbers);
                }
            };

        // add more resolution to units
        units[4] = ['day', [1, 2, 3, 4]]; // allow more days
        units[5] = ['week', [1, 2, 3]]; // allow more weeks

        defaultSeriesType = seriesTypes.areaspline === undefined ? 'line' : 'areaspline';

        extend(defaultOptions, {
            navigator: {
                //enabled: true,
                height: 40,
                margin: 25,
                maskInside: true,

                handles: {
                    backgroundColor: '#f2f2f2',
                    borderColor: '#999999'
                },
                maskFill: color('#6685c2').setOpacity(0.3).get(),
                outlineColor: '#cccccc',
                outlineWidth: 1,

                series: {
                    type: defaultSeriesType,

                    color: '#335cad',
                    fillOpacity: 0.05,
                    lineWidth: 1,

                    compare: null,
                    dataGrouping: {
                        approximation: 'average',
                        enabled: true,
                        groupPixelWidth: 2,
                        smoothed: true,
                        units: units
                    },
                    dataLabels: {
                        enabled: false,
                        zIndex: 2 // #1839
                    },
                    id: 'highcharts-navigator-series',
                    className: 'highcharts-navigator-series',
                    lineColor: null, // Allow color setting while disallowing default candlestick setting (#4602)
                    marker: {
                        enabled: false
                    },
                    pointRange: 0,
                    shadow: false,
                    threshold: null
                },
                //top: undefined,
                //opposite: undefined, // docs
                xAxis: {
                    className: 'highcharts-navigator-xaxis',
                    tickLength: 0,

                    lineWidth: 0,
                    gridLineColor: '#e6e6e6',
                    gridLineWidth: 1,

                    tickPixelInterval: 200,
                    labels: {
                        align: 'left',

                        style: {
                            color: '#999999'
                        },

                        x: 3,
                        y: -4
                    },
                    crosshair: false
                },
                yAxis: {
                    className: 'highcharts-navigator-yaxis',

                    gridLineWidth: 0,

                    startOnTick: false,
                    endOnTick: false,
                    minPadding: 0.1,
                    maxPadding: 0.1,
                    labels: {
                        enabled: false
                    },
                    crosshair: false,
                    title: {
                        text: null
                    },
                    tickLength: 0,
                    tickWidth: 0
                }
            }
        });

        /**
         * The Navigator class
         * @param {Object} chart - Chart object
         * @class
         */
        function Navigator(chart) {
            this.init(chart);
        }

        Navigator.prototype = {
            /**
             * Draw one of the handles on the side of the zoomed range in the navigator
             * @param {Number} x The x center for the handle
             * @param {Number} index 0 for left and 1 for right
             * @param {Boolean} inverted flag for chart.inverted
             * @param {String} verb use 'animate' or 'attr'
             */
            drawHandle: function(x, index, inverted, verb) {
                var navigator = this;

                // Place it
                navigator.handles[index][verb](inverted ? {
                    translateX: Math.round(navigator.left + navigator.height / 2 - 8),
                    translateY: Math.round(navigator.top + parseInt(x, 10) + 0.5)
                } : {
                    translateX: Math.round(navigator.left + parseInt(x, 10)),
                    translateY: Math.round(navigator.top + navigator.height / 2 - 8)
                });
            },

            /**
             * Draw one of the handles on the side of the zoomed range in the navigator
             * @param {Boolean} inverted flag for chart.inverted
             * @returns {Array} Path to be used in a handle
             */
            getHandlePath: function(inverted) {
                return swapXY([
                    'M', -4.5, 0.5,
                    'L',
                    3.5, 0.5,
                    'L',
                    3.5, 15.5,
                    'L', -4.5, 15.5,
                    'L', -4.5, 0.5,
                    'M', -1.5, 4,
                    'L', -1.5, 12,
                    'M',
                    0.5, 4,
                    'L',
                    0.5, 12
                ], inverted);
            },
            /**
             * Render outline around the zoomed range
             * @param {Number} zoomedMin in pixels position where zoomed range starts
             * @param {Number} zoomedMax in pixels position where zoomed range ends
             * @param {Boolean} inverted flag if chart is inverted
             * @param {String} verb use 'animate' or 'attr'
             */
            drawOutline: function(zoomedMin, zoomedMax, inverted, verb) {
                var navigator = this,
                    maskInside = navigator.navigatorOptions.maskInside,
                    outlineWidth = navigator.outline.strokeWidth(),
                    halfOutline = outlineWidth / 2,
                    outlineHeight = navigator.outlineHeight,
                    scrollbarHeight = navigator.scrollbarHeight,
                    navigatorSize = navigator.size,
                    left = navigator.left - scrollbarHeight,
                    navigatorTop = navigator.top,
                    verticalMin,
                    path;

                if (inverted) {
                    left -= halfOutline;
                    verticalMin = navigatorTop + zoomedMax + halfOutline;
                    zoomedMax = navigatorTop + zoomedMin + halfOutline;

                    path = [
                        'M',
                        left + outlineHeight,
                        navigatorTop - scrollbarHeight - halfOutline, // top edge
                        'L',
                        left + outlineHeight,
                        verticalMin, // top right of zoomed range
                        'L',
                        left,
                        verticalMin, // top left of z.r.
                        'L',
                        left,
                        zoomedMax, // bottom left of z.r.
                        'L',
                        left + outlineHeight,
                        zoomedMax, // bottom right of z.r.
                        'L',
                        left + outlineHeight,
                        navigatorTop + navigatorSize + scrollbarHeight // bottom edge
                    ].concat(maskInside ? [
                        'M',
                        left + outlineHeight,
                        verticalMin - halfOutline, // upper left of zoomed range
                        'L',
                        left + outlineHeight,
                        zoomedMax + halfOutline // upper right of z.r.
                    ] : []);
                } else {
                    zoomedMin += left + scrollbarHeight - halfOutline; // #5800 - TO DO, remove halfOutline
                    zoomedMax += left + scrollbarHeight - halfOutline; // #5800 - TO DO, remove halfOutline
                    navigatorTop += halfOutline;

                    path = [
                        'M',
                        left,
                        navigatorTop, // left
                        'L',
                        zoomedMin,
                        navigatorTop, // upper left of zoomed range
                        'L',
                        zoomedMin,
                        navigatorTop + outlineHeight, // lower left of z.r.
                        'L',
                        zoomedMax,
                        navigatorTop + outlineHeight, // lower right of z.r.
                        'L',
                        zoomedMax,
                        navigatorTop, // upper right of z.r.
                        'L',
                        left + navigatorSize + scrollbarHeight * 2,
                        navigatorTop // right
                    ].concat(maskInside ? [
                        'M',
                        zoomedMin - halfOutline,
                        navigatorTop, // upper left of zoomed range
                        'L',
                        zoomedMax + halfOutline,
                        navigatorTop // upper right of z.r.
                    ] : []);
                }
                navigator.outline[verb]({
                    d: path
                });
            },

            /**
             * Render outline around the zoomed range
             * @param {Number} zoomedMin in pixels position where zoomed range starts
             * @param {Number} zoomedMax in pixels position where zoomed range ends
             * @param {Boolean} inverted flag if chart is inverted
             * @param {String} verb use 'animate' or 'attr'
             */
            drawMasks: function(zoomedMin, zoomedMax, inverted, verb) {
                var navigator = this,
                    left = navigator.left,
                    top = navigator.top,
                    navigatorHeight = navigator.height,
                    height,
                    width,
                    x,
                    y;

                // Determine rectangle position & size 
                // According to (non)inverted position:
                if (inverted) {
                    x = [left, left, left];
                    y = [top, top + zoomedMin, top + zoomedMax];
                    width = [navigatorHeight, navigatorHeight, navigatorHeight];
                    height = [
                        zoomedMin,
                        zoomedMax - zoomedMin,
                        navigator.size - zoomedMax
                    ];
                } else {
                    x = [left, left + zoomedMin, left + zoomedMax];
                    y = [top, top, top];
                    width = [
                        zoomedMin,
                        zoomedMax - zoomedMin,
                        navigator.size - zoomedMax
                    ];
                    height = [navigatorHeight, navigatorHeight, navigatorHeight];
                }
                each(navigator.shades, function(shade, i) {
                    shade[verb]({
                        x: x[i],
                        y: y[i],
                        width: width[i],
                        height: height[i]
                    });
                });
            },

            /**
             * Generate DOM elements for a navigator:
             * - main navigator group
             * - all shades
             * - outline
             * - handles
             */
            renderElements: function() {
                var navigator = this,
                    navigatorOptions = navigator.navigatorOptions,
                    maskInside = navigatorOptions.maskInside,
                    chart = navigator.chart,
                    inverted = chart.inverted,
                    renderer = chart.renderer,
                    navigatorGroup;

                // Create the main navigator group
                navigator.navigatorGroup = navigatorGroup = renderer.g('navigator')
                    .attr({
                        zIndex: 8,
                        visibility: 'hidden'
                    })
                    .add();



                var mouseCursor = {
                    cursor: inverted ? 'ns-resize' : 'ew-resize'
                };


                // Create masks, each mask will get events and fill:
                each([!maskInside, maskInside, !maskInside], function(hasMask, index) {
                    navigator.shades[index] = renderer.rect()
                        .addClass('highcharts-navigator-mask' +
                            (index === 1 ? '-inside' : '-outside'))

                    .attr({
                            fill: hasMask ? navigatorOptions.maskFill : 'transparent'
                        })
                        .css(index === 1 && mouseCursor)

                    .add(navigatorGroup);
                });

                // Create the outline:
                navigator.outline = renderer.path()
                    .addClass('highcharts-navigator-outline')

                .attr({
                    'stroke-width': navigatorOptions.outlineWidth,
                    stroke: navigatorOptions.outlineColor
                })

                .add(navigatorGroup);

                // Create the handlers:
                each([0, 1], function(index) {
                    navigator.handles[index] = renderer
                        .path(navigator.getHandlePath(inverted))
                        // zIndex = 6 for right handle, 7 for left.
                        // Can't be 10, because of the tooltip in inverted chart #2908
                        .attr({
                            zIndex: 7 - index
                        })
                        .addClass(
                            'highcharts-navigator-handle highcharts-navigator-handle-' + ['left', 'right'][index]
                        ).add(navigatorGroup);


                    var handlesOptions = navigatorOptions.handles;
                    navigator.handles[index]
                        .attr({
                            fill: handlesOptions.backgroundColor,
                            stroke: handlesOptions.borderColor,
                            'stroke-width': 1
                        })
                        .css(mouseCursor);

                });
            },

            /**
             * Update navigator
             * @param {Object} options Options to merge in when updating navigator
             */
            update: function(options) {
                this.destroy();
                var chartOptions = this.chart.options;
                merge(true, chartOptions.navigator, this.options, options);
                this.init(this.chart);
            },

            /**
             * Render the navigator
             * @param {Number} min X axis value minimum
             * @param {Number} max X axis value maximum
             * @param {Number} pxMin Pixel value minimum
             * @param {Number} pxMax Pixel value maximum
             */
            render: function(min, max, pxMin, pxMax) {
                var navigator = this,
                    chart = navigator.chart,
                    navigatorWidth,
                    scrollbarLeft,
                    scrollbarTop,
                    scrollbarHeight = navigator.scrollbarHeight,
                    navigatorSize,
                    xAxis = navigator.xAxis,
                    navigatorEnabled = navigator.navigatorEnabled,
                    zoomedMin,
                    zoomedMax,
                    rendered = navigator.rendered,
                    inverted = chart.inverted,
                    verb,
                    newMin,
                    newMax,
                    minRange = chart.xAxis[0].minRange;

                // Don't redraw while moving the handles (#4703).
                if (this.hasDragged && !defined(pxMin)) {
                    return;
                }

                // Don't render the navigator until we have data (#486, #4202, #5172).
                if (!isNumber(min) || !isNumber(max)) {
                    // However, if navigator was already rendered, we may need to resize
                    // it. For example hidden series, but visible navigator (#6022).
                    if (rendered) {
                        pxMin = 0;
                        pxMax = xAxis.width;
                    } else {
                        return;
                    }
                }

                navigator.left = pick(
                    xAxis.left,
                    chart.plotLeft + scrollbarHeight // in case of scrollbar only, without navigator
                );

                if (inverted) {
                    navigator.size = zoomedMax = navigatorSize = pick(
                        xAxis.len,
                        chart.plotHeight - 2 * scrollbarHeight
                    );
                    navigatorWidth = scrollbarHeight;
                } else {
                    navigator.size = zoomedMax = navigatorSize = pick(
                        xAxis.len,
                        chart.plotWidth - 2 * scrollbarHeight
                    );
                    navigatorWidth = navigatorSize + 2 * scrollbarHeight;
                }

                // Get the pixel position of the handles
                pxMin = pick(pxMin, xAxis.toPixels(min, true));
                pxMax = pick(pxMax, xAxis.toPixels(max, true));

                if (!isNumber(pxMin) || Math.abs(pxMin) === Infinity) { // Verify (#1851, #2238)
                    pxMin = 0;
                    pxMax = navigatorWidth;
                }

                // Are we below the minRange? (#2618, #6191)
                newMin = xAxis.toValue(pxMin, true);
                newMax = xAxis.toValue(pxMax, true);
                if (Math.abs(newMax - newMin) < minRange) {
                    if (this.grabbedLeft) {
                        pxMin = xAxis.toPixels(newMax - minRange, true);
                    } else if (this.grabbedRight) {
                        pxMax = xAxis.toPixels(newMin + minRange, true);
                    } else {
                        return;
                    }
                }

                // Handles are allowed to cross, but never exceed the plot area
                navigator.zoomedMax = Math.min(Math.max(pxMin, pxMax, 0), zoomedMax);
                navigator.zoomedMin = Math.min(
                    Math.max(
                        navigator.fixedWidth ?
                        navigator.zoomedMax - navigator.fixedWidth :
                        Math.min(pxMin, pxMax),
                        0
                    ),
                    zoomedMax
                );
                navigator.range = navigator.zoomedMax - navigator.zoomedMin;

                zoomedMax = Math.round(navigator.zoomedMax);
                zoomedMin = Math.round(navigator.zoomedMin);

                if (navigatorEnabled) {
                    navigator.navigatorGroup.attr({
                        visibility: 'visible'
                    });
                    // Place elements
                    verb = rendered && !navigator.hasDragged ? 'animate' : 'attr';

                    navigator.drawMasks(zoomedMin, zoomedMax, inverted, verb);
                    navigator.drawOutline(zoomedMin, zoomedMax, inverted, verb);
                    navigator.drawHandle(zoomedMin, 0, inverted, verb);
                    navigator.drawHandle(zoomedMax, 1, inverted, verb);
                }

                if (navigator.scrollbar) {
                    if (inverted) {
                        scrollbarTop = navigator.top - scrollbarHeight;
                        scrollbarLeft = navigator.left - scrollbarHeight +
                            (navigatorEnabled ? 0 : navigator.height);
                        scrollbarHeight = navigatorSize + 2 * scrollbarHeight;
                    } else {
                        scrollbarTop = navigator.top +
                            (navigatorEnabled ? navigator.height : -scrollbarHeight);
                        scrollbarLeft = navigator.left - scrollbarHeight;
                    }
                    // Reposition scrollbar
                    navigator.scrollbar.position(
                        scrollbarLeft,
                        scrollbarTop,
                        navigatorWidth,
                        scrollbarHeight
                    );
                    // Keep scale 0-1
                    navigator.scrollbar.setRange(
                        zoomedMin / navigatorSize,
                        zoomedMax / navigatorSize
                    );
                }
                navigator.rendered = true;
            },

            /**
             * Set up the mouse and touch events for the navigator
             */
            addMouseEvents: function() {
                var navigator = this,
                    chart = navigator.chart,
                    container = chart.container,
                    eventsToUnbind = [],
                    mouseMoveHandler,
                    mouseUpHandler;

                /**
                 * Create mouse events' handlers.
                 * Make them as separate functions to enable wrapping them:
                 */
                navigator.mouseMoveHandler = mouseMoveHandler = function(e) {
                    navigator.onMouseMove(e);
                };
                navigator.mouseUpHandler = mouseUpHandler = function(e) {
                    navigator.onMouseUp(e);
                };

                // Add shades and handles mousedown events
                eventsToUnbind = navigator.getPartsEvents('mousedown');
                // Add mouse move and mouseup events. These are bind to doc/container,
                // because Navigator.grabbedSomething flags are stored in mousedown events:
                eventsToUnbind.push(
                    addEvent(container, 'mousemove', mouseMoveHandler),
                    addEvent(doc, 'mouseup', mouseUpHandler)
                );

                // Touch events
                if (hasTouch) {
                    eventsToUnbind.push(
                        addEvent(container, 'touchmove', mouseMoveHandler),
                        addEvent(doc, 'touchend', mouseUpHandler)
                    );
                    eventsToUnbind.concat(navigator.getPartsEvents('touchstart'));
                }

                navigator.eventsToUnbind = eventsToUnbind;

                // Data events
                if (navigator.series && navigator.series[0]) {
                    eventsToUnbind.push(
                        addEvent(navigator.series[0].xAxis, 'foundExtremes', function() {
                            chart.navigator.modifyNavigatorAxisExtremes();
                        })
                    );
                }
            },

            /**
             * Generate events for handles and masks
             * @param {String} eventName Event name handler, 'mousedown' or 'touchstart'
             * @returns {Array} An array of arrays: [DOMElement, eventName, callback].
             */
            getPartsEvents: function(eventName) {
                var navigator = this,
                    events = [];
                each(['shades', 'handles'], function(name) {
                    each(navigator[name], function(navigatorItem, index) {
                        events.push(
                            addEvent(
                                navigatorItem.element,
                                eventName,
                                function(e) {
                                    navigator[name + 'Mousedown'](e, index);
                                }
                            )
                        );
                    });
                });
                return events;
            },

            /**
             * Mousedown on a shaded mask, either:
             * - will be stored for future drag&drop 
             * - will directly shift to a new range
             *
             * @param {Object} e Mouse event
             * @param {Number} index Index of a mask in Navigator.shades array
             */
            shadesMousedown: function(e, index) {
                e = this.chart.pointer.normalize(e);

                var navigator = this,
                    chart = navigator.chart,
                    xAxis = navigator.xAxis,
                    zoomedMin = navigator.zoomedMin,
                    navigatorPosition = navigator.left,
                    navigatorSize = navigator.size,
                    range = navigator.range,
                    chartX = e.chartX,
                    fixedMax,
                    ext,
                    left;

                // For inverted chart, swap some options:
                if (chart.inverted) {
                    chartX = e.chartY;
                    navigatorPosition = navigator.top;
                }

                if (index === 1) {
                    // Store information for drag&drop
                    navigator.grabbedCenter = chartX;
                    navigator.fixedWidth = range;
                    navigator.dragOffset = chartX - zoomedMin;
                } else {
                    // Shift the range by clicking on shaded areas
                    left = chartX - navigatorPosition - range / 2;
                    if (index === 0) {
                        left = Math.max(0, left);
                    } else if (index === 2 && left + range >= navigatorSize) {
                        left = navigatorSize - range;
                        fixedMax = navigator.getUnionExtremes().dataMax; // #2293, #3543
                    }
                    if (left !== zoomedMin) { // it has actually moved
                        navigator.fixedWidth = range; // #1370

                        ext = xAxis.toFixedRange(left, left + range, null, fixedMax);
                        chart.xAxis[0].setExtremes(
                            Math.min(ext.min, ext.max),
                            Math.max(ext.min, ext.max),
                            true,
                            null, // auto animation
                            {
                                trigger: 'navigator'
                            }
                        );
                    }
                }
            },

            /**
             * Mousedown on a handle mask.
             * Will store necessary information for drag&drop.
             *
             * @param {Object} e Mouse event
             * @param {Number} index Index of a handle in Navigator.handles array
             */
            handlesMousedown: function(e, index) {
                e = this.chart.pointer.normalize(e);

                var navigator = this,
                    chart = navigator.chart,
                    baseXAxis = chart.xAxis[0],
                    // For reversed axes, min and max are chagned,
                    // so the other extreme should be stored
                    reverse = (chart.inverted && !baseXAxis.reversed) ||
                    (!chart.inverted && baseXAxis.reversed);

                if (index === 0) {
                    // Grab the left handle
                    navigator.grabbedLeft = true;
                    navigator.otherHandlePos = navigator.zoomedMax;
                    navigator.fixedExtreme = reverse ? baseXAxis.min : baseXAxis.max;
                } else {
                    // Grab the right handle
                    navigator.grabbedRight = true;
                    navigator.otherHandlePos = navigator.zoomedMin;
                    navigator.fixedExtreme = reverse ? baseXAxis.max : baseXAxis.min;
                }

                chart.fixedRange = null;
            },
            /**
             * Mouse move event based on x/y mouse position.
             * @param {Object} e Mouse event
             */
            onMouseMove: function(e) {
                var navigator = this,
                    chart = navigator.chart,
                    left = navigator.left,
                    navigatorSize = navigator.navigatorSize,
                    range = navigator.range,
                    dragOffset = navigator.dragOffset,
                    inverted = chart.inverted,
                    chartX;


                // In iOS, a mousemove event with e.pageX === 0 is fired when holding the finger
                // down in the center of the scrollbar. This should be ignored.
                if (!e.touches || e.touches[0].pageX !== 0) { // #4696, scrollbar failed on Android

                    e = chart.pointer.normalize(e);
                    chartX = e.chartX;

                    // Swap some options for inverted chart
                    if (inverted) {
                        left = navigator.top;
                        chartX = e.chartY;
                    }

                    // Drag left handle or top handle
                    if (navigator.grabbedLeft) {
                        navigator.hasDragged = true;
                        navigator.render(
                            0,
                            0,
                            chartX - left,
                            navigator.otherHandlePos
                        );
                        // Drag right handle or bottom handle
                    } else if (navigator.grabbedRight) {
                        navigator.hasDragged = true;
                        navigator.render(
                            0,
                            0,
                            navigator.otherHandlePos,
                            chartX - left
                        );
                        // Drag scrollbar or open area in navigator
                    } else if (navigator.grabbedCenter) {
                        navigator.hasDragged = true;
                        if (chartX < dragOffset) { // outside left
                            chartX = dragOffset;
                        } else if (chartX > navigatorSize + dragOffset - range) { // outside right
                            chartX = navigatorSize + dragOffset - range;
                        }
                        navigator.render(
                            0,
                            0,
                            chartX - dragOffset,
                            chartX - dragOffset + range
                        );
                    }
                    if (navigator.hasDragged && navigator.scrollbar && navigator.scrollbar.options.liveRedraw) {
                        e.DOMType = e.type; // DOMType is for IE8 because it can't read type async
                        setTimeout(function() {
                            navigator.onMouseUp(e);
                        }, 0);
                    }
                }
            },

            /**
             * Mouse up event based on x/y mouse position.
             * @param {Object} e Mouse event
             */
            onMouseUp: function(e) {
                var navigator = this,
                    chart = navigator.chart,
                    xAxis = navigator.xAxis,
                    fixedMin,
                    fixedMax,
                    ext,
                    DOMEvent = e.DOMEvent || e;

                if (navigator.hasDragged || e.trigger === 'scrollbar') {
                    // When dragging one handle, make sure the other one doesn't change
                    if (navigator.zoomedMin === navigator.otherHandlePos) {
                        fixedMin = navigator.fixedExtreme;
                    } else if (navigator.zoomedMax === navigator.otherHandlePos) {
                        fixedMax = navigator.fixedExtreme;
                    }
                    // Snap to right edge (#4076)
                    if (navigator.zoomedMax === navigator.navigatorSize) {
                        fixedMax = navigator.getUnionExtremes().dataMax;
                    }
                    ext = xAxis.toFixedRange(
                        navigator.zoomedMin,
                        navigator.zoomedMax,
                        fixedMin,
                        fixedMax
                    );

                    if (defined(ext.min)) {
                        chart.xAxis[0].setExtremes(
                            Math.min(ext.min, ext.max),
                            Math.max(ext.min, ext.max),
                            true,
                            navigator.hasDragged ? false : null, // Run animation when clicking buttons, scrollbar track etc, but not when dragging handles or scrollbar
                            {
                                trigger: 'navigator',
                                triggerOp: 'navigator-drag',
                                DOMEvent: DOMEvent // #1838
                            }
                        );
                    }
                }

                if (e.DOMType !== 'mousemove') {
                    navigator.grabbedLeft = navigator.grabbedRight =
                        navigator.grabbedCenter = navigator.fixedWidth =
                        navigator.fixedExtreme = navigator.otherHandlePos =
                        navigator.hasDragged = navigator.dragOffset = null;
                }
            },

            /**
             * Removes the event handlers attached previously with addEvents.
             */
            removeEvents: function() {
                if (this.eventsToUnbind) {
                    each(this.eventsToUnbind, function(unbind) {
                        unbind();
                    });
                    this.eventsToUnbind = undefined;
                }
                this.removeBaseSeriesEvents();
            },

            /**
             * Remove data events.
             */
            removeBaseSeriesEvents: function() {
                var baseSeries = this.baseSeries || [];
                if (this.navigatorEnabled && baseSeries[0] && this.navigatorOptions.adaptToUpdatedData !== false) {
                    each(baseSeries, function(series) {
                        removeEvent(series, 'updatedData', this.updatedDataHandler);
                    }, this);

                    // We only listen for extremes-events on the first baseSeries
                    if (baseSeries[0].xAxis) {
                        removeEvent(baseSeries[0].xAxis, 'foundExtremes', this.modifyBaseAxisExtremes);
                    }
                }
            },

            /**
             * Initiate the Navigator object
             */
            init: function(chart) {
                var chartOptions = chart.options,
                    navigatorOptions = chartOptions.navigator,
                    navigatorEnabled = navigatorOptions.enabled,
                    scrollbarOptions = chartOptions.scrollbar,
                    scrollbarEnabled = scrollbarOptions.enabled,
                    height = navigatorEnabled ? navigatorOptions.height : 0,
                    scrollbarHeight = scrollbarEnabled ? scrollbarOptions.height : 0;

                this.handles = [];
                this.shades = [];

                this.chart = chart;
                this.setBaseSeries();

                this.height = height;
                this.scrollbarHeight = scrollbarHeight;
                this.scrollbarEnabled = scrollbarEnabled;
                this.navigatorEnabled = navigatorEnabled;
                this.navigatorOptions = navigatorOptions;
                this.scrollbarOptions = scrollbarOptions;
                this.outlineHeight = height + scrollbarHeight;

                var navigator = this,
                    baseSeries = navigator.baseSeries,
                    xAxisIndex = chart.xAxis.length,
                    yAxisIndex = chart.yAxis.length,
                    baseXaxis = baseSeries && baseSeries[0] && baseSeries[0].xAxis || chart.xAxis[0];

                // Make room for the navigator, can be placed around the chart:
                chart.extraMargin = {
                    type: navigatorOptions.opposite ? 'plotTop' : 'marginBottom',
                    value: navigator.outlineHeight + navigatorOptions.margin
                };
                if (chart.inverted) {
                    chart.extraMargin.type = navigatorOptions.opposite ? 'marginRight' : 'plotLeft';
                }
                chart.isDirtyBox = true;

                if (navigator.navigatorEnabled) {
                    // an x axis is required for scrollbar also
                    navigator.xAxis = new Axis(chart, merge({
                        // inherit base xAxis' break and ordinal options
                        breaks: baseXaxis.options.breaks,
                        ordinal: baseXaxis.options.ordinal
                    }, navigatorOptions.xAxis, {
                        id: 'navigator-x-axis',
                        yAxis: 'navigator-y-axis',
                        isX: true,
                        type: 'datetime',
                        index: xAxisIndex,
                        offset: 0,
                        keepOrdinalPadding: true, // #2436
                        startOnTick: false,
                        endOnTick: false,
                        minPadding: 0,
                        maxPadding: 0,
                        zoomEnabled: false
                    }, chart.inverted ? {
                        offsets: [scrollbarHeight, 0, -scrollbarHeight, 0],
                        width: height
                    } : {
                        offsets: [0, -scrollbarHeight, 0, scrollbarHeight],
                        height: height
                    }));

                    navigator.yAxis = new Axis(chart, merge(navigatorOptions.yAxis, {
                        id: 'navigator-y-axis',
                        alignTicks: false,
                        offset: 0,
                        index: yAxisIndex,
                        zoomEnabled: false
                    }, chart.inverted ? {
                        width: height
                    } : {
                        height: height
                    }));

                    // If we have a base series, initialize the navigator series
                    if (baseSeries || navigatorOptions.series.data) {
                        navigator.addBaseSeries();

                        // If not, set up an event to listen for added series
                    } else if (chart.series.length === 0) {

                        wrap(chart, 'redraw', function(proceed, animation) {
                            // We've got one, now add it as base and reset chart.redraw
                            if (chart.series.length > 0 && !navigator.series) {
                                navigator.setBaseSeries();
                                chart.redraw = proceed; // reset
                            }
                            proceed.call(chart, animation);
                        });
                    }

                    // Render items, so we can bind events to them:
                    navigator.renderElements();
                    // Add mouse events
                    navigator.addMouseEvents();

                    // in case of scrollbar only, fake an x axis to get translation
                } else {
                    navigator.xAxis = {
                        translate: function(value, reverse) {
                            var axis = chart.xAxis[0],
                                ext = axis.getExtremes(),
                                scrollTrackWidth = chart.plotWidth - 2 * scrollbarHeight,
                                min = numExt('min', axis.options.min, ext.dataMin),
                                valueRange = numExt('max', axis.options.max, ext.dataMax) - min;

                            return reverse ?
                                // from pixel to value
                                (value * valueRange / scrollTrackWidth) + min :
                                // from value to pixel
                                scrollTrackWidth * (value - min) / valueRange;
                        },
                        toPixels: function(value) {
                            return this.translate(value);
                        },
                        toValue: function(value) {
                            return this.translate(value, true);
                        },
                        toFixedRange: Axis.prototype.toFixedRange,
                        fake: true
                    };
                }


                // Initialize the scrollbar
                if (chart.options.scrollbar.enabled) {
                    chart.scrollbar = navigator.scrollbar = new Scrollbar(
                        chart.renderer,
                        merge(chart.options.scrollbar, {
                            margin: navigator.navigatorEnabled ? 0 : 10,
                            vertical: chart.inverted
                        }),
                        chart
                    );
                    addEvent(navigator.scrollbar, 'changed', function(e) {
                        var range = navigator.size,
                            to = range * this.to,
                            from = range * this.from;

                        navigator.hasDragged = navigator.scrollbar.hasDragged;
                        navigator.render(0, 0, from, to);

                        if (chart.options.scrollbar.liveRedraw || e.DOMType !== 'mousemove') {
                            setTimeout(function() {
                                navigator.onMouseUp(e);
                            });
                        }
                    });
                }

                // Add data events
                navigator.addBaseSeriesEvents();
                // Add redraw events
                navigator.addChartEvents();
            },

            /**
             * Get the union data extremes of the chart - the outer data extremes of the base
             * X axis and the navigator axis.
             * @param {boolean} returnFalseOnNoBaseSeries - as the param says.
             */
            getUnionExtremes: function(returnFalseOnNoBaseSeries) {
                var baseAxis = this.chart.xAxis[0],
                    navAxis = this.xAxis,
                    navAxisOptions = navAxis.options,
                    baseAxisOptions = baseAxis.options,
                    ret;

                if (!returnFalseOnNoBaseSeries || baseAxis.dataMin !== null) {
                    ret = {
                        dataMin: pick( // #4053
                            navAxisOptions && navAxisOptions.min,
                            numExt(
                                'min',
                                baseAxisOptions.min,
                                baseAxis.dataMin,
                                navAxis.dataMin,
                                navAxis.min
                            )
                        ),
                        dataMax: pick(
                            navAxisOptions && navAxisOptions.max,
                            numExt(
                                'max',
                                baseAxisOptions.max,
                                baseAxis.dataMax,
                                navAxis.dataMax,
                                navAxis.max
                            )
                        )
                    };
                }
                return ret;
            },

            /**
             * Set the base series. With a bit of modification we should be able to make
             * this an API method to be called from the outside
             * @param {Object} baseSeriesOptions - series options for a navigator
             */
            setBaseSeries: function(baseSeriesOptions) {
                var chart = this.chart,
                    baseSeries = this.baseSeries = [];

                baseSeriesOptions = baseSeriesOptions || chart.options && chart.options.navigator.baseSeries || 0;

                // If we're resetting, remove the existing series
                if (this.series) {
                    this.removeBaseSeriesEvents();
                    each(this.series, function(s) {
                        s.destroy();
                    });
                }

                // Iterate through series and add the ones that should be shown in navigator
                each(chart.series || [], function(series, i) {
                    if (series.options.showInNavigator || (i === baseSeriesOptions || series.options.id === baseSeriesOptions) &&
                        series.options.showInNavigator !== false) {
                        baseSeries.push(series);
                    }
                });

                // When run after render, this.xAxis already exists
                if (this.xAxis && !this.xAxis.fake) {
                    this.addBaseSeries();
                }
            },

            /*
             * Add base series to the navigator.
             */
            addBaseSeries: function() {
                var navigator = this,
                    chart = navigator.chart,
                    navigatorSeries = navigator.series = [],
                    baseSeries = navigator.baseSeries,
                    baseOptions,
                    mergedNavSeriesOptions,
                    chartNavigatorOptions = navigator.navigatorOptions.series,
                    baseNavigatorOptions,
                    navSeriesMixin = {
                        enableMouseTracking: false,
                        index: null, // #6162
                        group: 'nav', // for columns
                        padXAxis: false,
                        xAxis: 'navigator-x-axis',
                        yAxis: 'navigator-y-axis',
                        showInLegend: false,
                        stacking: false, // #4823
                        isInternal: true,
                        visible: true
                    };

                // Go through each base series and merge the options to create new series
                if (baseSeries) {
                    each(baseSeries, function(base, i) {
                        navSeriesMixin.name = 'Navigator ' + (i + 1);

                        baseOptions = base.options || {};
                        baseNavigatorOptions = baseOptions.navigatorOptions || {};
                        mergedNavSeriesOptions = merge(baseOptions, navSeriesMixin, chartNavigatorOptions, baseNavigatorOptions);

                        // Merge data separately. Do a slice to avoid mutating the navigator options from base series (#4923).
                        var navigatorSeriesData = baseNavigatorOptions.data || chartNavigatorOptions.data;
                        navigator.hasNavigatorData = navigator.hasNavigatorData || !!navigatorSeriesData;
                        mergedNavSeriesOptions.data = navigatorSeriesData || baseOptions.data && baseOptions.data.slice(0);

                        // Add the series
                        base.navigatorSeries = chart.initSeries(mergedNavSeriesOptions);
                        navigatorSeries.push(base.navigatorSeries);
                    });
                } else {
                    // No base series, build from mixin and chart wide options
                    mergedNavSeriesOptions = merge(chartNavigatorOptions, navSeriesMixin);
                    mergedNavSeriesOptions.data = chartNavigatorOptions.data;
                    navigator.hasNavigatorData = !!mergedNavSeriesOptions.data;
                    navigatorSeries.push(chart.initSeries(mergedNavSeriesOptions));
                }

                this.addBaseSeriesEvents();
            },

            /**
             * Add data events.
             * For example when main series is updated we need to recalculate extremes
             */
            addBaseSeriesEvents: function() {
                var navigator = this,
                    baseSeries = navigator.baseSeries || [];

                // Bind modified extremes event to first base's xAxis only. In event of > 1 base-xAxes, the navigator will ignore those.
                if (baseSeries[0] && baseSeries[0].xAxis) {
                    addEvent(baseSeries[0].xAxis, 'foundExtremes', this.modifyBaseAxisExtremes);
                }

                if (this.navigatorOptions.adaptToUpdatedData !== false) {
                    // Respond to updated data in the base series.
                    // Abort if lazy-loading data from the server.
                    each(baseSeries, function(base) {
                        if (base.xAxis) {
                            addEvent(base, 'updatedData', this.updatedDataHandler);
                            // Survive Series.update()
                            base.userOptions.events = extend(base.userOptions.event, {
                                updatedData: this.updatedDataHandler
                            });
                        }

                        // Handle series removal
                        addEvent(base, 'remove', function() {
                            if (this.navigatorSeries) {
                                erase(navigator.series, this.navigatorSeries);
                                this.navigatorSeries.remove();
                                delete this.navigatorSeries;
                            }
                        });
                    }, this);
                }
            },

            /**
             * Set the navigator x axis extremes to reflect the total. The navigator extremes
             * should always be the extremes of the union of all series in the chart as
             * well as the navigator series.
             */
            modifyNavigatorAxisExtremes: function() {
                var xAxis = this.xAxis,
                    unionExtremes;

                if (xAxis.getExtremes) {
                    unionExtremes = this.getUnionExtremes(true);
                    if (unionExtremes && (unionExtremes.dataMin !== xAxis.min || unionExtremes.dataMax !== xAxis.max)) {
                        xAxis.min = unionExtremes.dataMin;
                        xAxis.max = unionExtremes.dataMax;
                    }
                }
            },

            /**
             * Hook to modify the base axis extremes with information from the Navigator
             */
            modifyBaseAxisExtremes: function() {
                var baseXAxis = this,
                    navigator = baseXAxis.chart.navigator,
                    baseExtremes = baseXAxis.getExtremes(),
                    baseMin = baseExtremes.min,
                    baseMax = baseExtremes.max,
                    baseDataMin = baseExtremes.dataMin,
                    baseDataMax = baseExtremes.dataMax,
                    range = baseMax - baseMin,
                    stickToMin = navigator.stickToMin,
                    stickToMax = navigator.stickToMax,
                    newMax,
                    newMin,
                    navigatorSeries = navigator.series && navigator.series[0],
                    hasSetExtremes = !!baseXAxis.setExtremes,

                    // When the extremes have been set by range selector button, don't stick to min or max.
                    // The range selector buttons will handle the extremes. (#5489)
                    unmutable = baseXAxis.eventArgs && baseXAxis.eventArgs.trigger === 'rangeSelectorButton';

                if (!unmutable) {

                    // If the zoomed range is already at the min, move it to the right as new data
                    // comes in
                    if (stickToMin) {
                        newMin = baseDataMin;
                        newMax = newMin + range;
                    }

                    // If the zoomed range is already at the max, move it to the right as new data
                    // comes in
                    if (stickToMax) {
                        newMax = baseDataMax;
                        if (!stickToMin) { // if stickToMin is true, the new min value is set above
                            newMin = Math.max(
                                newMax - range,
                                navigatorSeries && navigatorSeries.xData ?
                                navigatorSeries.xData[0] : -Number.MAX_VALUE
                            );
                        }
                    }

                    // Update the extremes
                    if (hasSetExtremes && (stickToMin || stickToMax)) {
                        if (isNumber(newMin)) {
                            baseXAxis.min = baseXAxis.userMin = newMin;
                            baseXAxis.max = baseXAxis.userMax = newMax;
                        }
                    }
                }

                // Reset
                navigator.stickToMin = navigator.stickToMax = null;
            },

            /**
             * Handler for updated data on the base series. When data is modified, the navigator series
             * must reflect it. This is called from the Chart.redraw function before axis and series
             * extremes are computed.
             */
            updatedDataHandler: function() {
                var navigator = this.chart.navigator,
                    baseSeries = this,
                    navigatorSeries = this.navigatorSeries;

                // Detect whether the zoomed area should stick to the minimum or maximum. If the current
                // axis minimum falls outside the new updated dataset, we must adjust.
                navigator.stickToMin = isNumber(baseSeries.xAxis.min) && (baseSeries.xAxis.min <= baseSeries.xData[0]);
                // If the scrollbar is scrolled all the way to the right, keep right as new data 
                // comes in.
                navigator.stickToMax = Math.round(navigator.zoomedMax) >= Math.round(navigator.size);

                // Set the navigator series data to the new data of the base series
                if (navigatorSeries && !navigator.hasNavigatorData) {
                    navigatorSeries.options.pointStart = baseSeries.xData[0];
                    navigatorSeries.setData(baseSeries.options.data, false, null, false); // #5414
                }
            },

            /**
             * Add chart events, like redrawing navigator, when chart requires that.
             */
            addChartEvents: function() {
                addEvent(this.chart, 'redraw', function() {
                    // Move the scrollbar after redraw, like after data updata even if axes don't redraw
                    var navigator = this.navigator,
                        xAxis = navigator && (
                            navigator.baseSeries &&
                            navigator.baseSeries[0] &&
                            navigator.baseSeries[0].xAxis ||
                            navigator.scrollbar && this.xAxis[0]
                        ); // #5709

                    if (xAxis) {
                        navigator.render(xAxis.min, xAxis.max);
                    }
                });
            },

            /**
             * Destroys allocated elements.
             */
            destroy: function() {

                // Disconnect events added in addEvents
                this.removeEvents();

                if (this.xAxis) {
                    erase(this.chart.xAxis, this.xAxis);
                    erase(this.chart.axes, this.xAxis);
                }
                if (this.yAxis) {
                    erase(this.chart.yAxis, this.yAxis);
                    erase(this.chart.axes, this.yAxis);
                }
                // Destroy series
                each(this.series || [], function(s) {
                    if (s.destroy) {
                        s.destroy();
                    }
                });

                // Destroy properties
                each([
                    'series', 'xAxis', 'yAxis', 'shades', 'outline', 'scrollbarTrack',
                    'scrollbarRifles', 'scrollbarGroup', 'scrollbar', 'navigatorGroup',
                    'rendered'
                ], function(prop) {
                    if (this[prop] && this[prop].destroy) {
                        this[prop].destroy();
                    }
                    this[prop] = null;
                }, this);

                // Destroy elements in collection
                each([this.handles], function(coll) {
                    destroyObjectProperties(coll);
                }, this);
            }
        };

        H.Navigator = Navigator;

        /**
         * For Stock charts, override selection zooming with some special features because
         * X axis zooming is already allowed by the Navigator and Range selector.
         */
        wrap(Axis.prototype, 'zoom', function(proceed, newMin, newMax) {
            var chart = this.chart,
                chartOptions = chart.options,
                zoomType = chartOptions.chart.zoomType,
                previousZoom,
                navigator = chartOptions.navigator,
                rangeSelector = chartOptions.rangeSelector,
                ret;

            if (this.isXAxis && ((navigator && navigator.enabled) ||
                    (rangeSelector && rangeSelector.enabled))) {

                // For x only zooming, fool the chart.zoom method not to create the zoom button
                // because the property already exists
                if (zoomType === 'x') {
                    chart.resetZoomButton = 'blocked';

                    // For y only zooming, ignore the X axis completely
                } else if (zoomType === 'y') {
                    ret = false;

                    // For xy zooming, record the state of the zoom before zoom selection, then when
                    // the reset button is pressed, revert to this state
                } else if (zoomType === 'xy') {
                    previousZoom = this.previousZoom;
                    if (defined(newMin)) {
                        this.previousZoom = [this.min, this.max];
                    } else if (previousZoom) {
                        newMin = previousZoom[0];
                        newMax = previousZoom[1];
                        delete this.previousZoom;
                    }
                }

            }
            return ret !== undefined ? ret : proceed.call(this, newMin, newMax);
        });

        // Initialize navigator for stock charts
        wrap(Chart.prototype, 'init', function(proceed, options, callback) {

            addEvent(this, 'beforeRender', function() {
                var options = this.options;
                if (options.navigator.enabled || options.scrollbar.enabled) {
                    this.scroller = this.navigator = new Navigator(this);
                }
            });

            proceed.call(this, options, callback);

        });

        /**
         * For stock charts, extend the Chart.setChartSize method so that we can set the final top position
         * of the navigator once the height of the chart, including the legend, is determined. #367.
         * We can't use Chart.getMargins, because labels offsets are not calculated yet.
         */
        wrap(Chart.prototype, 'setChartSize', function(proceed) {

            var legend = this.legend,
                navigator = this.navigator,
                scrollbarHeight,
                legendOptions,
                xAxis,
                yAxis;

            proceed.apply(this, [].slice.call(arguments, 1));

            if (navigator) {
                legendOptions = legend.options;
                xAxis = navigator.xAxis;
                yAxis = navigator.yAxis;
                scrollbarHeight = navigator.scrollbarHeight;

                // Compute the top position
                if (this.inverted) {
                    navigator.left = navigator.navigatorOptions.opposite ?
                        this.chartWidth - scrollbarHeight - navigator.height :
                        this.spacing[3] + scrollbarHeight;
                    navigator.top = this.plotTop + scrollbarHeight;
                } else {
                    navigator.left = this.plotLeft + scrollbarHeight;
                    navigator.top = navigator.navigatorOptions.top ||
                        this.chartHeight - navigator.height - scrollbarHeight - this.spacing[2] -
                        (legendOptions.verticalAlign === 'bottom' && legendOptions.enabled && !legendOptions.floating ?
                            legend.legendHeight + pick(legendOptions.margin, 10) : 0);
                }

                if (xAxis && yAxis) { // false if navigator is disabled (#904)

                    if (this.inverted) {
                        xAxis.options.left = yAxis.options.left = navigator.left;
                    } else {
                        xAxis.options.top = yAxis.options.top = navigator.top;
                    }

                    xAxis.setAxisSize();
                    yAxis.setAxisSize();
                }
            }
        });

        // Pick up badly formatted point options to addPoint
        wrap(Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {
            var turboThreshold = this.options.turboThreshold;
            if (turboThreshold && this.xData.length > turboThreshold && isObject(options, true) && this.chart.navigator) {
                error(20, true);
            }
            proceed.call(this, options, redraw, shift, animation);
        });

        // Handle adding new series
        wrap(Chart.prototype, 'addSeries', function(proceed, options, redraw, animation) {
            var series = proceed.call(this, options, false, animation);
            if (this.navigator) {
                this.navigator.setBaseSeries(); // Recompute which series should be shown in navigator, and add them
            }
            if (pick(redraw, true)) {
                this.redraw();
            }
            return series;
        });

        // Handle updating series
        wrap(Series.prototype, 'update', function(proceed, newOptions, redraw) {
            proceed.call(this, newOptions, false);
            if (this.chart.navigator) {
                this.chart.navigator.setBaseSeries();
            }
            if (pick(redraw, true)) {
                this.chart.redraw();
            }
        });

        Chart.prototype.callbacks.push(function(chart) {
            var extremes,
                navigator = chart.navigator;

            // Initiate the navigator
            if (navigator) {
                extremes = chart.xAxis[0].getExtremes();
                navigator.render(extremes.min, extremes.max);
            }
        });

        /* ****************************************************************************
         * End Navigator code														  *
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            Axis = H.Axis,
            Chart = H.Chart,
            css = H.css,
            createElement = H.createElement,
            dateFormat = H.dateFormat,
            defaultOptions = H.defaultOptions,
            useUTC = defaultOptions.global.useUTC,
            defined = H.defined,
            destroyObjectProperties = H.destroyObjectProperties,
            discardElement = H.discardElement,
            each = H.each,
            extend = H.extend,
            fireEvent = H.fireEvent,
            HCDate = H.Date,
            isNumber = H.isNumber,
            merge = H.merge,
            pick = H.pick,
            pInt = H.pInt,
            splat = H.splat,
            wrap = H.wrap;

        /* ****************************************************************************
         * Start Range Selector code												  *
         *****************************************************************************/
        extend(defaultOptions, {
            rangeSelector: {
                // allButtonsEnabled: false,
                // enabled: true,
                // buttons: {Object}
                // buttonSpacing: 0,
                buttonTheme: {
                    'stroke-width': 0,
                    width: 28,
                    height: 18,
                    padding: 2,
                    zIndex: 7 // #484, #852
                },
                height: 35, // reserved space for buttons and input
                inputPosition: {
                    align: 'right'
                },
                // inputDateFormat: '%b %e, %Y',
                // inputEditDateFormat: '%Y-%m-%d',
                // inputEnabled: true,
                // selected: undefined,

                // inputStyle: {},
                labelStyle: {
                    color: '#666666'
                }

            }
        });
        defaultOptions.lang = merge(defaultOptions.lang, {
            rangeSelectorZoom: 'Zoom',
            rangeSelectorFrom: 'From',
            rangeSelectorTo: 'To'
        });

        /**
         * The range selector.
         * @class
         * @param {Object} chart
         */
        function RangeSelector(chart) {

            // Run RangeSelector
            this.init(chart);
        }

        RangeSelector.prototype = {
            /**
             * The method to run when one of the buttons in the range selectors is clicked
             * @param {Number} i The index of the button
             * @param {Object} rangeOptions
             * @param {Boolean} redraw
             */
            clickButton: function(i, redraw) {
                var rangeSelector = this,
                    chart = rangeSelector.chart,
                    rangeOptions = rangeSelector.buttonOptions[i],
                    baseAxis = chart.xAxis[0],
                    unionExtremes = (chart.scroller && chart.scroller.getUnionExtremes()) || baseAxis || {},
                    dataMin = unionExtremes.dataMin,
                    dataMax = unionExtremes.dataMax,
                    newMin,
                    newMax = baseAxis && Math.round(Math.min(baseAxis.max, pick(dataMax, baseAxis.max))), // #1568
                    type = rangeOptions.type,
                    baseXAxisOptions,
                    range = rangeOptions._range,
                    rangeMin,
                    minSetting,
                    rangeSetting,
                    ctx,
                    ytdExtremes,
                    dataGrouping = rangeOptions.dataGrouping;

                if (dataMin === null || dataMax === null) { // chart has no data, base series is removed
                    return;
                }

                // Set the fixed range before range is altered
                chart.fixedRange = range;

                // Apply dataGrouping associated to button
                if (dataGrouping) {
                    this.forcedDataGrouping = true;
                    Axis.prototype.setDataGrouping.call(baseAxis || {
                        chart: this.chart
                    }, dataGrouping, false);
                }

                // Apply range
                if (type === 'month' || type === 'year') {
                    if (!baseAxis) {
                        // This is set to the user options and picked up later when the axis is instantiated
                        // so that we know the min and max.
                        range = rangeOptions;
                    } else {
                        ctx = {
                            range: rangeOptions,
                            max: newMax,
                            dataMin: dataMin,
                            dataMax: dataMax
                        };
                        newMin = baseAxis.minFromRange.call(ctx);
                        if (isNumber(ctx.newMax)) {
                            newMax = ctx.newMax;
                        }
                    }

                    // Fixed times like minutes, hours, days
                } else if (range) {
                    newMin = Math.max(newMax - range, dataMin);
                    newMax = Math.min(newMin + range, dataMax);

                } else if (type === 'ytd') {

                    // On user clicks on the buttons, or a delayed action running from the beforeRender
                    // event (below), the baseAxis is defined.
                    if (baseAxis) {
                        // When "ytd" is the pre-selected button for the initial view, its calculation
                        // is delayed and rerun in the beforeRender event (below). When the series
                        // are initialized, but before the chart is rendered, we have access to the xData
                        // array (#942).
                        if (dataMax === undefined) {
                            dataMin = Number.MAX_VALUE;
                            dataMax = Number.MIN_VALUE;
                            each(chart.series, function(series) {
                                var xData = series.xData; // reassign it to the last item
                                dataMin = Math.min(xData[0], dataMin);
                                dataMax = Math.max(xData[xData.length - 1], dataMax);
                            });
                            redraw = false;
                        }
                        ytdExtremes = rangeSelector.getYTDExtremes(dataMax, dataMin, useUTC);
                        newMin = rangeMin = ytdExtremes.min;
                        newMax = ytdExtremes.max;

                        // "ytd" is pre-selected. We don't yet have access to processed point and extremes data
                        // (things like pointStart and pointInterval are missing), so we delay the process (#942)
                    } else {
                        addEvent(chart, 'beforeRender', function() {
                            rangeSelector.clickButton(i);
                        });
                        return;
                    }
                } else if (type === 'all' && baseAxis) {
                    newMin = dataMin;
                    newMax = dataMax;
                }
                rangeSelector.setSelected(i);

                // Update the chart
                if (!baseAxis) {
                    // Axis not yet instanciated. Temporarily set min and range
                    // options and remove them on chart load (#4317).
                    baseXAxisOptions = splat(chart.options.xAxis)[0];
                    rangeSetting = baseXAxisOptions.range;
                    baseXAxisOptions.range = range;
                    minSetting = baseXAxisOptions.min;
                    baseXAxisOptions.min = rangeMin;
                    addEvent(chart, 'load', function resetMinAndRange() {
                        baseXAxisOptions.range = rangeSetting;
                        baseXAxisOptions.min = minSetting;
                    });
                } else {
                    // Existing axis object. Set extremes after render time.
                    baseAxis.setExtremes(
                        newMin,
                        newMax,
                        pick(redraw, 1),
                        null, // auto animation
                        {
                            trigger: 'rangeSelectorButton',
                            rangeSelectorButton: rangeOptions
                        }
                    );
                }
            },

            /**
             * Set the selected option. This method only sets the internal flag, it doesn't
             * update the buttons or the actual zoomed range.
             */
            setSelected: function(selected) {
                this.selected = this.options.selected = selected;
            },

            /**
             * The default buttons for pre-selecting time frames
             */
            defaultButtons: [{
                type: 'month',
                count: 1,
                text: '1m'
            }, {
                type: 'month',
                count: 3,
                text: '3m'
            }, {
                type: 'month',
                count: 6,
                text: '6m'
            }, {
                type: 'ytd',
                text: 'YTD'
            }, {
                type: 'year',
                count: 1,
                text: '1y'
            }, {
                type: 'all',
                text: 'All'
            }],

            /**
             * Initialize the range selector
             */
            init: function(chart) {
                var rangeSelector = this,
                    options = chart.options.rangeSelector,
                    buttonOptions = options.buttons || [].concat(rangeSelector.defaultButtons),
                    selectedOption = options.selected,
                    blurInputs = function() {
                        var minInput = rangeSelector.minInput,
                            maxInput = rangeSelector.maxInput;
                        if (minInput && minInput.blur) { //#3274 in some case blur is not defined
                            fireEvent(minInput, 'blur'); //#3274
                        }
                        if (maxInput && maxInput.blur) { //#3274 in some case blur is not defined
                            fireEvent(maxInput, 'blur'); //#3274
                        }
                    };

                rangeSelector.chart = chart;
                rangeSelector.options = options;
                rangeSelector.buttons = [];

                chart.extraTopMargin = options.height;
                rangeSelector.buttonOptions = buttonOptions;

                this.unMouseDown = addEvent(chart.container, 'mousedown', blurInputs);
                this.unResize = addEvent(chart, 'resize', blurInputs);

                // Extend the buttonOptions with actual range
                each(buttonOptions, rangeSelector.computeButtonRange);

                // zoomed range based on a pre-selected button index
                if (selectedOption !== undefined && buttonOptions[selectedOption]) {
                    this.clickButton(selectedOption, false);
                }


                addEvent(chart, 'load', function() {
                    // If a data grouping is applied to the current button, release it when extremes change
                    addEvent(chart.xAxis[0], 'setExtremes', function(e) {
                        if (this.max - this.min !== chart.fixedRange && e.trigger !== 'rangeSelectorButton' &&
                            e.trigger !== 'updatedData' && rangeSelector.forcedDataGrouping) {
                            this.setDataGrouping(false, false);
                        }
                    });
                });
            },

            /**
             * Dynamically update the range selector buttons after a new range has been set
             */
            updateButtonStates: function() {
                var rangeSelector = this,
                    chart = this.chart,
                    baseAxis = chart.xAxis[0],
                    actualRange = Math.round(baseAxis.max - baseAxis.min),
                    hasNoData = !baseAxis.hasVisibleSeries,
                    day = 24 * 36e5, // A single day in milliseconds
                    unionExtremes = (chart.scroller && chart.scroller.getUnionExtremes()) || baseAxis,
                    dataMin = unionExtremes.dataMin,
                    dataMax = unionExtremes.dataMax,
                    ytdExtremes = rangeSelector.getYTDExtremes(dataMax, dataMin, useUTC),
                    ytdMin = ytdExtremes.min,
                    ytdMax = ytdExtremes.max,
                    selected = rangeSelector.selected,
                    selectedExists = isNumber(selected),
                    allButtonsEnabled = rangeSelector.options.allButtonsEnabled,
                    buttons = rangeSelector.buttons;

                each(rangeSelector.buttonOptions, function(rangeOptions, i) {
                    var range = rangeOptions._range,
                        type = rangeOptions.type,
                        count = rangeOptions.count || 1,
                        button = buttons[i],
                        state = 0,
                        disable,
                        select,
                        isSelected = i === selected,
                        // Disable buttons where the range exceeds what is allowed in the current view
                        isTooGreatRange = range > dataMax - dataMin,
                        // Disable buttons where the range is smaller than the minimum range
                        isTooSmallRange = range < baseAxis.minRange,
                        // Do not select the YTD button if not explicitly told so
                        isYTDButNotSelected = false,
                        // Disable the All button if we're already showing all
                        isAllButAlreadyShowingAll = false,
                        isSameRange = range === actualRange;
                    // Months and years have a variable range so we check the extremes
                    if (
                        (type === 'month' || type === 'year') &&
                        (actualRange >= {
                            month: 28,
                            year: 365
                        }[type] * day * count) &&
                        (actualRange <= {
                            month: 31,
                            year: 366
                        }[type] * day * count)
                    ) {
                        isSameRange = true;
                    } else if (type === 'ytd') {
                        isSameRange = (ytdMax - ytdMin) === actualRange;
                        isYTDButNotSelected = !isSelected;
                    } else if (type === 'all') {
                        isSameRange = baseAxis.max - baseAxis.min >= dataMax - dataMin;
                        isAllButAlreadyShowingAll = !isSelected && selectedExists && isSameRange;
                    }
                    // The new zoom area happens to match the range for a button - mark it selected.
                    // This happens when scrolling across an ordinal gap. It can be seen in the intraday
                    // demos when selecting 1h and scroll across the night gap.
                    disable = (!allButtonsEnabled &&
                        (
                            isTooGreatRange ||
                            isTooSmallRange ||
                            isAllButAlreadyShowingAll ||
                            hasNoData
                        )
                    );
                    select = (
                        (isSelected && isSameRange) ||
                        (isSameRange && !selectedExists && !isYTDButNotSelected)
                    );

                    if (disable) {
                        state = 3;
                    } else if (select) {
                        selectedExists = true; // Only one button can be selected
                        state = 2;
                    }

                    // If state has changed, update the button
                    if (button.state !== state) {
                        button.setState(state);
                    }
                });
            },

            /**
             * Compute and cache the range for an individual button
             */
            computeButtonRange: function(rangeOptions) {
                var type = rangeOptions.type,
                    count = rangeOptions.count || 1,

                    // these time intervals have a fixed number of milliseconds, as opposed
                    // to month, ytd and year
                    fixedTimes = {
                        millisecond: 1,
                        second: 1000,
                        minute: 60 * 1000,
                        hour: 3600 * 1000,
                        day: 24 * 3600 * 1000,
                        week: 7 * 24 * 3600 * 1000
                    };

                // Store the range on the button object
                if (fixedTimes[type]) {
                    rangeOptions._range = fixedTimes[type] * count;
                } else if (type === 'month' || type === 'year') {
                    rangeOptions._range = {
                        month: 30,
                        year: 365
                    }[type] * 24 * 36e5 * count;
                }
            },

            /**
             * Set the internal and displayed value of a HTML input for the dates
             * @param {String} name
             * @param {Number} time
             */
            setInputValue: function(name, time) {
                var options = this.chart.options.rangeSelector,
                    input = this[name + 'Input'];

                if (defined(time)) {
                    input.previousValue = input.HCTime;
                    input.HCTime = time;
                }

                input.value = dateFormat(
                    options.inputEditDateFormat || '%Y-%m-%d',
                    input.HCTime
                );
                this[name + 'DateBox'].attr({
                    text: dateFormat(options.inputDateFormat || '%b %e, %Y', input.HCTime)
                });
            },

            showInput: function(name) {
                var inputGroup = this.inputGroup,
                    dateBox = this[name + 'DateBox'];

                css(this[name + 'Input'], {
                    left: (inputGroup.translateX + dateBox.x) + 'px',
                    top: inputGroup.translateY + 'px',
                    width: (dateBox.width - 2) + 'px',
                    height: (dateBox.height - 2) + 'px',
                    border: '2px solid silver'
                });
            },

            hideInput: function(name) {
                css(this[name + 'Input'], {
                    border: 0,
                    width: '1px',
                    height: '1px'
                });
                this.setInputValue(name);
            },

            /**
             * Draw either the 'from' or the 'to' HTML input box of the range selector
             * @param {Object} name
             */
            drawInput: function(name) {
                var rangeSelector = this,
                    chart = rangeSelector.chart,
                    chartStyle = chart.renderer.style || {},
                    renderer = chart.renderer,
                    options = chart.options.rangeSelector,
                    lang = defaultOptions.lang,
                    div = rangeSelector.div,
                    isMin = name === 'min',
                    input,
                    label,
                    dateBox,
                    inputGroup = this.inputGroup;

                function updateExtremes() {
                    var inputValue = input.value,
                        value = (options.inputDateParser || Date.parse)(inputValue),
                        chartAxis = chart.xAxis[0],
                        dataAxis = chart.scroller && chart.scroller.xAxis ? chart.scroller.xAxis : chartAxis,
                        dataMin = dataAxis.dataMin,
                        dataMax = dataAxis.dataMax;
                    if (value !== input.previousValue) {
                        input.previousValue = value;
                        // If the value isn't parsed directly to a value by the browser's Date.parse method,
                        // like YYYY-MM-DD in IE, try parsing it a different way
                        if (!isNumber(value)) {
                            value = inputValue.split('-');
                            value = Date.UTC(pInt(value[0]), pInt(value[1]) - 1, pInt(value[2]));
                        }

                        if (isNumber(value)) {

                            // Correct for timezone offset (#433)
                            if (!useUTC) {
                                value = value + new Date().getTimezoneOffset() * 60 * 1000;
                            }

                            // Validate the extremes. If it goes beyound the data min or max, use the
                            // actual data extreme (#2438).
                            if (isMin) {
                                if (value > rangeSelector.maxInput.HCTime) {
                                    value = undefined;
                                } else if (value < dataMin) {
                                    value = dataMin;
                                }
                            } else {
                                if (value < rangeSelector.minInput.HCTime) {
                                    value = undefined;
                                } else if (value > dataMax) {
                                    value = dataMax;
                                }
                            }

                            // Set the extremes
                            if (value !== undefined) {
                                chartAxis.setExtremes(
                                    isMin ? value : chartAxis.min,
                                    isMin ? chartAxis.max : value,
                                    undefined,
                                    undefined, {
                                        trigger: 'rangeSelectorInput'
                                    }
                                );
                            }
                        }
                    }
                }

                // Create the text label
                this[name + 'Label'] = label = renderer.label(lang[isMin ? 'rangeSelectorFrom' : 'rangeSelectorTo'], this.inputGroup.offset)
                    .addClass('highcharts-range-label')
                    .attr({
                        padding: 2
                    })
                    .add(inputGroup);
                inputGroup.offset += label.width + 5;

                // Create an SVG label that shows updated date ranges and and records click events that
                // bring in the HTML input.
                this[name + 'DateBox'] = dateBox = renderer.label('', inputGroup.offset)
                    .addClass('highcharts-range-input')
                    .attr({
                        padding: 2,
                        width: options.inputBoxWidth || 90,
                        height: options.inputBoxHeight || 17,
                        stroke: options.inputBoxBorderColor || '#cccccc',
                        'stroke-width': 1,
                        'text-align': 'center'
                    })
                    .on('click', function() {
                        rangeSelector.showInput(name); // If it is already focused, the onfocus event doesn't fire (#3713)
                        rangeSelector[name + 'Input'].focus();
                    })
                    .add(inputGroup);
                inputGroup.offset += dateBox.width + (isMin ? 10 : 0);


                // Create the HTML input element. This is rendered as 1x1 pixel then set to the right size
                // when focused.
                this[name + 'Input'] = input = createElement('input', {
                    name: name,
                    className: 'highcharts-range-selector',
                    type: 'text'
                }, {
                    top: chart.plotTop + 'px' // prevent jump on focus in Firefox
                }, div);


                // Styles
                label.css(merge(chartStyle, options.labelStyle));

                dateBox.css(merge({
                    color: '#333333'
                }, chartStyle, options.inputStyle));

                css(input, extend({
                    position: 'absolute',
                    border: 0,
                    width: '1px', // Chrome needs a pixel to see it
                    height: '1px',
                    padding: 0,
                    textAlign: 'center',
                    fontSize: chartStyle.fontSize,
                    fontFamily: chartStyle.fontFamily,
                    left: '-9em' // #4798
                }, options.inputStyle));


                // Blow up the input box
                input.onfocus = function() {
                    rangeSelector.showInput(name);
                };
                // Hide away the input box
                input.onblur = function() {
                    rangeSelector.hideInput(name);
                };

                // handle changes in the input boxes
                input.onchange = updateExtremes;

                input.onkeypress = function(event) {
                    // IE does not fire onchange on enter
                    if (event.keyCode === 13) {
                        updateExtremes();
                    }
                };
            },

            /**
             * Get the position of the range selector buttons and inputs. This can be overridden from outside for custom positioning.
             */
            getPosition: function() {
                var chart = this.chart,
                    options = chart.options.rangeSelector,
                    buttonTop = pick((options.buttonPosition || {}).y, chart.plotTop - chart.axisOffset[0] - options.height);

                return {
                    buttonTop: buttonTop,
                    inputTop: buttonTop - 10
                };
            },
            /**
             * Get the extremes of YTD. 
             * Will choose dataMax if its value is lower than the current timestamp.
             * Will choose dataMin if its value is higher than the timestamp for
             * 	the start of current year.
             * @param  {number} dataMax
             * @param  {number} dataMin
             * @return {object} Returns min and max for the YTD
             */
            getYTDExtremes: function(dataMax, dataMin, useUTC) {
                var min,
                    now = new HCDate(dataMax),
                    year = now[HCDate.hcGetFullYear](),
                    startOfYear = useUTC ? HCDate.UTC(year, 0, 1) : +new HCDate(year, 0, 1); // eslint-disable-line new-cap
                min = Math.max(dataMin || 0, startOfYear);
                now = now.getTime();
                return {
                    max: Math.min(dataMax || now, now),
                    min: min
                };
            },

            /**
             * Render the range selector including the buttons and the inputs. The first time render
             * is called, the elements are created and positioned. On subsequent calls, they are
             * moved and updated.
             * @param {Number} min X axis minimum
             * @param {Number} max X axis maximum
             */
            render: function(min, max) {

                var rangeSelector = this,
                    chart = rangeSelector.chart,
                    renderer = chart.renderer,
                    container = chart.container,
                    chartOptions = chart.options,
                    navButtonOptions = chartOptions.exporting && chartOptions.exporting.enabled !== false &&
                    chartOptions.navigation && chartOptions.navigation.buttonOptions,
                    options = chartOptions.rangeSelector,
                    buttons = rangeSelector.buttons,
                    lang = defaultOptions.lang,
                    div = rangeSelector.div,
                    inputGroup = rangeSelector.inputGroup,
                    buttonTheme = options.buttonTheme,
                    buttonPosition = options.buttonPosition || {},
                    inputEnabled = options.inputEnabled,
                    states = buttonTheme && buttonTheme.states,
                    plotLeft = chart.plotLeft,
                    buttonLeft,
                    pos = this.getPosition(),
                    buttonGroup = rangeSelector.group,
                    buttonBBox,
                    rendered = rangeSelector.rendered;

                if (options.enabled === false) {
                    return;
                }

                // create the elements
                if (!rendered) {

                    rangeSelector.group = buttonGroup = renderer.g('range-selector-buttons').add();

                    rangeSelector.zoomText = renderer.text(lang.rangeSelectorZoom, pick(buttonPosition.x, plotLeft), 15)
                        .css(options.labelStyle)
                        .add(buttonGroup);

                    // button starting position
                    buttonLeft = pick(buttonPosition.x, plotLeft) + rangeSelector.zoomText.getBBox().width + 5;

                    each(rangeSelector.buttonOptions, function(rangeOptions, i) {
                        buttons[i] = renderer.button(
                                rangeOptions.text,
                                buttonLeft,
                                0,
                                function() {
                                    rangeSelector.clickButton(i);
                                    rangeSelector.isActive = true;
                                },
                                buttonTheme,
                                states && states.hover,
                                states && states.select,
                                states && states.disabled
                            )
                            .attr({
                                'text-align': 'center'
                            })
                            .add(buttonGroup);

                        // increase button position for the next button
                        buttonLeft += buttons[i].width + pick(options.buttonSpacing, 5);
                    });

                    // first create a wrapper outside the container in order to make
                    // the inputs work and make export correct
                    if (inputEnabled !== false) {
                        rangeSelector.div = div = createElement('div', null, {
                            position: 'relative',
                            height: 0,
                            zIndex: 1 // above container
                        });

                        container.parentNode.insertBefore(div, container);

                        // Create the group to keep the inputs
                        rangeSelector.inputGroup = inputGroup = renderer.g('input-group')
                            .add();
                        inputGroup.offset = 0;

                        rangeSelector.drawInput('min');
                        rangeSelector.drawInput('max');
                    }
                }
                rangeSelector.updateButtonStates();

                // Set or update the group position
                buttonGroup[rendered ? 'animate' : 'attr']({
                    translateY: pos.buttonTop
                });

                if (inputEnabled !== false) {

                    // Update the alignment to the updated spacing box
                    inputGroup.align(extend({
                        y: pos.inputTop,
                        width: inputGroup.offset,
                        // Detect collision with the exporting buttons
                        x: navButtonOptions && (pos.inputTop < (navButtonOptions.y || 0) + navButtonOptions.height - chart.spacing[0]) ?
                            -40 : 0
                    }, options.inputPosition), true, chart.spacingBox);

                    // Hide if overlapping - inputEnabled is null or undefined
                    if (!defined(inputEnabled)) {
                        buttonBBox = buttonGroup.getBBox();
                        inputGroup[inputGroup.alignAttr.translateX < buttonBBox.x + buttonBBox.width + 10 ? 'hide' : 'show']();
                    }

                    // Set or reset the input values
                    rangeSelector.setInputValue('min', min);
                    rangeSelector.setInputValue('max', max);
                }

                rangeSelector.rendered = true;
            },

            /**
             * Update the range selector with new options
             */
            update: function(options) {
                var chart = this.chart;
                merge(true, chart.options.rangeSelector, options);
                this.destroy();
                this.init(chart);
            },

            /**
             * Destroys allocated elements.
             */
            destroy: function() {
                var minInput = this.minInput,
                    maxInput = this.maxInput,
                    key;

                this.unMouseDown();
                this.unResize();

                // Destroy elements in collections
                destroyObjectProperties(this.buttons);

                // Clear input element events
                if (minInput) {
                    minInput.onfocus = minInput.onblur = minInput.onchange = null;
                }
                if (maxInput) {
                    maxInput.onfocus = maxInput.onblur = maxInput.onchange = null;
                }

                // Destroy HTML and SVG elements
                for (key in this) {
                    if (this[key] && key !== 'chart') {
                        if (this[key].destroy) { // SVGElement
                            this[key].destroy();
                        } else if (this[key].nodeType) { // HTML element
                            discardElement(this[key]);
                        }
                    }
                    if (this[key] !== RangeSelector.prototype[key]) {
                        this[key] = null;
                    }
                }
            }
        };

        /**
         * Add logic to normalize the zoomed range in order to preserve the pressed state of range selector buttons
         */
        Axis.prototype.toFixedRange = function(pxMin, pxMax, fixedMin, fixedMax) {
            var fixedRange = this.chart && this.chart.fixedRange,
                newMin = pick(fixedMin, this.translate(pxMin, true, !this.horiz)),
                newMax = pick(fixedMax, this.translate(pxMax, true, !this.horiz)),
                changeRatio = fixedRange && (newMax - newMin) / fixedRange;

            // If the difference between the fixed range and the actual requested range is
            // too great, the user is dragging across an ordinal gap, and we need to release
            // the range selector button.
            if (changeRatio > 0.7 && changeRatio < 1.3) {
                if (fixedMax) {
                    newMin = newMax - fixedRange;
                } else {
                    newMax = newMin + fixedRange;
                }
            }
            if (!isNumber(newMin)) { // #1195
                newMin = newMax = undefined;
            }

            return {
                min: newMin,
                max: newMax
            };
        };

        /**
         * Get the axis min value based on the range option and the current max. For
         * stock charts this is extended via the {@link RangeSelector} so that if the
         * selected range is a multiple of months or years, it is compensated for
         * various month lengths.
         * 
         * @return {number} The new minimum value.
         */
        Axis.prototype.minFromRange = function() {
            var rangeOptions = this.range,
                type = rangeOptions.type,
                timeName = {
                    month: 'Month',
                    year: 'FullYear'
                }[type],
                min,
                max = this.max,
                dataMin,
                range,
                // Get the true range from a start date
                getTrueRange = function(base, count) {
                    var date = new Date(base);
                    date['set' + timeName](date['get' + timeName]() + count);
                    return date.getTime() - base;
                };

            if (isNumber(rangeOptions)) {
                min = max - rangeOptions;
                range = rangeOptions;
            } else {
                min = max + getTrueRange(max, -rangeOptions.count);

                // Let the fixedRange reflect initial settings (#5930)
                if (this.chart) {
                    this.chart.fixedRange = max - min;
                }
            }

            dataMin = pick(this.dataMin, Number.MIN_VALUE);
            if (!isNumber(min)) {
                min = dataMin;
            }
            if (min <= dataMin) {
                min = dataMin;
                if (range === undefined) { // #4501
                    range = getTrueRange(min, rangeOptions.count);
                }
                this.newMax = Math.min(min + range, this.dataMax);
            }
            if (!isNumber(max)) {
                min = undefined;
            }
            return min;

        };

        // Initialize scroller for stock charts
        wrap(Chart.prototype, 'init', function(proceed, options, callback) {

            addEvent(this, 'init', function() {
                if (this.options.rangeSelector.enabled) {
                    this.rangeSelector = new RangeSelector(this);
                }
            });

            proceed.call(this, options, callback);

        });

        Chart.prototype.callbacks.push(function(chart) {
            var extremes,
                rangeSelector = chart.rangeSelector,
                unbindRender,
                unbindSetExtremes;

            function renderRangeSelector() {
                extremes = chart.xAxis[0].getExtremes();
                if (isNumber(extremes.min)) {
                    rangeSelector.render(extremes.min, extremes.max);
                }
            }

            if (rangeSelector) {
                // redraw the scroller on setExtremes
                unbindSetExtremes = addEvent(
                    chart.xAxis[0],
                    'afterSetExtremes',
                    function(e) {
                        rangeSelector.render(e.min, e.max);
                    }
                );

                // redraw the scroller chart resize
                unbindRender = addEvent(chart, 'redraw', renderRangeSelector);

                // do it now
                renderRangeSelector();
            }

            // Remove resize/afterSetExtremes at chart destroy
            addEvent(chart, 'destroy', function destroyEvents() {
                if (rangeSelector) {
                    unbindRender();
                    unbindSetExtremes();
                }
            });
        });


        H.RangeSelector = RangeSelector;

        /* ****************************************************************************
         * End Range Selector code													*
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var arrayMax = H.arrayMax,
            arrayMin = H.arrayMin,
            Axis = H.Axis,
            Chart = H.Chart,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            format = H.format,
            inArray = H.inArray,
            isNumber = H.isNumber,
            isString = H.isString,
            map = H.map,
            merge = H.merge,
            pick = H.pick,
            Point = H.Point,
            Renderer = H.Renderer,
            Series = H.Series,
            splat = H.splat,
            SVGRenderer = H.SVGRenderer,
            VMLRenderer = H.VMLRenderer,
            wrap = H.wrap,


            seriesProto = Series.prototype,
            seriesInit = seriesProto.init,
            seriesProcessData = seriesProto.processData,
            pointTooltipFormatter = Point.prototype.tooltipFormatter;
        /**
         * A wrapper for Chart with all the default values for a Stock chart
         */
        H.StockChart = H.stockChart = function(a, b, c) {
            var hasRenderToArg = isString(a) || a.nodeName,
                options = arguments[hasRenderToArg ? 1 : 0],
                seriesOptions = options.series, // to increase performance, don't merge the data
                defaultOptions = H.getOptions(),
                opposite,

                // Always disable startOnTick:true on the main axis when the navigator
                // is enabled (#1090)
                navigatorEnabled = pick(
                    options.navigator && options.navigator.enabled,
                    defaultOptions.navigator.enabled,
                    true
                ),
                disableStartOnTick = navigatorEnabled ? {
                    startOnTick: false,
                    endOnTick: false
                } : null,

                lineOptions = {

                    marker: {
                        enabled: false,
                        radius: 2
                    }
                    // gapSize: 0
                },
                columnOptions = {
                    shadow: false,
                    borderWidth: 0
                };

            // apply X axis options to both single and multi y axes
            options.xAxis = map(splat(options.xAxis || {}), function(xAxisOptions) {
                return merge({ // defaults
                        minPadding: 0,
                        maxPadding: 0,
                        ordinal: true,
                        title: {
                            text: null
                        },
                        labels: {
                            overflow: 'justify'
                        },
                        showLastLabel: true
                    },
                    defaultOptions.xAxis, // #3802
                    xAxisOptions, // user options
                    { // forced options
                        type: 'datetime',
                        categories: null
                    },
                    disableStartOnTick
                );
            });

            // apply Y axis options to both single and multi y axes
            options.yAxis = map(splat(options.yAxis || {}), function(yAxisOptions) {
                opposite = pick(yAxisOptions.opposite, true);
                return merge({ // defaults
                        labels: {
                            y: -2
                        },
                        opposite: opposite,
                        showLastLabel: false,
                        title: {
                            text: null
                        }
                    },
                    defaultOptions.yAxis, // #3802
                    yAxisOptions // user options
                );
            });

            options.series = null;

            options = merge({
                    chart: {
                        panning: true,
                        pinchType: 'x'
                    },
                    navigator: {
                        enabled: navigatorEnabled
                    },
                    scrollbar: {
                        // #4988 - check if setOptions was called
                        enabled: pick(defaultOptions.scrollbar.enabled, true)
                    },
                    rangeSelector: {
                        // #4988 - check if setOptions was called
                        enabled: pick(defaultOptions.rangeSelector.enabled, true)
                    },
                    title: {
                        text: null
                    },
                    tooltip: {
                        shared: true,
                        crosshairs: true
                    },
                    legend: {
                        enabled: false
                    },

                    plotOptions: {
                        line: lineOptions,
                        spline: lineOptions,
                        area: lineOptions,
                        areaspline: lineOptions,
                        arearange: lineOptions,
                        areasplinerange: lineOptions,
                        column: columnOptions,
                        columnrange: columnOptions,
                        candlestick: columnOptions,
                        ohlc: columnOptions
                    }

                },

                options, // user's options

                { // forced options
                    isStock: true // internal flag
                }
            );

            options.series = seriesOptions;

            return hasRenderToArg ?
                new Chart(a, options, c) :
                new Chart(options, b);
        };

        // Override the automatic label alignment so that the first Y axis' labels
        // are drawn on top of the grid line, and subsequent axes are drawn outside
        wrap(Axis.prototype, 'autoLabelAlign', function(proceed) {
            var chart = this.chart,
                options = this.options,
                panes = chart._labelPanes = chart._labelPanes || {},
                key,
                labelOptions = this.options.labels;
            if (this.chart.options.isStock && this.coll === 'yAxis') {
                key = options.top + ',' + options.height;
                if (!panes[key] && labelOptions.enabled) { // do it only for the first Y axis of each pane
                    if (labelOptions.x === 15) { // default
                        labelOptions.x = 0;
                    }
                    if (labelOptions.align === undefined) {
                        labelOptions.align = 'right';
                    }
                    panes[key] = 1;
                    return 'right';
                }
            }
            return proceed.call(this, [].slice.call(arguments, 1));
        });

        // Override getPlotLinePath to allow for multipane charts
        wrap(Axis.prototype, 'getPlotLinePath', function(proceed, value, lineWidth, old, force, translatedValue) {
            var axis = this,
                series = (this.isLinked && !this.series ? this.linkedParent.series : this.series),
                chart = axis.chart,
                renderer = chart.renderer,
                axisLeft = axis.left,
                axisTop = axis.top,
                x1,
                y1,
                x2,
                y2,
                result = [],
                axes = [], //#3416 need a default array
                axes2,
                uniqueAxes,
                transVal;

            /**
             * Return the other axis based on either the axis option or on related series.
             */
            function getAxis(coll) {
                var otherColl = coll === 'xAxis' ? 'yAxis' : 'xAxis',
                    opt = axis.options[otherColl];

                // Other axis indexed by number
                if (isNumber(opt)) {
                    return [chart[otherColl][opt]];
                }

                // Other axis indexed by id (like navigator)
                if (isString(opt)) {
                    return [chart.get(opt)];
                }

                // Auto detect based on existing series
                return map(series, function(s) {
                    return s[otherColl];
                });
            }

            // Ignore in case of color Axis. #3360, #3524
            if (axis.coll === 'colorAxis') {
                return proceed.apply(this, [].slice.call(arguments, 1));
            }

            // Get the related axes based on series
            axes = getAxis(axis.coll);

            // Get the related axes based options.*Axis setting #2810
            axes2 = (axis.isXAxis ? chart.yAxis : chart.xAxis);
            each(axes2, function(A) {
                if (defined(A.options.id) ? A.options.id.indexOf('navigator') === -1 : true) {
                    var a = (A.isXAxis ? 'yAxis' : 'xAxis'),
                        rax = (defined(A.options[a]) ? chart[a][A.options[a]] : chart[a][0]);

                    if (axis === rax) {
                        axes.push(A);
                    }
                }
            });


            // Remove duplicates in the axes array. If there are no axes in the axes array,
            // we are adding an axis without data, so we need to populate this with grid
            // lines (#2796).
            uniqueAxes = axes.length ? [] : [axis.isXAxis ? chart.yAxis[0] : chart.xAxis[0]]; //#3742
            each(axes, function(axis2) {
                if (inArray(axis2, uniqueAxes) === -1) {
                    uniqueAxes.push(axis2);
                }
            });

            transVal = pick(translatedValue, axis.translate(value, null, null, old));
            if (isNumber(transVal)) {
                if (axis.horiz) {
                    each(uniqueAxes, function(axis2) {
                        var skip;

                        y1 = axis2.pos;
                        y2 = y1 + axis2.len;
                        x1 = x2 = Math.round(transVal + axis.transB);

                        if (x1 < axisLeft || x1 > axisLeft + axis.width) { // outside plot area
                            if (force) {
                                x1 = x2 = Math.min(Math.max(axisLeft, x1), axisLeft + axis.width);
                            } else {
                                skip = true;
                            }
                        }
                        if (!skip) {
                            result.push('M', x1, y1, 'L', x2, y2);
                        }
                    });
                } else {
                    each(uniqueAxes, function(axis2) {
                        var skip;

                        x1 = axis2.pos;
                        x2 = x1 + axis2.len;
                        y1 = y2 = Math.round(axisTop + axis.height - transVal);

                        if (y1 < axisTop || y1 > axisTop + axis.height) { // outside plot area
                            if (force) {
                                y1 = y2 = Math.min(Math.max(axisTop, y1), axis.top + axis.height);
                            } else {
                                skip = true;
                            }
                        }
                        if (!skip) {
                            result.push('M', x1, y1, 'L', x2, y2);
                        }
                    });
                }
            }
            return result.length > 0 ?
                renderer.crispPolyLine(result, lineWidth || 1) :
                null; //#3557 getPlotLinePath in regular Highcharts also returns null
        });

        // Override getPlotBandPath to allow for multipane charts
        Axis.prototype.getPlotBandPath = function(from, to) {
            var toPath = this.getPlotLinePath(to, null, null, true),
                path = this.getPlotLinePath(from, null, null, true),
                result = [],
                i;

            if (path && toPath) {
                if (path.toString() === toPath.toString()) {
                    // #6166
                    result = path;
                    result.flat = true;
                } else {
                    // Go over each subpath
                    for (i = 0; i < path.length; i += 6) {
                        result.push(
                            'M', path[i + 1], path[i + 2],
                            'L', path[i + 4], path[i + 5],
                            toPath[i + 4], toPath[i + 5],
                            toPath[i + 1], toPath[i + 2],
                            'z'
                        );
                    }
                }
            } else { // outside the axis area
                result = null;
            }

            return result;
        };

        // Function to crisp a line with multiple segments
        SVGRenderer.prototype.crispPolyLine = function(points, width) {
            // points format: ['M', 0, 0, 'L', 100, 0]		
            // normalize to a crisp line
            var i;
            for (i = 0; i < points.length; i = i + 6) {
                if (points[i + 1] === points[i + 4]) {
                    // Substract due to #1129. Now bottom and left axis gridlines behave the same.
                    points[i + 1] = points[i + 4] = Math.round(points[i + 1]) - (width % 2 / 2);
                }
                if (points[i + 2] === points[i + 5]) {
                    points[i + 2] = points[i + 5] = Math.round(points[i + 2]) + (width % 2 / 2);
                }
            }
            return points;
        };

        if (Renderer === VMLRenderer) {
            VMLRenderer.prototype.crispPolyLine = SVGRenderer.prototype.crispPolyLine;
        }


        // Wrapper to hide the label
        wrap(Axis.prototype, 'hideCrosshair', function(proceed, i) {

            proceed.call(this, i);

            if (this.crossLabel) {
                this.crossLabel = this.crossLabel.hide();
            }
        });

        // Wrapper to draw the label
        wrap(Axis.prototype, 'drawCrosshair', function(proceed, e, point) {

            // Draw the crosshair
            proceed.call(this, e, point);

            // Check if the label has to be drawn
            if (!defined(this.crosshair.label) || !this.crosshair.label.enabled || !this.cross) {
                return;
            }

            var chart = this.chart,
                options = this.options.crosshair.label, // the label's options
                horiz = this.horiz, // axis orientation
                opposite = this.opposite, // axis position
                left = this.left, // left position
                top = this.top, // top position
                crossLabel = this.crossLabel, // reference to the svgElement
                posx,
                posy,
                crossBox,
                formatOption = options.format,
                formatFormat = '',
                limit,
                align,
                tickInside = this.options.tickPosition === 'inside',
                snap = this.crosshair.snap !== false,
                value,
                offset = 0;

            // Use last available event (#5287)
            if (!e) {
                e = this.cross && this.cross.e;
            }

            align = (horiz ? 'center' : opposite ?
                (this.labelAlign === 'right' ? 'right' : 'left') :
                (this.labelAlign === 'left' ? 'left' : 'center'));

            // If the label does not exist yet, create it.
            if (!crossLabel) {
                crossLabel = this.crossLabel = chart.renderer.label(null, null, null, options.shape || 'callout')
                    .addClass('highcharts-crosshair-label' +
                        (this.series[0] && ' highcharts-color-' + this.series[0].colorIndex))
                    .attr({
                        align: options.align || align,
                        padding: pick(options.padding, 8),
                        r: pick(options.borderRadius, 3),
                        zIndex: 2
                    })
                    .add(this.labelGroup);


                // Presentational
                crossLabel
                    .attr({
                        fill: options.backgroundColor ||
                            (this.series[0] && this.series[0].color) || '#666666',
                        stroke: options.borderColor || '',
                        'stroke-width': options.borderWidth || 0
                    })
                    .css(extend({
                        color: '#ffffff',
                        fontWeight: 'normal',
                        fontSize: '11px',
                        textAlign: 'center'
                    }, options.style));

            }

            if (horiz) {
                posx = snap ? point.plotX + left : e.chartX;
                posy = top + (opposite ? 0 : this.height);
            } else {
                posx = opposite ? this.width + left : 0;
                posy = snap ? point.plotY + top : e.chartY;
            }

            if (!formatOption && !options.formatter) {
                if (this.isDatetimeAxis) {
                    formatFormat = '%b %d, %Y';
                }
                formatOption = '{value' + (formatFormat ? ':' + formatFormat : '') + '}';
            }

            // Show the label
            value = snap ? point[this.isXAxis ? 'x' : 'y'] : this.toValue(horiz ? e.chartX : e.chartY);
            crossLabel.attr({
                text: formatOption ? format(formatOption, {
                    value: value
                }) : options.formatter.call(this, value),
                x: posx,
                y: posy,
                visibility: 'visible'
            });

            crossBox = crossLabel.getBBox();

            // now it is placed we can correct its position
            if (horiz) {
                if ((tickInside && !opposite) || (!tickInside && opposite)) {
                    posy = crossLabel.y - crossBox.height;
                }
            } else {
                posy = crossLabel.y - (crossBox.height / 2);
            }

            // check the edges
            if (horiz) {
                limit = {
                    left: left - crossBox.x,
                    right: left + this.width - crossBox.x
                };
            } else {
                limit = {
                    left: this.labelAlign === 'left' ? left : 0,
                    right: this.labelAlign === 'right' ? left + this.width : chart.chartWidth
                };
            }

            // left edge
            if (crossLabel.translateX < limit.left) {
                offset = limit.left - crossLabel.translateX;
            }
            // right edge
            if (crossLabel.translateX + crossBox.width >= limit.right) {
                offset = -(crossLabel.translateX + crossBox.width - limit.right);
            }

            // show the crosslabel
            crossLabel.attr({
                x: posx + offset,
                y: posy,
                // First set x and y, then anchorX and anchorY, when box is actually calculated, #5702
                anchorX: horiz ? posx : (this.opposite ? 0 : chart.chartWidth),
                anchorY: horiz ? (this.opposite ? chart.chartHeight : 0) : posy + crossBox.height / 2
            });
        });

        /* ****************************************************************************
         * Start value compare logic                                                  *
         *****************************************************************************/

        /**
         * Extend series.init by adding a method to modify the y value used for plotting
         * on the y axis. This method is called both from the axis when finding dataMin
         * and dataMax, and from the series.translate method.
         */
        seriesProto.init = function() {

            // Call base method
            seriesInit.apply(this, arguments);

            // Set comparison mode
            this.setCompare(this.options.compare);
        };

        /**
         * The setCompare method can be called also from the outside after render time
         */
        seriesProto.setCompare = function(compare) {

            // Set or unset the modifyValue method
            this.modifyValue = (compare === 'value' || compare === 'percent') ? function(value, point) {
                var compareValue = this.compareValue;

                if (value !== undefined && compareValue !== undefined) { // #2601, #5814

                    // Get the modified value
                    if (compare === 'value') {
                        value -= compareValue;

                        // Compare percent
                    } else {
                        value = 100 * (value / compareValue) -
                            (this.options.compareBase === 100 ? 0 : 100);
                    }

                    // record for tooltip etc.
                    if (point) {
                        point.change = value;
                    }

                    return value;
                }
            } : null;

            // Survive to export, #5485
            this.userOptions.compare = compare;

            // Mark dirty
            if (this.chart.hasRendered) {
                this.isDirty = true;
            }

        };

        /**
         * Extend series.processData by finding the first y value in the plot area,
         * used for comparing the following values
         */
        seriesProto.processData = function() {
            var series = this,
                i,
                keyIndex = -1,
                processedXData,
                processedYData,
                length,
                compareValue;

            // call base method
            seriesProcessData.apply(this, arguments);

            if (series.xAxis && series.processedYData) { // not pies

                // local variables
                processedXData = series.processedXData;
                processedYData = series.processedYData;
                length = processedYData.length;

                // For series with more than one value (range, OHLC etc), compare against
                // close or the pointValKey (#4922, #3112)
                if (series.pointArrayMap) {
                    // Use close if present (#3112)
                    keyIndex = inArray('close', series.pointArrayMap);
                    if (keyIndex === -1) {
                        keyIndex = inArray(series.pointValKey || 'y', series.pointArrayMap);
                    }
                }

                // find the first value for comparison
                for (i = 0; i < length - 1; i++) {
                    compareValue = keyIndex > -1 ?
                        processedYData[i][keyIndex] :
                        processedYData[i];
                    if (isNumber(compareValue) && processedXData[i + 1] >= series.xAxis.min && compareValue !== 0) {
                        series.compareValue = compareValue;
                        break;
                    }
                }
            }
        };

        /**
         * Modify series extremes
         */
        wrap(seriesProto, 'getExtremes', function(proceed) {
            var extremes;

            proceed.apply(this, [].slice.call(arguments, 1));

            if (this.modifyValue) {
                extremes = [this.modifyValue(this.dataMin), this.modifyValue(this.dataMax)];
                this.dataMin = arrayMin(extremes);
                this.dataMax = arrayMax(extremes);
            }
        });

        /**
         * Add a utility method, setCompare, to the Y axis
         */
        Axis.prototype.setCompare = function(compare, redraw) {
            if (!this.isXAxis) {
                each(this.series, function(series) {
                    series.setCompare(compare);
                });
                if (pick(redraw, true)) {
                    this.chart.redraw();
                }
            }
        };

        /**
         * Extend the tooltip formatter by adding support for the point.change variable
         * as well as the changeDecimals option
         */
        Point.prototype.tooltipFormatter = function(pointFormat) {
            var point = this;

            pointFormat = pointFormat.replace(
                '{point.change}',
                (point.change > 0 ? '+' : '') +
                H.numberFormat(point.change, pick(point.series.tooltipOptions.changeDecimals, 2))
            );

            return pointTooltipFormatter.apply(this, [pointFormat]);
        };

        /* ****************************************************************************
         * End value compare logic                                                    *
         *****************************************************************************/


        /**
         * Extend the Series prototype to create a separate series clip box. This is
         * related to using multiple panes, and a future pane logic should incorporate
         * this feature (#2754).
         */
        wrap(Series.prototype, 'render', function(proceed) {
            // Only do this on not 3d (#2939, #5904) nor polar (#6057) charts, and only
            // if the series type handles clipping in the animate method (#2975).
            if (!(this.chart.is3d && this.chart.is3d()) &&
                !this.chart.polar &&
                this.xAxis &&
                !this.xAxis.isRadial // Gauge, #6192
            ) {

                // First render, initial clip box
                if (!this.clipBox && this.animate) {
                    this.clipBox = merge(this.chart.clipBox);
                    this.clipBox.width = this.xAxis.len;
                    this.clipBox.height = this.yAxis.len;

                    // On redrawing, resizing etc, update the clip rectangle
                } else if (this.chart[this.sharedClipKey]) {
                    this.chart[this.sharedClipKey].attr({
                        width: this.xAxis.len,
                        height: this.yAxis.len
                    });
                    // #3111
                } else if (this.clipBox) {
                    this.clipBox.width = this.xAxis.len;
                    this.clipBox.height = this.yAxis.len;
                }
            }
            proceed.call(this);
        });

    }(Highcharts));
}));
