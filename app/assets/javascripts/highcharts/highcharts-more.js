/**
 * @license Highcharts JS v5.0.7 (2017-01-17)
 *
 * (c) 2009-2016 Torstein Honsi
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
        var each = H.each,
            extend = H.extend,
            merge = H.merge,
            splat = H.splat;
        /**
         * The Pane object allows options that are common to a set of X and Y axes.
         *
         * In the future, this can be extended to basic Highcharts and Highstock.
         */
        function Pane(options, chart, firstAxis) {
            this.init(options, chart, firstAxis);
        }

        // Extend the Pane prototype
        extend(Pane.prototype, {

            /**
             * Initiate the Pane object
             */
            init: function(options, chart, firstAxis) {
                var pane = this,
                    backgroundOption,
                    defaultOptions = pane.defaultOptions;

                pane.chart = chart;

                // Set options. Angular charts have a default background (#3318)
                pane.options = options = merge(defaultOptions, chart.angular ? {
                    background: {}
                } : undefined, options);

                backgroundOption = options.background;

                // To avoid having weighty logic to place, update and remove the backgrounds,
                // push them to the first axis' plot bands and borrow the existing logic there.
                if (backgroundOption) {
                    each([].concat(splat(backgroundOption)).reverse(), function(config) {
                        var mConfig,
                            axisUserOptions = firstAxis.userOptions;
                        mConfig = merge(pane.defaultBackgroundOptions, config);


                        if (config.backgroundColor) {
                            mConfig.backgroundColor = config.backgroundColor;
                        }
                        mConfig.color = mConfig.backgroundColor; // due to naming in plotBands


                        firstAxis.options.plotBands.unshift(mConfig);
                        axisUserOptions.plotBands = axisUserOptions.plotBands || []; // #3176
                        if (axisUserOptions.plotBands !== firstAxis.options.plotBands) {
                            axisUserOptions.plotBands.unshift(mConfig);
                        }
                    });
                }
            },

            /**
             * The default options object
             */
            defaultOptions: {
                // background: {conditional},
                center: ['50%', '50%'],
                size: '85%',
                startAngle: 0
                    //endAngle: startAngle + 360
            },

            /**
             * The default background options
             */
            defaultBackgroundOptions: {
                className: 'highcharts-pane',
                shape: 'circle',

                borderWidth: 1,
                borderColor: '#cccccc',
                backgroundColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, '#ffffff'],
                        [1, '#e6e6e6']
                    ]
                },

                from: -Number.MAX_VALUE, // corrected to axis min
                innerRadius: 0,
                to: Number.MAX_VALUE, // corrected to axis max
                outerRadius: '105%'
            }

        });

        H.Pane = Pane;

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Axis = H.Axis,
            CenteredSeriesMixin = H.CenteredSeriesMixin,
            each = H.each,
            extend = H.extend,
            map = H.map,
            merge = H.merge,
            noop = H.noop,
            Pane = H.Pane,
            pick = H.pick,
            pInt = H.pInt,
            Tick = H.Tick,
            splat = H.splat,
            wrap = H.wrap,


            hiddenAxisMixin, // @todo Extract this to a new file
            radialAxisMixin, // @todo Extract this to a new file
            axisProto = Axis.prototype,
            tickProto = Tick.prototype;

        /**
         * Augmented methods for the x axis in order to hide it completely, used for the X axis in gauges
         */
        hiddenAxisMixin = {
            getOffset: noop,
            redraw: function() {
                this.isDirty = false; // prevent setting Y axis dirty
            },
            render: function() {
                this.isDirty = false; // prevent setting Y axis dirty
            },
            setScale: noop,
            setCategories: noop,
            setTitle: noop
        };

        /**
         * Augmented methods for the value axis
         */
        radialAxisMixin = {

            /**
             * The default options extend defaultYAxisOptions
             */
            defaultRadialGaugeOptions: {
                labels: {
                    align: 'center',
                    x: 0,
                    y: null // auto
                },
                minorGridLineWidth: 0,
                minorTickInterval: 'auto',
                minorTickLength: 10,
                minorTickPosition: 'inside',
                minorTickWidth: 1,
                tickLength: 10,
                tickPosition: 'inside',
                tickWidth: 2,
                title: {
                    rotation: 0
                },
                zIndex: 2 // behind dials, points in the series group
            },

            // Circular axis around the perimeter of a polar chart
            defaultRadialXOptions: {
                gridLineWidth: 1, // spokes
                labels: {
                    align: null, // auto
                    distance: 15,
                    x: 0,
                    y: null // auto
                },
                maxPadding: 0,
                minPadding: 0,
                showLastLabel: false,
                tickLength: 0
            },

            // Radial axis, like a spoke in a polar chart
            defaultRadialYOptions: {
                gridLineInterpolation: 'circle',
                labels: {
                    align: 'right',
                    x: -3,
                    y: -2
                },
                showLastLabel: false,
                title: {
                    x: 4,
                    text: null,
                    rotation: 90
                }
            },

            /**
             * Merge and set options
             */
            setOptions: function(userOptions) {

                var options = this.options = merge(
                    this.defaultOptions,
                    this.defaultRadialOptions,
                    userOptions
                );

                // Make sure the plotBands array is instanciated for each Axis (#2649)
                if (!options.plotBands) {
                    options.plotBands = [];
                }

            },

            /**
             * Wrap the getOffset method to return zero offset for title or labels in a radial
             * axis
             */
            getOffset: function() {
                // Call the Axis prototype method (the method we're in now is on the instance)
                axisProto.getOffset.call(this);

                // Title or label offsets are not counted
                this.chart.axisOffset[this.side] = 0;

                // Set the center array
                this.center = this.pane.center = CenteredSeriesMixin.getCenter.call(this.pane);
            },


            /**
             * Get the path for the axis line. This method is also referenced in the getPlotLinePath
             * method.
             */
            getLinePath: function(lineWidth, radius) {
                var center = this.center,
                    end,
                    chart = this.chart,
                    r = pick(radius, center[2] / 2 - this.offset),
                    path;

                if (this.isCircular || radius !== undefined) {
                    path = this.chart.renderer.symbols.arc(
                        this.left + center[0],
                        this.top + center[1],
                        r,
                        r, {
                            start: this.startAngleRad,
                            end: this.endAngleRad,
                            open: true,
                            innerR: 0
                        }
                    );
                } else {
                    end = this.postTranslate(this.angleRad, r);
                    path = ['M', center[0] + chart.plotLeft, center[1] + chart.plotTop, 'L', end.x, end.y];
                }
                return path;
            },

            /**
             * Override setAxisTranslation by setting the translation to the difference
             * in rotation. This allows the translate method to return angle for
             * any given value.
             */
            setAxisTranslation: function() {

                // Call uber method
                axisProto.setAxisTranslation.call(this);

                // Set transA and minPixelPadding
                if (this.center) { // it's not defined the first time
                    if (this.isCircular) {

                        this.transA = (this.endAngleRad - this.startAngleRad) /
                            ((this.max - this.min) || 1);


                    } else {
                        this.transA = (this.center[2] / 2) / ((this.max - this.min) || 1);
                    }

                    if (this.isXAxis) {
                        this.minPixelPadding = this.transA * this.minPointOffset;
                    } else {
                        // This is a workaround for regression #2593, but categories still don't position correctly.
                        this.minPixelPadding = 0;
                    }
                }
            },

            /**
             * In case of auto connect, add one closestPointRange to the max value right before
             * tickPositions are computed, so that ticks will extend passed the real max.
             */
            beforeSetTickPositions: function() {
                // If autoConnect is true, polygonal grid lines are connected, and one closestPointRange
                // is added to the X axis to prevent the last point from overlapping the first.
                this.autoConnect = this.isCircular && pick(this.userMax, this.options.max) === undefined &&
                    this.endAngleRad - this.startAngleRad === 2 * Math.PI;

                if (this.autoConnect) {
                    this.max += (this.categories && 1) || this.pointRange || this.closestPointRange || 0; // #1197, #2260
                }
            },

            /**
             * Override the setAxisSize method to use the arc's circumference as length. This
             * allows tickPixelInterval to apply to pixel lengths along the perimeter
             */
            setAxisSize: function() {

                axisProto.setAxisSize.call(this);

                if (this.isRadial) {

                    // Set the center array
                    this.center = this.pane.center = CenteredSeriesMixin.getCenter.call(this.pane);

                    // The sector is used in Axis.translate to compute the translation of reversed axis points (#2570)
                    if (this.isCircular) {
                        this.sector = this.endAngleRad - this.startAngleRad;
                    }

                    // Axis len is used to lay out the ticks
                    this.len = this.width = this.height = this.center[2] * pick(this.sector, 1) / 2;


                }
            },

            /**
             * Returns the x, y coordinate of a point given by a value and a pixel distance
             * from center
             */
            getPosition: function(value, length) {
                return this.postTranslate(
                    this.isCircular ? this.translate(value) : this.angleRad, // #2848
                    pick(this.isCircular ? length : this.translate(value), this.center[2] / 2) - this.offset
                );
            },

            /**
             * Translate from intermediate plotX (angle), plotY (axis.len - radius) to final chart coordinates.
             */
            postTranslate: function(angle, radius) {

                var chart = this.chart,
                    center = this.center;

                angle = this.startAngleRad + angle;

                return {
                    x: chart.plotLeft + center[0] + Math.cos(angle) * radius,
                    y: chart.plotTop + center[1] + Math.sin(angle) * radius
                };

            },

            /**
             * Find the path for plot bands along the radial axis
             */
            getPlotBandPath: function(from, to, options) {
                var center = this.center,
                    startAngleRad = this.startAngleRad,
                    fullRadius = center[2] / 2,
                    radii = [
                        pick(options.outerRadius, '100%'),
                        options.innerRadius,
                        pick(options.thickness, 10)
                    ],
                    offset = Math.min(this.offset, 0),
                    percentRegex = /%$/,
                    start,
                    end,
                    open,
                    isCircular = this.isCircular, // X axis in a polar chart
                    ret;

                // Polygonal plot bands
                if (this.options.gridLineInterpolation === 'polygon') {
                    ret = this.getPlotLinePath(from).concat(this.getPlotLinePath(to, true));

                    // Circular grid bands
                } else {

                    // Keep within bounds
                    from = Math.max(from, this.min);
                    to = Math.min(to, this.max);

                    // Plot bands on Y axis (radial axis) - inner and outer radius depend on to and from
                    if (!isCircular) {
                        radii[0] = this.translate(from);
                        radii[1] = this.translate(to);
                    }

                    // Convert percentages to pixel values
                    radii = map(radii, function(radius) {
                        if (percentRegex.test(radius)) {
                            radius = (pInt(radius, 10) * fullRadius) / 100;
                        }
                        return radius;
                    });

                    // Handle full circle
                    if (options.shape === 'circle' || !isCircular) {
                        start = -Math.PI / 2;
                        end = Math.PI * 1.5;
                        open = true;
                    } else {
                        start = startAngleRad + this.translate(from);
                        end = startAngleRad + this.translate(to);
                    }

                    radii[0] -= offset; // #5283
                    radii[2] -= offset; // #5283

                    ret = this.chart.renderer.symbols.arc(
                        this.left + center[0],
                        this.top + center[1],
                        radii[0],
                        radii[0], {
                            start: Math.min(start, end), // Math is for reversed yAxis (#3606)
                            end: Math.max(start, end),
                            innerR: pick(radii[1], radii[0] - radii[2]),
                            open: open
                        }
                    );
                }

                return ret;
            },

            /**
             * Find the path for plot lines perpendicular to the radial axis.
             */
            getPlotLinePath: function(value, reverse) {
                var axis = this,
                    center = axis.center,
                    chart = axis.chart,
                    end = axis.getPosition(value),
                    xAxis,
                    xy,
                    tickPositions,
                    ret;

                // Spokes
                if (axis.isCircular) {
                    ret = ['M', center[0] + chart.plotLeft, center[1] + chart.plotTop, 'L', end.x, end.y];

                    // Concentric circles
                } else if (axis.options.gridLineInterpolation === 'circle') {
                    value = axis.translate(value);
                    if (value) { // a value of 0 is in the center
                        ret = axis.getLinePath(0, value);
                    }
                    // Concentric polygons
                } else {
                    // Find the X axis in the same pane
                    each(chart.xAxis, function(a) {
                        if (a.pane === axis.pane) {
                            xAxis = a;
                        }
                    });
                    ret = [];
                    value = axis.translate(value);
                    tickPositions = xAxis.tickPositions;
                    if (xAxis.autoConnect) {
                        tickPositions = tickPositions.concat([tickPositions[0]]);
                    }
                    // Reverse the positions for concatenation of polygonal plot bands
                    if (reverse) {
                        tickPositions = [].concat(tickPositions).reverse();
                    }

                    each(tickPositions, function(pos, i) {
                        xy = xAxis.getPosition(pos, value);
                        ret.push(i ? 'L' : 'M', xy.x, xy.y);
                    });

                }
                return ret;
            },

            /**
             * Find the position for the axis title, by default inside the gauge
             */
            getTitlePosition: function() {
                var center = this.center,
                    chart = this.chart,
                    titleOptions = this.options.title;

                return {
                    x: chart.plotLeft + center[0] + (titleOptions.x || 0),
                    y: chart.plotTop + center[1] - ({
                            high: 0.5,
                            middle: 0.25,
                            low: 0
                        }[titleOptions.align] *
                        center[2]) + (titleOptions.y || 0)
                };
            }

        };

        /**
         * Override axisProto.init to mix in special axis instance functions and function overrides
         */
        wrap(axisProto, 'init', function(proceed, chart, userOptions) {
            var axis = this,
                angular = chart.angular,
                polar = chart.polar,
                isX = userOptions.isX,
                isHidden = angular && isX,
                isCircular,
                options,
                chartOptions = chart.options,
                paneIndex = userOptions.pane || 0,
                pane,
                paneOptions;

            // Before prototype.init
            if (angular) {
                extend(this, isHidden ? hiddenAxisMixin : radialAxisMixin);
                isCircular = !isX;
                if (isCircular) {
                    this.defaultRadialOptions = this.defaultRadialGaugeOptions;
                }

            } else if (polar) {
                extend(this, radialAxisMixin);
                isCircular = isX;
                this.defaultRadialOptions = isX ? this.defaultRadialXOptions : merge(this.defaultYAxisOptions, this.defaultRadialYOptions);

            }

            // Disable certain features on angular and polar axes
            if (angular || polar) {
                this.isRadial = true;
                chart.inverted = false;
                chartOptions.chart.zoomType = null;
            } else {
                this.isRadial = false;
            }

            // Run prototype.init
            proceed.call(this, chart, userOptions);

            if (!isHidden && (angular || polar)) {
                options = this.options;

                // Create the pane and set the pane options.
                if (!chart.panes) {
                    chart.panes = [];
                }
                this.pane = pane = chart.panes[paneIndex] = chart.panes[paneIndex] || new Pane(
                    splat(chartOptions.pane)[paneIndex],
                    chart,
                    axis
                );
                paneOptions = pane.options;

                // Start and end angle options are
                // given in degrees relative to top, while internal computations are
                // in radians relative to right (like SVG).
                this.angleRad = (options.angle || 0) * Math.PI / 180; // Y axis in polar charts
                this.startAngleRad = (paneOptions.startAngle - 90) * Math.PI / 180; // Gauges
                this.endAngleRad = (pick(paneOptions.endAngle, paneOptions.startAngle + 360) - 90) * Math.PI / 180; // Gauges
                this.offset = options.offset || 0;

                this.isCircular = isCircular;

            }

        });

        /**
         * Wrap auto label align to avoid setting axis-wide rotation on radial axes (#4920)
         * @param   {Function} proceed
         * @returns {String} Alignment
         */
        wrap(axisProto, 'autoLabelAlign', function(proceed) {
            if (!this.isRadial) {
                return proceed.apply(this, [].slice.call(arguments, 1));
            } // else return undefined
        });

        /**
         * Add special cases within the Tick class' methods for radial axes.
         */
        wrap(tickProto, 'getPosition', function(proceed, horiz, pos, tickmarkOffset, old) {
            var axis = this.axis;

            return axis.getPosition ?
                axis.getPosition(pos) :
                proceed.call(this, horiz, pos, tickmarkOffset, old);
        });

        /**
         * Wrap the getLabelPosition function to find the center position of the label
         * based on the distance option
         */
        wrap(tickProto, 'getLabelPosition', function(proceed, x, y, label, horiz, labelOptions, tickmarkOffset, index, step) {
            var axis = this.axis,
                optionsY = labelOptions.y,
                ret,
                centerSlot = 20, // 20 degrees to each side at the top and bottom
                align = labelOptions.align,
                angle = ((axis.translate(this.pos) + axis.startAngleRad + Math.PI / 2) / Math.PI * 180) % 360;

            if (axis.isRadial) { // Both X and Y axes in a polar chart
                ret = axis.getPosition(this.pos, (axis.center[2] / 2) + pick(labelOptions.distance, -25));

                // Automatically rotated
                if (labelOptions.rotation === 'auto') {
                    label.attr({
                        rotation: angle
                    });

                    // Vertically centered
                } else if (optionsY === null) {
                    optionsY = axis.chart.renderer.fontMetrics(label.styles.fontSize).b - label.getBBox().height / 2;
                }

                // Automatic alignment
                if (align === null) {
                    if (axis.isCircular) { // Y axis
                        if (this.label.getBBox().width > axis.len * axis.tickInterval / (axis.max - axis.min)) { // #3506
                            centerSlot = 0;
                        }
                        if (angle > centerSlot && angle < 180 - centerSlot) {
                            align = 'left'; // right hemisphere
                        } else if (angle > 180 + centerSlot && angle < 360 - centerSlot) {
                            align = 'right'; // left hemisphere
                        } else {
                            align = 'center'; // top or bottom
                        }
                    } else {
                        align = 'center';
                    }
                    label.attr({
                        align: align
                    });
                }

                ret.x += labelOptions.x;
                ret.y += optionsY;

            } else {
                ret = proceed.call(this, x, y, label, horiz, labelOptions, tickmarkOffset, index, step);
            }
            return ret;
        });

        /**
         * Wrap the getMarkPath function to return the path of the radial marker
         */
        wrap(tickProto, 'getMarkPath', function(proceed, x, y, tickLength, tickWidth, horiz, renderer) {
            var axis = this.axis,
                endPoint,
                ret;

            if (axis.isRadial) {
                endPoint = axis.getPosition(this.pos, axis.center[2] / 2 + tickLength);
                ret = [
                    'M',
                    x,
                    y,
                    'L',
                    endPoint.x,
                    endPoint.y
                ];
            } else {
                ret = proceed.call(this, x, y, tickLength, tickWidth, horiz, renderer);
            }
            return ret;
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var each = H.each,
            noop = H.noop,
            pick = H.pick,
            Series = H.Series,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;
        /* 
         * The arearangeseries series type
         */
        seriesType('arearange', 'area', {

            lineWidth: 1,

            marker: null,
            threshold: null,
            tooltip: {

                pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.low}</b> - <b>{point.high}</b><br/>' // eslint-disable-line no-dupe-keys

            },
            trackByArea: true,
            dataLabels: {
                align: null,
                verticalAlign: null,
                xLow: 0,
                xHigh: 0,
                yLow: 0,
                yHigh: 0
            },
            states: {
                hover: {
                    halo: false
                }
            }

            // Prototype members
        }, {
            pointArrayMap: ['low', 'high'],
            dataLabelCollections: ['dataLabel', 'dataLabelUpper'],
            toYData: function(point) {
                return [point.low, point.high];
            },
            pointValKey: 'low',
            deferTranslatePolar: true,

            /**
             * Translate a point's plotHigh from the internal angle and radius measures to
             * true plotHigh coordinates. This is an addition of the toXY method found in
             * Polar.js, because it runs too early for arearanges to be considered (#3419).
             */
            highToXY: function(point) {
                // Find the polar plotX and plotY
                var chart = this.chart,
                    xy = this.xAxis.postTranslate(point.rectPlotX, this.yAxis.len - point.plotHigh);
                point.plotHighX = xy.x - chart.plotLeft;
                point.plotHigh = xy.y - chart.plotTop;
            },

            /**
             * Translate data points from raw values x and y to plotX and plotY
             */
            translate: function() {
                var series = this,
                    yAxis = series.yAxis,
                    hasModifyValue = !!series.modifyValue;

                seriesTypes.area.prototype.translate.apply(series);

                // Set plotLow and plotHigh
                each(series.points, function(point) {

                    var low = point.low,
                        high = point.high,
                        plotY = point.plotY;

                    if (high === null || low === null) {
                        point.isNull = true;
                    } else {
                        point.plotLow = plotY;
                        point.plotHigh = yAxis.translate(
                            hasModifyValue ? series.modifyValue(high, point) : high,
                            0,
                            1,
                            0,
                            1
                        );
                        if (hasModifyValue) {
                            point.yBottom = point.plotHigh;
                        }
                    }
                });

                // Postprocess plotHigh
                if (this.chart.polar) {
                    each(this.points, function(point) {
                        series.highToXY(point);
                    });
                }
            },

            /**
             * Extend the line series' getSegmentPath method by applying the segment
             * path to both lower and higher values of the range
             */
            getGraphPath: function(points) {

                var highPoints = [],
                    highAreaPoints = [],
                    i,
                    getGraphPath = seriesTypes.area.prototype.getGraphPath,
                    point,
                    pointShim,
                    linePath,
                    lowerPath,
                    options = this.options,
                    connectEnds = this.chart.polar && options.connectEnds !== false,
                    step = options.step,
                    higherPath,
                    higherAreaPath;

                points = points || this.points;
                i = points.length;

                // Create the top line and the top part of the area fill. The area fill compensates for 
                // null points by drawing down to the lower graph, moving across the null gap and 
                // starting again at the lower graph.
                i = points.length;
                while (i--) {
                    point = points[i];

                    if (!point.isNull &&
                        !connectEnds &&
                        (!points[i + 1] || points[i + 1].isNull)
                    ) {
                        highAreaPoints.push({
                            plotX: point.plotX,
                            plotY: point.plotY,
                            doCurve: false // #5186, gaps in areasplinerange fill
                        });
                    }

                    pointShim = {
                        polarPlotY: point.polarPlotY,
                        rectPlotX: point.rectPlotX,
                        yBottom: point.yBottom,
                        plotX: pick(point.plotHighX, point.plotX), // plotHighX is for polar charts
                        plotY: point.plotHigh,
                        isNull: point.isNull
                    };
                    highAreaPoints.push(pointShim);
                    highPoints.push(pointShim);

                    if (!point.isNull &&
                        !connectEnds &&
                        (!points[i - 1] || points[i - 1].isNull)
                    ) {
                        highAreaPoints.push({
                            plotX: point.plotX,
                            plotY: point.plotY,
                            doCurve: false // #5186, gaps in areasplinerange fill
                        });
                    }
                }

                // Get the paths
                lowerPath = getGraphPath.call(this, points);
                if (step) {
                    if (step === true) {
                        step = 'left';
                    }
                    options.step = {
                        left: 'right',
                        center: 'center',
                        right: 'left'
                    }[step]; // swap for reading in getGraphPath
                }
                higherPath = getGraphPath.call(this, highPoints);
                higherAreaPath = getGraphPath.call(this, highAreaPoints);
                options.step = step;

                // Create a line on both top and bottom of the range
                linePath = [].concat(lowerPath, higherPath);

                // For the area path, we need to change the 'move' statement into 'lineTo' or 'curveTo'
                if (!this.chart.polar && higherAreaPath[0] === 'M') {
                    higherAreaPath[0] = 'L'; // this probably doesn't work for spline			
                }

                this.graphPath = linePath;
                this.areaPath = this.areaPath.concat(lowerPath, higherAreaPath);

                // Prepare for sideways animation
                linePath.isArea = true;
                linePath.xMap = lowerPath.xMap;
                this.areaPath.xMap = lowerPath.xMap;

                return linePath;
            },

            /**
             * Extend the basic drawDataLabels method by running it for both lower and higher
             * values.
             */
            drawDataLabels: function() {

                var data = this.data,
                    length = data.length,
                    i,
                    originalDataLabels = [],
                    seriesProto = Series.prototype,
                    dataLabelOptions = this.options.dataLabels,
                    align = dataLabelOptions.align,
                    verticalAlign = dataLabelOptions.verticalAlign,
                    inside = dataLabelOptions.inside,
                    point,
                    up,
                    inverted = this.chart.inverted;

                if (dataLabelOptions.enabled || this._hasPointLabels) {

                    // Step 1: set preliminary values for plotY and dataLabel and draw the upper labels
                    i = length;
                    while (i--) {
                        point = data[i];
                        if (point) {
                            up = inside ? point.plotHigh < point.plotLow : point.plotHigh > point.plotLow;

                            // Set preliminary values
                            point.y = point.high;
                            point._plotY = point.plotY;
                            point.plotY = point.plotHigh;

                            // Store original data labels and set preliminary label objects to be picked up
                            // in the uber method
                            originalDataLabels[i] = point.dataLabel;
                            point.dataLabel = point.dataLabelUpper;

                            // Set the default offset
                            point.below = up;
                            if (inverted) {
                                if (!align) {
                                    dataLabelOptions.align = up ? 'right' : 'left';
                                }
                            } else {
                                if (!verticalAlign) {
                                    dataLabelOptions.verticalAlign = up ? 'top' : 'bottom';
                                }
                            }

                            dataLabelOptions.x = dataLabelOptions.xHigh;
                            dataLabelOptions.y = dataLabelOptions.yHigh;
                        }
                    }

                    if (seriesProto.drawDataLabels) {
                        seriesProto.drawDataLabels.apply(this, arguments); // #1209
                    }

                    // Step 2: reorganize and handle data labels for the lower values
                    i = length;
                    while (i--) {
                        point = data[i];
                        if (point) {
                            up = inside ? point.plotHigh < point.plotLow : point.plotHigh > point.plotLow;

                            // Move the generated labels from step 1, and reassign the original data labels
                            point.dataLabelUpper = point.dataLabel;
                            point.dataLabel = originalDataLabels[i];

                            // Reset values
                            point.y = point.low;
                            point.plotY = point._plotY;

                            // Set the default offset
                            point.below = !up;
                            if (inverted) {
                                if (!align) {
                                    dataLabelOptions.align = up ? 'left' : 'right';
                                }
                            } else {
                                if (!verticalAlign) {
                                    dataLabelOptions.verticalAlign = up ? 'bottom' : 'top';
                                }

                            }

                            dataLabelOptions.x = dataLabelOptions.xLow;
                            dataLabelOptions.y = dataLabelOptions.yLow;
                        }
                    }
                    if (seriesProto.drawDataLabels) {
                        seriesProto.drawDataLabels.apply(this, arguments);
                    }
                }

                dataLabelOptions.align = align;
                dataLabelOptions.verticalAlign = verticalAlign;
            },

            alignDataLabel: function() {
                seriesTypes.column.prototype.alignDataLabel.apply(this, arguments);
            },

            setStackedPoints: noop,

            getSymbol: noop,

            drawPoints: noop
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';

        var seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;

        /**
         * The areasplinerange series type
         */
        seriesType('areasplinerange', 'arearange', null, {
            getPointSpline: seriesTypes.spline.prototype.getPointSpline
        });

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
            noop = H.noop,
            pick = H.pick,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;

        var colProto = seriesTypes.column.prototype;

        /**
         * The ColumnRangeSeries class
         */
        seriesType('columnrange', 'arearange', merge(defaultPlotOptions.column, defaultPlotOptions.arearange, {
            lineWidth: 1,
            pointRange: null

            // Prototype members
        }), {
            /**
             * Translate data points from raw values x and y to plotX and plotY
             */
            translate: function() {
                var series = this,
                    yAxis = series.yAxis,
                    xAxis = series.xAxis,
                    startAngleRad = xAxis.startAngleRad,
                    start,
                    chart = series.chart,
                    isRadial = series.xAxis.isRadial,
                    plotHigh;

                colProto.translate.apply(series);

                // Set plotLow and plotHigh
                each(series.points, function(point) {
                    var shapeArgs = point.shapeArgs,
                        minPointLength = series.options.minPointLength,
                        heightDifference,
                        height,
                        y;

                    point.plotHigh = plotHigh = yAxis.translate(point.high, 0, 1, 0, 1);
                    point.plotLow = point.plotY;

                    // adjust shape
                    y = plotHigh;
                    height = pick(point.rectPlotY, point.plotY) - plotHigh;

                    // Adjust for minPointLength
                    if (Math.abs(height) < minPointLength) {
                        heightDifference = (minPointLength - height);
                        height += heightDifference;
                        y -= heightDifference / 2;

                        // Adjust for negative ranges or reversed Y axis (#1457)
                    } else if (height < 0) {
                        height *= -1;
                        y -= height;
                    }

                    if (isRadial) {

                        start = point.barX + startAngleRad;
                        point.shapeType = 'path';
                        point.shapeArgs = {
                            d: series.polarArc(y + height, y, start, start + point.pointWidth)
                        };
                    } else {
                        shapeArgs.height = height;
                        shapeArgs.y = y;

                        point.tooltipPos = chart.inverted ? [
                            yAxis.len + yAxis.pos - chart.plotLeft - y - height / 2,
                            xAxis.len + xAxis.pos - chart.plotTop - shapeArgs.x -
                            shapeArgs.width / 2,
                            height
                        ] : [
                            xAxis.left - chart.plotLeft + shapeArgs.x +
                            shapeArgs.width / 2,
                            yAxis.pos - chart.plotTop + y + height / 2,
                            height
                        ]; // don't inherit from column tooltip position - #3372
                    }
                });
            },
            directTouch: true,
            trackerGroups: ['group', 'dataLabelsGroup'],
            drawGraph: noop,
            crispCol: colProto.crispCol,
            drawPoints: colProto.drawPoints,
            drawTracker: colProto.drawTracker,
            getColumnMetrics: colProto.getColumnMetrics,
            animate: function() {
                return colProto.animate.apply(this, arguments);
            },
            polarArc: function() {
                return colProto.polarArc.apply(this, arguments);
            },
            pointAttribs: colProto.pointAttribs
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var each = H.each,
            isNumber = H.isNumber,
            merge = H.merge,
            noop = H.noop,
            pick = H.pick,
            pInt = H.pInt,
            Series = H.Series,
            seriesType = H.seriesType,
            TrackerMixin = H.TrackerMixin;
        /* 
         * The GaugeSeries class
         */
        seriesType('gauge', 'line', {
            dataLabels: {
                enabled: true,
                defer: false,
                y: 15,
                borderRadius: 3,
                crop: false,
                verticalAlign: 'top',
                zIndex: 2,

                // Presentational
                borderWidth: 1,
                borderColor: '#cccccc'

            },
            dial: {
                // radius: '80%',
                // baseWidth: 3,
                // topWidth: 1,
                // baseLength: '70%' // of radius
                // rearLength: '10%'

                // backgroundColor: '#000000',
                // borderColor: '#cccccc',
                // borderWidth: 0


            },
            pivot: {
                //radius: 5,

                //borderWidth: 0
                //borderColor: '#cccccc',
                //backgroundColor: '#000000'

            },
            tooltip: {
                headerFormat: ''
            },
            showInLegend: false

            // Prototype members
        }, {
            // chart.angular will be set to true when a gauge series is present, and this will
            // be used on the axes
            angular: true,
            directTouch: true, // #5063
            drawGraph: noop,
            fixedBox: true,
            forceDL: true,
            noSharedTooltip: true,
            trackerGroups: ['group', 'dataLabelsGroup'],

            /**
             * Calculate paths etc
             */
            translate: function() {

                var series = this,
                    yAxis = series.yAxis,
                    options = series.options,
                    center = yAxis.center;

                series.generatePoints();

                each(series.points, function(point) {

                    var dialOptions = merge(options.dial, point.dial),
                        radius = (pInt(pick(dialOptions.radius, 80)) * center[2]) / 200,
                        baseLength = (pInt(pick(dialOptions.baseLength, 70)) * radius) / 100,
                        rearLength = (pInt(pick(dialOptions.rearLength, 10)) * radius) / 100,
                        baseWidth = dialOptions.baseWidth || 3,
                        topWidth = dialOptions.topWidth || 1,
                        overshoot = options.overshoot,
                        rotation = yAxis.startAngleRad + yAxis.translate(point.y, null, null, null, true);

                    // Handle the wrap and overshoot options
                    if (isNumber(overshoot)) {
                        overshoot = overshoot / 180 * Math.PI;
                        rotation = Math.max(yAxis.startAngleRad - overshoot, Math.min(yAxis.endAngleRad + overshoot, rotation));

                    } else if (options.wrap === false) {
                        rotation = Math.max(yAxis.startAngleRad, Math.min(yAxis.endAngleRad, rotation));
                    }

                    rotation = rotation * 180 / Math.PI;

                    point.shapeType = 'path';
                    point.shapeArgs = {
                        d: dialOptions.path || [
                            'M', -rearLength, -baseWidth / 2,
                            'L',
                            baseLength, -baseWidth / 2,
                            radius, -topWidth / 2,
                            radius, topWidth / 2,
                            baseLength, baseWidth / 2, -rearLength, baseWidth / 2,
                            'z'
                        ],
                        translateX: center[0],
                        translateY: center[1],
                        rotation: rotation
                    };

                    // Positions for data label
                    point.plotX = center[0];
                    point.plotY = center[1];
                });
            },

            /**
             * Draw the points where each point is one needle
             */
            drawPoints: function() {

                var series = this,
                    center = series.yAxis.center,
                    pivot = series.pivot,
                    options = series.options,
                    pivotOptions = options.pivot,
                    renderer = series.chart.renderer;

                each(series.points, function(point) {

                    var graphic = point.graphic,
                        shapeArgs = point.shapeArgs,
                        d = shapeArgs.d,
                        dialOptions = merge(options.dial, point.dial); // #1233

                    if (graphic) {
                        graphic.animate(shapeArgs);
                        shapeArgs.d = d; // animate alters it
                    } else {
                        point.graphic = renderer[point.shapeType](shapeArgs)
                            .attr({
                                rotation: shapeArgs.rotation, // required by VML when animation is false
                                zIndex: 1
                            })
                            .addClass('highcharts-dial')
                            .add(series.group);


                        // Presentational attributes
                        point.graphic.attr({
                            stroke: dialOptions.borderColor || 'none',
                            'stroke-width': dialOptions.borderWidth || 0,
                            fill: dialOptions.backgroundColor || '#000000'
                        });

                    }
                });

                // Add or move the pivot
                if (pivot) {
                    pivot.animate({ // #1235
                        translateX: center[0],
                        translateY: center[1]
                    });
                } else {
                    series.pivot = renderer.circle(0, 0, pick(pivotOptions.radius, 5))
                        .attr({
                            zIndex: 2
                        })
                        .addClass('highcharts-pivot')
                        .translate(center[0], center[1])
                        .add(series.group);


                    // Presentational attributes
                    series.pivot.attr({
                        'stroke-width': pivotOptions.borderWidth || 0,
                        stroke: pivotOptions.borderColor || '#cccccc',
                        fill: pivotOptions.backgroundColor || '#000000'
                    });

                }
            },

            /**
             * Animate the arrow up from startAngle
             */
            animate: function(init) {
                var series = this;

                if (!init) {
                    each(series.points, function(point) {
                        var graphic = point.graphic;

                        if (graphic) {
                            // start value
                            graphic.attr({
                                rotation: series.yAxis.startAngleRad * 180 / Math.PI
                            });

                            // animate
                            graphic.animate({
                                rotation: point.shapeArgs.rotation
                            }, series.options.animation);
                        }
                    });

                    // delete this function to allow it only once
                    series.animate = null;
                }
            },

            render: function() {
                this.group = this.plotGroup(
                    'group',
                    'series',
                    this.visible ? 'visible' : 'hidden',
                    this.options.zIndex,
                    this.chart.seriesGroup
                );
                Series.prototype.render.call(this);
                this.group.clip(this.chart.clipRect);
            },

            /**
             * Extend the basic setData method by running processData and generatePoints immediately,
             * in order to access the points from the legend.
             */
            setData: function(data, redraw) {
                Series.prototype.setData.call(this, data, false);
                this.processData();
                this.generatePoints();
                if (pick(redraw, true)) {
                    this.chart.redraw();
                }
            },

            /**
             * If the tracking module is loaded, add the point tracker
             */
            drawTracker: TrackerMixin && TrackerMixin.drawTrackerPoint

            // Point members
        }, {
            /**
             * Don't do any hover colors or anything
             */
            setState: function(state) {
                this.state = state;
            }
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var each = H.each,
            noop = H.noop,
            pick = H.pick,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;

        /**
         * The boxplot series type.
         *
         * @constructor seriesTypes.boxplot
         * @augments seriesTypes.column
         */
        seriesType('boxplot', 'column', {
            threshold: null,
            tooltip: {

                pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {series.name}</b><br/>' + // eslint-disable-line no-dupe-keys
                    'Maximum: {point.high}<br/>' +
                    'Upper quartile: {point.q3}<br/>' +
                    'Median: {point.median}<br/>' +
                    'Lower quartile: {point.q1}<br/>' +
                    'Minimum: {point.low}<br/>'

            },
            whiskerLength: '50%',

            fillColor: '#ffffff',
            lineWidth: 1,
            //medianColor: null,
            medianWidth: 2,
            states: {
                hover: {
                    brightness: -0.3
                }
            },
            //stemColor: null,
            //stemDashStyle: 'solid'
            //stemWidth: null,

            //whiskerColor: null,
            whiskerWidth: 2


        }, /** @lends seriesTypes.boxplot */ {
            pointArrayMap: ['low', 'q1', 'median', 'q3', 'high'], // array point configs are mapped to this
            toYData: function(point) { // return a plain array for speedy calculation
                return [point.low, point.q1, point.median, point.q3, point.high];
            },
            pointValKey: 'high', // defines the top of the tracker


            /**
             * Get presentational attributes
             */
            pointAttribs: function(point) {
                var options = this.options,
                    color = (point && point.color) || this.color;

                return {
                    'fill': point.fillColor || options.fillColor || color,
                    'stroke': options.lineColor || color,
                    'stroke-width': options.lineWidth || 0
                };
            },


            /**
             * Disable data labels for box plot
             */
            drawDataLabels: noop,

            /**
             * Translate data points from raw values x and y to plotX and plotY
             */
            translate: function() {
                var series = this,
                    yAxis = series.yAxis,
                    pointArrayMap = series.pointArrayMap;

                seriesTypes.column.prototype.translate.apply(series);

                // do the translation on each point dimension
                each(series.points, function(point) {
                    each(pointArrayMap, function(key) {
                        if (point[key] !== null) {
                            point[key + 'Plot'] = yAxis.translate(point[key], 0, 1, 0, 1);
                        }
                    });
                });
            },

            /**
             * Draw the data points
             */
            drawPoints: function() {
                var series = this, //state = series.state,
                    points = series.points,
                    options = series.options,
                    chart = series.chart,
                    renderer = chart.renderer,
                    q1Plot,
                    q3Plot,
                    highPlot,
                    lowPlot,
                    medianPlot,
                    medianPath,
                    crispCorr,
                    crispX = 0,
                    boxPath,
                    width,
                    left,
                    right,
                    halfWidth,
                    doQuartiles = series.doQuartiles !== false, // error bar inherits this series type but doesn't do quartiles
                    pointWiskerLength,
                    whiskerLength = series.options.whiskerLength;


                each(points, function(point) {

                    var graphic = point.graphic,
                        verb = graphic ? 'animate' : 'attr',
                        shapeArgs = point.shapeArgs; // the box


                    var boxAttr,
                        stemAttr = {},
                        whiskersAttr = {},
                        medianAttr = {},
                        color = point.color || series.color;


                    if (point.plotY !== undefined) {

                        // crisp vector coordinates
                        width = shapeArgs.width;
                        left = Math.floor(shapeArgs.x);
                        right = left + width;
                        halfWidth = Math.round(width / 2);
                        q1Plot = Math.floor(doQuartiles ? point.q1Plot : point.lowPlot);
                        q3Plot = Math.floor(doQuartiles ? point.q3Plot : point.lowPlot);
                        highPlot = Math.floor(point.highPlot);
                        lowPlot = Math.floor(point.lowPlot);

                        if (!graphic) {
                            point.graphic = graphic = renderer.g('point')
                                .add(series.group);

                            point.stem = renderer.path()
                                .addClass('highcharts-boxplot-stem')
                                .add(graphic);

                            if (whiskerLength) {
                                point.whiskers = renderer.path()
                                    .addClass('highcharts-boxplot-whisker')
                                    .add(graphic);
                            }
                            if (doQuartiles) {
                                point.box = renderer.path(boxPath)
                                    .addClass('highcharts-boxplot-box')
                                    .add(graphic);
                            }
                            point.medianShape = renderer.path(medianPath)
                                .addClass('highcharts-boxplot-median')
                                .add(graphic);




                            // Stem attributes
                            stemAttr.stroke = point.stemColor || options.stemColor || color;
                            stemAttr['stroke-width'] = pick(point.stemWidth, options.stemWidth, options.lineWidth);
                            stemAttr.dashstyle = point.stemDashStyle || options.stemDashStyle;
                            point.stem.attr(stemAttr);

                            // Whiskers attributes
                            if (whiskerLength) {
                                whiskersAttr.stroke = point.whiskerColor || options.whiskerColor || color;
                                whiskersAttr['stroke-width'] = pick(point.whiskerWidth, options.whiskerWidth, options.lineWidth);
                                point.whiskers.attr(whiskersAttr);
                            }

                            if (doQuartiles) {
                                boxAttr = series.pointAttribs(point);
                                point.box.attr(boxAttr);
                            }


                            // Median attributes
                            medianAttr.stroke = point.medianColor || options.medianColor || color;
                            medianAttr['stroke-width'] = pick(point.medianWidth, options.medianWidth, options.lineWidth);
                            point.medianShape.attr(medianAttr);


                        }



                        // The stem
                        crispCorr = (point.stem.strokeWidth() % 2) / 2;
                        crispX = left + halfWidth + crispCorr;
                        point.stem[verb]({
                            d: [
                                // stem up
                                'M',
                                crispX, q3Plot,
                                'L',
                                crispX, highPlot,

                                // stem down
                                'M',
                                crispX, q1Plot,
                                'L',
                                crispX, lowPlot
                            ]
                        });

                        // The box
                        if (doQuartiles) {
                            crispCorr = (point.box.strokeWidth() % 2) / 2;
                            q1Plot = Math.floor(q1Plot) + crispCorr;
                            q3Plot = Math.floor(q3Plot) + crispCorr;
                            left += crispCorr;
                            right += crispCorr;
                            point.box[verb]({
                                d: [
                                    'M',
                                    left, q3Plot,
                                    'L',
                                    left, q1Plot,
                                    'L',
                                    right, q1Plot,
                                    'L',
                                    right, q3Plot,
                                    'L',
                                    left, q3Plot,
                                    'z'
                                ]
                            });
                        }

                        // The whiskers
                        if (whiskerLength) {
                            crispCorr = (point.whiskers.strokeWidth() % 2) / 2;
                            highPlot = highPlot + crispCorr;
                            lowPlot = lowPlot + crispCorr;
                            pointWiskerLength = (/%$/).test(whiskerLength) ? halfWidth * parseFloat(whiskerLength) / 100 : whiskerLength / 2;
                            point.whiskers[verb]({
                                d: [
                                    // High whisker
                                    'M',
                                    crispX - pointWiskerLength,
                                    highPlot,
                                    'L',
                                    crispX + pointWiskerLength,
                                    highPlot,

                                    // Low whisker
                                    'M',
                                    crispX - pointWiskerLength,
                                    lowPlot,
                                    'L',
                                    crispX + pointWiskerLength,
                                    lowPlot
                                ]
                            });
                        }

                        // The median
                        medianPlot = Math.round(point.medianPlot);
                        crispCorr = (point.medianShape.strokeWidth() % 2) / 2;
                        medianPlot = medianPlot + crispCorr;

                        point.medianShape[verb]({
                            d: [
                                'M',
                                left,
                                medianPlot,
                                'L',
                                right,
                                medianPlot
                            ]
                        });
                    }
                });

            },
            setStackedPoints: noop // #3890


        });

        /* ****************************************************************************
         * End Box plot series code												*
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var each = H.each,
            noop = H.noop,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;


        /* ****************************************************************************
         * Start error bar series code                                                *
         *****************************************************************************/
        seriesType('errorbar', 'boxplot', {

            color: '#000000',

            grouping: false,
            linkedTo: ':previous',
            tooltip: {
                pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.low}</b> - <b>{point.high}</b><br/>'
            },
            whiskerWidth: null

            // Prototype members
        }, {
            type: 'errorbar',
            pointArrayMap: ['low', 'high'], // array point configs are mapped to this
            toYData: function(point) { // return a plain array for speedy calculation
                return [point.low, point.high];
            },
            pointValKey: 'high', // defines the top of the tracker
            doQuartiles: false,
            drawDataLabels: seriesTypes.arearange ? function() {
                var valKey = this.pointValKey;
                seriesTypes.arearange.prototype.drawDataLabels.call(this);
                // Arearange drawDataLabels does not reset point.y to high, but to low after drawing. #4133 
                each(this.data, function(point) {
                    point.y = point[valKey];
                });
            } : noop,

            /**
             * Get the width and X offset, either on top of the linked series column
             * or standalone
             */
            getColumnMetrics: function() {
                return (this.linkedParent && this.linkedParent.columnMetrics) ||
                    seriesTypes.column.prototype.getColumnMetrics.call(this);
            }
        });

        /* ****************************************************************************
         * End error bar series code                                                  *
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var correctFloat = H.correctFloat,
            isNumber = H.isNumber,
            noop = H.noop,
            pick = H.pick,
            Point = H.Point,
            Series = H.Series,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;

        /* ****************************************************************************
         * Start Waterfall series code                                                *
         *****************************************************************************/
        seriesType('waterfall', 'column', {
            dataLabels: {
                inside: true
            },

            lineWidth: 1,
            lineColor: '#333333',
            dashStyle: 'dot',
            borderColor: '#333333',
            states: {
                hover: {
                    lineWidthPlus: 0 // #3126
                }
            }


            // Prototype members
        }, {
            pointValKey: 'y',

            /**
             * Translate data points from raw values
             */
            translate: function() {
                var series = this,
                    options = series.options,
                    yAxis = series.yAxis,
                    len,
                    i,
                    points,
                    point,
                    shapeArgs,
                    stack,
                    y,
                    yValue,
                    previousY,
                    previousIntermediate,
                    range,
                    minPointLength = pick(options.minPointLength, 5),
                    threshold = options.threshold,
                    stacking = options.stacking,
                    // Separate offsets for negative and positive columns:
                    positiveOffset = 0,
                    negativeOffset = 0,
                    stackIndicator,
                    tooltipY;

                // run column series translate
                seriesTypes.column.prototype.translate.apply(this);

                previousY = previousIntermediate = threshold;
                points = series.points;

                for (i = 0, len = points.length; i < len; i++) {
                    // cache current point object
                    point = points[i];
                    yValue = this.processedYData[i];
                    shapeArgs = point.shapeArgs;

                    // get current stack
                    stack = stacking && yAxis.stacks[(series.negStacks && yValue < threshold ? '-' : '') + series.stackKey];
                    stackIndicator = series.getStackIndicator(stackIndicator, point.x);
                    range = stack ?
                        stack[point.x].points[series.index + ',' + i + ',' + stackIndicator.index] : [0, yValue];

                    // override point value for sums
                    // #3710 Update point does not propagate to sum
                    if (point.isSum) {
                        point.y = correctFloat(yValue);
                    } else if (point.isIntermediateSum) {
                        point.y = correctFloat(yValue - previousIntermediate); // #3840
                    }
                    // up points
                    y = Math.max(previousY, previousY + point.y) + range[0];
                    shapeArgs.y = yAxis.toPixels(y, true);


                    // sum points
                    if (point.isSum) {
                        shapeArgs.y = yAxis.toPixels(range[1], true);
                        shapeArgs.height = Math.min(yAxis.toPixels(range[0], true), yAxis.len) -
                            shapeArgs.y + positiveOffset + negativeOffset; // #4256

                    } else if (point.isIntermediateSum) {
                        shapeArgs.y = yAxis.toPixels(range[1], true);
                        shapeArgs.height = Math.min(yAxis.toPixels(previousIntermediate, true), yAxis.len) -
                            shapeArgs.y + positiveOffset + negativeOffset;
                        previousIntermediate = range[1];

                        // If it's not the sum point, update previous stack end position and get
                        // shape height (#3886)
                    } else {
                        shapeArgs.height = yValue > 0 ?
                            yAxis.toPixels(previousY, true) - shapeArgs.y :
                            yAxis.toPixels(previousY, true) - yAxis.toPixels(previousY - yValue, true);
                        previousY += yValue;
                    }
                    // #3952 Negative sum or intermediate sum not rendered correctly
                    if (shapeArgs.height < 0) {
                        shapeArgs.y += shapeArgs.height;
                        shapeArgs.height *= -1;
                    }

                    point.plotY = shapeArgs.y = Math.round(shapeArgs.y) - (series.borderWidth % 2) / 2;
                    shapeArgs.height = Math.max(Math.round(shapeArgs.height), 0.001); // #3151
                    point.yBottom = shapeArgs.y + shapeArgs.height;

                    // Before minPointLength, apply negative offset:
                    shapeArgs.y -= negativeOffset;


                    if (shapeArgs.height <= minPointLength && !point.isNull) {
                        shapeArgs.height = minPointLength;
                        if (point.y < 0) {
                            negativeOffset -= minPointLength;
                        } else {
                            positiveOffset += minPointLength;
                        }
                    }

                    // After minPointLength is updated, apply positive offset:
                    shapeArgs.y -= positiveOffset;

                    // Correct tooltip placement (#3014)
                    tooltipY = point.plotY - negativeOffset - positiveOffset +
                        (point.negative && negativeOffset >= 0 ? shapeArgs.height : 0);
                    if (series.chart.inverted) {
                        point.tooltipPos[0] = yAxis.len - tooltipY;
                    } else {
                        point.tooltipPos[1] = tooltipY;
                    }
                }
            },

            /**
             * Call default processData then override yData to reflect waterfall's extremes on yAxis
             */
            processData: function(force) {
                var series = this,
                    options = series.options,
                    yData = series.yData,
                    points = series.options.data, // #3710 Update point does not propagate to sum
                    point,
                    dataLength = yData.length,
                    threshold = options.threshold || 0,
                    subSum,
                    sum,
                    dataMin,
                    dataMax,
                    y,
                    i;

                sum = subSum = dataMin = dataMax = threshold;

                for (i = 0; i < dataLength; i++) {
                    y = yData[i];
                    point = points && points[i] ? points[i] : {};

                    if (y === 'sum' || point.isSum) {
                        yData[i] = correctFloat(sum);
                    } else if (y === 'intermediateSum' || point.isIntermediateSum) {
                        yData[i] = correctFloat(subSum);
                    } else {
                        sum += y;
                        subSum += y;
                    }
                    dataMin = Math.min(sum, dataMin);
                    dataMax = Math.max(sum, dataMax);
                }

                Series.prototype.processData.call(this, force);

                // Record extremes
                series.dataMin = dataMin;
                series.dataMax = dataMax;
            },

            /**
             * Return y value or string if point is sum
             */
            toYData: function(pt) {
                if (pt.isSum) {
                    return (pt.x === 0 ? null : 'sum'); //#3245 Error when first element is Sum or Intermediate Sum
                }
                if (pt.isIntermediateSum) {
                    return (pt.x === 0 ? null : 'intermediateSum'); //#3245
                }
                return pt.y;
            },


            /**
             * Postprocess mapping between options and SVG attributes
             */
            pointAttribs: function(point, state) {

                var upColor = this.options.upColor,
                    attr;

                // Set or reset up color (#3710, update to negative)
                if (upColor && !point.options.color) {
                    point.color = point.y > 0 ? upColor : null;
                }

                attr = seriesTypes.column.prototype.pointAttribs.call(this, point, state);

                // The dashStyle option in waterfall applies to the graph, not
                // the points
                delete attr.dashstyle;

                return attr;
            },


            /**
             * Return an empty path initially, because we need to know the stroke-width in order 
             * to set the final path.
             */
            getGraphPath: function() {
                return ['M', 0, 0];
            },

            /**
             * Draw columns' connector lines
             */
            getCrispPath: function() {

                var data = this.data,
                    length = data.length,
                    lineWidth = this.graph.strokeWidth() + this.borderWidth,
                    normalizer = Math.round(lineWidth) % 2 / 2,
                    path = [],
                    prevArgs,
                    pointArgs,
                    i,
                    d;

                for (i = 1; i < length; i++) {
                    pointArgs = data[i].shapeArgs;
                    prevArgs = data[i - 1].shapeArgs;

                    d = [
                        'M',
                        prevArgs.x + prevArgs.width, prevArgs.y + normalizer,
                        'L',
                        pointArgs.x, prevArgs.y + normalizer
                    ];

                    if (data[i - 1].y < 0) {
                        d[2] += prevArgs.height;
                        d[5] += prevArgs.height;
                    }

                    path = path.concat(d);
                }

                return path;
            },

            /**
             * The graph is initally drawn with an empty definition, then updated with
             * crisp rendering.
             */
            drawGraph: function() {
                Series.prototype.drawGraph.call(this);
                this.graph.attr({
                    d: this.getCrispPath()
                });
            },

            /**
             * Extremes are recorded in processData
             */
            getExtremes: noop

            // Point members
        }, {
            getClassName: function() {
                var className = Point.prototype.getClassName.call(this);

                if (this.isSum) {
                    className += ' highcharts-sum';
                } else if (this.isIntermediateSum) {
                    className += ' highcharts-intermediate-sum';
                }
                return className;
            },
            /**
             * Pass the null test in ColumnSeries.translate.
             */
            isValid: function() {
                return isNumber(this.y, true) || this.isSum || this.isIntermediateSum;
            }

        });

        /* ****************************************************************************
         * End Waterfall series code                                                  *
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var LegendSymbolMixin = H.LegendSymbolMixin,
            noop = H.noop,
            Series = H.Series,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;
        /**
         * The polygon series prototype
         */
        seriesType('polygon', 'scatter', {
            marker: {
                enabled: false,
                states: {
                    hover: {
                        enabled: false
                    }
                }
            },
            stickyTracking: false,
            tooltip: {
                followPointer: true,
                pointFormat: ''
            },
            trackByArea: true

            // Prototype members
        }, {
            type: 'polygon',
            getGraphPath: function() {

                var graphPath = Series.prototype.getGraphPath.call(this),
                    i = graphPath.length + 1;

                // Close all segments
                while (i--) {
                    if ((i === graphPath.length || graphPath[i] === 'M') && i > 0) {
                        graphPath.splice(i, 0, 'z');
                    }
                }
                this.areaPath = graphPath;
                return graphPath;
            },
            drawGraph: function() {

                this.options.fillColor = this.color; // Hack into the fill logic in area.drawGraph

                seriesTypes.area.prototype.drawGraph.call(this);
            },
            drawLegendSymbol: LegendSymbolMixin.drawRectangle,
            drawTracker: Series.prototype.drawTracker,
            setStackedPoints: noop // No stacking points on polygons (#5310)
        });

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
            color = H.color,
            each = H.each,
            isNumber = H.isNumber,
            noop = H.noop,
            pick = H.pick,
            pInt = H.pInt,
            Point = H.Point,
            Series = H.Series,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes;

        /* ****************************************************************************
         * Start Bubble series code											          *
         *****************************************************************************/

        seriesType('bubble', 'scatter', {
            dataLabels: {
                formatter: function() { // #2945
                    return this.point.z;
                },
                inside: true,
                verticalAlign: 'middle'
            },
            // displayNegative: true,
            marker: {

                // fillOpacity: 0.5,
                lineColor: null, // inherit from series.color
                lineWidth: 1,

                // Avoid offset in Point.setState
                radius: null,
                states: {
                    hover: {
                        radiusPlus: 0
                    }
                },
                symbol: 'circle'
            },
            minSize: 8,
            maxSize: '20%',
            // negativeColor: null,
            // sizeBy: 'area'
            softThreshold: false,
            states: {
                hover: {
                    halo: {
                        size: 5
                    }
                }
            },
            tooltip: {
                pointFormat: '({point.x}, {point.y}), Size: {point.z}'
            },
            turboThreshold: 0,
            zThreshold: 0,
            zoneAxis: 'z'

            // Prototype members
        }, {
            pointArrayMap: ['y', 'z'],
            parallelArrays: ['x', 'y', 'z'],
            trackerGroups: ['markerGroup', 'dataLabelsGroup'],
            bubblePadding: true,
            zoneAxis: 'z',


            pointAttribs: function(point, state) {
                var markerOptions = this.options.marker,
                    fillOpacity = pick(markerOptions.fillOpacity, 0.5),
                    attr = Series.prototype.pointAttribs.call(this, point, state);

                if (fillOpacity !== 1) {
                    attr.fill = color(attr.fill).setOpacity(fillOpacity).get('rgba');
                }

                return attr;
            },


            /**
             * Get the radius for each point based on the minSize, maxSize and each point's Z value. This
             * must be done prior to Series.translate because the axis needs to add padding in
             * accordance with the point sizes.
             */
            getRadii: function(zMin, zMax, minSize, maxSize) {
                var len,
                    i,
                    pos,
                    zData = this.zData,
                    radii = [],
                    options = this.options,
                    sizeByArea = options.sizeBy !== 'width',
                    zThreshold = options.zThreshold,
                    zRange = zMax - zMin,
                    value,
                    radius;

                // Set the shape type and arguments to be picked up in drawPoints
                for (i = 0, len = zData.length; i < len; i++) {

                    value = zData[i];

                    // When sizing by threshold, the absolute value of z determines the size
                    // of the bubble.
                    if (options.sizeByAbsoluteValue && value !== null) {
                        value = Math.abs(value - zThreshold);
                        zMax = Math.max(zMax - zThreshold, Math.abs(zMin - zThreshold));
                        zMin = 0;
                    }

                    if (value === null) {
                        radius = null;
                        // Issue #4419 - if value is less than zMin, push a radius that's always smaller than the minimum size
                    } else if (value < zMin) {
                        radius = minSize / 2 - 1;
                    } else {
                        // Relative size, a number between 0 and 1
                        pos = zRange > 0 ? (value - zMin) / zRange : 0.5;

                        if (sizeByArea && pos >= 0) {
                            pos = Math.sqrt(pos);
                        }
                        radius = Math.ceil(minSize + pos * (maxSize - minSize)) / 2;
                    }
                    radii.push(radius);
                }
                this.radii = radii;
            },

            /**
             * Perform animation on the bubbles
             */
            animate: function(init) {
                var animation = this.options.animation;

                if (!init) { // run the animation
                    each(this.points, function(point) {
                        var graphic = point.graphic,
                            animationTarget;

                        if (graphic && graphic.width) { // URL symbols don't have width
                            animationTarget = {
                                x: graphic.x,
                                y: graphic.y,
                                width: graphic.width,
                                height: graphic.height
                            };

                            // Start values
                            graphic.attr({
                                x: point.plotX,
                                y: point.plotY,
                                width: 1,
                                height: 1
                            });

                            // Run animation
                            graphic.animate(animationTarget, animation);
                        }
                    });

                    // delete this function to allow it only once
                    this.animate = null;
                }
            },

            /**
             * Extend the base translate method to handle bubble size
             */
            translate: function() {

                var i,
                    data = this.data,
                    point,
                    radius,
                    radii = this.radii;

                // Run the parent method
                seriesTypes.scatter.prototype.translate.call(this);

                // Set the shape type and arguments to be picked up in drawPoints
                i = data.length;

                while (i--) {
                    point = data[i];
                    radius = radii ? radii[i] : 0; // #1737

                    if (isNumber(radius) && radius >= this.minPxSize / 2) {
                        // Shape arguments
                        point.marker = {
                            radius: radius,
                            width: 2 * radius,
                            height: 2 * radius
                        };

                        // Alignment box for the data label
                        point.dlBox = {
                            x: point.plotX - radius,
                            y: point.plotY - radius,
                            width: 2 * radius,
                            height: 2 * radius
                        };
                    } else { // below zThreshold
                        point.shapeArgs = point.plotY = point.dlBox = undefined; // #1691
                    }
                }
            },

            alignDataLabel: seriesTypes.column.prototype.alignDataLabel,
            buildKDTree: noop,
            applyZones: noop

            // Point class
        }, {
            haloPath: function(size) {
                return Point.prototype.haloPath.call(
                    this,
                    size === 0 ? 0 : this.marker.radius + size // #6067
                );
            },
            ttBelow: false
        });

        /**
         * Add logic to pad each axis with the amount of pixels
         * necessary to avoid the bubbles to overflow.
         */
        Axis.prototype.beforePadding = function() {
            var axis = this,
                axisLength = this.len,
                chart = this.chart,
                pxMin = 0,
                pxMax = axisLength,
                isXAxis = this.isXAxis,
                dataKey = isXAxis ? 'xData' : 'yData',
                min = this.min,
                extremes = {},
                smallestSize = Math.min(chart.plotWidth, chart.plotHeight),
                zMin = Number.MAX_VALUE,
                zMax = -Number.MAX_VALUE,
                range = this.max - min,
                transA = axisLength / range,
                activeSeries = [];

            // Handle padding on the second pass, or on redraw
            each(this.series, function(series) {

                var seriesOptions = series.options,
                    zData;

                if (series.bubblePadding && (series.visible || !chart.options.chart.ignoreHiddenSeries)) {

                    // Correction for #1673
                    axis.allowZoomOutside = true;

                    // Cache it
                    activeSeries.push(series);

                    if (isXAxis) { // because X axis is evaluated first

                        // For each series, translate the size extremes to pixel values
                        each(['minSize', 'maxSize'], function(prop) {
                            var length = seriesOptions[prop],
                                isPercent = /%$/.test(length);

                            length = pInt(length);
                            extremes[prop] = isPercent ?
                                smallestSize * length / 100 :
                                length;

                        });
                        series.minPxSize = extremes.minSize;
                        // Prioritize min size if conflict to make sure bubbles are
                        // always visible. #5873
                        series.maxPxSize = Math.max(extremes.maxSize, extremes.minSize);

                        // Find the min and max Z
                        zData = series.zData;
                        if (zData.length) { // #1735
                            zMin = pick(seriesOptions.zMin, Math.min(
                                zMin,
                                Math.max(
                                    arrayMin(zData),
                                    seriesOptions.displayNegative === false ? seriesOptions.zThreshold : -Number.MAX_VALUE
                                )
                            ));
                            zMax = pick(seriesOptions.zMax, Math.max(zMax, arrayMax(zData)));
                        }
                    }
                }
            });

            each(activeSeries, function(series) {

                var data = series[dataKey],
                    i = data.length,
                    radius;

                if (isXAxis) {
                    series.getRadii(zMin, zMax, series.minPxSize, series.maxPxSize);
                }

                if (range > 0) {
                    while (i--) {
                        if (isNumber(data[i]) && axis.dataMin <= data[i] && data[i] <= axis.dataMax) {
                            radius = series.radii[i];
                            pxMin = Math.min(((data[i] - min) * transA) - radius, pxMin);
                            pxMax = Math.max(((data[i] - min) * transA) + radius, pxMax);
                        }
                    }
                }
            });

            if (activeSeries.length && range > 0 && !this.isLog) {
                pxMax -= axisLength;
                transA *= (axisLength + pxMin - pxMax) / axisLength;
                each([
                    ['min', 'userMin', pxMin],
                    ['max', 'userMax', pxMax]
                ], function(keys) {
                    if (pick(axis.options[keys[0]], axis[keys[1]]) === undefined) {
                        axis[keys[0]] += keys[2] / transA;
                    }
                });
            }
        };

        /* ****************************************************************************
         * End Bubble series code                                                     *
         *****************************************************************************/

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';

        /**
         * Extensions for polar charts. Additionally, much of the geometry required for polar charts is
         * gathered in RadialAxes.js.
         *
         */

        var each = H.each,
            pick = H.pick,
            Pointer = H.Pointer,
            Series = H.Series,
            seriesTypes = H.seriesTypes,
            wrap = H.wrap,

            seriesProto = Series.prototype,
            pointerProto = Pointer.prototype,
            colProto;

        /**
         * Search a k-d tree by the point angle, used for shared tooltips in polar charts
         */
        seriesProto.searchPointByAngle = function(e) {
            var series = this,
                chart = series.chart,
                xAxis = series.xAxis,
                center = xAxis.pane.center,
                plotX = e.chartX - center[0] - chart.plotLeft,
                plotY = e.chartY - center[1] - chart.plotTop;

            return this.searchKDTree({
                clientX: 180 + (Math.atan2(plotX, plotY) * (-180 / Math.PI))
            });

        };

        /**
         * Wrap the buildKDTree function so that it searches by angle (clientX) in case of shared tooltip,
         * and by two dimensional distance in case of non-shared.
         */
        wrap(seriesProto, 'buildKDTree', function(proceed) {
            if (this.chart.polar) {
                if (this.kdByAngle) {
                    this.searchPoint = this.searchPointByAngle;
                } else {
                    this.kdDimensions = 2;
                }
            }
            proceed.apply(this);
        });

        /**
         * Translate a point's plotX and plotY from the internal angle and radius measures to
         * true plotX, plotY coordinates
         */
        seriesProto.toXY = function(point) {
            var xy,
                chart = this.chart,
                plotX = point.plotX,
                plotY = point.plotY,
                clientX;

            // Save rectangular plotX, plotY for later computation
            point.rectPlotX = plotX;
            point.rectPlotY = plotY;

            // Find the polar plotX and plotY
            xy = this.xAxis.postTranslate(point.plotX, this.yAxis.len - plotY);
            point.plotX = point.polarPlotX = xy.x - chart.plotLeft;
            point.plotY = point.polarPlotY = xy.y - chart.plotTop;

            // If shared tooltip, record the angle in degrees in order to align X points. Otherwise,
            // use a standard k-d tree to get the nearest point in two dimensions.
            if (this.kdByAngle) {
                clientX = ((plotX / Math.PI * 180) + this.xAxis.pane.options.startAngle) % 360;
                if (clientX < 0) { // #2665
                    clientX += 360;
                }
                point.clientX = clientX;
            } else {
                point.clientX = point.plotX;
            }
        };

        if (seriesTypes.spline) {
            /**
             * Overridden method for calculating a spline from one point to the next
             */
            wrap(seriesTypes.spline.prototype, 'getPointSpline', function(proceed, segment, point, i) {

                var ret,
                    smoothing = 1.5, // 1 means control points midway between points, 2 means 1/3 from the point, 3 is 1/4 etc;
                    denom = smoothing + 1,
                    plotX,
                    plotY,
                    lastPoint,
                    nextPoint,
                    lastX,
                    lastY,
                    nextX,
                    nextY,
                    leftContX,
                    leftContY,
                    rightContX,
                    rightContY,
                    distanceLeftControlPoint,
                    distanceRightControlPoint,
                    leftContAngle,
                    rightContAngle,
                    jointAngle;


                if (this.chart.polar) {

                    plotX = point.plotX;
                    plotY = point.plotY;
                    lastPoint = segment[i - 1];
                    nextPoint = segment[i + 1];

                    // Connect ends
                    if (this.connectEnds) {
                        if (!lastPoint) {
                            lastPoint = segment[segment.length - 2]; // not the last but the second last, because the segment is already connected
                        }
                        if (!nextPoint) {
                            nextPoint = segment[1];
                        }
                    }

                    // find control points
                    if (lastPoint && nextPoint) {

                        lastX = lastPoint.plotX;
                        lastY = lastPoint.plotY;
                        nextX = nextPoint.plotX;
                        nextY = nextPoint.plotY;
                        leftContX = (smoothing * plotX + lastX) / denom;
                        leftContY = (smoothing * plotY + lastY) / denom;
                        rightContX = (smoothing * plotX + nextX) / denom;
                        rightContY = (smoothing * plotY + nextY) / denom;
                        distanceLeftControlPoint = Math.sqrt(Math.pow(leftContX - plotX, 2) + Math.pow(leftContY - plotY, 2));
                        distanceRightControlPoint = Math.sqrt(Math.pow(rightContX - plotX, 2) + Math.pow(rightContY - plotY, 2));
                        leftContAngle = Math.atan2(leftContY - plotY, leftContX - plotX);
                        rightContAngle = Math.atan2(rightContY - plotY, rightContX - plotX);
                        jointAngle = (Math.PI / 2) + ((leftContAngle + rightContAngle) / 2);


                        // Ensure the right direction, jointAngle should be in the same quadrant as leftContAngle
                        if (Math.abs(leftContAngle - jointAngle) > Math.PI / 2) {
                            jointAngle -= Math.PI;
                        }

                        // Find the corrected control points for a spline straight through the point
                        leftContX = plotX + Math.cos(jointAngle) * distanceLeftControlPoint;
                        leftContY = plotY + Math.sin(jointAngle) * distanceLeftControlPoint;
                        rightContX = plotX + Math.cos(Math.PI + jointAngle) * distanceRightControlPoint;
                        rightContY = plotY + Math.sin(Math.PI + jointAngle) * distanceRightControlPoint;

                        // Record for drawing in next point
                        point.rightContX = rightContX;
                        point.rightContY = rightContY;

                    }


                    // moveTo or lineTo
                    if (!i) {
                        ret = ['M', plotX, plotY];
                    } else { // curve from last point to this
                        ret = [
                            'C',
                            lastPoint.rightContX || lastPoint.plotX,
                            lastPoint.rightContY || lastPoint.plotY,
                            leftContX || plotX,
                            leftContY || plotY,
                            plotX,
                            plotY
                        ];
                        lastPoint.rightContX = lastPoint.rightContY = null; // reset for updating series later
                    }


                } else {
                    ret = proceed.call(this, segment, point, i);
                }
                return ret;
            });
        }

        /**
         * Extend translate. The plotX and plotY values are computed as if the polar chart were a
         * cartesian plane, where plotX denotes the angle in radians and (yAxis.len - plotY) is the pixel distance from
         * center.
         */
        wrap(seriesProto, 'translate', function(proceed) {
            var chart = this.chart,
                points,
                i;

            // Run uber method
            proceed.call(this);

            // Postprocess plot coordinates
            if (chart.polar) {
                this.kdByAngle = chart.tooltip && chart.tooltip.shared;

                if (!this.preventPostTranslate) {
                    points = this.points;
                    i = points.length;

                    while (i--) {
                        // Translate plotX, plotY from angle and radius to true plot coordinates
                        this.toXY(points[i]);
                    }
                }
            }
        });

        /**
         * Extend getSegmentPath to allow connecting ends across 0 to provide a closed circle in
         * line-like series.
         */
        wrap(seriesProto, 'getGraphPath', function(proceed, points) {
            var series = this,
                i,
                firstValid;

            // Connect the path
            if (this.chart.polar) {
                points = points || this.points;

                // Append first valid point in order to connect the ends
                for (i = 0; i < points.length; i++) {
                    if (!points[i].isNull) {
                        firstValid = i;
                        break;
                    }
                }
                if (this.options.connectEnds !== false && firstValid !== undefined) {
                    this.connectEnds = true; // re-used in splines
                    points.splice(points.length, 0, points[firstValid]);
                }

                // For area charts, pseudo points are added to the graph, now we need to translate these
                each(points, function(point) {
                    if (point.polarPlotY === undefined) {
                        series.toXY(point);
                    }
                });
            }

            // Run uber method
            return proceed.apply(this, [].slice.call(arguments, 1));

        });


        function polarAnimate(proceed, init) {
            var chart = this.chart,
                animation = this.options.animation,
                group = this.group,
                markerGroup = this.markerGroup,
                center = this.xAxis.center,
                plotLeft = chart.plotLeft,
                plotTop = chart.plotTop,
                attribs;

            // Specific animation for polar charts
            if (chart.polar) {

                // Enable animation on polar charts only in SVG. In VML, the scaling is different, plus animation
                // would be so slow it would't matter.
                if (chart.renderer.isSVG) {

                    if (animation === true) {
                        animation = {};
                    }

                    // Initialize the animation
                    if (init) {

                        // Scale down the group and place it in the center
                        attribs = {
                            translateX: center[0] + plotLeft,
                            translateY: center[1] + plotTop,
                            scaleX: 0.001, // #1499
                            scaleY: 0.001
                        };

                        group.attr(attribs);
                        if (markerGroup) {
                            //markerGroup.attrSetters = group.attrSetters;
                            markerGroup.attr(attribs);
                        }

                        // Run the animation
                    } else {
                        attribs = {
                            translateX: plotLeft,
                            translateY: plotTop,
                            scaleX: 1,
                            scaleY: 1
                        };
                        group.animate(attribs, animation);
                        if (markerGroup) {
                            markerGroup.animate(attribs, animation);
                        }

                        // Delete this function to allow it only once
                        this.animate = null;
                    }
                }

                // For non-polar charts, revert to the basic animation
            } else {
                proceed.call(this, init);
            }
        }

        // Define the animate method for regular series
        wrap(seriesProto, 'animate', polarAnimate);


        if (seriesTypes.column) {

            colProto = seriesTypes.column.prototype;

            colProto.polarArc = function(low, high, start, end) {
                var center = this.xAxis.center,
                    len = this.yAxis.len;

                return this.chart.renderer.symbols.arc(
                    center[0],
                    center[1],
                    len - high,
                    null, {
                        start: start,
                        end: end,
                        innerR: len - pick(low, len)
                    }
                );
            };

            /**
             * Define the animate method for columnseries
             */
            wrap(colProto, 'animate', polarAnimate);


            /**
             * Extend the column prototype's translate method
             */
            wrap(colProto, 'translate', function(proceed) {

                var xAxis = this.xAxis,
                    startAngleRad = xAxis.startAngleRad,
                    start,
                    points,
                    point,
                    i;

                this.preventPostTranslate = true;

                // Run uber method
                proceed.call(this);

                // Postprocess plot coordinates
                if (xAxis.isRadial) {
                    points = this.points;
                    i = points.length;
                    while (i--) {
                        point = points[i];
                        start = point.barX + startAngleRad;
                        point.shapeType = 'path';
                        point.shapeArgs = {
                            d: this.polarArc(point.yBottom, point.plotY, start, start + point.pointWidth)
                        };
                        // Provide correct plotX, plotY for tooltip
                        this.toXY(point);
                        point.tooltipPos = [point.plotX, point.plotY];
                        point.ttBelow = point.plotY > xAxis.center[1];
                    }
                }
            });


            /**
             * Align column data labels outside the columns. #1199.
             */
            wrap(colProto, 'alignDataLabel', function(proceed, point, dataLabel, options, alignTo, isNew) {

                if (this.chart.polar) {
                    var angle = point.rectPlotX / Math.PI * 180,
                        align,
                        verticalAlign;

                    // Align nicely outside the perimeter of the columns
                    if (options.align === null) {
                        if (angle > 20 && angle < 160) {
                            align = 'left'; // right hemisphere
                        } else if (angle > 200 && angle < 340) {
                            align = 'right'; // left hemisphere
                        } else {
                            align = 'center'; // top or bottom
                        }
                        options.align = align;
                    }
                    if (options.verticalAlign === null) {
                        if (angle < 45 || angle > 315) {
                            verticalAlign = 'bottom'; // top part
                        } else if (angle > 135 && angle < 225) {
                            verticalAlign = 'top'; // bottom part
                        } else {
                            verticalAlign = 'middle'; // left or right
                        }
                        options.verticalAlign = verticalAlign;
                    }

                    seriesProto.alignDataLabel.call(this, point, dataLabel, options, alignTo, isNew);
                } else {
                    proceed.call(this, point, dataLabel, options, alignTo, isNew);
                }

            });
        }

        /**
         * Extend getCoordinates to prepare for polar axis values
         */
        wrap(pointerProto, 'getCoordinates', function(proceed, e) {
            var chart = this.chart,
                ret = {
                    xAxis: [],
                    yAxis: []
                };

            if (chart.polar) {

                each(chart.axes, function(axis) {
                    var isXAxis = axis.isXAxis,
                        center = axis.center,
                        x = e.chartX - center[0] - chart.plotLeft,
                        y = e.chartY - center[1] - chart.plotTop;

                    ret[isXAxis ? 'xAxis' : 'yAxis'].push({
                        axis: axis,
                        value: axis.translate(
                            isXAxis ?
                            Math.PI - Math.atan2(x, y) : // angle
                            Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)), // distance from center
                            true
                        )
                    });
                });

            } else {
                ret = proceed.call(this, e);
            }

            return ret;
        });

    }(Highcharts));
}));
