/**
 * @license Highcharts JS v5.0.7 (2017-01-17)
 *
 * (c) 2009-2016 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */
'use strict';
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = root.document ?
            factory(root) :
            factory;
    } else {
        root.Highcharts = factory(root);
    }
}(typeof window !== 'undefined' ? window : this, function(win) {
    var Highcharts = (function() {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        /* global window */
        var win = window,
            doc = win.document;

        var SVG_NS = 'http://www.w3.org/2000/svg',
            userAgent = (win.navigator && win.navigator.userAgent) || '',
            svg = doc && doc.createElementNS && !!doc.createElementNS(SVG_NS, 'svg').createSVGRect,
            isMS = /(edge|msie|trident)/i.test(userAgent) && !window.opera,
            vml = !svg,
            isFirefox = /Firefox/.test(userAgent),
            hasBidiBug = isFirefox && parseInt(userAgent.split('Firefox/')[1], 10) < 4; // issue #38

        var Highcharts = win.Highcharts ? win.Highcharts.error(16, true) : {
            product: 'Highcharts',
            version: '5.0.7',
            deg2rad: Math.PI * 2 / 360,
            doc: doc,
            hasBidiBug: hasBidiBug,
            hasTouch: doc && doc.documentElement.ontouchstart !== undefined,
            isMS: isMS,
            isWebKit: /AppleWebKit/.test(userAgent),
            isFirefox: isFirefox,
            isTouchDevice: /(Mobile|Android|Windows Phone)/.test(userAgent),
            SVG_NS: SVG_NS,
            chartCount: 0,
            seriesTypes: {},
            symbolSizes: {},
            svg: svg,
            vml: vml,
            win: win,
            charts: [],
            marginNames: ['plotTop', 'marginRight', 'marginBottom', 'plotLeft'],
            noop: function() {
                return undefined;
            }
        };
        return Highcharts;
    }());
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        /* eslint max-len: ["warn", 80, 4] */
        'use strict';

        /**
         * The Highcharts object is the placeholder for all other members, and various
         * utility functions.
         * @namespace Highcharts
         */

        var timers = [];

        var charts = H.charts,
            doc = H.doc,
            win = H.win;

        /**
         * Provide error messages for debugging, with links to online explanation. This
         * function can be overridden to provide custom error handling.
         *
         * @function #error
         * @memberOf Highcharts
         * @param {Number|String} code - The error code. See [errors.xml]{@link 
         *     https://github.com/highcharts/highcharts/blob/master/errors/errors.xml}
         *     for available codes. If it is a string, the error message is printed
         *     directly in the console.
         * @param {Boolean} [stop=false] - Whether to throw an error or just log a 
         *     warning in the console.
         */
        H.error = function(code, stop) {
            var msg = H.isNumber(code) ?
                'Highcharts error #' + code + ': www.highcharts.com/errors/' + code :
                code;
            if (stop) {
                throw new Error(msg);
            }
            // else ...
            if (win.console) {
                console.log(msg); // eslint-disable-line no-console
            }
        };

        /**
         * An animator object. One instance applies to one property (attribute or style
         * prop) on one element.
         *
         * @constructor Fx
         * @memberOf Highcharts
         * @param {HTMLDOMElement|SVGElement} elem - The element to animate.
         * @param {AnimationOptions} options - Animation options.
         * @param {string} prop - The single attribute or CSS property to animate.
         */
        H.Fx = function(elem, options, prop) {
            this.options = options;
            this.elem = elem;
            this.prop = prop;
        };
        H.Fx.prototype = {

            /**
             * Set the current step of a path definition on SVGElement.
             *
             * @function #dSetter
             * @memberOf Highcharts.Fx
             */
            dSetter: function() {
                var start = this.paths[0],
                    end = this.paths[1],
                    ret = [],
                    now = this.now,
                    i = start.length,
                    startVal;

                // Land on the final path without adjustment points appended in the ends
                if (now === 1) {
                    ret = this.toD;

                } else if (i === end.length && now < 1) {
                    while (i--) {
                        startVal = parseFloat(start[i]);
                        ret[i] =
                            isNaN(startVal) ? // a letter instruction like M or L
                            start[i] :
                            now * (parseFloat(end[i] - startVal)) + startVal;

                    }
                    // If animation is finished or length not matching, land on right value
                } else {
                    ret = end;
                }
                this.elem.attr('d', ret, null, true);
            },

            /**
             * Update the element with the current animation step.
             *
             * @function #update
             * @memberOf Highcharts.Fx
             */
            update: function() {
                var elem = this.elem,
                    prop = this.prop, // if destroyed, it is null
                    now = this.now,
                    step = this.options.step;

                // Animation setter defined from outside
                if (this[prop + 'Setter']) {
                    this[prop + 'Setter']();

                    // Other animations on SVGElement
                } else if (elem.attr) {
                    if (elem.element) {
                        elem.attr(prop, now, null, true);
                    }

                    // HTML styles, raw HTML content like container size
                } else {
                    elem.style[prop] = now + this.unit;
                }

                if (step) {
                    step.call(elem, now, this);
                }

            },

            /**
             * Run an animation.
             *
             * @function #run
             * @memberOf Highcharts.Fx
             * @param {Number} from - The current value, value to start from.
             * @param {Number} to - The end value, value to land on.
             * @param {String} [unit] - The property unit, for example `px`.
             * @returns {void}
             */
            run: function(from, to, unit) {
                var self = this,
                    timer = function(gotoEnd) {
                        return timer.stopped ? false : self.step(gotoEnd);
                    },
                    i;

                this.startTime = +new Date();
                this.start = from;
                this.end = to;
                this.unit = unit;
                this.now = this.start;
                this.pos = 0;

                timer.elem = this.elem;
                timer.prop = this.prop;

                if (timer() && timers.push(timer) === 1) {
                    timer.timerId = setInterval(function() {

                        for (i = 0; i < timers.length; i++) {
                            if (!timers[i]()) {
                                timers.splice(i--, 1);
                            }
                        }

                        if (!timers.length) {
                            clearInterval(timer.timerId);
                        }
                    }, 13);
                }
            },

            /**
             * Run a single step in the animation.
             *
             * @function #step
             * @memberOf Highcharts.Fx
             * @param   {Boolean} [gotoEnd] - Whether to go to the endpoint of the
             *     animation after abort.
             * @returns {Boolean} Returns `true` if animation continues.
             */
            step: function(gotoEnd) {
                var t = +new Date(),
                    ret,
                    done,
                    options = this.options,
                    elem = this.elem,
                    complete = options.complete,
                    duration = options.duration,
                    curAnim = options.curAnim,
                    i;

                if (elem.attr && !elem.element) { // #2616, element is destroyed
                    ret = false;

                } else if (gotoEnd || t >= duration + this.startTime) {
                    this.now = this.end;
                    this.pos = 1;
                    this.update();

                    curAnim[this.prop] = true;

                    done = true;
                    for (i in curAnim) {
                        if (curAnim[i] !== true) {
                            done = false;
                        }
                    }

                    if (done && complete) {
                        complete.call(elem);
                    }
                    ret = false;

                } else {
                    this.pos = options.easing((t - this.startTime) / duration);
                    this.now = this.start + ((this.end - this.start) * this.pos);
                    this.update();
                    ret = true;
                }
                return ret;
            },

            /**
             * Prepare start and end values so that the path can be animated one to one.
             *
             * @function #initPath
             * @memberOf Highcharts.Fx
             * @param {SVGElement} elem - The SVGElement item.
             * @param {String} fromD - Starting path definition.
             * @param {Array} toD - Ending path definition.
             * @returns {Array} An array containing start and end paths in array form
             * so that they can be animated in parallel.
             */
            initPath: function(elem, fromD, toD) {
                fromD = fromD || '';
                var shift,
                    startX = elem.startX,
                    endX = elem.endX,
                    bezier = fromD.indexOf('C') > -1,
                    numParams = bezier ? 7 : 3,
                    fullLength,
                    slice,
                    i,
                    start = fromD.split(' '),
                    end = toD.slice(), // copy
                    isArea = elem.isArea,
                    positionFactor = isArea ? 2 : 1,
                    reverse;

                /**
                 * In splines make moveTo and lineTo points have six parameters like
                 * bezier curves, to allow animation one-to-one.
                 */
                function sixify(arr) {
                    var isOperator,
                        nextIsOperator;
                    i = arr.length;
                    while (i--) {

                        // Fill in dummy coordinates only if the next operator comes
                        // three places behind (#5788)
                        isOperator = arr[i] === 'M' || arr[i] === 'L';
                        nextIsOperator = /[a-zA-Z]/.test(arr[i + 3]);
                        if (isOperator && nextIsOperator) {
                            arr.splice(
                                i + 1, 0,
                                arr[i + 1], arr[i + 2],
                                arr[i + 1], arr[i + 2]
                            );
                        }
                    }
                }

                /**
                 * Insert an array at the given position of another array
                 */
                function insertSlice(arr, subArr, index) {
                    [].splice.apply(
                        arr, [index, 0].concat(subArr)
                    );
                }

                /**
                 * If shifting points, prepend a dummy point to the end path. 
                 */
                function prepend(arr, other) {
                    while (arr.length < fullLength) {

                        // Move to, line to or curve to?
                        arr[0] = other[fullLength - arr.length];

                        // Prepend a copy of the first point
                        insertSlice(arr, arr.slice(0, numParams), 0);

                        // For areas, the bottom path goes back again to the left, so we
                        // need to append a copy of the last point.
                        if (isArea) {
                            insertSlice(
                                arr,
                                arr.slice(arr.length - numParams), arr.length
                            );
                            i--;
                        }
                    }
                    arr[0] = 'M';
                }

                /**
                 * Copy and append last point until the length matches the end length
                 */
                function append(arr, other) {
                    var i = (fullLength - arr.length) / numParams;
                    while (i > 0 && i--) {

                        // Pull out the slice that is going to be appended or inserted.
                        // In a line graph, the positionFactor is 1, and the last point
                        // is sliced out. In an area graph, the positionFactor is 2,
                        // causing the middle two points to be sliced out, since an area
                        // path starts at left, follows the upper path then turns and
                        // follows the bottom back. 
                        slice = arr.slice().splice(
                            (arr.length / positionFactor) - numParams,
                            numParams * positionFactor
                        );

                        // Move to, line to or curve to?
                        slice[0] = other[fullLength - numParams - (i * numParams)];

                        // Disable first control point
                        if (bezier) {
                            slice[numParams - 6] = slice[numParams - 2];
                            slice[numParams - 5] = slice[numParams - 1];
                        }

                        // Now insert the slice, either in the middle (for areas) or at
                        // the end (for lines)
                        insertSlice(arr, slice, arr.length / positionFactor);

                        if (isArea) {
                            i--;
                        }
                    }
                }

                if (bezier) {
                    sixify(start);
                    sixify(end);
                }

                // For sideways animation, find out how much we need to shift to get the
                // start path Xs to match the end path Xs.
                if (startX && endX) {
                    for (i = 0; i < startX.length; i++) {
                        // Moving left, new points coming in on right
                        if (startX[i] === endX[0]) {
                            shift = i;
                            break;
                            // Moving right
                        } else if (startX[0] ===
                            endX[endX.length - startX.length + i]) {
                            shift = i;
                            reverse = true;
                            break;
                        }
                    }
                    if (shift === undefined) {
                        start = [];
                    }
                }

                if (start.length && H.isNumber(shift)) {

                    // The common target length for the start and end array, where both 
                    // arrays are padded in opposite ends
                    fullLength = end.length + shift * positionFactor * numParams;

                    if (!reverse) {
                        prepend(end, start);
                        append(start, end);
                    } else {
                        prepend(start, end);
                        append(end, start);
                    }
                }

                return [start, end];
            }
        }; // End of Fx prototype


        /**
         * Utility function to extend an object with the members of another.
         *
         * @function #extend
         * @memberOf Highcharts
         * @param {Object} a - The object to be extended.
         * @param {Object} b - The object to add to the first one.
         * @returns {Object} Object a, the original object.
         */
        H.extend = function(a, b) {
            var n;
            if (!a) {
                a = {};
            }
            for (n in b) {
                a[n] = b[n];
            }
            return a;
        };

        /**
         * Utility function to deep merge two or more objects and return a third object.
         * If the first argument is true, the contents of the second object is copied
         * into the first object. The merge function can also be used with a single 
         * object argument to create a deep copy of an object.
         *
         * @function #merge
         * @memberOf Highcharts
         * @param {Boolean} [extend] - Whether to extend the left-side object (a) or
                  return a whole new object.
         * @param {Object} a - The first object to extend. When only this is given, the
                  function returns a deep copy.
         * @param {...Object} [n] - An object to merge into the previous one.
         * @returns {Object} - The merged object. If the first argument is true, the 
         * return is the same as the second argument.
         */
        H.merge = function() {
            var i,
                args = arguments,
                len,
                ret = {},
                doCopy = function(copy, original) {
                    var value, key;

                    // An object is replacing a primitive
                    if (typeof copy !== 'object') {
                        copy = {};
                    }

                    for (key in original) {
                        if (original.hasOwnProperty(key)) {
                            value = original[key];

                            // Copy the contents of objects, but not arrays or DOM nodes
                            if (H.isObject(value, true) &&
                                key !== 'renderTo' &&
                                typeof value.nodeType !== 'number') {
                                copy[key] = doCopy(copy[key] || {}, value);

                                // Primitives and arrays are copied over directly
                            } else {
                                copy[key] = original[key];
                            }
                        }
                    }
                    return copy;
                };

            // If first argument is true, copy into the existing object. Used in
            // setOptions.
            if (args[0] === true) {
                ret = args[1];
                args = Array.prototype.slice.call(args, 2);
            }

            // For each argument, extend the return
            len = args.length;
            for (i = 0; i < len; i++) {
                ret = doCopy(ret, args[i]);
            }

            return ret;
        };

        /**
         * Shortcut for parseInt
         * @ignore
         * @param {Object} s
         * @param {Number} mag Magnitude
         */
        H.pInt = function(s, mag) {
            return parseInt(s, mag || 10);
        };

        /**
         * Utility function to check for string type.
         *
         * @function #isString
         * @memberOf Highcharts
         * @param {Object} s - The item to check.
         * @returns {Boolean} - True if the argument is a string.
         */
        H.isString = function(s) {
            return typeof s === 'string';
        };

        /**
         * Utility function to check if an item is an array.
         *
         * @function #isArray
         * @memberOf Highcharts
         * @param {Object} obj - The item to check.
         * @returns {Boolean} - True if the argument is an array.
         */
        H.isArray = function(obj) {
            var str = Object.prototype.toString.call(obj);
            return str === '[object Array]' || str === '[object Array Iterator]';
        };

        /**
         * Utility function to check if an item is of type object.
         *
         * @function #isObject
         * @memberOf Highcharts
         * @param {Object} obj - The item to check.
         * @param {Boolean} [strict=false] - Also checks that the object is not an
         *    array.
         * @returns {Boolean} - True if the argument is an object.
         */
        H.isObject = function(obj, strict) {
            return obj && typeof obj === 'object' && (!strict || !H.isArray(obj));
        };

        /**
         * Utility function to check if an item is of type number.
         *
         * @function #isNumber
         * @memberOf Highcharts
         * @param {Object} n - The item to check.
         * @returns {Boolean} - True if the item is a number and is not NaN.
         */
        H.isNumber = function(n) {
            return typeof n === 'number' && !isNaN(n);
        };

        /**
         * Remove the last occurence of an item from an array.
         *
         * @function #erase
         * @memberOf Highcharts
         * @param {Array} arr - The array.
         * @param {*} item - The item to remove.
         */
        H.erase = function(arr, item) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === item) {
                    arr.splice(i, 1);
                    break;
                }
            }
        };

        /**
         * Check if an object is null or undefined.
         *
         * @function #defined
         * @memberOf Highcharts
         * @param {Object} obj - The object to check.
         * @returns {Boolean} - False if the object is null or undefined, otherwise
         *        true.
         */
        H.defined = function(obj) {
            return obj !== undefined && obj !== null;
        };

        /**
         * Set or get an attribute or an object of attributes. To use as a setter, pass
         * a key and a value, or let the second argument be a collection of keys and
         * values. To use as a getter, pass only a string as the second argument.
         *
         * @function #attr
         * @memberOf Highcharts
         * @param {Object} elem - The DOM element to receive the attribute(s).
         * @param {String|Object} [prop] - The property or an object of key-value pairs.
         * @param {String} [value] - The value if a single property is set.
         * @returns {*} When used as a getter, return the value.
         */
        H.attr = function(elem, prop, value) {
            var key,
                ret;

            // if the prop is a string
            if (H.isString(prop)) {
                // set the value
                if (H.defined(value)) {
                    elem.setAttribute(prop, value);

                    // get the value
                } else if (elem && elem.getAttribute) {
                    ret = elem.getAttribute(prop);
                }

                // else if prop is defined, it is a hash of key/value pairs
            } else if (H.defined(prop) && H.isObject(prop)) {
                for (key in prop) {
                    elem.setAttribute(key, prop[key]);
                }
            }
            return ret;
        };

        /**
         * Check if an element is an array, and if not, make it into an array.
         *
         * @function #splat
         * @memberOf Highcharts
         * @param obj {*} - The object to splat.
         * @returns {Array} The produced or original array.
         */
        H.splat = function(obj) {
            return H.isArray(obj) ? obj : [obj];
        };

        /**
         * Set a timeout if the delay is given, otherwise perform the function
         * synchronously.
         *
         * @function #syncTimeout
         * @memberOf Highcharts
         * @param   {Function} fn - The function callback.
         * @param   {Number}   delay - Delay in milliseconds.
         * @param   {Object}   [context] - The context.
         * @returns {Number} An identifier for the timeout that can later be cleared
         * with clearTimeout.
         */
        H.syncTimeout = function(fn, delay, context) {
            if (delay) {
                return setTimeout(fn, delay, context);
            }
            fn.call(0, context);
        };


        /**
         * Return the first value that is not null or undefined.
         *
         * @function #pick
         * @memberOf Highcharts
         * @param {...*} items - Variable number of arguments to inspect.
         * @returns {*} The value of the first argument that is not null or undefined.
         */
        H.pick = function() {
            var args = arguments,
                i,
                arg,
                length = args.length;
            for (i = 0; i < length; i++) {
                arg = args[i];
                if (arg !== undefined && arg !== null) {
                    return arg;
                }
            }
        };

        /**
         * @typedef {Object} CSSObject - A style object with camel case property names.
         * The properties can be whatever styles are supported on the given SVG or HTML
         * element.
         * @example
         * {
         *    fontFamily: 'monospace',
         *    fontSize: '1.2em'
         * }
         */
        /**
         * Set CSS on a given element.
         *
         * @function #css
         * @memberOf Highcharts
         * @param {HTMLDOMElement} el - A HTML DOM element.
         * @param {CSSObject} styles - Style object with camel case property names.
         * @returns {void}
         */
        H.css = function(el, styles) {
            if (H.isMS && !H.svg) { // #2686
                if (styles && styles.opacity !== undefined) {
                    styles.filter = 'alpha(opacity=' + (styles.opacity * 100) + ')';
                }
            }
            H.extend(el.style, styles);
        };

        /**
         * A HTML DOM element.
         * @typedef {Object} HTMLDOMElement
         */

        /**
         * Utility function to create an HTML element with attributes and styles.
         *
         * @function #createElement
         * @memberOf Highcharts
         * @param {String} tag - The HTML tag.
         * @param {Object} [attribs] - Attributes as an object of key-value pairs.
         * @param {CSSObject} [styles] - Styles as an object of key-value pairs.
         * @param {Object} [parent] - The parent HTML object.
         * @param {Boolean} [nopad=false] - If true, remove all padding, border and
         *    margin.
         * @returns {HTMLDOMElement} The created DOM element.
         */
        H.createElement = function(tag, attribs, styles, parent, nopad) {
            var el = doc.createElement(tag),
                css = H.css;
            if (attribs) {
                H.extend(el, attribs);
            }
            if (nopad) {
                css(el, {
                    padding: 0,
                    border: 'none',
                    margin: 0
                });
            }
            if (styles) {
                css(el, styles);
            }
            if (parent) {
                parent.appendChild(el);
            }
            return el;
        };

        /**
         * Extend a prototyped class by new members.
         *
         * @function #extendClass
         * @memberOf Highcharts
         * @param {Object} parent - The parent prototype to inherit.
         * @param {Object} members - A collection of prototype members to add or
         *        override compared to the parent prototype.
         * @returns {Object} A new prototype.
         */
        H.extendClass = function(parent, members) {
            var object = function() {};
            object.prototype = new parent(); // eslint-disable-line new-cap
            H.extend(object.prototype, members);
            return object;
        };

        /**
         * Left-pad a string to a given length by adding a character repetetively.
         *
         * @function #pad
         * @memberOf Highcharts
         * @param {Number} number - The input string or number.
         * @param {Number} length - The desired string length.
         * @param {String} [padder=0] - The character to pad with.
         * @returns {String} The padded string.
         */
        H.pad = function(number, length, padder) {
            return new Array((length || 2) + 1 -
                String(number).length).join(padder || 0) + number;
        };

        /**
         * @typedef {Number|String} RelativeSize - If a number is given, it defines the
         *    pixel length. If a percentage string is given, like for example `'50%'`,
         *    the setting defines a length relative to a base size, for example the size
         *    of a container.
         */
        /**
         * Return a length based on either the integer value, or a percentage of a base.
         *
         * @function #relativeLength
         * @memberOf Highcharts
         * @param {RelativeSize} value - A percentage string or a number.
         * @param {Number} base - The full length that represents 100%.
         * @returns {Number} The computed length.
         */
        H.relativeLength = function(value, base) {
            return (/%$/).test(value) ?
                base * parseFloat(value) / 100 :
                parseFloat(value);
        };

        /**
         * Wrap a method with extended functionality, preserving the original function.
         *
         * @function #wrap
         * @memberOf Highcharts
         * @param {Object} obj - The context object that the method belongs to. In real
         *        cases, this is often a prototype.
         * @param {String} method - The name of the method to extend.
         * @param {Function} func - A wrapper function callback. This function is called
         *        with the same arguments as the original function, except that the
         *        original function is unshifted and passed as the first argument.
         * @returns {void}
         */
        H.wrap = function(obj, method, func) {
            var proceed = obj[method];
            obj[method] = function() {
                var args = Array.prototype.slice.call(arguments),
                    outerArgs = arguments,
                    ctx = this,
                    ret;
                ctx.proceed = function() {
                    proceed.apply(ctx, arguments.length ? arguments : outerArgs);
                };
                args.unshift(proceed);
                ret = func.apply(this, args);
                ctx.proceed = null;
                return ret;
            };
        };

        /**
         * Get the time zone offset based on the current timezone information as set in
         * the global options.
         *
         * @function #getTZOffset
         * @memberOf Highcharts
         * @param  {Number} timestamp - The JavaScript timestamp to inspect.
         * @return {Number} - The timezone offset in minutes compared to UTC.
         */
        H.getTZOffset = function(timestamp) {
            var d = H.Date;
            return ((d.hcGetTimezoneOffset && d.hcGetTimezoneOffset(timestamp)) ||
                d.hcTimezoneOffset || 0) * 60000;
        };

        /**
         * Format a date, based on the syntax for PHP's [strftime]{@link
         * http://www.php.net/manual/en/function.strftime.php} function.
         *
         * @function #dateFormat
         * @memberOf Highcharts
         * @param {String} format - The desired format where various time
         *        representations are prefixed with %.
         * @param {Number} timestamp - The JavaScript timestamp.
         * @param {Boolean} [capitalize=false] - Upper case first letter in the return.
         * @returns {String} The formatted date.
         */
        H.dateFormat = function(format, timestamp, capitalize) {
            if (!H.defined(timestamp) || isNaN(timestamp)) {
                return H.defaultOptions.lang.invalidDate || '';
            }
            format = H.pick(format, '%Y-%m-%d %H:%M:%S');

            var D = H.Date,
                date = new D(timestamp - H.getTZOffset(timestamp)),
                key, // used in for constuct below
                // get the basic time values
                hours = date[D.hcGetHours](),
                day = date[D.hcGetDay](),
                dayOfMonth = date[D.hcGetDate](),
                month = date[D.hcGetMonth](),
                fullYear = date[D.hcGetFullYear](),
                lang = H.defaultOptions.lang,
                langWeekdays = lang.weekdays,
                shortWeekdays = lang.shortWeekdays,
                pad = H.pad,

                // List all format keys. Custom formats can be added from the outside. 
                replacements = H.extend({

                    //-- Day
                    // Short weekday, like 'Mon'
                    'a': shortWeekdays ?
                        shortWeekdays[day] : langWeekdays[day].substr(0, 3),
                    // Long weekday, like 'Monday'
                    'A': langWeekdays[day],
                    // Two digit day of the month, 01 to 31
                    'd': pad(dayOfMonth),
                    // Day of the month, 1 through 31
                    'e': pad(dayOfMonth, 2, ' '),
                    'w': day,

                    // Week (none implemented)
                    //'W': weekNumber(),

                    //-- Month
                    // Short month, like 'Jan'
                    'b': lang.shortMonths[month],
                    // Long month, like 'January'
                    'B': lang.months[month],
                    // Two digit month number, 01 through 12
                    'm': pad(month + 1),

                    //-- Year
                    // Two digits year, like 09 for 2009
                    'y': fullYear.toString().substr(2, 2),
                    // Four digits year, like 2009
                    'Y': fullYear,

                    //-- Time
                    // Two digits hours in 24h format, 00 through 23
                    'H': pad(hours),
                    // Hours in 24h format, 0 through 23
                    'k': hours,
                    // Two digits hours in 12h format, 00 through 11
                    'I': pad((hours % 12) || 12),
                    // Hours in 12h format, 1 through 12
                    'l': (hours % 12) || 12,
                    // Two digits minutes, 00 through 59
                    'M': pad(date[D.hcGetMinutes]()),
                    // Upper case AM or PM
                    'p': hours < 12 ? 'AM' : 'PM',
                    // Lower case AM or PM
                    'P': hours < 12 ? 'am' : 'pm',
                    // Two digits seconds, 00 through  59
                    'S': pad(date.getSeconds()),
                    // Milliseconds (naming from Ruby)
                    'L': pad(Math.round(timestamp % 1000), 3)
                }, H.dateFormats);


            // Do the replaces
            for (key in replacements) {
                // Regex would do it in one line, but this is faster
                while (format.indexOf('%' + key) !== -1) {
                    format = format.replace(
                        '%' + key,
                        typeof replacements[key] === 'function' ?
                        replacements[key](timestamp) :
                        replacements[key]
                    );
                }
            }

            // Optionally capitalize the string and return
            return capitalize ?
                format.substr(0, 1).toUpperCase() + format.substr(1) :
                format;
        };

        /**
         * Format a single variable. Similar to sprintf, without the % prefix.
         *
         * @example
         * formatSingle('.2f', 5); // => '5.00'.
         *
         * @function #formatSingle
         * @memberOf Highcharts
         * @param {String} format The format string.
         * @param {*} val The value.
         * @returns {String} The formatted representation of the value.
         */
        H.formatSingle = function(format, val) {
            var floatRegex = /f$/,
                decRegex = /\.([0-9])/,
                lang = H.defaultOptions.lang,
                decimals;

            if (floatRegex.test(format)) { // float
                decimals = format.match(decRegex);
                decimals = decimals ? decimals[1] : -1;
                if (val !== null) {
                    val = H.numberFormat(
                        val,
                        decimals,
                        lang.decimalPoint,
                        format.indexOf(',') > -1 ? lang.thousandsSep : ''
                    );
                }
            } else {
                val = H.dateFormat(format, val);
            }
            return val;
        };

        /**
         * Format a string according to a subset of the rules of Python's String.format
         * method.
         *
         * @function #format
         * @memberOf Highcharts
         * @param {String} str The string to format.
         * @param {Object} ctx The context, a collection of key-value pairs where each
         *        key is replaced by its value.
         * @returns {String} The formatted string.
         *
         * @example
         * var s = Highcharts.format(
         *     'The {color} fox was {len:.2f} feet long',
         *     { color: 'red', len: Math.PI }
         * );
         * // => The red fox was 3.14 feet long
         */
        H.format = function(str, ctx) {
            var splitter = '{',
                isInside = false,
                segment,
                valueAndFormat,
                path,
                i,
                len,
                ret = [],
                val,
                index;

            while (str) {
                index = str.indexOf(splitter);
                if (index === -1) {
                    break;
                }

                segment = str.slice(0, index);
                if (isInside) { // we're on the closing bracket looking back

                    valueAndFormat = segment.split(':');
                    path = valueAndFormat.shift().split('.'); // get first and leave
                    len = path.length;
                    val = ctx;

                    // Assign deeper paths
                    for (i = 0; i < len; i++) {
                        val = val[path[i]];
                    }

                    // Format the replacement
                    if (valueAndFormat.length) {
                        val = H.formatSingle(valueAndFormat.join(':'), val);
                    }

                    // Push the result and advance the cursor
                    ret.push(val);

                } else {
                    ret.push(segment);

                }
                str = str.slice(index + 1); // the rest
                isInside = !isInside; // toggle
                splitter = isInside ? '}' : '{'; // now look for next matching bracket
            }
            ret.push(str);
            return ret.join('');
        };

        /**
         * Get the magnitude of a number.
         *
         * @function #getMagnitude
         * @memberOf Highcharts
         * @param {Number} number The number.
         * @returns {Number} The magnitude, where 1-9 are magnitude 1, 10-99 magnitude 2
         *        etc.
         */
        H.getMagnitude = function(num) {
            return Math.pow(10, Math.floor(Math.log(num) / Math.LN10));
        };

        /**
         * Take an interval and normalize it to multiples of round numbers.
         *
         * @todo  Move this function to the Axis prototype. It is here only for
         *        historical reasons.
         * @function #normalizeTickInterval
         * @memberOf Highcharts
         * @param {Number} interval - The raw, un-rounded interval.
         * @param {Array} [multiples] - Allowed multiples.
         * @param {Number} [magnitude] - The magnitude of the number.
         * @param {Boolean} [allowDecimals] - Whether to allow decimals.
         * @param {Boolean} [hasTickAmount] - If it has tickAmount, avoid landing
         *        on tick intervals lower than original.
         * @returns {Number} The normalized interval.
         */
        H.normalizeTickInterval = function(interval, multiples, magnitude,
            allowDecimals, hasTickAmount) {
            var normalized,
                i,
                retInterval = interval;

            // round to a tenfold of 1, 2, 2.5 or 5
            magnitude = H.pick(magnitude, 1);
            normalized = interval / magnitude;

            // multiples for a linear scale
            if (!multiples) {
                multiples = hasTickAmount ?
                    // Finer grained ticks when the tick amount is hard set, including
                    // when alignTicks is true on multiple axes (#4580).
                    [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] :

                    // Else, let ticks fall on rounder numbers
                    [1, 2, 2.5, 5, 10];


                // the allowDecimals option
                if (allowDecimals === false) {
                    if (magnitude === 1) {
                        multiples = H.grep(multiples, function(num) {
                            return num % 1 === 0;
                        });
                    } else if (magnitude <= 0.1) {
                        multiples = [1 / magnitude];
                    }
                }
            }

            // normalize the interval to the nearest multiple
            for (i = 0; i < multiples.length; i++) {
                retInterval = multiples[i];
                // only allow tick amounts smaller than natural
                if ((hasTickAmount && retInterval * magnitude >= interval) ||
                    (!hasTickAmount && (normalized <= (multiples[i] +
                        (multiples[i + 1] || multiples[i])) / 2))) {
                    break;
                }
            }

            // Multiply back to the correct magnitude. Correct floats to appropriate 
            // precision (#6085).
            retInterval = H.correctFloat(
                retInterval * magnitude, -Math.round(Math.log(0.001) / Math.LN10)
            );

            return retInterval;
        };


        /**
         * Sort an object array and keep the order of equal items. The ECMAScript
         * standard does not specify the behaviour when items are equal.
         *
         * @function #stableSort
         * @memberOf Highcharts
         * @param {Array} arr - The array to sort.
         * @param {Function} sortFunction - The function to sort it with, like with 
         *        regular Array.prototype.sort.
         * @returns {void}
         */
        H.stableSort = function(arr, sortFunction) {
            var length = arr.length,
                sortValue,
                i;

            // Add index to each item
            for (i = 0; i < length; i++) {
                arr[i].safeI = i; // stable sort index
            }

            arr.sort(function(a, b) {
                sortValue = sortFunction(a, b);
                return sortValue === 0 ? a.safeI - b.safeI : sortValue;
            });

            // Remove index from items
            for (i = 0; i < length; i++) {
                delete arr[i].safeI; // stable sort index
            }
        };

        /**
         * Non-recursive method to find the lowest member of an array. `Math.min` raises
         * a maximum call stack size exceeded error in Chrome when trying to apply more
         * than 150.000 points. This method is slightly slower, but safe.
         *
         * @function #arrayMin
         * @memberOf  Highcharts
         * @param {Array} data An array of numbers.
         * @returns {Number} The lowest number.
         */
        H.arrayMin = function(data) {
            var i = data.length,
                min = data[0];

            while (i--) {
                if (data[i] < min) {
                    min = data[i];
                }
            }
            return min;
        };

        /**
         * Non-recursive method to find the lowest member of an array. `Math.max` raises
         * a maximum call stack size exceeded error in Chrome when trying to apply more
         * than 150.000 points. This method is slightly slower, but safe.
         *
         * @function #arrayMax
         * @memberOf  Highcharts
         * @param {Array} data - An array of numbers.
         * @returns {Number} The highest number.
         */
        H.arrayMax = function(data) {
            var i = data.length,
                max = data[0];

            while (i--) {
                if (data[i] > max) {
                    max = data[i];
                }
            }
            return max;
        };

        /**
         * Utility method that destroys any SVGElement instances that are properties on
         * the given object. It loops all properties and invokes destroy if there is a
         * destroy method. The property is then delete.
         *
         * @function #destroyObjectProperties
         * @memberOf Highcharts
         * @param {Object} obj - The object to destroy properties on.
         * @param {Object} [except] - Exception, do not destroy this property, only
         *    delete it.
         * @returns {void}
         */
        H.destroyObjectProperties = function(obj, except) {
            var n;
            for (n in obj) {
                // If the object is non-null and destroy is defined
                if (obj[n] && obj[n] !== except && obj[n].destroy) {
                    // Invoke the destroy
                    obj[n].destroy();
                }

                // Delete the property from the object.
                delete obj[n];
            }
        };


        /**
         * Discard a HTML element by moving it to the bin and delete.
         *
         * @function #discardElement
         * @memberOf Highcharts
         * @param {HTMLDOMElement} element - The HTML node to discard.
         * @returns {void}
         */
        H.discardElement = function(element) {
            var garbageBin = H.garbageBin;
            // create a garbage bin element, not part of the DOM
            if (!garbageBin) {
                garbageBin = H.createElement('div');
            }

            // move the node and empty bin
            if (element) {
                garbageBin.appendChild(element);
            }
            garbageBin.innerHTML = '';
        };

        /**
         * Fix JS round off float errors.
         *
         * @function #correctFloat
         * @memberOf Highcharts
         * @param {Number} num - A float number to fix.
         * @param {Number} [prec=14] - The precision.
         * @returns {Number} The corrected float number.
         */
        H.correctFloat = function(num, prec) {
            return parseFloat(
                num.toPrecision(prec || 14)
            );
        };

        /**
         * Set the global animation to either a given value, or fall back to the given
         * chart's animation option.
         *
         * @function #setAnimation
         * @memberOf Highcharts
         * @param {Boolean|Animation} animation - The animation object.
         * @param {Object} chart - The chart instance.
         * @returns {void}
         * @todo This function always relates to a chart, and sets a property on the
         *        renderer, so it should be moved to the SVGRenderer.
         */
        H.setAnimation = function(animation, chart) {
            chart.renderer.globalAnimation = H.pick(
                animation,
                chart.options.chart.animation,
                true
            );
        };

        /**
         * Get the animation in object form, where a disabled animation is always
         * returned as `{ duration: 0 }`.
         *
         * @function #animObject
         * @memberOf Highcharts
         * @param {Boolean|AnimationOptions} animation - An animation setting. Can be an
         *        object with duration, complete and easing properties, or a boolean to
         *        enable or disable.
         * @returns {AnimationOptions} An object with at least a duration property.
         */
        H.animObject = function(animation) {
            return H.isObject(animation) ?
                H.merge(animation) : {
                    duration: animation ? 500 : 0
                };
        };

        /**
         * The time unit lookup
         */
        H.timeUnits = {
            millisecond: 1,
            second: 1000,
            minute: 60000,
            hour: 3600000,
            day: 24 * 3600000,
            week: 7 * 24 * 3600000,
            month: 28 * 24 * 3600000,
            year: 364 * 24 * 3600000
        };

        /**
         * Format a number and return a string based on input settings.
         *
         * @function #numberFormat
         * @memberOf Highcharts
         * @param {Number} number - The input number to format.
         * @param {Number} decimals - The amount of decimals. A value of -1 preserves
         *        the amount in the input number.
         * @param {String} [decimalPoint] - The decimal point, defaults to the one given
         *        in the lang options.
         * @param {String} [thousandsSep] - The thousands separator, defaults to the one
         *        given in the lang options.
         * @returns {String} The formatted number.
         */
        H.numberFormat = function(number, decimals, decimalPoint, thousandsSep) {
            number = +number || 0;
            decimals = +decimals;

            var lang = H.defaultOptions.lang,
                origDec = (number.toString().split('.')[1] || '').length,
                strinteger,
                thousands,
                ret,
                roundedNumber;

            if (decimals === -1) {
                // Preserve decimals. Not huge numbers (#3793).
                decimals = Math.min(origDec, 20);
            } else if (!H.isNumber(decimals)) {
                decimals = 2;
            }

            // Add another decimal to avoid rounding errors of float numbers. (#4573)
            // Then use toFixed to handle rounding.
            roundedNumber = (
                Math.abs(number) + Math.pow(10, -Math.max(decimals, origDec) - 1)
            ).toFixed(decimals);

            // A string containing the positive integer component of the number
            strinteger = String(H.pInt(roundedNumber));

            // Leftover after grouping into thousands. Can be 0, 1 or 3.
            thousands = strinteger.length > 3 ? strinteger.length % 3 : 0;

            // Language
            decimalPoint = H.pick(decimalPoint, lang.decimalPoint);
            thousandsSep = H.pick(thousandsSep, lang.thousandsSep);

            // Start building the return
            ret = number < 0 ? '-' : '';

            // Add the leftover after grouping into thousands. For example, in the
            // number 42 000 000, this line adds 42.
            ret += thousands ? strinteger.substr(0, thousands) + thousandsSep : '';

            // Add the remaining thousands groups, joined by the thousands separator
            ret += strinteger
                .substr(thousands)
                .replace(/(\d{3})(?=\d)/g, '$1' + thousandsSep);

            // Add the decimal point and the decimal component
            if (decimals) {
                // Get the decimal component
                ret += decimalPoint + roundedNumber.slice(-decimals);
            }

            return ret;
        };

        /**
         * Easing definition
         * @ignore
         * @param   {Number} pos Current position, ranging from 0 to 1.
         */
        Math.easeInOutSine = function(pos) {
            return -0.5 * (Math.cos(Math.PI * pos) - 1);
        };

        /**
         * Get the computed CSS value for given element and property, only for numerical
         * properties. For width and height, the dimension of the inner box (excluding
         * padding) is returned. Used for fitting the chart within the container.
         *
         * @function #getStyle
         * @memberOf Highcharts
         * @param {HTMLDOMElement} el - A HTML element.
         * @param {String} prop - The property name.
         * @returns {Number} - The numeric value.
         */
        H.getStyle = function(el, prop) {

            var style;

            // For width and height, return the actual inner pixel size (#4913)
            if (prop === 'width') {
                return Math.min(el.offsetWidth, el.scrollWidth) -
                    H.getStyle(el, 'padding-left') -
                    H.getStyle(el, 'padding-right');
            } else if (prop === 'height') {
                return Math.min(el.offsetHeight, el.scrollHeight) -
                    H.getStyle(el, 'padding-top') -
                    H.getStyle(el, 'padding-bottom');
            }

            // Otherwise, get the computed style
            style = win.getComputedStyle(el, undefined);
            return style && H.pInt(style.getPropertyValue(prop));
        };

        /**
         * Search for an item in an array.
         *
         * @function #inArray
         * @memberOf Highcharts
         * @param {*} item - The item to search for.
         * @param {arr} arr - The array or node collection to search in.
         * @returns {Number} - The index within the array, or -1 if not found.
         */
        H.inArray = function(item, arr) {
            return arr.indexOf ? arr.indexOf(item) : [].indexOf.call(arr, item);
        };

        /**
         * Filter an array by a callback.
         *
         * @function #grep
         * @memberOf Highcharts
         * @param {Array} arr - The array to filter.
         * @param {Function} callback - The callback function. The function receives the
         *        item as the first argument. Return `true` if the item is to be
         *        preserved.
         * @returns {Array} - A new, filtered array.
         */
        H.grep = function(arr, callback) {
            return [].filter.call(arr, callback);
        };

        /**
         * Return the value of the first element in the array that satisfies the 
         * provided testing function.
         *
         * @function #find
         * @memberOf Highcharts
         * @param {Array} arr - The array to test.
         * @param {Function} callback - The callback function. The function receives the
         *        item as the first argument. Return `true` if this item satisfies the
         *        condition.
         * @returns {Mixed} - The value of the element.
         */
        H.find = function(arr, callback) {
            return [].find.call(arr, callback);
        };

        /**
         * Map an array by a callback.
         *
         * @function #map
         * @memberOf Highcharts
         * @param {Array} arr - The array to map.
         * @param {Function} fn - The callback function. Return the new value for the 
         *        new array.
         * @returns {Array} - A new array item with modified items.
         */
        H.map = function(arr, fn) {
            var results = [],
                i = 0,
                len = arr.length;

            for (; i < len; i++) {
                results[i] = fn.call(arr[i], arr[i], i, arr);
            }

            return results;
        };

        /**
         * Get the element's offset position, corrected for `overflow: auto`.
         *
         * @function #offset
         * @memberOf Highcharts
         * @param {HTMLDOMElement} el - The HTML element.
         * @returns {Object} An object containing `left` and `top` properties for the
         * position in the page.
         */
        H.offset = function(el) {
            var docElem = doc.documentElement,
                box = el.getBoundingClientRect();

            return {
                top: box.top + (win.pageYOffset || docElem.scrollTop) -
                    (docElem.clientTop || 0),
                left: box.left + (win.pageXOffset || docElem.scrollLeft) -
                    (docElem.clientLeft || 0)
            };
        };

        /**
         * Stop running animation.
         *
         * @todo A possible extension to this would be to stop a single property, when
         * we want to continue animating others. Then assign the prop to the timer
         * in the Fx.run method, and check for the prop here. This would be an
         * improvement in all cases where we stop the animation from .attr. Instead of
         * stopping everything, we can just stop the actual attributes we're setting.
         *
         * @function #stop
         * @memberOf Highcharts
         * @param {SVGElement} el - The SVGElement to stop animation on.
         * @param {string} [prop] - The property to stop animating. If given, the stop
         *    method will stop a single property from animating, while others continue.
         * @returns {void}
         */
        H.stop = function(el, prop) {

            var i = timers.length;

            // Remove timers related to this element (#4519)
            while (i--) {
                if (timers[i].elem === el && (!prop || prop === timers[i].prop)) {
                    timers[i].stopped = true; // #4667
                }
            }
        };

        /**
         * Iterate over an array.
         *
         * @function #each
         * @memberOf Highcharts
         * @param {Array} arr - The array to iterate over.
         * @param {Function} fn - The iterator callback. It passes two arguments:
         * * item - The array item.
         * * index - The item's index in the array.
         * @param {Object} [ctx] The context.
         */
        H.each = function(arr, fn, ctx) { // modern browsers
            return Array.prototype.forEach.call(arr, fn, ctx);
        };

        /**
         * Add an event listener.
         *
         * @function #addEvent
         * @memberOf Highcharts
         * @param {Object} el - The element or object to add a listener to. It can be a
         *        {@link HTMLDOMElement}, an {@link SVGElement} or any other object.
         * @param {String} type - The event type.
         * @param {Function} fn - The function callback to execute when the event is 
         *        fired.
         * @returns {Function} A callback function to remove the added event.
         */
        H.addEvent = function(el, type, fn) {

            var events = el.hcEvents = el.hcEvents || {};

            function wrappedFn(e) {
                e.target = e.srcElement || win; // #2820
                fn.call(el, e);
            }

            // Handle DOM events in modern browsers
            if (el.addEventListener) {
                el.addEventListener(type, fn, false);

                // Handle old IE implementation
            } else if (el.attachEvent) {

                if (!el.hcEventsIE) {
                    el.hcEventsIE = {};
                }

                // Link wrapped fn with original fn, so we can get this in removeEvent
                el.hcEventsIE[fn.toString()] = wrappedFn;

                el.attachEvent('on' + type, wrappedFn);
            }

            if (!events[type]) {
                events[type] = [];
            }

            events[type].push(fn);

            // Return a function that can be called to remove this event.
            return function() {
                H.removeEvent(el, type, fn);
            };
        };

        /**
         * Remove an event that was added with {@link Highcharts#addEvent}.
         *
         * @function #removeEvent
         * @memberOf Highcharts
         * @param {Object} el - The element to remove events on.
         * @param {String} [type] - The type of events to remove. If undefined, all
         *        events are removed from the element.
         * @param {Function} [fn] - The specific callback to remove. If undefined, all
         *        events that match the element and optionally the type are removed.
         * @returns {void}
         */
        H.removeEvent = function(el, type, fn) {

            var events,
                hcEvents = el.hcEvents,
                index;

            function removeOneEvent(type, fn) {
                if (el.removeEventListener) {
                    el.removeEventListener(type, fn, false);
                } else if (el.attachEvent) {
                    fn = el.hcEventsIE[fn.toString()];
                    el.detachEvent('on' + type, fn);
                }
            }

            function removeAllEvents() {
                var types,
                    len,
                    n;

                if (!el.nodeName) {
                    return; // break on non-DOM events
                }

                if (type) {
                    types = {};
                    types[type] = true;
                } else {
                    types = hcEvents;
                }

                for (n in types) {
                    if (hcEvents[n]) {
                        len = hcEvents[n].length;
                        while (len--) {
                            removeOneEvent(n, hcEvents[n][len]);
                        }
                    }
                }
            }

            if (hcEvents) {
                if (type) {
                    events = hcEvents[type] || [];
                    if (fn) {
                        index = H.inArray(fn, events);
                        if (index > -1) {
                            events.splice(index, 1);
                            hcEvents[type] = events;
                        }
                        removeOneEvent(type, fn);

                    } else {
                        removeAllEvents();
                        hcEvents[type] = [];
                    }
                } else {
                    removeAllEvents();
                    el.hcEvents = {};
                }
            }
        };

        /**
         * Fire an event that was registered with {@link Highcharts#addEvent}.
         *
         * @function #fireEvent
         * @memberOf Highcharts
         * @param {Object} el - The object to fire the event on. It can be a
         *        {@link HTMLDOMElement}, an {@link SVGElement} or any other object.
         * @param {String} type - The type of event.
         * @param {Object} [eventArguments] - Custom event arguments that are passed on
         *        as an argument to the event handler.
         * @param {Function} [defaultFunction] - The default function to execute if the 
         *        other listeners haven't returned false.
         * @returns {void}
         */
        H.fireEvent = function(el, type, eventArguments, defaultFunction) {
            var e,
                hcEvents = el.hcEvents,
                events,
                len,
                i,
                fn;

            eventArguments = eventArguments || {};

            if (doc.createEvent && (el.dispatchEvent || el.fireEvent)) {
                e = doc.createEvent('Events');
                e.initEvent(type, true, true);
                //e.target = el;

                H.extend(e, eventArguments);

                if (el.dispatchEvent) {
                    el.dispatchEvent(e);
                } else {
                    el.fireEvent(type, e);
                }

            } else if (hcEvents) {

                events = hcEvents[type] || [];
                len = events.length;

                if (!eventArguments.target) { // We're running a custom event

                    H.extend(eventArguments, {
                        // Attach a simple preventDefault function to skip default
                        // handler if called. The built-in defaultPrevented property is
                        // not overwritable (#5112)
                        preventDefault: function() {
                            eventArguments.defaultPrevented = true;
                        },
                        // Setting target to native events fails with clicking the
                        // zoom-out button in Chrome.
                        target: el,
                        // If the type is not set, we're running a custom event (#2297).
                        // If it is set, we're running a browser event, and setting it
                        // will cause en error in IE8 (#2465).		
                        type: type
                    });
                }


                for (i = 0; i < len; i++) {
                    fn = events[i];

                    // If the event handler return false, prevent the default handler
                    // from executing
                    if (fn && fn.call(el, eventArguments) === false) {
                        eventArguments.preventDefault();
                    }
                }
            }

            // Run the default if not prevented
            if (defaultFunction && !eventArguments.defaultPrevented) {
                defaultFunction(eventArguments);
            }
        };

        /**
         * An animation configuration. Animation configurations can also be defined as
         * booleans, where `false` turns off animation and `true` defaults to a duration
         * of 500ms.
         * @typedef {Object} AnimationOptions
         * @property {Number} duration - The animation duration in milliseconds.
         * @property {String} [easing] - The name of an easing function as defined on
         *     the `Math` object.
         * @property {Function} [complete] - A callback function to exectute when the
         *     animation finishes.
         * @property {Function} [step] - A callback function to execute on each step of
         *     each attribute or CSS property that's being animated. The first argument
         *     contains information about the animation and progress.
         */


        /**
         * The global animate method, which uses Fx to create individual animators.
         *
         * @function #animate
         * @memberOf Highcharts
         * @param {HTMLDOMElement|SVGElement} el - The element to animate.
         * @param {Object} params - An object containing key-value pairs of the
         *        properties to animate. Supports numeric as pixel-based CSS properties
         *        for HTML objects and attributes for SVGElements.
         * @param {AnimationOptions} [opt] - Animation options.
         */
        H.animate = function(el, params, opt) {
            var start,
                unit = '',
                end,
                fx,
                args,
                prop;

            if (!H.isObject(opt)) { // Number or undefined/null
                args = arguments;
                opt = {
                    duration: args[2],
                    easing: args[3],
                    complete: args[4]
                };
            }
            if (!H.isNumber(opt.duration)) {
                opt.duration = 400;
            }
            opt.easing = typeof opt.easing === 'function' ?
                opt.easing :
                (Math[opt.easing] || Math.easeInOutSine);
            opt.curAnim = H.merge(params);

            for (prop in params) {

                // Stop current running animation of this property
                H.stop(el, prop);

                fx = new H.Fx(el, opt, prop);
                end = null;

                if (prop === 'd') {
                    fx.paths = fx.initPath(
                        el,
                        el.d,
                        params.d
                    );
                    fx.toD = params.d;
                    start = 0;
                    end = 1;
                } else if (el.attr) {
                    start = el.attr(prop);
                } else {
                    start = parseFloat(H.getStyle(el, prop)) || 0;
                    if (prop !== 'opacity') {
                        unit = 'px';
                    }
                }

                if (!end) {
                    end = params[prop];
                }
                if (end.match && end.match('px')) {
                    end = end.replace(/px/g, ''); // #4351
                }
                fx.run(start, end, unit);
            }
        };

        /**
         * Factory to create new series prototypes.
         *
         * @function #seriesType
         * @memberOf Highcharts
         *
         * @param {String} type - The series type name.
         * @param {String} parent - The parent series type name. Use `line` to inherit
         *        from the basic {@link Series} object.
         * @param {Object} options - The additional default options that is merged with
         *        the parent's options.
         * @param {Object} props - The properties (functions and primitives) to set on
         *        the new prototype.
         * @param {Object} [pointProps] - Members for a series-specific extension of the
         *        {@link Point} prototype if needed.
         * @returns {*} - The newly created prototype as extended from {@link Series}
         * or its derivatives.
         */
        // docs: add to API + extending Highcharts
        H.seriesType = function(type, parent, options, props, pointProps) {
            var defaultOptions = H.getOptions(),
                seriesTypes = H.seriesTypes;

            // Merge the options
            defaultOptions.plotOptions[type] = H.merge(
                defaultOptions.plotOptions[parent],
                options
            );

            // Create the class
            seriesTypes[type] = H.extendClass(seriesTypes[parent] ||
                function() {}, props);
            seriesTypes[type].prototype.type = type;

            // Create the point class if needed
            if (pointProps) {
                seriesTypes[type].prototype.pointClass =
                    H.extendClass(H.Point, pointProps);
            }

            return seriesTypes[type];
        };

        /**
         * Get a unique key for using in internal element id's and pointers. The key
         * is composed of a random hash specific to this Highcharts instance, and a 
         * counter.
         * @function #uniqueKey
         * @memberOf Highcharts
         * @return {string} The key.
         * @example
         * var id = H.uniqueKey(); // => 'highcharts-x45f6hp-0'
         */
        H.uniqueKey = (function() {

            var uniqueKeyHash = Math.random().toString(36).substring(2, 9),
                idCounter = 0;

            return function() {
                return 'highcharts-' + uniqueKeyHash + '-' + idCounter++;
            };
        }());

        /**
         * Register Highcharts as a plugin in jQuery
         */
        if (win.jQuery) {
            win.jQuery.fn.highcharts = function() {
                var args = [].slice.call(arguments);

                if (this[0]) { // this[0] is the renderTo div

                    // Create the chart
                    if (args[0]) {
                        new H[ // eslint-disable-line no-new
                            // Constructor defaults to Chart
                            H.isString(args[0]) ? args.shift() : 'Chart'
                        ](this[0], args[0], args[1]);
                        return this;
                    }

                    // When called without parameters or with the return argument,
                    // return an existing chart
                    return charts[H.attr(this[0], 'data-highcharts-chart')];
                }
            };
        }


        /**
         * Compatibility section to add support for legacy IE. This can be removed if
         * old IE support is not needed.
         */
        if (doc && !doc.defaultView) {
            H.getStyle = function(el, prop) {
                var val,
                    alias = {
                        width: 'clientWidth',
                        height: 'clientHeight'
                    }[prop];

                if (el.style[prop]) {
                    return H.pInt(el.style[prop]);
                }
                if (prop === 'opacity') {
                    prop = 'filter';
                }

                // Getting the rendered width and height
                if (alias) {
                    el.style.zoom = 1;
                    return Math.max(el[alias] - 2 * H.getStyle(el, 'padding'), 0);
                }

                val = el.currentStyle[prop.replace(/\-(\w)/g, function(a, b) {
                    return b.toUpperCase();
                })];
                if (prop === 'filter') {
                    val = val.replace(
                        /alpha\(opacity=([0-9]+)\)/,
                        function(a, b) {
                            return b / 100;
                        }
                    );
                }

                return val === '' ? 1 : H.pInt(val);
            };
        }

        if (!Array.prototype.forEach) {
            H.each = function(arr, fn, ctx) { // legacy
                var i = 0,
                    len = arr.length;
                for (; i < len; i++) {
                    if (fn.call(ctx, arr[i], i, arr) === false) {
                        return i;
                    }
                }
            };
        }

        if (!Array.prototype.indexOf) {
            H.inArray = function(item, arr) {
                var len,
                    i = 0;

                if (arr) {
                    len = arr.length;

                    for (; i < len; i++) {
                        if (arr[i] === item) {
                            return i;
                        }
                    }
                }

                return -1;
            };
        }

        if (!Array.prototype.filter) {
            H.grep = function(elements, fn) {
                var ret = [],
                    i = 0,
                    length = elements.length;

                for (; i < length; i++) {
                    if (fn(elements[i], i)) {
                        ret.push(elements[i]);
                    }
                }

                return ret;
            };
        }

        if (!Array.prototype.find) {
            H.find = function(arr, fn) {
                var i,
                    length = arr.length;

                for (i = 0; i < length; i++) {
                    if (fn(arr[i], i)) {
                        return arr[i];
                    }
                }
            };
        }

        //--- End compatibility section ---

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
            map = H.map,
            merge = H.merge,
            pInt = H.pInt;

        /**
         * @typedef {string} ColorString
         * A valid color to be parsed and handled by Highcharts. Highcharts internally 
         * supports hex colors like `#ffffff`, rgb colors like `rgb(255,255,255)` and
         * rgba colors like `rgba(255,255,255,1)`. Other colors may be supported by the
         * browsers and displayed correctly, but Highcharts is not able to process them
         * and apply concepts like opacity and brightening.
         */
        /**
         * Handle color operations. The object methods are chainable.
         * @param {String} input The input color in either rbga or hex format
         */
        H.Color = function(input) {
            // Backwards compatibility, allow instanciation without new
            if (!(this instanceof H.Color)) {
                return new H.Color(input);
            }
            // Initialize
            this.init(input);
        };
        H.Color.prototype = {

            // Collection of parsers. This can be extended from the outside by pushing parsers
            // to Highcharts.Color.prototype.parsers.
            parsers: [{
                // RGBA color
                regex: /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?(?:\.[0-9]+)?)\s*\)/,
                parse: function(result) {
                    return [pInt(result[1]), pInt(result[2]), pInt(result[3]), parseFloat(result[4], 10)];
                }
            }, {
                // HEX color
                regex: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
                parse: function(result) {
                    return [pInt(result[1], 16), pInt(result[2], 16), pInt(result[3], 16), 1];
                }
            }, {
                // RGB color
                regex: /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/,
                parse: function(result) {
                    return [pInt(result[1]), pInt(result[2]), pInt(result[3]), 1];
                }
            }],

            // Collection of named colors. Can be extended from the outside by adding colors
            // to Highcharts.Color.prototype.names.
            names: {
                white: '#ffffff',
                black: '#000000'
            },

            /**
             * Parse the input color to rgba array
             * @param {String} input
             */
            init: function(input) {
                var result,
                    rgba,
                    i,
                    parser;

                this.input = input = this.names[input] || input;

                // Gradients
                if (input && input.stops) {
                    this.stops = map(input.stops, function(stop) {
                        return new H.Color(stop[1]);
                    });

                    // Solid colors
                } else {
                    i = this.parsers.length;
                    while (i-- && !rgba) {
                        parser = this.parsers[i];
                        result = parser.regex.exec(input);
                        if (result) {
                            rgba = parser.parse(result);
                        }
                    }
                }
                this.rgba = rgba || [];
            },

            /**
             * Return the color a specified format
             * @param {String} format
             */
            get: function(format) {
                var input = this.input,
                    rgba = this.rgba,
                    ret;

                if (this.stops) {
                    ret = merge(input);
                    ret.stops = [].concat(ret.stops);
                    each(this.stops, function(stop, i) {
                        ret.stops[i] = [ret.stops[i][0], stop.get(format)];
                    });

                    // it's NaN if gradient colors on a column chart
                } else if (rgba && isNumber(rgba[0])) {
                    if (format === 'rgb' || (!format && rgba[3] === 1)) {
                        ret = 'rgb(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ')';
                    } else if (format === 'a') {
                        ret = rgba[3];
                    } else {
                        ret = 'rgba(' + rgba.join(',') + ')';
                    }
                } else {
                    ret = input;
                }
                return ret;
            },

            /**
             * Brighten the color
             * @param {Number} alpha
             */
            brighten: function(alpha) {
                var i,
                    rgba = this.rgba;

                if (this.stops) {
                    each(this.stops, function(stop) {
                        stop.brighten(alpha);
                    });

                } else if (isNumber(alpha) && alpha !== 0) {
                    for (i = 0; i < 3; i++) {
                        rgba[i] += pInt(alpha * 255);

                        if (rgba[i] < 0) {
                            rgba[i] = 0;
                        }
                        if (rgba[i] > 255) {
                            rgba[i] = 255;
                        }
                    }
                }
                return this;
            },

            /**
             * Set the color's opacity to a given alpha value
             * @param {Number} alpha
             */
            setOpacity: function(alpha) {
                this.rgba[3] = alpha;
                return this;
            }
        };
        H.color = function(input) {
            return new H.Color(input);
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var SVGElement,
            SVGRenderer,

            addEvent = H.addEvent,
            animate = H.animate,
            attr = H.attr,
            charts = H.charts,
            color = H.color,
            css = H.css,
            createElement = H.createElement,
            defined = H.defined,
            deg2rad = H.deg2rad,
            destroyObjectProperties = H.destroyObjectProperties,
            doc = H.doc,
            each = H.each,
            extend = H.extend,
            erase = H.erase,
            grep = H.grep,
            hasTouch = H.hasTouch,
            inArray = H.inArray,
            isArray = H.isArray,
            isFirefox = H.isFirefox,
            isMS = H.isMS,
            isObject = H.isObject,
            isString = H.isString,
            isWebKit = H.isWebKit,
            merge = H.merge,
            noop = H.noop,
            pick = H.pick,
            pInt = H.pInt,
            removeEvent = H.removeEvent,
            splat = H.splat,
            stop = H.stop,
            svg = H.svg,
            SVG_NS = H.SVG_NS,
            symbolSizes = H.symbolSizes,
            win = H.win;

        /**
         * @typedef {Object} SVGDOMElement - An SVG DOM element.
         */
        /**
         * The SVGElement prototype is a JavaScript wrapper for SVG elements used in the
         * rendering layer of Highcharts. Combined with the {@link SVGRenderer} object,
         * these prototypes allow freeform annotation in the charts or even in HTML
         * pages without instanciating a chart. The SVGElement can also wrap HTML
         * labels, when `text` or `label` elements are created with the `useHTML`
         * parameter.
         *
         * The SVGElement instances are created through factory functions on the 
         * {@link SVGRenderer} object, like [rect]{@link SVGRenderer#rect},
         * [path]{@link SVGRenderer#path}, [text]{@link SVGRenderer#text}, [label]{@link
         * SVGRenderer#label}, [g]{@link SVGRenderer#g} and more.
         *
         * @class
         */
        SVGElement = H.SVGElement = function() {
            return this;
        };
        SVGElement.prototype = {

            // Default base for animation
            opacity: 1,
            SVG_NS: SVG_NS,

            /**
             * For labels, these CSS properties are applied to the `text` node directly.
             * @type {Array.<string>}
             */
            textProps: ['direction', 'fontSize', 'fontWeight', 'fontFamily',
                'fontStyle', 'color', 'lineHeight', 'width', 'textDecoration',
                'textOverflow', 'textOutline'
            ],

            /**
             * Initialize the SVG renderer. This function only exists to make the
             * initiation process overridable. It should not be called directly.
             *
             * @param {SVGRenderer} renderer The SVGRenderer instance to initialize to.
             * @param {String} nodeName The SVG node name.
             * @returns {void}
             */
            init: function(renderer, nodeName) {

                /** 
                 * The DOM node. Each SVGRenderer instance wraps a main DOM node, but 
                 * may also represent more nodes.
                 * @type {SVGDOMNode|HTMLDOMNode}
                 */
                this.element = nodeName === 'span' ?
                    createElement(nodeName) :
                    doc.createElementNS(this.SVG_NS, nodeName);

                /**
                 * The renderer that the SVGElement belongs to.
                 * @type {SVGRenderer}
                 */
                this.renderer = renderer;
            },

            /**
             * Animate to given attributes or CSS properties.
             * 
             * @param {SVGAttributes} params SVG attributes or CSS to animate.
             * @param {AnimationOptions} [options] Animation options.
             * @param {Function} [complete] Function to perform at the end of animation.
             * @returns {SVGElement} Returns the SVGElement for chaining.
             */
            animate: function(params, options, complete) {
                var animOptions = H.animObject(
                    pick(options, this.renderer.globalAnimation, true)
                );
                if (animOptions.duration !== 0) {
                    if (complete) { // allows using a callback with the global animation without overwriting it
                        animOptions.complete = complete;
                    }
                    animate(this, params, animOptions);
                } else {
                    this.attr(params, null, complete);
                }
                return this;
            },

            /**
             * @typedef {Object} GradientOptions
             * @property {Object} linearGradient Holds an object that defines the start
             *    position and the end position relative to the shape.
             * @property {Number} linearGradient.x1 Start horizontal position of the
             *    gradient. Ranges 0-1.
             * @property {Number} linearGradient.x2 End horizontal position of the
             *    gradient. Ranges 0-1.
             * @property {Number} linearGradient.y1 Start vertical position of the
             *    gradient. Ranges 0-1.
             * @property {Number} linearGradient.y2 End vertical position of the
             *    gradient. Ranges 0-1.
             * @property {Object} radialGradient Holds an object that defines the center
             *    position and the radius.
             * @property {Number} radialGradient.cx Center horizontal position relative
             *    to the shape. Ranges 0-1.
             * @property {Number} radialGradient.cy Center vertical position relative
             *    to the shape. Ranges 0-1.
             * @property {Number} radialGradient.r Radius relative to the shape. Ranges
             *    0-1.
             * @property {Array.<Array>} stops The first item in each tuple is the
             *    position in the gradient, where 0 is the start of the gradient and 1
             *    is the end of the gradient. Multiple stops can be applied. The second
             *    item is the color for each stop. This color can also be given in the
             *    rgba format.
             *
             * @example
             * // Linear gradient used as a color option
             * color: {
             *     linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
             *         stops: [
             *             [0, '#003399'], // start
             *             [0.5, '#ffffff'], // middle
             *             [1, '#3366AA'] // end
             *         ]
             *     }
             * }
             */
            /**
             * Build and apply an SVG gradient out of a common JavaScript configuration
             * object. This function is called from the attribute setters.
             *
             * @private
             * @param {GradientOptions} color The gradient options structure.
             * @param {string} prop The property to apply, can either be `fill` or
             * `stroke`. 
             * @param {SVGDOMElement} elem SVG DOM element to apply the gradient on.
             */
            colorGradient: function(color, prop, elem) {
                var renderer = this.renderer,
                    colorObject,
                    gradName,
                    gradAttr,
                    radAttr,
                    gradients,
                    gradientObject,
                    stops,
                    stopColor,
                    stopOpacity,
                    radialReference,
                    n,
                    id,
                    key = [],
                    value;

                // Apply linear or radial gradients
                if (color.linearGradient) {
                    gradName = 'linearGradient';
                } else if (color.radialGradient) {
                    gradName = 'radialGradient';
                }

                if (gradName) {
                    gradAttr = color[gradName];
                    gradients = renderer.gradients;
                    stops = color.stops;
                    radialReference = elem.radialReference;

                    // Keep < 2.2 kompatibility
                    if (isArray(gradAttr)) {
                        color[gradName] = gradAttr = {
                            x1: gradAttr[0],
                            y1: gradAttr[1],
                            x2: gradAttr[2],
                            y2: gradAttr[3],
                            gradientUnits: 'userSpaceOnUse'
                        };
                    }

                    // Correct the radial gradient for the radial reference system
                    if (gradName === 'radialGradient' && radialReference && !defined(gradAttr.gradientUnits)) {
                        radAttr = gradAttr; // Save the radial attributes for updating
                        gradAttr = merge(gradAttr,
                            renderer.getRadialAttr(radialReference, radAttr), {
                                gradientUnits: 'userSpaceOnUse'
                            }
                        );
                    }

                    // Build the unique key to detect whether we need to create a new element (#1282)
                    for (n in gradAttr) {
                        if (n !== 'id') {
                            key.push(n, gradAttr[n]);
                        }
                    }
                    for (n in stops) {
                        key.push(stops[n]);
                    }
                    key = key.join(',');

                    // Check if a gradient object with the same config object is created within this renderer
                    if (gradients[key]) {
                        id = gradients[key].attr('id');

                    } else {

                        // Set the id and create the element
                        gradAttr.id = id = H.uniqueKey();
                        gradients[key] = gradientObject = renderer.createElement(gradName)
                            .attr(gradAttr)
                            .add(renderer.defs);

                        gradientObject.radAttr = radAttr;

                        // The gradient needs to keep a list of stops to be able to destroy them
                        gradientObject.stops = [];
                        each(stops, function(stop) {
                            var stopObject;
                            if (stop[1].indexOf('rgba') === 0) {
                                colorObject = H.color(stop[1]);
                                stopColor = colorObject.get('rgb');
                                stopOpacity = colorObject.get('a');
                            } else {
                                stopColor = stop[1];
                                stopOpacity = 1;
                            }
                            stopObject = renderer.createElement('stop').attr({
                                offset: stop[0],
                                'stop-color': stopColor,
                                'stop-opacity': stopOpacity
                            }).add(gradientObject);

                            // Add the stop element to the gradient
                            gradientObject.stops.push(stopObject);
                        });
                    }

                    // Set the reference to the gradient object
                    value = 'url(' + renderer.url + '#' + id + ')';
                    elem.setAttribute(prop, value);
                    elem.gradient = key;

                    // Allow the color to be concatenated into tooltips formatters etc. (#2995)
                    color.toString = function() {
                        return value;
                    };
                }
            },

            /**
             * Apply a text outline through a custom CSS property, by copying the text
             * element and apply stroke to the copy. Used internally. Contrast checks
             * at http://jsfiddle.net/highcharts/43soe9m1/2/ .
             *
             * @private
             * @param {String} textOutline A custom CSS `text-outline` setting, defined
             *    by `width color`. 
             * @example
             * // Specific color
             * text.css({
             *    textOutline: '1px black'
             * });
             * // Automatic contrast
             * text.css({
             *    color: '#000000', // black text
             *    textOutline: '1px contrast' // => white outline
             * });
             */
            applyTextOutline: function(textOutline) {
                var elem = this.element,
                    tspans,
                    hasContrast = textOutline.indexOf('contrast') !== -1,
                    styles = {},
                    color,
                    strokeWidth,
                    firstRealChild;

                // When the text shadow is set to contrast, use dark stroke for light
                // text and vice versa.
                if (hasContrast) {
                    styles.textOutline = textOutline = textOutline.replace(
                        /contrast/g,
                        this.renderer.getContrast(elem.style.fill)
                    );
                }

                this.fakeTS = true; // Fake text shadow

                // In order to get the right y position of the clone,
                // copy over the y setter
                this.ySetter = this.xSetter;

                tspans = [].slice.call(elem.getElementsByTagName('tspan'));

                // Extract the stroke width and color
                textOutline = textOutline.split(' ');
                color = textOutline[textOutline.length - 1];
                strokeWidth = textOutline[0];

                if (strokeWidth && strokeWidth !== 'none') {

                    // Since the stroke is applied on center of the actual outline, we
                    // need to double it to get the correct stroke-width outside the 
                    // glyphs.
                    strokeWidth = strokeWidth.replace(
                        /(^[\d\.]+)(.*?)$/g,
                        function(match, digit, unit) {
                            return (2 * digit) + unit;
                        }
                    );

                    // Remove shadows from previous runs
                    each(tspans, function(tspan) {
                        if (tspan.getAttribute('class') === 'highcharts-text-outline') {
                            // Remove then erase
                            erase(tspans, elem.removeChild(tspan));
                        }
                    });

                    // For each of the tspans, create a stroked copy behind it.
                    firstRealChild = elem.firstChild;
                    each(tspans, function(tspan, y) {
                        var clone;

                        // Let the first line start at the correct X position
                        if (y === 0) {
                            tspan.setAttribute('x', elem.getAttribute('x'));
                            y = elem.getAttribute('y');
                            tspan.setAttribute('y', y || 0);
                            if (y === null) {
                                elem.setAttribute('y', 0);
                            }
                        }

                        // Create the clone and apply outline properties
                        clone = tspan.cloneNode(1);
                        attr(clone, {
                            'class': 'highcharts-text-outline',
                            'fill': color,
                            'stroke': color,
                            'stroke-width': strokeWidth,
                            'stroke-linejoin': 'round'
                        });
                        elem.insertBefore(clone, firstRealChild);
                    });
                }
            },

            /**
             *
             * @typedef {Object} SVGAttributes An object of key-value pairs for SVG
             *   attributes. Attributes in Highcharts elements for the most parts
             *   correspond to SVG, but some are specific to Highcharts, like `zIndex`,
             *   `rotation`, `translateX`, `translateY`, `scaleX` and `scaleY`. SVG
             *   attributes containing a hyphen are _not_ camel-cased, they should be
             *   quoted to preserve the hyphen.
             * @example
             * {
             *     'stroke': '#ff0000', // basic
             *     'stroke-width': 2, // hyphenated
             *     'rotation': 45 // custom
             *     'd': ['M', 10, 10, 'L', 30, 30, 'z'] // path definition, note format
             * }
             */
            /**
             * Apply native and custom attributes to the SVG elements.
             * 
             * In order to set the rotation center for rotation, set x and y to 0 and
             * use `translateX` and `translateY` attributes to position the element
             * instead.
             *
             * Attributes frequently used in Highcharts are `fill`, `stroke`,
             * `stroke-width`.
             *
             * @param {SVGAttributes|String} hash - The native and custom SVG
             *    attributes. 
             * @param {string} [val] - If the type of the first argument is `string`, 
             *    the second can be a value, which will serve as a single attribute
             *    setter. If the first argument is a string and the second is undefined,
             *    the function serves as a getter and the current value of the property
             *    is returned.
             * @param {Function} complete - A callback function to execute after setting
             *    the attributes. This makes the function compliant and interchangeable
             *    with the {@link SVGElement#animate} function.
             * @param {boolean} continueAnimation - Used internally when `.attr` is
             *    called as part of an animation step. Otherwise, calling `.attr` for an
             *    attribute will stop animation for that attribute.
             *    
             * @returns {SVGElement|string|number} If used as a setter, it returns the 
             *    current {@link SVGElement} so the calls can be chained. If used as a 
             *    getter, the current value of the attribute is returned.
             * 
             * @example
             * // Set multiple attributes
             * element.attr({
             *     stroke: 'red',
             *     fill: 'blue',
             *     x: 10,
             *     y: 10
             * });
             *
             * // Set a single attribute
             * element.attr('stroke', 'red');
             *
             * // Get an attribute
             * element.attr('stroke'); // => 'red'
             * 
             */
            attr: function(hash, val, complete, continueAnimation) {
                var key,
                    value,
                    element = this.element,
                    hasSetSymbolSize,
                    ret = this,
                    skipAttr,
                    setter;

                // single key-value pair
                if (typeof hash === 'string' && val !== undefined) {
                    key = hash;
                    hash = {};
                    hash[key] = val;
                }

                // used as a getter: first argument is a string, second is undefined
                if (typeof hash === 'string') {
                    ret = (this[hash + 'Getter'] || this._defaultGetter).call(this, hash, element);

                    // setter
                } else {

                    for (key in hash) {
                        value = hash[key];
                        skipAttr = false;

                        // Unless .attr is from the animator update, stop current
                        // running animation of this property
                        if (!continueAnimation) {
                            stop(this, key);
                        }

                        if (this.symbolName && /^(x|y|width|height|r|start|end|innerR|anchorX|anchorY)/.test(key)) {
                            if (!hasSetSymbolSize) {
                                this.symbolAttr(hash);
                                hasSetSymbolSize = true;
                            }
                            skipAttr = true;
                        }

                        if (this.rotation && (key === 'x' || key === 'y')) {
                            this.doTransform = true;
                        }

                        if (!skipAttr) {
                            setter = this[key + 'Setter'] || this._defaultSetter;
                            setter.call(this, value, key, element);


                            // Let the shadow follow the main element
                            if (this.shadows && /^(width|height|visibility|x|y|d|transform|cx|cy|r)$/.test(key)) {
                                this.updateShadows(key, value, setter);
                            }

                        }
                    }

                    // Update transform. Do this outside the loop to prevent redundant updating for batch setting
                    // of attributes.
                    if (this.doTransform) {
                        this.updateTransform();
                        this.doTransform = false;
                    }

                }

                // In accordance with animate, run a complete callback
                if (complete) {
                    complete();
                }

                return ret;
            },


            /**
             * Update the shadow elements with new attributes.
             *
             * @private
             * @param {String} key - The attribute name.
             * @param {String|Number} value - The value of the attribute.
             * @param {Function} setter - The setter function, inherited from the
             *   parent wrapper
             * @returns {void}
             */
            updateShadows: function(key, value, setter) {
                var shadows = this.shadows,
                    i = shadows.length;

                while (i--) {
                    setter.call(
                        shadows[i],
                        key === 'height' ?
                        Math.max(value - (shadows[i].cutHeight || 0), 0) :
                        key === 'd' ? this.d : value,
                        key,
                        shadows[i]
                    );
                }
            },


            /**
             * Add a class name to an element.
             *
             * @param {string} className - The new class name to add.
             * @param {boolean} [replace=false] - When true, the existing class name(s)
             *    will be overwritten with the new one. When false, the new one is
             *    added.
             * @returns {SVGElement} Return the SVG element for chainability.
             */
            addClass: function(className, replace) {
                var currentClassName = this.attr('class') || '';

                if (currentClassName.indexOf(className) === -1) {
                    if (!replace) {
                        className =
                            (currentClassName + (currentClassName ? ' ' : '') +
                                className).replace('  ', ' ');
                    }
                    this.attr('class', className);
                }
                return this;
            },

            /**
             * Check if an element has the given class name.
             * @param  {string}  className - The class name to check for.
             * @return {Boolean}
             */
            hasClass: function(className) {
                return attr(this.element, 'class').indexOf(className) !== -1;
            },

            /**
             * Remove a class name from the element.
             * @param  {string} className The class name to remove.
             * @return {SVGElement} Returns the SVG element for chainability.
             */
            removeClass: function(className) {
                attr(this.element, 'class', (attr(this.element, 'class') || '').replace(className, ''));
                return this;
            },

            /**
             * If one of the symbol size affecting parameters are changed,
             * check all the others only once for each call to an element's
             * .attr() method
             * @param {Object} hash - The attributes to set.
             * @private
             */
            symbolAttr: function(hash) {
                var wrapper = this;

                each(['x', 'y', 'r', 'start', 'end', 'width', 'height', 'innerR', 'anchorX', 'anchorY'], function(key) {
                    wrapper[key] = pick(hash[key], wrapper[key]);
                });

                wrapper.attr({
                    d: wrapper.renderer.symbols[wrapper.symbolName](
                        wrapper.x,
                        wrapper.y,
                        wrapper.width,
                        wrapper.height,
                        wrapper
                    )
                });
            },

            /**
             * Apply a clipping rectangle to this element.
             * 
             * @param {ClipRect} [clipRect] - The clipping rectangle. If skipped, the
             *    current clip is removed.
             * @returns {SVGElement} Returns the SVG element to allow chaining.
             */
            clip: function(clipRect) {
                return this.attr(
                    'clip-path',
                    clipRect ?
                    'url(' + this.renderer.url + '#' + clipRect.id + ')' :
                    'none'
                );
            },

            /**
             * Calculate the coordinates needed for drawing a rectangle crisply and
             * return the calculated attributes.
             * 
             * @param {Object} rect - A rectangle.
             * @param {number} rect.x - The x position.
             * @param {number} rect.y - The y position.
             * @param {number} rect.width - The width.
             * @param {number} rect.height - The height.
             * @param {number} [strokeWidth] - The stroke width to consider when
             *    computing crisp positioning. It can also be set directly on the rect
             *    parameter.
             *
             * @returns {{x: Number, y: Number, width: Number, height: Number}} The
             *    modified rectangle arguments.
             */
            crisp: function(rect, strokeWidth) {

                var wrapper = this,
                    key,
                    attribs = {},
                    normalizer;

                strokeWidth = strokeWidth || rect.strokeWidth || 0;
                normalizer = Math.round(strokeWidth) % 2 / 2; // Math.round because strokeWidth can sometimes have roundoff errors

                // normalize for crisp edges
                rect.x = Math.floor(rect.x || wrapper.x || 0) + normalizer;
                rect.y = Math.floor(rect.y || wrapper.y || 0) + normalizer;
                rect.width = Math.floor((rect.width || wrapper.width || 0) - 2 * normalizer);
                rect.height = Math.floor((rect.height || wrapper.height || 0) - 2 * normalizer);
                if (defined(rect.strokeWidth)) {
                    rect.strokeWidth = strokeWidth;
                }

                for (key in rect) {
                    if (wrapper[key] !== rect[key]) { // only set attribute if changed
                        wrapper[key] = attribs[key] = rect[key];
                    }
                }

                return attribs;
            },

            /**
             * Set styles for the element. In addition to CSS styles supported by 
             * native SVG and HTML elements, there are also some custom made for 
             * Highcharts, like `width`, `ellipsis` and `textOverflow` for SVG text
             * elements.
             * @param {CSSObject} styles The new CSS styles.
             * @returns {SVGElement} Return the SVG element for chaining.
             */
            css: function(styles) {
                var elemWrapper = this,
                    oldStyles = elemWrapper.styles,
                    newStyles = {},
                    elem = elemWrapper.element,
                    textWidth,
                    n,
                    serializedCss = '',
                    hyphenate,
                    hasNew = !oldStyles,
                    // These CSS properties are interpreted internally by the SVG
                    // renderer, but are not supported by SVG and should not be added to
                    // the DOM. In styled mode, no CSS should find its way to the DOM
                    // whatsoever (#6173).
                    svgPseudoProps = ['textOverflow', 'width'];

                // convert legacy
                if (styles && styles.color) {
                    styles.fill = styles.color;
                }

                // Filter out existing styles to increase performance (#2640)
                if (oldStyles) {
                    for (n in styles) {
                        if (styles[n] !== oldStyles[n]) {
                            newStyles[n] = styles[n];
                            hasNew = true;
                        }
                    }
                }
                if (hasNew) {
                    textWidth = elemWrapper.textWidth =
                        (styles && styles.width && elem.nodeName.toLowerCase() === 'text' && pInt(styles.width)) ||
                        elemWrapper.textWidth; // #3501

                    // Merge the new styles with the old ones
                    if (oldStyles) {
                        styles = extend(
                            oldStyles,
                            newStyles
                        );
                    }

                    // store object
                    elemWrapper.styles = styles;

                    if (textWidth && (!svg && elemWrapper.renderer.forExport)) {
                        delete styles.width;
                    }

                    // serialize and set style attribute
                    if (isMS && !svg) {
                        css(elemWrapper.element, styles);
                    } else {
                        hyphenate = function(a, b) {
                            return '-' + b.toLowerCase();
                        };
                        for (n in styles) {
                            if (inArray(n, svgPseudoProps) === -1) {
                                serializedCss +=
                                    n.replace(/([A-Z])/g, hyphenate) + ':' +
                                    styles[n] + ';';
                            }
                        }
                        if (serializedCss) {
                            attr(elem, 'style', serializedCss); // #1881
                        }
                    }


                    if (elemWrapper.added) {
                        // Rebuild text after added
                        if (textWidth) {
                            elemWrapper.renderer.buildText(elemWrapper);
                        }

                        // Apply text outline after added
                        if (styles && styles.textOutline) {
                            elemWrapper.applyTextOutline(styles.textOutline);
                        }
                    }
                }

                return elemWrapper;
            },


            /**
             * Get the current stroke width. In classic mode, the setter registers it 
             * directly on the element.
             * @returns {number} The stroke width in pixels.
             * @ignore
             */
            strokeWidth: function() {
                return this['stroke-width'] || 0;
            },


            /**
             * Add an event listener. This is a simple setter that replaces all other
             * events of the same type, opposed to the {@link Highcharts#addEvent}
             * function.
             * @param {string} eventType - The event type. If the type is `click`, 
             *    Highcharts will internally translate it to a `touchstart` event on 
             *    touch devices, to prevent the browser from waiting for a click event
             *    from firing.
             * @param {Function} handler - The handler callback.
             * @returns {SVGElement} The SVGElement for chaining.
             */
            on: function(eventType, handler) {
                var svgElement = this,
                    element = svgElement.element;

                // touch
                if (hasTouch && eventType === 'click') {
                    element.ontouchstart = function(e) {
                        svgElement.touchEventFired = Date.now(); // #2269
                        e.preventDefault();
                        handler.call(element, e);
                    };
                    element.onclick = function(e) {
                        if (win.navigator.userAgent.indexOf('Android') === -1 ||
                            Date.now() - (svgElement.touchEventFired || 0) > 1100) {
                            handler.call(element, e);
                        }
                    };
                } else {
                    // simplest possible event model for internal use
                    element['on' + eventType] = handler;
                }
                return this;
            },

            /**
             * Set the coordinates needed to draw a consistent radial gradient across
             * a shape regardless of positioning inside the chart. Used on pie slices
             * to make all the slices have the same radial reference point.
             *
             * @param {Array} coordinates The center reference. The format is
             *    `[centerX, centerY, diameter]` in pixels.
             * @returns {SVGElement} Returns the SVGElement for chaining.
             */
            setRadialReference: function(coordinates) {
                var existingGradient = this.renderer.gradients[this.element.gradient];

                this.element.radialReference = coordinates;

                // On redrawing objects with an existing gradient, the gradient needs
                // to be repositioned (#3801)
                if (existingGradient && existingGradient.radAttr) {
                    existingGradient.animate(
                        this.renderer.getRadialAttr(
                            coordinates,
                            existingGradient.radAttr
                        )
                    );
                }

                return this;
            },

            /**
             * Move an object and its children by x and y values.
             * 
             * @param {number} x - The x value.
             * @param {number} y - The y value.
             */
            translate: function(x, y) {
                return this.attr({
                    translateX: x,
                    translateY: y
                });
            },

            /**
             * Invert a group, rotate and flip. This is used internally on inverted 
             * charts, where the points and graphs are drawn as if not inverted, then
             * the series group elements are inverted.
             *
             * @param {boolean} inverted - Whether to invert or not. An inverted shape
             *    can be un-inverted by setting it to false.
             * @returns {SVGElement} Return the SVGElement for chaining.
             */
            invert: function(inverted) {
                var wrapper = this;
                wrapper.inverted = inverted;
                wrapper.updateTransform();
                return wrapper;
            },

            /**
             * Update the transform attribute based on internal properties. Deals with
             * the custom `translateX`, `translateY`, `rotation`, `scaleX` and `scaleY`
             * attributes and updates the SVG `transform` attribute.
             * @private
             * @returns {void}
             */
            updateTransform: function() {
                var wrapper = this,
                    translateX = wrapper.translateX || 0,
                    translateY = wrapper.translateY || 0,
                    scaleX = wrapper.scaleX,
                    scaleY = wrapper.scaleY,
                    inverted = wrapper.inverted,
                    rotation = wrapper.rotation,
                    element = wrapper.element,
                    transform;

                // flipping affects translate as adjustment for flipping around the group's axis
                if (inverted) {
                    translateX += wrapper.width;
                    translateY += wrapper.height;
                }

                // Apply translate. Nearly all transformed elements have translation, so instead
                // of checking for translate = 0, do it always (#1767, #1846).
                transform = ['translate(' + translateX + ',' + translateY + ')'];

                // apply rotation
                if (inverted) {
                    transform.push('rotate(90) scale(-1,1)');
                } else if (rotation) { // text rotation
                    transform.push('rotate(' + rotation + ' ' + (element.getAttribute('x') || 0) + ' ' + (element.getAttribute('y') || 0) + ')');

                    // Delete bBox memo when the rotation changes
                    //delete wrapper.bBox;
                }

                // apply scale
                if (defined(scaleX) || defined(scaleY)) {
                    transform.push('scale(' + pick(scaleX, 1) + ' ' + pick(scaleY, 1) + ')');
                }

                if (transform.length) {
                    element.setAttribute('transform', transform.join(' '));
                }
            },

            /**
             * Bring the element to the front.
             *
             * @returns {SVGElement} Returns the SVGElement for chaining.
             */
            toFront: function() {
                var element = this.element;
                element.parentNode.appendChild(element);
                return this;
            },


            /**
             * Align the element relative to the chart or another box.
             * ß
             * @param {Object} [alignOptions] The alignment options. The function can be
             *   called without this parameter in order to re-align an element after the
             *   box has been updated.
             * @param {string} [alignOptions.align=left] Horizontal alignment. Can be
             *   one of `left`, `center` and `right`.
             * @param {string} [alignOptions.verticalAlign=top] Vertical alignment. Can
             *   be one of `top`, `middle` and `bottom`.
             * @param {number} [alignOptions.x=0] Horizontal pixel offset from
             *   alignment.
             * @param {number} [alignOptions.y=0] Vertical pixel offset from alignment.
             * @param {Boolean} [alignByTranslate=false] Use the `transform` attribute
             *   with translateX and translateY custom attributes to align this elements
             *   rather than `x` and `y` attributes.
             * @param {String|Object} box The box to align to, needs a width and height.
             *   When the box is a string, it refers to an object in the Renderer. For
             *   example, when box is `spacingBox`, it refers to `Renderer.spacingBox`
             *   which holds `width`, `height`, `x` and `y` properties.
             * @returns {SVGElement} Returns the SVGElement for chaining.
             */
            align: function(alignOptions, alignByTranslate, box) {
                var align,
                    vAlign,
                    x,
                    y,
                    attribs = {},
                    alignTo,
                    renderer = this.renderer,
                    alignedObjects = renderer.alignedObjects,
                    alignFactor,
                    vAlignFactor;

                // First call on instanciate
                if (alignOptions) {
                    this.alignOptions = alignOptions;
                    this.alignByTranslate = alignByTranslate;
                    if (!box || isString(box)) { // boxes other than renderer handle this internally
                        this.alignTo = alignTo = box || 'renderer';
                        erase(alignedObjects, this); // prevent duplicates, like legendGroup after resize
                        alignedObjects.push(this);
                        box = null; // reassign it below
                    }

                    // When called on resize, no arguments are supplied
                } else {
                    alignOptions = this.alignOptions;
                    alignByTranslate = this.alignByTranslate;
                    alignTo = this.alignTo;
                }

                box = pick(box, renderer[alignTo], renderer);

                // Assign variables
                align = alignOptions.align;
                vAlign = alignOptions.verticalAlign;
                x = (box.x || 0) + (alignOptions.x || 0); // default: left align
                y = (box.y || 0) + (alignOptions.y || 0); // default: top align

                // Align
                if (align === 'right') {
                    alignFactor = 1;
                } else if (align === 'center') {
                    alignFactor = 2;
                }
                if (alignFactor) {
                    x += (box.width - (alignOptions.width || 0)) / alignFactor;
                }
                attribs[alignByTranslate ? 'translateX' : 'x'] = Math.round(x);


                // Vertical align
                if (vAlign === 'bottom') {
                    vAlignFactor = 1;
                } else if (vAlign === 'middle') {
                    vAlignFactor = 2;
                }
                if (vAlignFactor) {
                    y += (box.height - (alignOptions.height || 0)) / vAlignFactor;
                }
                attribs[alignByTranslate ? 'translateY' : 'y'] = Math.round(y);

                // Animate only if already placed
                this[this.placed ? 'animate' : 'attr'](attribs);
                this.placed = true;
                this.alignAttr = attribs;

                return this;
            },

            /**
             * Get the bounding box (width, height, x and y) for the element. Generally
             * used to get rendered text size. Since this is called a lot in charts,
             * the results are cached based on text properties, in order to save DOM
             * traffic. The returned bounding box includes the rotation, so for example
             * a single text line of rotation 90 will report a greater height, and a
             * width corresponding to the line-height.
             *
             * @param {boolean} [reload] Skip the cache and get the updated DOM bouding
             *   box.
             * @param {number} [rot] Override the element's rotation. This is internally
             *   used on axis labels with a value of 0 to find out what the bounding box
             *   would be have been if it were not rotated.
             * @returns {Object} The bounding box with `x`, `y`, `width` and `height`
             * properties.
             */
            getBBox: function(reload, rot) {
                var wrapper = this,
                    bBox, // = wrapper.bBox,
                    renderer = wrapper.renderer,
                    width,
                    height,
                    rotation,
                    rad,
                    element = wrapper.element,
                    styles = wrapper.styles,
                    fontSize,
                    textStr = wrapper.textStr,
                    toggleTextShadowShim,
                    cache = renderer.cache,
                    cacheKeys = renderer.cacheKeys,
                    cacheKey;

                rotation = pick(rot, wrapper.rotation);
                rad = rotation * deg2rad;


                fontSize = styles && styles.fontSize;


                if (textStr !== undefined) {

                    cacheKey = textStr.toString();

                    // Since numbers are monospaced, and numerical labels appear a lot
                    // in a chart, we assume that a label of n characters has the same
                    // bounding box as others of the same length. Unless there is inner
                    // HTML in the label. In that case, leave the numbers as is (#5899).
                    if (cacheKey.indexOf('<') === -1) {
                        cacheKey = cacheKey.replace(/[0-9]/g, '0');
                    }

                    // Properties that affect bounding box
                    cacheKey += [
                            '',
                            rotation || 0,
                            fontSize,
                            styles && styles.width,
                            styles && styles.textOverflow // #5968
                        ]
                        .join(',');

                }

                if (cacheKey && !reload) {
                    bBox = cache[cacheKey];
                }

                // No cache found
                if (!bBox) {

                    // SVG elements
                    if (element.namespaceURI === wrapper.SVG_NS || renderer.forExport) {
                        try { // Fails in Firefox if the container has display: none.

                            // When the text shadow shim is used, we need to hide the fake shadows
                            // to get the correct bounding box (#3872)
                            toggleTextShadowShim = this.fakeTS && function(display) {
                                each(element.querySelectorAll('.highcharts-text-outline'), function(tspan) {
                                    tspan.style.display = display;
                                });
                            };

                            // Workaround for #3842, Firefox reporting wrong bounding box for shadows
                            if (toggleTextShadowShim) {
                                toggleTextShadowShim('none');
                            }

                            bBox = element.getBBox ?
                                // SVG: use extend because IE9 is not allowed to change width and height in case
                                // of rotation (below)
                                extend({}, element.getBBox()) : {

                                    // Legacy IE in export mode
                                    width: element.offsetWidth,
                                    height: element.offsetHeight
                                };

                            // #3842
                            if (toggleTextShadowShim) {
                                toggleTextShadowShim('');
                            }
                        } catch (e) {}

                        // If the bBox is not set, the try-catch block above failed. The other condition
                        // is for Opera that returns a width of -Infinity on hidden elements.
                        if (!bBox || bBox.width < 0) {
                            bBox = {
                                width: 0,
                                height: 0
                            };
                        }


                        // VML Renderer or useHTML within SVG
                    } else {

                        bBox = wrapper.htmlGetBBox();

                    }

                    // True SVG elements as well as HTML elements in modern browsers using the .useHTML option
                    // need to compensated for rotation
                    if (renderer.isSVG) {
                        width = bBox.width;
                        height = bBox.height;

                        // Workaround for wrong bounding box in IE, Edge and Chrome on
                        // Windows. With Highcharts' default font, IE and Edge report
                        // a box height of 16.899 and Chrome rounds it to 17. If this 
                        // stands uncorrected, it results in more padding added below
                        // the text than above when adding a label border or background.
                        // Also vertical positioning is affected.
                        // http://jsfiddle.net/highcharts/em37nvuj/
                        // (#1101, #1505, #1669, #2568, #6213).
                        if (
                            styles &&
                            styles.fontSize === '11px' &&
                            Math.round(height) === 17
                        ) {
                            bBox.height = height = 14;
                        }

                        // Adjust for rotated text
                        if (rotation) {
                            bBox.width = Math.abs(height * Math.sin(rad)) + Math.abs(width * Math.cos(rad));
                            bBox.height = Math.abs(height * Math.cos(rad)) + Math.abs(width * Math.sin(rad));
                        }
                    }

                    // Cache it. When loading a chart in a hidden iframe in Firefox and IE/Edge, the
                    // bounding box height is 0, so don't cache it (#5620).
                    if (cacheKey && bBox.height > 0) {

                        // Rotate (#4681)
                        while (cacheKeys.length > 250) {
                            delete cache[cacheKeys.shift()];
                        }

                        if (!cache[cacheKey]) {
                            cacheKeys.push(cacheKey);
                        }
                        cache[cacheKey] = bBox;
                    }
                }
                return bBox;
            },

            /**
             * Show the element after it has been hidden. 
             *
             * @param {boolean} [inherit=false] Set the visibility attribute to
             * `inherit` rather than `visible`. The difference is that an element with
             * `visibility="visible"` will be visible even if the parent is hidden.
             *
             * @returns {SVGElement} Returns the SVGElement for chaining.
             */
            show: function(inherit) {
                return this.attr({
                    visibility: inherit ? 'inherit' : 'visible'
                });
            },

            /**
             * Hide the element, equivalent to setting the `visibility` attribute to
             * `hidden`.
             *
             * @returns {SVGElement} Returns the SVGElement for chaining.
             */
            hide: function() {
                return this.attr({
                    visibility: 'hidden'
                });
            },

            /**
             * Fade out an element by animating its opacity down to 0, and hide it on
             * complete. Used internally for the tooltip.
             * 
             * @param {number} [duration=150] The fade duration in milliseconds.
             */
            fadeOut: function(duration) {
                var elemWrapper = this;
                elemWrapper.animate({
                    opacity: 0
                }, {
                    duration: duration || 150,
                    complete: function() {
                        elemWrapper.attr({
                            y: -9999
                        }); // #3088, assuming we're only using this for tooltips
                    }
                });
            },

            /**
             * Add the element to the DOM. All elements must be added this way.
             * 
             * @param {SVGElement|SVGDOMElement} [parent] The parent item to add it to.
             *   If undefined, the element is added to the {@link SVGRenderer.box}.
             *
             * @returns {SVGElement} Returns the SVGElement for chaining.
             *
             * @sample highcharts/members/renderer-g - Elements added to a group
             */
            add: function(parent) {

                var renderer = this.renderer,
                    element = this.element,
                    inserted;

                if (parent) {
                    this.parentGroup = parent;
                }

                // mark as inverted
                this.parentInverted = parent && parent.inverted;

                // build formatted text
                if (this.textStr !== undefined) {
                    renderer.buildText(this);
                }

                // Mark as added
                this.added = true;

                // If we're adding to renderer root, or other elements in the group
                // have a z index, we need to handle it
                if (!parent || parent.handleZ || this.zIndex) {
                    inserted = this.zIndexSetter();
                }

                // If zIndex is not handled, append at the end
                if (!inserted) {
                    (parent ? parent.element : renderer.box).appendChild(element);
                }

                // fire an event for internal hooks
                if (this.onAdd) {
                    this.onAdd();
                }

                return this;
            },

            /**
             * Removes an element from the DOM.
             *
             * @private
             * @param {SVGDOMElement|HTMLDOMElement} element The DOM node to remove.
             */
            safeRemoveChild: function(element) {
                var parentNode = element.parentNode;
                if (parentNode) {
                    parentNode.removeChild(element);
                }
            },

            /**
             * Destroy the element and element wrapper and clear up the DOM and event
             * hooks.
             *
             * @returns {void}
             */
            destroy: function() {
                var wrapper = this,
                    element = wrapper.element || {},
                    parentToClean = wrapper.renderer.isSVG && element.nodeName === 'SPAN' && wrapper.parentGroup,
                    grandParent,
                    key,
                    i;

                // remove events
                element.onclick = element.onmouseout = element.onmouseover = element.onmousemove = element.point = null;
                stop(wrapper); // stop running animations

                if (wrapper.clipPath) {
                    wrapper.clipPath = wrapper.clipPath.destroy();
                }

                // Destroy stops in case this is a gradient object
                if (wrapper.stops) {
                    for (i = 0; i < wrapper.stops.length; i++) {
                        wrapper.stops[i] = wrapper.stops[i].destroy();
                    }
                    wrapper.stops = null;
                }

                // remove element
                wrapper.safeRemoveChild(element);


                wrapper.destroyShadows();


                // In case of useHTML, clean up empty containers emulating SVG groups (#1960, #2393, #2697).
                while (parentToClean && parentToClean.div && parentToClean.div.childNodes.length === 0) {
                    grandParent = parentToClean.parentGroup;
                    wrapper.safeRemoveChild(parentToClean.div);
                    delete parentToClean.div;
                    parentToClean = grandParent;
                }

                // remove from alignObjects
                if (wrapper.alignTo) {
                    erase(wrapper.renderer.alignedObjects, wrapper);
                }

                for (key in wrapper) {
                    delete wrapper[key];
                }

                return null;
            },


            /**
             * @typedef {Object} ShadowOptions
             * @property {string} [color=#000000] The shadow color.
             * @property {number} [offsetX=1] The horizontal offset from the element.
             * @property {number} [offsetY=1] The vertical offset from the element.
             * @property {number} [opacity=0.15] The shadow opacity.
             * @property {number} [width=3] The shadow width or distance from the
             *    element.
             */
            /**
             * Add a shadow to the element. Must be called after the element is added to
             * the DOM. In styled mode, this method is not used, instead use `defs` and
             * filters.
             * 
             * @param {boolean|ShadowOptions} shadowOptions The shadow options. If
             *    `true`, the default options are applied. If `false`, the current
             *    shadow will be removed.
             * @param {SVGElement} [group] The SVG group element where the shadows will 
             *    be applied. The default is to add it to the same parent as the current
             *    element. Internally, this is ised for pie slices, where all the
             *    shadows are added to an element behind all the slices.
             * @param {boolean} [cutOff] Used internally for column shadows.
             *
             * @returns {SVGElement} Returns the SVGElement for chaining.
             *
             * @example
             * renderer.rect(10, 100, 100, 100)
             *     .attr({ fill: 'red' })
             *     .shadow(true);
             */
            shadow: function(shadowOptions, group, cutOff) {
                var shadows = [],
                    i,
                    shadow,
                    element = this.element,
                    strokeWidth,
                    shadowWidth,
                    shadowElementOpacity,

                    // compensate for inverted plot area
                    transform;

                if (!shadowOptions) {
                    this.destroyShadows();

                } else if (!this.shadows) {
                    shadowWidth = pick(shadowOptions.width, 3);
                    shadowElementOpacity = (shadowOptions.opacity || 0.15) / shadowWidth;
                    transform = this.parentInverted ?
                        '(-1,-1)' :
                        '(' + pick(shadowOptions.offsetX, 1) + ', ' + pick(shadowOptions.offsetY, 1) + ')';
                    for (i = 1; i <= shadowWidth; i++) {
                        shadow = element.cloneNode(0);
                        strokeWidth = (shadowWidth * 2) + 1 - (2 * i);
                        attr(shadow, {
                            'isShadow': 'true',
                            'stroke': shadowOptions.color || '#000000',
                            'stroke-opacity': shadowElementOpacity * i,
                            'stroke-width': strokeWidth,
                            'transform': 'translate' + transform,
                            'fill': 'none'
                        });
                        if (cutOff) {
                            attr(shadow, 'height', Math.max(attr(shadow, 'height') - strokeWidth, 0));
                            shadow.cutHeight = strokeWidth;
                        }

                        if (group) {
                            group.element.appendChild(shadow);
                        } else {
                            element.parentNode.insertBefore(shadow, element);
                        }

                        shadows.push(shadow);
                    }

                    this.shadows = shadows;
                }
                return this;

            },

            /**
             * Destroy shadows on the element.
             * @private
             */
            destroyShadows: function() {
                each(this.shadows || [], function(shadow) {
                    this.safeRemoveChild(shadow);
                }, this);
                this.shadows = undefined;
            },



            xGetter: function(key) {
                if (this.element.nodeName === 'circle') {
                    if (key === 'x') {
                        key = 'cx';
                    } else if (key === 'y') {
                        key = 'cy';
                    }
                }
                return this._defaultGetter(key);
            },

            /**
             * Get the current value of an attribute or pseudo attribute, used mainly
             * for animation. Called internally from the {@link SVGRenderer#attr}
             * function.
             *
             * @private
             */
            _defaultGetter: function(key) {
                var ret = pick(this[key], this.element ? this.element.getAttribute(key) : null, 0);

                if (/^[\-0-9\.]+$/.test(ret)) { // is numerical
                    ret = parseFloat(ret);
                }
                return ret;
            },


            dSetter: function(value, key, element) {
                if (value && value.join) { // join path
                    value = value.join(' ');
                }
                if (/(NaN| {2}|^$)/.test(value)) {
                    value = 'M 0 0';
                }
                element.setAttribute(key, value);

                this[key] = value;
            },

            dashstyleSetter: function(value) {
                var i,
                    strokeWidth = this['stroke-width'];

                // If "inherit", like maps in IE, assume 1 (#4981). With HC5 and the new strokeWidth 
                // function, we should be able to use that instead.
                if (strokeWidth === 'inherit') {
                    strokeWidth = 1;
                }
                value = value && value.toLowerCase();
                if (value) {
                    value = value
                        .replace('shortdashdotdot', '3,1,1,1,1,1,')
                        .replace('shortdashdot', '3,1,1,1')
                        .replace('shortdot', '1,1,')
                        .replace('shortdash', '3,1,')
                        .replace('longdash', '8,3,')
                        .replace(/dot/g, '1,3,')
                        .replace('dash', '4,3,')
                        .replace(/,$/, '')
                        .split(','); // ending comma

                    i = value.length;
                    while (i--) {
                        value[i] = pInt(value[i]) * strokeWidth;
                    }
                    value = value.join(',')
                        .replace(/NaN/g, 'none'); // #3226
                    this.element.setAttribute('stroke-dasharray', value);
                }
            },

            alignSetter: function(value) {
                var convert = {
                    left: 'start',
                    center: 'middle',
                    right: 'end'
                };
                this.element.setAttribute('text-anchor', convert[value]);
            },
            opacitySetter: function(value, key, element) {
                this[key] = value;
                element.setAttribute(key, value);
            },
            titleSetter: function(value) {
                var titleNode = this.element.getElementsByTagName('title')[0];
                if (!titleNode) {
                    titleNode = doc.createElementNS(this.SVG_NS, 'title');
                    this.element.appendChild(titleNode);
                }

                // Remove text content if it exists
                if (titleNode.firstChild) {
                    titleNode.removeChild(titleNode.firstChild);
                }

                titleNode.appendChild(
                    doc.createTextNode(
                        (String(pick(value), '')).replace(/<[^>]*>/g, '') // #3276, #3895
                    )
                );
            },
            textSetter: function(value) {
                if (value !== this.textStr) {
                    // Delete bBox memo when the text changes
                    delete this.bBox;

                    this.textStr = value;
                    if (this.added) {
                        this.renderer.buildText(this);
                    }
                }
            },
            fillSetter: function(value, key, element) {
                if (typeof value === 'string') {
                    element.setAttribute(key, value);
                } else if (value) {
                    this.colorGradient(value, key, element);
                }
            },
            visibilitySetter: function(value, key, element) {
                // IE9-11 doesn't handle visibilty:inherit well, so we remove the attribute instead (#2881, #3909)
                if (value === 'inherit') {
                    element.removeAttribute(key);
                } else {
                    element.setAttribute(key, value);
                }
            },
            zIndexSetter: function(value, key) {
                var renderer = this.renderer,
                    parentGroup = this.parentGroup,
                    parentWrapper = parentGroup || renderer,
                    parentNode = parentWrapper.element || renderer.box,
                    childNodes,
                    otherElement,
                    otherZIndex,
                    element = this.element,
                    inserted,
                    run = this.added,
                    i;

                if (defined(value)) {
                    element.zIndex = value; // So we can read it for other elements in the group
                    value = +value;
                    if (this[key] === value) { // Only update when needed (#3865)
                        run = false;
                    }
                    this[key] = value;
                }

                // Insert according to this and other elements' zIndex. Before .add() is called,
                // nothing is done. Then on add, or by later calls to zIndexSetter, the node
                // is placed on the right place in the DOM.
                if (run) {
                    value = this.zIndex;

                    if (value && parentGroup) {
                        parentGroup.handleZ = true;
                    }

                    childNodes = parentNode.childNodes;
                    for (i = 0; i < childNodes.length && !inserted; i++) {
                        otherElement = childNodes[i];
                        otherZIndex = otherElement.zIndex;
                        if (otherElement !== element && (
                                // Insert before the first element with a higher zIndex
                                pInt(otherZIndex) > value ||
                                // If no zIndex given, insert before the first element with a zIndex
                                (!defined(value) && defined(otherZIndex)) ||
                                // Negative zIndex versus no zIndex:
                                // On all levels except the highest. If the parent is <svg>,
                                // then we don't want to put items before <desc> or <defs>
                                (value < 0 && !defined(otherZIndex) && parentNode !== renderer.box)

                            )) {
                            parentNode.insertBefore(element, otherElement);
                            inserted = true;
                        }
                    }
                    if (!inserted) {
                        parentNode.appendChild(element);
                    }
                }
                return inserted;
            },
            _defaultSetter: function(value, key, element) {
                element.setAttribute(key, value);
            }
        };

        // Some shared setters and getters
        SVGElement.prototype.yGetter = SVGElement.prototype.xGetter;
        SVGElement.prototype.translateXSetter = SVGElement.prototype.translateYSetter =
            SVGElement.prototype.rotationSetter = SVGElement.prototype.verticalAlignSetter =
            SVGElement.prototype.scaleXSetter = SVGElement.prototype.scaleYSetter = function(value, key) {
                this[key] = value;
                this.doTransform = true;
            };


        // WebKit and Batik have problems with a stroke-width of zero, so in this case we remove the 
        // stroke attribute altogether. #1270, #1369, #3065, #3072.
        SVGElement.prototype['stroke-widthSetter'] = SVGElement.prototype.strokeSetter = function(value, key, element) {
            this[key] = value;
            // Only apply the stroke attribute if the stroke width is defined and larger than 0
            if (this.stroke && this['stroke-width']) {
                SVGElement.prototype.fillSetter.call(this, this.stroke, 'stroke', element); // use prototype as instance may be overridden
                element.setAttribute('stroke-width', this['stroke-width']);
                this.hasStroke = true;
            } else if (key === 'stroke-width' && value === 0 && this.hasStroke) {
                element.removeAttribute('stroke');
                this.hasStroke = false;
            }
        };


        /**
         * Allows direct access to the Highcharts rendering layer in order to draw
         * primitive shapes like circles, rectangles, paths or text directly on a chart,
         * or independent from any chart. The SVGRenderer represents a wrapper object
         * for SVGin modern browsers and through the VMLRenderer, for VML in IE < 8.
         *
         * An existing chart's renderer can be accessed through {@link Chart#renderer}.
         * The renderer can also be used completely decoupled from a chart.
         *
         * @param {HTMLDOMElement} container - Where to put the SVG in the web page.
         * @param {number} width - The width of the SVG.
         * @param {number} height - The height of the SVG.
         * @param {boolean} [forExport=false] - Whether the rendered content is intended
         *   for export.
         * @param {boolean} [allowHTML=true] - Whether the renderer is allowed to
         *   include HTML text, which will be projected on top of the SVG.
         *
         * @example
         * // Use directly without a chart object.
         * var renderer = new Highcharts.Renderer(parentNode, 600, 400);
         *
         * @sample highcharts/members/renderer-on-chart - Annotating a chart programmatically.
         * @sample highcharts/members/renderer-basic - Independedt SVG drawing.
         *
         * @class
         */
        SVGRenderer = H.SVGRenderer = function() {
            this.init.apply(this, arguments);
        };
        SVGRenderer.prototype = {
            /**
             * A pointer to the renderer's associated Element class. The VMLRenderer
             * will have a pointer to VMLElement here.
             * @type {SVGElement}
             */
            Element: SVGElement,
            SVG_NS: SVG_NS,
            /**
             * Initialize the SVGRenderer. Overridable initiator function that takes
             * the same parameters as the constructor.
             */
            init: function(container, width, height, style, forExport, allowHTML) {
                var renderer = this,
                    boxWrapper,
                    element,
                    desc;

                boxWrapper = renderer.createElement('svg')
                    .attr({
                        'version': '1.1',
                        'class': 'highcharts-root'
                    })

                .css(this.getStyle(style));
                element = boxWrapper.element;
                container.appendChild(element);

                // For browsers other than IE, add the namespace attribute (#1978)
                if (container.innerHTML.indexOf('xmlns') === -1) {
                    attr(element, 'xmlns', this.SVG_NS);
                }

                // object properties
                renderer.isSVG = true;

                /** 
                 * The root `svg` node of the renderer.
                 * @type {SVGDOMElement}
                 */
                this.box = element;
                /** 
                 * The wrapper for the root `svg` node of the renderer.
                 * @type {SVGElement}
                 */
                this.boxWrapper = boxWrapper;
                renderer.alignedObjects = [];

                /**
                 * Page url used for internal references.
                 * @type {string}
                 */
                // #24, #672, #1070
                this.url = (isFirefox || isWebKit) && doc.getElementsByTagName('base').length ?
                    win.location.href
                    .replace(/#.*?$/, '') // remove the hash
                    .replace(/<[^>]*>/g, '') // wing cut HTML
                    .replace(/([\('\)])/g, '\\$1') // escape parantheses and quotes
                    .replace(/ /g, '%20') : // replace spaces (needed for Safari only)
                    '';

                // Add description
                desc = this.createElement('desc').add();
                desc.element.appendChild(doc.createTextNode('Created with Highcharts 5.0.7'));


                renderer.defs = this.createElement('defs').add();
                renderer.allowHTML = allowHTML;
                renderer.forExport = forExport;
                renderer.gradients = {}; // Object where gradient SvgElements are stored
                renderer.cache = {}; // Cache for numerical bounding boxes
                renderer.cacheKeys = [];
                renderer.imgCount = 0;

                renderer.setSize(width, height, false);



                // Issue 110 workaround:
                // In Firefox, if a div is positioned by percentage, its pixel position may land
                // between pixels. The container itself doesn't display this, but an SVG element
                // inside this container will be drawn at subpixel precision. In order to draw
                // sharp lines, this must be compensated for. This doesn't seem to work inside
                // iframes though (like in jsFiddle).
                var subPixelFix, rect;
                if (isFirefox && container.getBoundingClientRect) {
                    subPixelFix = function() {
                        css(container, {
                            left: 0,
                            top: 0
                        });
                        rect = container.getBoundingClientRect();
                        css(container, {
                            left: (Math.ceil(rect.left) - rect.left) + 'px',
                            top: (Math.ceil(rect.top) - rect.top) + 'px'
                        });
                    };

                    // run the fix now
                    subPixelFix();

                    // run it on resize
                    renderer.unSubPixelFix = addEvent(win, 'resize', subPixelFix);
                }
            },



            /**
             * Get the global style setting for the renderer.
             * @private
             * @param  {CSSObject} style - Style settings.
             * @return {CSSObject} The style settings mixed with defaults.
             */
            getStyle: function(style) {
                this.style = extend({

                    fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif', // default font
                    fontSize: '12px'

                }, style);
                return this.style;
            },
            /**
             * Apply the global style on the renderer, mixed with the default styles.
             * @param {CSSObject} style - CSS to apply.
             */
            setStyle: function(style) {
                this.boxWrapper.css(this.getStyle(style));
            },


            /**
             * Detect whether the renderer is hidden. This happens when one of the
             * parent elements has display: none. Used internally to detect when we need
             * to render preliminarily in another div to get the text bounding boxes 
             * right.
             *
             * @returns {boolean} True if it is hidden.
             */
            isHidden: function() { // #608
                return !this.boxWrapper.getBBox().width;
            },

            /**
             * Destroys the renderer and its allocated members.
             */
            destroy: function() {
                var renderer = this,
                    rendererDefs = renderer.defs;
                renderer.box = null;
                renderer.boxWrapper = renderer.boxWrapper.destroy();

                // Call destroy on all gradient elements
                destroyObjectProperties(renderer.gradients || {});
                renderer.gradients = null;

                // Defs are null in VMLRenderer
                // Otherwise, destroy them here.
                if (rendererDefs) {
                    renderer.defs = rendererDefs.destroy();
                }

                // Remove sub pixel fix handler (#982)
                if (renderer.unSubPixelFix) {
                    renderer.unSubPixelFix();
                }

                renderer.alignedObjects = null;

                return null;
            },

            /**
             * Create a wrapper for an SVG element. Serves as a factory for 
             * {@link SVGElement}, but this function is itself mostly called from 
             * primitive factories like {@link SVGRenderer#path}, {@link
             * SVGRenderer#rect} or {@link SVGRenderer#text}.
             * 
             * @param {string} nodeName - The node name, for example `rect`, `g` etc.
             * @returns {SVGElement} The generated SVGElement.
             */
            createElement: function(nodeName) {
                var wrapper = new this.Element();
                wrapper.init(this, nodeName);
                return wrapper;
            },

            /**
             * Dummy function for plugins, called every time the renderer is updated.
             * Prior to Highcharts 5, this was used for the canvg renderer.
             * @function
             */
            draw: noop,

            /**
             * Get converted radial gradient attributes according to the radial
             * reference. Used internally from the {@link SVGElement#colorGradient}
             * function.
             *
             * @private
             */
            getRadialAttr: function(radialReference, gradAttr) {
                return {
                    cx: (radialReference[0] - radialReference[2] / 2) + gradAttr.cx * radialReference[2],
                    cy: (radialReference[1] - radialReference[2] / 2) + gradAttr.cy * radialReference[2],
                    r: gradAttr.r * radialReference[2]
                };
            },

            /**
             * Parse a simple HTML string into SVG tspans. Called internally when text
             *   is set on an SVGElement. The function supports a subset of HTML tags,
             *   CSS text features like `width`, `text-overflow`, `white-space`, and
             *   also attributes like `href` and `style`.
             * @private
             * @param {SVGElement} wrapper The parent SVGElement.
             */
            buildText: function(wrapper) {
                var textNode = wrapper.element,
                    renderer = this,
                    forExport = renderer.forExport,
                    textStr = pick(wrapper.textStr, '').toString(),
                    hasMarkup = textStr.indexOf('<') !== -1,
                    lines,
                    childNodes = textNode.childNodes,
                    clsRegex,
                    styleRegex,
                    hrefRegex,
                    wasTooLong,
                    parentX = attr(textNode, 'x'),
                    textStyles = wrapper.styles,
                    width = wrapper.textWidth,
                    textLineHeight = textStyles && textStyles.lineHeight,
                    textOutline = textStyles && textStyles.textOutline,
                    ellipsis = textStyles && textStyles.textOverflow === 'ellipsis',
                    noWrap = textStyles && textStyles.whiteSpace === 'nowrap',
                    fontSize = textStyles && textStyles.fontSize,
                    textCache,
                    i = childNodes.length,
                    tempParent = width && !wrapper.added && this.box,
                    getLineHeight = function(tspan) {
                        var fontSizeStyle;

                        fontSizeStyle = /(px|em)$/.test(tspan && tspan.style.fontSize) ?
                            tspan.style.fontSize :
                            (fontSize || renderer.style.fontSize || 12);


                        return textLineHeight ?
                            pInt(textLineHeight) :
                            renderer.fontMetrics(
                                fontSizeStyle,
                                // Get the computed size from parent if not explicit
                                tspan.getAttribute('style') ? tspan : textNode
                            ).h;
                    },
                    unescapeAngleBrackets = function(inputStr) {
                        return inputStr.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                    };

                // The buildText code is quite heavy, so if we're not changing something
                // that affects the text, skip it (#6113).
                textCache = [
                    textStr,
                    ellipsis,
                    noWrap,
                    textLineHeight,
                    textOutline,
                    fontSize,
                    width
                ].join(',');
                if (textCache === wrapper.textCache) {
                    return;
                }
                wrapper.textCache = textCache;

                /// remove old text
                while (i--) {
                    textNode.removeChild(childNodes[i]);
                }

                // Skip tspans, add text directly to text node. The forceTSpan is a hook
                // used in text outline hack.
                if (!hasMarkup && !textOutline && !ellipsis && !width && textStr.indexOf(' ') === -1) {
                    textNode.appendChild(doc.createTextNode(unescapeAngleBrackets(textStr)));

                    // Complex strings, add more logic
                } else {

                    clsRegex = /<.*class="([^"]+)".*>/;
                    styleRegex = /<.*style="([^"]+)".*>/;
                    hrefRegex = /<.*href="(http[^"]+)".*>/;

                    if (tempParent) {
                        tempParent.appendChild(textNode); // attach it to the DOM to read offset width
                    }

                    if (hasMarkup) {
                        lines = textStr
                            .replace(/<(b|strong)>/g, '<span style="font-weight:bold">')
                            .replace(/<(i|em)>/g, '<span style="font-style:italic">')
                            .replace(/<a/g, '<span')
                            .replace(/<\/(b|strong|i|em|a)>/g, '</span>')
                            .split(/<br.*?>/g);

                    } else {
                        lines = [textStr];
                    }


                    // Trim empty lines (#5261)
                    lines = grep(lines, function(line) {
                        return line !== '';
                    });


                    // build the lines
                    each(lines, function buildTextLines(line, lineNo) {
                        var spans,
                            spanNo = 0;
                        line = line
                            .replace(/^\s+|\s+$/g, '') // Trim to prevent useless/costly process on the spaces (#5258)
                            .replace(/<span/g, '|||<span')
                            .replace(/<\/span>/g, '</span>|||');
                        spans = line.split('|||');

                        each(spans, function buildTextSpans(span) {
                            if (span !== '' || spans.length === 1) {
                                var attributes = {},
                                    tspan = doc.createElementNS(renderer.SVG_NS, 'tspan'),
                                    spanCls,
                                    spanStyle; // #390
                                if (clsRegex.test(span)) {
                                    spanCls = span.match(clsRegex)[1];
                                    attr(tspan, 'class', spanCls);
                                }
                                if (styleRegex.test(span)) {
                                    spanStyle = span.match(styleRegex)[1].replace(/(;| |^)color([ :])/, '$1fill$2');
                                    attr(tspan, 'style', spanStyle);
                                }
                                if (hrefRegex.test(span) && !forExport) { // Not for export - #1529
                                    attr(tspan, 'onclick', 'location.href=\"' + span.match(hrefRegex)[1] + '\"');
                                    css(tspan, {
                                        cursor: 'pointer'
                                    });
                                }

                                span = unescapeAngleBrackets(span.replace(/<(.|\n)*?>/g, '') || ' ');

                                // Nested tags aren't supported, and cause crash in Safari (#1596)
                                if (span !== ' ') {

                                    // add the text node
                                    tspan.appendChild(doc.createTextNode(span));

                                    if (!spanNo) { // first span in a line, align it to the left
                                        if (lineNo && parentX !== null) {
                                            attributes.x = parentX;
                                        }
                                    } else {
                                        attributes.dx = 0; // #16
                                    }

                                    // add attributes
                                    attr(tspan, attributes);

                                    // Append it
                                    textNode.appendChild(tspan);

                                    // first span on subsequent line, add the line height
                                    if (!spanNo && lineNo) {

                                        // allow getting the right offset height in exporting in IE
                                        if (!svg && forExport) {
                                            css(tspan, {
                                                display: 'block'
                                            });
                                        }

                                        // Set the line height based on the font size of either
                                        // the text element or the tspan element
                                        attr(
                                            tspan,
                                            'dy',
                                            getLineHeight(tspan)
                                        );
                                    }

                                    /*if (width) {
                                    	renderer.breakText(wrapper, width);
                                    }*/

                                    // Check width and apply soft breaks or ellipsis
                                    if (width) {
                                        var words = span.replace(/([^\^])-/g, '$1- ').split(' '), // #1273
                                            hasWhiteSpace = spans.length > 1 || lineNo || (words.length > 1 && !noWrap),
                                            tooLong,
                                            actualWidth,
                                            rest = [],
                                            dy = getLineHeight(tspan),
                                            rotation = wrapper.rotation,
                                            wordStr = span, // for ellipsis
                                            cursor = wordStr.length, // binary search cursor
                                            bBox;

                                        while ((hasWhiteSpace || ellipsis) && (words.length || rest.length)) {
                                            wrapper.rotation = 0; // discard rotation when computing box
                                            bBox = wrapper.getBBox(true);
                                            actualWidth = bBox.width;

                                            // Old IE cannot measure the actualWidth for SVG elements (#2314)
                                            if (!svg && renderer.forExport) {
                                                actualWidth = renderer.measureSpanWidth(tspan.firstChild.data, wrapper.styles);
                                            }

                                            tooLong = actualWidth > width;

                                            // For ellipsis, do a binary search for the correct string length
                                            if (wasTooLong === undefined) {
                                                wasTooLong = tooLong; // First time
                                            }
                                            if (ellipsis && wasTooLong) {
                                                cursor /= 2;

                                                if (wordStr === '' || (!tooLong && cursor < 0.5)) {
                                                    words = []; // All ok, break out
                                                } else {
                                                    wordStr = span.substring(0, wordStr.length + (tooLong ? -1 : 1) * Math.ceil(cursor));
                                                    words = [wordStr + (width > 3 ? '\u2026' : '')];
                                                    tspan.removeChild(tspan.firstChild);
                                                }

                                                // Looping down, this is the first word sequence that is not too long,
                                                // so we can move on to build the next line.
                                            } else if (!tooLong || words.length === 1) {
                                                words = rest;
                                                rest = [];

                                                if (words.length && !noWrap) {
                                                    tspan = doc.createElementNS(SVG_NS, 'tspan');
                                                    attr(tspan, {
                                                        dy: dy,
                                                        x: parentX
                                                    });
                                                    if (spanStyle) { // #390
                                                        attr(tspan, 'style', spanStyle);
                                                    }
                                                    textNode.appendChild(tspan);
                                                }
                                                if (actualWidth > width) { // a single word is pressing it out
                                                    width = actualWidth;
                                                }
                                            } else { // append to existing line tspan
                                                tspan.removeChild(tspan.firstChild);
                                                rest.unshift(words.pop());
                                            }
                                            if (words.length) {
                                                tspan.appendChild(doc.createTextNode(words.join(' ').replace(/- /g, '-')));
                                            }
                                        }
                                        wrapper.rotation = rotation;
                                    }

                                    spanNo++;
                                }
                            }
                        });
                    });

                    if (wasTooLong) {
                        wrapper.attr('title', wrapper.textStr);
                    }
                    if (tempParent) {
                        tempParent.removeChild(textNode); // attach it to the DOM to read offset width
                    }

                    // Apply the text outline
                    if (textOutline && wrapper.applyTextOutline) {
                        wrapper.applyTextOutline(textOutline);
                    }
                }
            },



            /*
            breakText: function (wrapper, width) {
            	var bBox = wrapper.getBBox(),
            		node = wrapper.element,
            		textLength = node.textContent.length,
            		pos = Math.round(width * textLength / bBox.width), // try this position first, based on average character width
            		increment = 0,
            		finalPos;

            	if (bBox.width > width) {
            		while (finalPos === undefined) {
            			textLength = node.getSubStringLength(0, pos);

            			if (textLength <= width) {
            				if (increment === -1) {
            					finalPos = pos;
            				} else {
            					increment = 1;
            				}
            			} else {
            				if (increment === 1) {
            					finalPos = pos - 1;
            				} else {
            					increment = -1;
            				}
            			}
            			pos += increment;
            		}
            	}
            	console.log('width', width, 'stringWidth', node.getSubStringLength(0, finalPos))
            },
            */

            /**
             * Returns white for dark colors and black for bright colors.
             *
             * @param {ColorString} rgba - The color to get the contrast for.
             * @returns {string} The contrast color, either `#000000` or `#FFFFFF`.
             */
            getContrast: function(rgba) {
                rgba = color(rgba).rgba;

                // The threshold may be discussed. Here's a proposal for adding
                // different weight to the color channels (#6216)
                /*
        rgba[0] *= 1; // red
        rgba[1] *= 1.2; // green
        rgba[2] *= 0.7; // blue
        */

                return rgba[0] + rgba[1] + rgba[2] > 2 * 255 ? '#000000' : '#FFFFFF';
            },

            /**
             * Create a button with preset states.
             * @param {string} text - The text or HTML to draw.
             * @param {number} x - The x position of the button's left side.
             * @param {number} y - The y position of the button's top side.
             * @param {Function} callback - The function to execute on button click or 
             *    touch.
             * @param {SVGAttributes} [normalState] - SVG attributes for the normal
             *    state.
             * @param {SVGAttributes} [hoverState] - SVG attributes for the hover state.
             * @param {SVGAttributes} [pressedState] - SVG attributes for the pressed
             *    state.
             * @param {SVGAttributes} [disabledState] - SVG attributes for the disabled
             *    state.
             * @param {Symbol} [shape=rect] - The shape type.
             * @returns {SVGRenderer} The button element.
             */
            button: function(text, x, y, callback, normalState, hoverState, pressedState, disabledState, shape) {
                var label = this.label(text, x, y, shape, null, null, null, null, 'button'),
                    curState = 0;

                // Default, non-stylable attributes
                label.attr(merge({
                    'padding': 8,
                    'r': 2
                }, normalState));


                // Presentational
                var normalStyle,
                    hoverStyle,
                    pressedStyle,
                    disabledStyle;

                // Normal state - prepare the attributes
                normalState = merge({
                    fill: '#f7f7f7',
                    stroke: '#cccccc',
                    'stroke-width': 1,
                    style: {
                        color: '#333333',
                        cursor: 'pointer',
                        fontWeight: 'normal'
                    }
                }, normalState);
                normalStyle = normalState.style;
                delete normalState.style;

                // Hover state
                hoverState = merge(normalState, {
                    fill: '#e6e6e6'
                }, hoverState);
                hoverStyle = hoverState.style;
                delete hoverState.style;

                // Pressed state
                pressedState = merge(normalState, {
                    fill: '#e6ebf5',
                    style: {
                        color: '#000000',
                        fontWeight: 'bold'
                    }
                }, pressedState);
                pressedStyle = pressedState.style;
                delete pressedState.style;

                // Disabled state
                disabledState = merge(normalState, {
                    style: {
                        color: '#cccccc'
                    }
                }, disabledState);
                disabledStyle = disabledState.style;
                delete disabledState.style;


                // Add the events. IE9 and IE10 need mouseover and mouseout to funciton (#667).
                addEvent(label.element, isMS ? 'mouseover' : 'mouseenter', function() {
                    if (curState !== 3) {
                        label.setState(1);
                    }
                });
                addEvent(label.element, isMS ? 'mouseout' : 'mouseleave', function() {
                    if (curState !== 3) {
                        label.setState(curState);
                    }
                });

                label.setState = function(state) {
                    // Hover state is temporary, don't record it
                    if (state !== 1) {
                        label.state = curState = state;
                    }
                    // Update visuals
                    label.removeClass(/highcharts-button-(normal|hover|pressed|disabled)/)
                        .addClass('highcharts-button-' + ['normal', 'hover', 'pressed', 'disabled'][state || 0]);


                    label.attr([normalState, hoverState, pressedState, disabledState][state || 0])
                        .css([normalStyle, hoverStyle, pressedStyle, disabledStyle][state || 0]);

                };



                // Presentational attributes
                label
                    .attr(normalState)
                    .css(extend({
                        cursor: 'default'
                    }, normalStyle));


                return label
                    .on('click', function(e) {
                        if (curState !== 3) {
                            callback.call(label, e);
                        }
                    });
            },

            /**
             * Make a straight line crisper by not spilling out to neighbour pixels.
             * 
             * @param {Array} points - The original points on the format `['M', 0, 0,
             *    'L', 100, 0]`.
             * @param {number} width - The width of the line.
             * @returns {Array} The original points array, but modified to render
             * crisply.
             */
            crispLine: function(points, width) {
                // normalize to a crisp line
                if (points[1] === points[4]) {
                    // Substract due to #1129. Now bottom and left axis gridlines behave the same.
                    points[1] = points[4] = Math.round(points[1]) - (width % 2 / 2);
                }
                if (points[2] === points[5]) {
                    points[2] = points[5] = Math.round(points[2]) + (width % 2 / 2);
                }
                return points;
            },


            /**
             * Draw a path, wraps the SVG `path` element.
             * 
             * @param {Array} [path] An SVG path definition in array form.
             * 
             * @example
             * var path = renderer.path(['M', 10, 10, 'L', 30, 30, 'z'])
             *     .attr({ stroke: '#ff00ff' })
             *     .add();
             * @returns {SVGElement} The generated wrapper element.
             */
            /**
             * Draw a path, wraps the SVG `path` element.
             * 
             * @param {SVGAttributes} [attribs] The initial attributes.
             * @returns {SVGElement} The generated wrapper element.
             */
            path: function(path) {
                var attribs = {

                    fill: 'none'

                };
                if (isArray(path)) {
                    attribs.d = path;
                } else if (isObject(path)) { // attributes
                    extend(attribs, path);
                }
                return this.createElement('path').attr(attribs);
            },

            /**
             * Draw a circle, wraps the SVG `circle` element.
             * 
             * @param {number} [x] The center x position.
             * @param {number} [y] The center y position.
             * @param {number} [r] The radius.
             * @returns {SVGElement} The generated wrapper element.
             */
            /**
             * Draw a circle, wraps the SVG `circle` element.
             * 
             * @param {SVGAttributes} [attribs] The initial attributes.
             * @returns {SVGElement} The generated wrapper element.
             */
            circle: function(x, y, r) {
                var attribs = isObject(x) ? x : {
                        x: x,
                        y: y,
                        r: r
                    },
                    wrapper = this.createElement('circle');

                // Setting x or y translates to cx and cy
                wrapper.xSetter = wrapper.ySetter = function(value, key, element) {
                    element.setAttribute('c' + key, value);
                };

                return wrapper.attr(attribs);
            },

            /**
             * Draw and return an arc.
             * @param {number} [x=0] Center X position.
             * @param {number} [y=0] Center Y position.
             * @param {number} [r=0] The outer radius of the arc.
             * @param {number} [innerR=0] Inner radius like used in donut charts.
             * @param {number} [start=0] The starting angle of the arc in radians, where
             *    0 is to the right and `-Math.PI/2` is up.
             * @param {number} [end=0] The ending angle of the arc in radians, where 0
             *    is to the right and `-Math.PI/2` is up.
             * @returns {SVGElement} The generated wrapper element.
             */
            /**
             * Draw and return an arc. Overloaded function that takes arguments object.
             * @param {SVGAttributes} attribs Initial SVG attributes.
             * @returns {SVGElement} The generated wrapper element.
             */
            arc: function(x, y, r, innerR, start, end) {
                var arc;

                if (isObject(x)) {
                    y = x.y;
                    r = x.r;
                    innerR = x.innerR;
                    start = x.start;
                    end = x.end;
                    x = x.x;
                }

                // Arcs are defined as symbols for the ability to set
                // attributes in attr and animate
                arc = this.symbol('arc', x || 0, y || 0, r || 0, r || 0, {
                    innerR: innerR || 0,
                    start: start || 0,
                    end: end || 0
                });
                arc.r = r; // #959
                return arc;
            },

            /**
             * Draw and return a rectangle.
             * @param {number} [x] Left position.
             * @param {number} [y] Top position.
             * @param {number} [width] Width of the rectangle.
             * @param {number} [height] Height of the rectangle.
             * @param {number} [r] Border corner radius.
             * @param {number} [strokeWidth] A stroke width can be supplied to allow
             *    crisp drawing.
             * @returns {SVGElement} The generated wrapper element.
             */
            /**
             * Draw and return a rectangle.
             * @param {SVGAttributes} [attributes] General SVG attributes for the 
             *    rectangle.
             * @returns {SVGElement} The generated wrapper element.
             */
            rect: function(x, y, width, height, r, strokeWidth) {

                r = isObject(x) ? x.r : r;

                var wrapper = this.createElement('rect'),
                    attribs = isObject(x) ? x : x === undefined ? {} : {
                        x: x,
                        y: y,
                        width: Math.max(width, 0),
                        height: Math.max(height, 0)
                    };


                if (strokeWidth !== undefined) {
                    attribs.strokeWidth = strokeWidth;
                    attribs = wrapper.crisp(attribs);
                }
                attribs.fill = 'none';


                if (r) {
                    attribs.r = r;
                }

                wrapper.rSetter = function(value, key, element) {
                    attr(element, {
                        rx: value,
                        ry: value
                    });
                };

                return wrapper.attr(attribs);
            },

            /**
             * Resize the {@link SVGRenderer#box} and re-align all aligned child
             * elements.
             * @param {number} width The new pixel width.
             * @param {number} height The new pixel height.
             * @param {boolean} animate Whether to animate.
             */
            setSize: function(width, height, animate) {
                var renderer = this,
                    alignedObjects = renderer.alignedObjects,
                    i = alignedObjects.length;

                renderer.width = width;
                renderer.height = height;

                renderer.boxWrapper.animate({
                    width: width,
                    height: height
                }, {
                    step: function() {
                        this.attr({
                            viewBox: '0 0 ' + this.attr('width') + ' ' + this.attr('height')
                        });
                    },
                    duration: pick(animate, true) ? undefined : 0
                });

                while (i--) {
                    alignedObjects[i].align();
                }
            },

            /**
             * Create and return an svg group element.
             * 
             * @param {string} [name] The group will be given a class name of
             * `highcharts-{name}`. This can be used for styling and scripting.
             * @returns {SVGElement} The generated wrapper element.
             */
            g: function(name) {
                var elem = this.createElement('g');
                return name ? elem.attr({
                    'class': 'highcharts-' + name
                }) : elem;
            },

            /**
             * Display an image.
             * @param {string} src The image source.
             * @param {number} [x] The X position.
             * @param {number} [y] The Y position.
             * @param {number} [width] The image width. If omitted, it defaults to the 
             *    image file width.
             * @param {number} [height] The image height. If omitted it defaults to the
             *    image file height.
             * @returns {SVGElement} The generated wrapper element.
             */
            image: function(src, x, y, width, height) {
                var attribs = {
                        preserveAspectRatio: 'none'
                    },
                    elemWrapper;

                // optional properties
                if (arguments.length > 1) {
                    extend(attribs, {
                        x: x,
                        y: y,
                        width: width,
                        height: height
                    });
                }

                elemWrapper = this.createElement('image').attr(attribs);

                // set the href in the xlink namespace
                if (elemWrapper.element.setAttributeNS) {
                    elemWrapper.element.setAttributeNS('http://www.w3.org/1999/xlink',
                        'href', src);
                } else {
                    // could be exporting in IE
                    // using href throws "not supported" in ie7 and under, requries regex shim to fix later
                    elemWrapper.element.setAttribute('hc-svg-href', src);
                }
                return elemWrapper;
            },

            /**
             * Draw a symbol out of pre-defined shape paths from {@SVGRenderer#symbols}.
             * It is used in Highcharts for point makers, which cake a `symbol` option,
             * and label and button backgrounds like in the tooltip and stock flags.
             *
             * @param {Symbol} symbol - The symbol name.
             * @param {number} x - The X coordinate for the top left position.
             * @param {number} y - The Y coordinate for the top left position.
             * @param {number} width - The pixel width.
             * @param {number} height - The pixel height.
             * @param {Object} [options] - Additional options, depending on the actual
             *    symbol drawn. 
             * @param {number} [options.anchorX] - The anchor X position for the
             *    `callout` symbol. This is where the chevron points to.
             * @param {number} [options.anchorY] - The anchor Y position for the
             *    `callout` symbol. This is where the chevron points to.
             * @param {number} [options.end] - The end angle of an `arc` symbol.
             * @param {boolean} [options.open] - Whether to draw `arc` symbol open or
             *    closed.
             * @param {number} [options.r] - The radius of an `arc` symbol, or the
             *    border radius for the `callout` symbol.
             * @param {number} [options.start] - The start angle of an `arc` symbol.
             */
            symbol: function(symbol, x, y, width, height, options) {

                var ren = this,
                    obj,

                    // get the symbol definition function
                    symbolFn = this.symbols[symbol],

                    // check if there's a path defined for this symbol
                    path = defined(x) && symbolFn && this.symbols[symbol](
                        Math.round(x),
                        Math.round(y),
                        width,
                        height,
                        options
                    ),
                    imageRegex = /^url\((.*?)\)$/,
                    imageSrc,
                    centerImage;

                if (symbolFn) {
                    obj = this.path(path);


                    obj.attr('fill', 'none');


                    // expando properties for use in animate and attr
                    extend(obj, {
                        symbolName: symbol,
                        x: x,
                        y: y,
                        width: width,
                        height: height
                    });
                    if (options) {
                        extend(obj, options);
                    }


                    // image symbols
                } else if (imageRegex.test(symbol)) {


                    imageSrc = symbol.match(imageRegex)[1];

                    // Create the image synchronously, add attribs async
                    obj = this.image(imageSrc);

                    // The image width is not always the same as the symbol width. The
                    // image may be centered within the symbol, as is the case when
                    // image shapes are used as label backgrounds, for example in flags.
                    obj.imgwidth = pick(
                        symbolSizes[imageSrc] && symbolSizes[imageSrc].width,
                        options && options.width
                    );
                    obj.imgheight = pick(
                        symbolSizes[imageSrc] && symbolSizes[imageSrc].height,
                        options && options.height
                    );
                    /**
                     * Set the size and position
                     */
                    centerImage = function() {
                        obj.attr({
                            width: obj.width,
                            height: obj.height
                        });
                    };

                    /**
                     * Width and height setters that take both the image's physical size
                     * and the label size into consideration, and translates the image
                     * to center within the label.
                     */
                    each(['width', 'height'], function(key) {
                        obj[key + 'Setter'] = function(value, key) {
                            var attribs = {},
                                imgSize = this['img' + key],
                                trans = key === 'width' ? 'translateX' : 'translateY';
                            this[key] = value;
                            if (defined(imgSize)) {
                                if (this.element) {
                                    this.element.setAttribute(key, imgSize);
                                }
                                if (!this.alignByTranslate) {
                                    attribs[trans] = ((this[key] || 0) - imgSize) / 2;
                                    this.attr(attribs);
                                }
                            }
                        };
                    });


                    if (defined(x)) {
                        obj.attr({
                            x: x,
                            y: y
                        });
                    }
                    obj.isImg = true;

                    if (defined(obj.imgwidth) && defined(obj.imgheight)) {
                        centerImage();
                    } else {
                        // Initialize image to be 0 size so export will still function if there's no cached sizes.
                        obj.attr({
                            width: 0,
                            height: 0
                        });

                        // Create a dummy JavaScript image to get the width and height. Due to a bug in IE < 8,
                        // the created element must be assigned to a variable in order to load (#292).
                        createElement('img', {
                            onload: function() {

                                var chart = charts[ren.chartIndex];

                                // Special case for SVGs on IE11, the width is not accessible until the image is
                                // part of the DOM (#2854).
                                if (this.width === 0) {
                                    css(this, {
                                        position: 'absolute',
                                        top: '-999em'
                                    });
                                    doc.body.appendChild(this);
                                }

                                // Center the image
                                symbolSizes[imageSrc] = { // Cache for next	
                                    width: this.width,
                                    height: this.height
                                };
                                obj.imgwidth = this.width;
                                obj.imgheight = this.height;

                                if (obj.element) {
                                    centerImage();
                                }

                                // Clean up after #2854 workaround.
                                if (this.parentNode) {
                                    this.parentNode.removeChild(this);
                                }

                                // Fire the load event when all external images are loaded
                                ren.imgCount--;
                                if (!ren.imgCount && chart && chart.onload) {
                                    chart.onload();
                                }
                            },
                            src: imageSrc
                        });
                        this.imgCount++;
                    }
                }

                return obj;
            },

            /**
             * @typedef {string} Symbol
             * 
             * Can be one of `arc`, `callout`, `circle`, `diamond`, `square`,
             * `triangle`, `triangle-down`. Symbols are used internally for point
             * markers, button and label borders and backgrounds, or custom shapes.
             * Extendable by adding to {@link SVGRenderer#symbols}.
             */
            /**
             * An extendable collection of functions for defining symbol paths.
             */
            symbols: {
                'circle': function(x, y, w, h) {
                    // Return a full arc
                    return this.arc(x + w / 2, y + h / 2, w / 2, h / 2, {
                        start: 0,
                        end: Math.PI * 2,
                        open: false
                    });
                },

                'square': function(x, y, w, h) {
                    return [
                        'M', x, y,
                        'L', x + w, y,
                        x + w, y + h,
                        x, y + h,
                        'Z'
                    ];
                },

                'triangle': function(x, y, w, h) {
                    return [
                        'M', x + w / 2, y,
                        'L', x + w, y + h,
                        x, y + h,
                        'Z'
                    ];
                },

                'triangle-down': function(x, y, w, h) {
                    return [
                        'M', x, y,
                        'L', x + w, y,
                        x + w / 2, y + h,
                        'Z'
                    ];
                },
                'diamond': function(x, y, w, h) {
                    return [
                        'M', x + w / 2, y,
                        'L', x + w, y + h / 2,
                        x + w / 2, y + h,
                        x, y + h / 2,
                        'Z'
                    ];
                },
                'arc': function(x, y, w, h, options) {
                    var start = options.start,
                        rx = options.r || w,
                        ry = options.r || h || w,
                        end = options.end - 0.001, // to prevent cos and sin of start and end from becoming equal on 360 arcs (related: #1561)
                        innerRadius = options.innerR,
                        open = options.open,
                        cosStart = Math.cos(start),
                        sinStart = Math.sin(start),
                        cosEnd = Math.cos(end),
                        sinEnd = Math.sin(end),
                        longArc = options.end - start < Math.PI ? 0 : 1,
                        arc;

                    arc = [
                        'M',
                        x + rx * cosStart,
                        y + ry * sinStart,
                        'A', // arcTo
                        rx, // x radius
                        ry, // y radius
                        0, // slanting
                        longArc, // long or short arc
                        1, // clockwise
                        x + rx * cosEnd,
                        y + ry * sinEnd
                    ];

                    if (defined(innerRadius)) {
                        arc.push(
                            open ? 'M' : 'L',
                            x + innerRadius * cosEnd,
                            y + innerRadius * sinEnd,
                            'A', // arcTo
                            innerRadius, // x radius
                            innerRadius, // y radius
                            0, // slanting
                            longArc, // long or short arc
                            0, // clockwise
                            x + innerRadius * cosStart,
                            y + innerRadius * sinStart
                        );
                    }

                    arc.push(open ? '' : 'Z'); // close
                    return arc;
                },

                /**
                 * Callout shape used for default tooltips, also used for rounded rectangles in VML
                 */
                callout: function(x, y, w, h, options) {
                    var arrowLength = 6,
                        halfDistance = 6,
                        r = Math.min((options && options.r) || 0, w, h),
                        safeDistance = r + halfDistance,
                        anchorX = options && options.anchorX,
                        anchorY = options && options.anchorY,
                        path;

                    path = [
                        'M', x + r, y,
                        'L', x + w - r, y, // top side
                        'C', x + w, y, x + w, y, x + w, y + r, // top-right corner
                        'L', x + w, y + h - r, // right side
                        'C', x + w, y + h, x + w, y + h, x + w - r, y + h, // bottom-right corner
                        'L', x + r, y + h, // bottom side
                        'C', x, y + h, x, y + h, x, y + h - r, // bottom-left corner
                        'L', x, y + r, // left side
                        'C', x, y, x, y, x + r, y // top-left corner
                    ];

                    // Anchor on right side
                    if (anchorX && anchorX > w) {

                        // Chevron
                        if (anchorY > y + safeDistance && anchorY < y + h - safeDistance) {
                            path.splice(13, 3,
                                'L', x + w, anchorY - halfDistance,
                                x + w + arrowLength, anchorY,
                                x + w, anchorY + halfDistance,
                                x + w, y + h - r
                            );

                            // Simple connector
                        } else {
                            path.splice(13, 3,
                                'L', x + w, h / 2,
                                anchorX, anchorY,
                                x + w, h / 2,
                                x + w, y + h - r
                            );
                        }

                        // Anchor on left side
                    } else if (anchorX && anchorX < 0) {

                        // Chevron
                        if (anchorY > y + safeDistance && anchorY < y + h - safeDistance) {
                            path.splice(33, 3,
                                'L', x, anchorY + halfDistance,
                                x - arrowLength, anchorY,
                                x, anchorY - halfDistance,
                                x, y + r
                            );

                            // Simple connector
                        } else {
                            path.splice(33, 3,
                                'L', x, h / 2,
                                anchorX, anchorY,
                                x, h / 2,
                                x, y + r
                            );
                        }

                    } else if (anchorY && anchorY > h && anchorX > x + safeDistance && anchorX < x + w - safeDistance) { // replace bottom
                        path.splice(23, 3,
                            'L', anchorX + halfDistance, y + h,
                            anchorX, y + h + arrowLength,
                            anchorX - halfDistance, y + h,
                            x + r, y + h
                        );
                    } else if (anchorY && anchorY < 0 && anchorX > x + safeDistance && anchorX < x + w - safeDistance) { // replace top
                        path.splice(3, 3,
                            'L', anchorX - halfDistance, y,
                            anchorX, y - arrowLength,
                            anchorX + halfDistance, y,
                            w - r, y
                        );
                    }

                    return path;
                }
            },

            /**
             * @typedef {SVGElement} ClipRect - A clipping rectangle that can be applied
             * to one or more {@link SVGElement} instances. It is instanciated with the
             * {@link SVGRenderer#clipRect} function and applied with the {@link 
             * SVGElement#clip} function.
             *
             * @example
             * var circle = renderer.circle(100, 100, 100)
             *     .attr({ fill: 'red' })
             *     .add();
             * var clipRect = renderer.clipRect(100, 100, 100, 100);
             *
             * // Leave only the lower right quarter visible
             * circle.clip(clipRect);
             */
            /**
             * Define a clipping rectangle
             * @param {String} id
             * @param {number} x
             * @param {number} y
             * @param {number} width
             * @param {number} height
             * @returns {ClipRect} A clipping rectangle.
             */
            clipRect: function(x, y, width, height) {
                var wrapper,
                    id = H.uniqueKey(),

                    clipPath = this.createElement('clipPath').attr({
                        id: id
                    }).add(this.defs);

                wrapper = this.rect(x, y, width, height, 0).add(clipPath);
                wrapper.id = id;
                wrapper.clipPath = clipPath;
                wrapper.count = 0;

                return wrapper;
            },





            /**
             * Add text to the SVG object
             * @param {String} str
             * @param {number} x Left position
             * @param {number} y Top position
             * @param {Boolean} useHTML Use HTML to render the text
             */
            text: function(str, x, y, useHTML) {

                // declare variables
                var renderer = this,
                    fakeSVG = !svg && renderer.forExport,
                    wrapper,
                    attribs = {};

                if (useHTML && (renderer.allowHTML || !renderer.forExport)) {
                    return renderer.html(str, x, y);
                }

                attribs.x = Math.round(x || 0); // X is always needed for line-wrap logic
                if (y) {
                    attribs.y = Math.round(y);
                }
                if (str || str === 0) {
                    attribs.text = str;
                }

                wrapper = renderer.createElement('text')
                    .attr(attribs);

                // Prevent wrapping from creating false offsetWidths in export in legacy IE (#1079, #1063)
                if (fakeSVG) {
                    wrapper.css({
                        position: 'absolute'
                    });
                }

                if (!useHTML) {
                    wrapper.xSetter = function(value, key, element) {
                        var tspans = element.getElementsByTagName('tspan'),
                            tspan,
                            parentVal = element.getAttribute(key),
                            i;
                        for (i = 0; i < tspans.length; i++) {
                            tspan = tspans[i];
                            // If the x values are equal, the tspan represents a linebreak
                            if (tspan.getAttribute(key) === parentVal) {
                                tspan.setAttribute(key, value);
                            }
                        }
                        element.setAttribute(key, value);
                    };
                }

                return wrapper;
            },

            /**
             * Utility to return the baseline offset and total line height from the font
             * size.
             *
             * @param {?string} fontSize The current font size to inspect. If not given,
             *   the font size will be found from the DOM element.
             * @param {SVGElement|SVGDOMElement} [elem] The element to inspect for a
             *   current font size.
             * @returns {Object} An object containing `h`: the line height, `b`: the
             * baseline relative to the top of the box, and `f`: the font size.
             */
            fontMetrics: function(fontSize, elem) {
                var lineHeight,
                    baseline;


                fontSize = fontSize ||
                    // When the elem is a DOM element (#5932)
                    (elem && elem.style && elem.style.fontSize) ||
                    // Fall back on the renderer style default
                    (this.style && this.style.fontSize);



                // Handle different units
                if (/px/.test(fontSize)) {
                    fontSize = pInt(fontSize);
                } else if (/em/.test(fontSize)) {
                    // The em unit depends on parent items
                    fontSize = parseFloat(fontSize) *
                        (elem ? this.fontMetrics(null, elem.parentNode).f : 16);
                } else {
                    fontSize = 12;
                }

                // Empirical values found by comparing font size and bounding box
                // height. Applies to the default font family.
                // http://jsfiddle.net/highcharts/7xvn7/
                lineHeight = fontSize < 24 ? fontSize + 3 : Math.round(fontSize * 1.2);
                baseline = Math.round(lineHeight * 0.8);

                return {
                    h: lineHeight,
                    b: baseline,
                    f: fontSize
                };
            },

            /**
             * Correct X and Y positioning of a label for rotation (#1764)
             */
            rotCorr: function(baseline, rotation, alterY) {
                var y = baseline;
                if (rotation && alterY) {
                    y = Math.max(y * Math.cos(rotation * deg2rad), 4);
                }
                return {
                    x: (-baseline / 3) * Math.sin(rotation * deg2rad),
                    y: y
                };
            },

            /**
             * Add a label, a text item that can hold a colored or gradient background
             * as well as a border and shadow. Supported custom attributes include
             * `padding`. 
             * 
             * @param {string} str
             * @param {number} x
             * @param {number} y
             * @param {String} shape
             * @param {number} anchorX In case the shape has a pointer, like a flag, this is the
             *	coordinates it should be pinned to
             * @param {number} anchorY
             * @param {Boolean} baseline Whether to position the label relative to the text baseline,
             *	like renderer.text, or to the upper border of the rectangle.
             * @param {String} className Class name for the group
             */
            label: function(str, x, y, shape, anchorX, anchorY, useHTML, baseline, className) {

                var renderer = this,
                    wrapper = renderer.g(className !== 'button' && 'label'),
                    text = wrapper.text = renderer.text('', 0, 0, useHTML)
                    .attr({
                        zIndex: 1
                    }),
                    box,
                    bBox,
                    alignFactor = 0,
                    padding = 3,
                    paddingLeft = 0,
                    width,
                    height,
                    wrapperX,
                    wrapperY,
                    textAlign,
                    deferredAttr = {},
                    strokeWidth,
                    baselineOffset,
                    hasBGImage = /^url\((.*?)\)$/.test(shape),
                    needsBox = hasBGImage,
                    getCrispAdjust,
                    updateBoxSize,
                    updateTextPadding,
                    boxAttr;

                if (className) {
                    wrapper.addClass('highcharts-' + className);
                }


                needsBox = hasBGImage;
                getCrispAdjust = function() {
                    return (strokeWidth || 0) % 2 / 2;
                };



                /**
                 * This function runs after the label is added to the DOM (when the bounding box is
                 * available), and after the text of the label is updated to detect the new bounding
                 * box and reflect it in the border box.
                 */
                updateBoxSize = function() {
                    var style = text.element.style,
                        crispAdjust,
                        attribs = {};

                    bBox = (width === undefined || height === undefined || textAlign) && defined(text.textStr) &&
                        text.getBBox(); //#3295 && 3514 box failure when string equals 0
                    wrapper.width = (width || bBox.width || 0) + 2 * padding + paddingLeft;
                    wrapper.height = (height || bBox.height || 0) + 2 * padding;

                    // Update the label-scoped y offset
                    baselineOffset = padding + renderer.fontMetrics(style && style.fontSize, text).b;


                    if (needsBox) {

                        // Create the border box if it is not already present
                        if (!box) {
                            wrapper.box = box = renderer.symbols[shape] || hasBGImage ? // Symbol definition exists (#5324)
                                renderer.symbol(shape) :
                                renderer.rect();

                            box.addClass(
                                (className === 'button' ? '' : 'highcharts-label-box') + // Don't use label className for buttons
                                (className ? ' highcharts-' + className + '-box' : '')
                            );

                            box.add(wrapper);

                            crispAdjust = getCrispAdjust();
                            attribs.x = crispAdjust;
                            attribs.y = (baseline ? -baselineOffset : 0) + crispAdjust;
                        }

                        // Apply the box attributes
                        attribs.width = Math.round(wrapper.width);
                        attribs.height = Math.round(wrapper.height);

                        box.attr(extend(attribs, deferredAttr));
                        deferredAttr = {};
                    }
                };

                /**
                 * This function runs after setting text or padding, but only if padding is changed
                 */
                updateTextPadding = function() {
                    var textX = paddingLeft + padding,
                        textY;

                    // determin y based on the baseline
                    textY = baseline ? 0 : baselineOffset;

                    // compensate for alignment
                    if (defined(width) && bBox && (textAlign === 'center' || textAlign === 'right')) {
                        textX += {
                            center: 0.5,
                            right: 1
                        }[textAlign] * (width - bBox.width);
                    }

                    // update if anything changed
                    if (textX !== text.x || textY !== text.y) {
                        text.attr('x', textX);
                        if (textY !== undefined) {
                            text.attr('y', textY);
                        }
                    }

                    // record current values
                    text.x = textX;
                    text.y = textY;
                };

                /**
                 * Set a box attribute, or defer it if the box is not yet created
                 * @param {Object} key
                 * @param {Object} value
                 */
                boxAttr = function(key, value) {
                    if (box) {
                        box.attr(key, value);
                    } else {
                        deferredAttr[key] = value;
                    }
                };

                /**
                 * After the text element is added, get the desired size of the border box
                 * and add it before the text in the DOM.
                 */
                wrapper.onAdd = function() {
                    text.add(wrapper);
                    wrapper.attr({
                        text: (str || str === 0) ? str : '', // alignment is available now // #3295: 0 not rendered if given as a value
                        x: x,
                        y: y
                    });

                    if (box && defined(anchorX)) {
                        wrapper.attr({
                            anchorX: anchorX,
                            anchorY: anchorY
                        });
                    }
                };

                /*
                 * Add specific attribute setters.
                 */

                // only change local variables
                wrapper.widthSetter = function(value) {
                    width = value;
                };
                wrapper.heightSetter = function(value) {
                    height = value;
                };
                wrapper['text-alignSetter'] = function(value) {
                    textAlign = value;
                };
                wrapper.paddingSetter = function(value) {
                    if (defined(value) && value !== padding) {
                        padding = wrapper.padding = value;
                        updateTextPadding();
                    }
                };
                wrapper.paddingLeftSetter = function(value) {
                    if (defined(value) && value !== paddingLeft) {
                        paddingLeft = value;
                        updateTextPadding();
                    }
                };


                // change local variable and prevent setting attribute on the group
                wrapper.alignSetter = function(value) {
                    value = {
                        left: 0,
                        center: 0.5,
                        right: 1
                    }[value];
                    if (value !== alignFactor) {
                        alignFactor = value;
                        if (bBox) { // Bounding box exists, means we're dynamically changing
                            wrapper.attr({
                                x: wrapperX
                            }); // #5134
                        }
                    }
                };

                // apply these to the box and the text alike
                wrapper.textSetter = function(value) {
                    if (value !== undefined) {
                        text.textSetter(value);
                    }
                    updateBoxSize();
                    updateTextPadding();
                };

                // apply these to the box but not to the text
                wrapper['stroke-widthSetter'] = function(value, key) {
                    if (value) {
                        needsBox = true;
                    }
                    strokeWidth = this['stroke-width'] = value;
                    boxAttr(key, value);
                };

                wrapper.strokeSetter = wrapper.fillSetter = wrapper.rSetter = function(value, key) {
                    if (key === 'fill' && value) {
                        needsBox = true;
                    }
                    boxAttr(key, value);
                };

                wrapper.anchorXSetter = function(value, key) {
                    anchorX = value;
                    boxAttr(key, Math.round(value) - getCrispAdjust() - wrapperX);
                };
                wrapper.anchorYSetter = function(value, key) {
                    anchorY = value;
                    boxAttr(key, value - wrapperY);
                };

                // rename attributes
                wrapper.xSetter = function(value) {
                    wrapper.x = value; // for animation getter
                    if (alignFactor) {
                        value -= alignFactor * ((width || bBox.width) + 2 * padding);
                    }
                    wrapperX = Math.round(value);
                    wrapper.attr('translateX', wrapperX);
                };
                wrapper.ySetter = function(value) {
                    wrapperY = wrapper.y = Math.round(value);
                    wrapper.attr('translateY', wrapperY);
                };

                // Redirect certain methods to either the box or the text
                var baseCss = wrapper.css;
                return extend(wrapper, {
                    /**
                     * Pick up some properties and apply them to the text instead of the
                     * wrapper.
                     * @ignore
                     */
                    css: function(styles) {
                        if (styles) {
                            var textStyles = {};
                            styles = merge(styles); // create a copy to avoid altering the original object (#537)
                            each(wrapper.textProps, function(prop) {
                                if (styles[prop] !== undefined) {
                                    textStyles[prop] = styles[prop];
                                    delete styles[prop];
                                }
                            });
                            text.css(textStyles);
                        }
                        return baseCss.call(wrapper, styles);
                    },
                    /**
                     * Return the bounding box of the box, not the group.
                     * @ignore
                     */
                    getBBox: function() {
                        return {
                            width: bBox.width + 2 * padding,
                            height: bBox.height + 2 * padding,
                            x: bBox.x - padding,
                            y: bBox.y - padding
                        };
                    },

                    /**
                     * Apply the shadow to the box.
                     * @ignore
                     */
                    shadow: function(b) {
                        if (b) {
                            updateBoxSize();
                            if (box) {
                                box.shadow(b);
                            }
                        }
                        return wrapper;
                    },

                    /**
                     * Destroy and release memory.
                     * @ignore
                     */
                    destroy: function() {

                        // Added by button implementation
                        removeEvent(wrapper.element, 'mouseenter');
                        removeEvent(wrapper.element, 'mouseleave');

                        if (text) {
                            text = text.destroy();
                        }
                        if (box) {
                            box = box.destroy();
                        }
                        // Call base implementation to destroy the rest
                        SVGElement.prototype.destroy.call(wrapper);

                        // Release local pointers (#1298)
                        wrapper = renderer = updateBoxSize = updateTextPadding = boxAttr = null;
                    }
                });
            }
        }; // end SVGRenderer


        // general renderer
        H.Renderer = SVGRenderer;

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var attr = H.attr,
            createElement = H.createElement,
            css = H.css,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            isFirefox = H.isFirefox,
            isMS = H.isMS,
            isWebKit = H.isWebKit,
            pInt = H.pInt,
            SVGElement = H.SVGElement,
            SVGRenderer = H.SVGRenderer,
            win = H.win,
            wrap = H.wrap;

        // Extend SvgElement for useHTML option
        extend(SVGElement.prototype, /** @lends SVGElement.prototype */ {
            /**
             * Apply CSS to HTML elements. This is used in text within SVG rendering and
             * by the VML renderer
             */
            htmlCss: function(styles) {
                var wrapper = this,
                    element = wrapper.element,
                    textWidth = styles && element.tagName === 'SPAN' && styles.width;

                if (textWidth) {
                    delete styles.width;
                    wrapper.textWidth = textWidth;
                    wrapper.updateTransform();
                }
                if (styles && styles.textOverflow === 'ellipsis') {
                    styles.whiteSpace = 'nowrap';
                    styles.overflow = 'hidden';
                }
                wrapper.styles = extend(wrapper.styles, styles);
                css(wrapper.element, styles);

                return wrapper;
            },

            /**
             * VML and useHTML method for calculating the bounding box based on offsets
             * @param {Boolean} refresh Whether to force a fresh value from the DOM or to
             * use the cached value
             *
             * @return {Object} A hash containing values for x, y, width and height
             */

            htmlGetBBox: function() {
                var wrapper = this,
                    element = wrapper.element;

                // faking getBBox in exported SVG in legacy IE
                // faking getBBox in exported SVG in legacy IE (is this a duplicate of the fix for #1079?)
                if (element.nodeName === 'text') {
                    element.style.position = 'absolute';
                }

                return {
                    x: element.offsetLeft,
                    y: element.offsetTop,
                    width: element.offsetWidth,
                    height: element.offsetHeight
                };
            },

            /**
             * VML override private method to update elements based on internal
             * properties based on SVG transform
             */
            htmlUpdateTransform: function() {
                // aligning non added elements is expensive
                if (!this.added) {
                    this.alignOnAdd = true;
                    return;
                }

                var wrapper = this,
                    renderer = wrapper.renderer,
                    elem = wrapper.element,
                    translateX = wrapper.translateX || 0,
                    translateY = wrapper.translateY || 0,
                    x = wrapper.x || 0,
                    y = wrapper.y || 0,
                    align = wrapper.textAlign || 'left',
                    alignCorrection = {
                        left: 0,
                        center: 0.5,
                        right: 1
                    }[align],
                    styles = wrapper.styles;

                // apply translate
                css(elem, {
                    marginLeft: translateX,
                    marginTop: translateY
                });


                if (wrapper.shadows) { // used in labels/tooltip
                    each(wrapper.shadows, function(shadow) {
                        css(shadow, {
                            marginLeft: translateX + 1,
                            marginTop: translateY + 1
                        });
                    });
                }


                // apply inversion
                if (wrapper.inverted) { // wrapper is a group
                    each(elem.childNodes, function(child) {
                        renderer.invertChild(child, elem);
                    });
                }

                if (elem.tagName === 'SPAN') {

                    var rotation = wrapper.rotation,
                        baseline,
                        textWidth = pInt(wrapper.textWidth),
                        whiteSpace = styles && styles.whiteSpace,
                        currentTextTransform = [rotation, align, elem.innerHTML, wrapper.textWidth, wrapper.textAlign].join(',');

                    if (currentTextTransform !== wrapper.cTT) { // do the calculations and DOM access only if properties changed


                        baseline = renderer.fontMetrics(elem.style.fontSize).b;

                        // Renderer specific handling of span rotation
                        if (defined(rotation)) {
                            wrapper.setSpanRotation(rotation, alignCorrection, baseline);
                        }

                        // Reset multiline/ellipsis in order to read width (#4928, #5417)
                        css(elem, {
                            width: '',
                            whiteSpace: whiteSpace || 'nowrap'
                        });

                        // Update textWidth
                        if (elem.offsetWidth > textWidth && /[ \-]/.test(elem.textContent || elem.innerText)) { // #983, #1254
                            css(elem, {
                                width: textWidth + 'px',
                                display: 'block',
                                whiteSpace: whiteSpace || 'normal' // #3331
                            });
                        }


                        wrapper.getSpanCorrection(elem.offsetWidth, baseline, alignCorrection, rotation, align);
                    }

                    // apply position with correction
                    css(elem, {
                        left: (x + (wrapper.xCorr || 0)) + 'px',
                        top: (y + (wrapper.yCorr || 0)) + 'px'
                    });

                    // force reflow in webkit to apply the left and top on useHTML element (#1249)
                    if (isWebKit) {
                        baseline = elem.offsetHeight; // assigned to baseline for lint purpose
                    }

                    // record current text transform
                    wrapper.cTT = currentTextTransform;
                }
            },

            /**
             * Set the rotation of an individual HTML span
             */
            setSpanRotation: function(rotation, alignCorrection, baseline) {
                var rotationStyle = {},
                    cssTransformKey = isMS ? '-ms-transform' : isWebKit ? '-webkit-transform' : isFirefox ? 'MozTransform' : win.opera ? '-o-transform' : '';

                rotationStyle[cssTransformKey] = rotationStyle.transform = 'rotate(' + rotation + 'deg)';
                rotationStyle[cssTransformKey + (isFirefox ? 'Origin' : '-origin')] = rotationStyle.transformOrigin = (alignCorrection * 100) + '% ' + baseline + 'px';
                css(this.element, rotationStyle);
            },

            /**
             * Get the correction in X and Y positioning as the element is rotated.
             */
            getSpanCorrection: function(width, baseline, alignCorrection) {
                this.xCorr = -width * alignCorrection;
                this.yCorr = -baseline;
            }
        });

        // Extend SvgRenderer for useHTML option.
        extend(SVGRenderer.prototype, /** @lends SVGRenderer.prototype */ {
            /**
             * Create HTML text node. This is used by the VML renderer as well as the SVG
             * renderer through the useHTML option.
             *
             * @param {String} str
             * @param {Number} x
             * @param {Number} y
             */
            html: function(str, x, y) {
                var wrapper = this.createElement('span'),
                    element = wrapper.element,
                    renderer = wrapper.renderer,
                    isSVG = renderer.isSVG,
                    addSetters = function(element, style) {
                        // These properties are set as attributes on the SVG group, and as
                        // identical CSS properties on the div. (#3542)
                        each(['opacity', 'visibility'], function(prop) {
                            wrap(element, prop + 'Setter', function(proceed, value, key, elem) {
                                proceed.call(this, value, key, elem);
                                style[key] = value;
                            });
                        });
                    };

                // Text setter
                wrapper.textSetter = function(value) {
                    if (value !== element.innerHTML) {
                        delete this.bBox;
                    }
                    element.innerHTML = this.textStr = value;
                    wrapper.htmlUpdateTransform();
                };

                // Add setters for the element itself (#4938)
                if (isSVG) { // #4938, only for HTML within SVG
                    addSetters(wrapper, wrapper.element.style);
                }

                // Various setters which rely on update transform
                wrapper.xSetter = wrapper.ySetter = wrapper.alignSetter = wrapper.rotationSetter = function(value, key) {
                    if (key === 'align') {
                        key = 'textAlign'; // Do not overwrite the SVGElement.align method. Same as VML.
                    }
                    wrapper[key] = value;
                    wrapper.htmlUpdateTransform();
                };

                // Set the default attributes
                wrapper
                    .attr({
                        text: str,
                        x: Math.round(x),
                        y: Math.round(y)
                    })
                    .css({

                        fontFamily: this.style.fontFamily,
                        fontSize: this.style.fontSize,

                        position: 'absolute'
                    });

                // Keep the whiteSpace style outside the wrapper.styles collection
                element.style.whiteSpace = 'nowrap';

                // Use the HTML specific .css method
                wrapper.css = wrapper.htmlCss;

                // This is specific for HTML within SVG
                if (isSVG) {
                    wrapper.add = function(svgGroupWrapper) {

                        var htmlGroup,
                            container = renderer.box.parentNode,
                            parentGroup,
                            parents = [];

                        this.parentGroup = svgGroupWrapper;

                        // Create a mock group to hold the HTML elements
                        if (svgGroupWrapper) {
                            htmlGroup = svgGroupWrapper.div;
                            if (!htmlGroup) {

                                // Read the parent chain into an array and read from top down
                                parentGroup = svgGroupWrapper;
                                while (parentGroup) {

                                    parents.push(parentGroup);

                                    // Move up to the next parent group
                                    parentGroup = parentGroup.parentGroup;
                                }

                                // Ensure dynamically updating position when any parent is translated
                                each(parents.reverse(), function(parentGroup) {
                                    var htmlGroupStyle,
                                        cls = attr(parentGroup.element, 'class');

                                    if (cls) {
                                        cls = {
                                            className: cls
                                        };
                                    } // else null

                                    // Create a HTML div and append it to the parent div to emulate
                                    // the SVG group structure
                                    htmlGroup = parentGroup.div = parentGroup.div || createElement('div', cls, {
                                        position: 'absolute',
                                        left: (parentGroup.translateX || 0) + 'px',
                                        top: (parentGroup.translateY || 0) + 'px',
                                        display: parentGroup.display,
                                        opacity: parentGroup.opacity, // #5075
                                        pointerEvents: parentGroup.styles && parentGroup.styles.pointerEvents // #5595
                                    }, htmlGroup || container); // the top group is appended to container

                                    // Shortcut
                                    htmlGroupStyle = htmlGroup.style;

                                    // Set listeners to update the HTML div's position whenever the SVG group
                                    // position is changed
                                    extend(parentGroup, {
                                        on: function() {
                                            wrapper.on.apply({
                                                element: parents[0].div
                                            }, arguments);
                                            return parentGroup;
                                        },
                                        translateXSetter: function(value, key) {
                                            htmlGroupStyle.left = value + 'px';
                                            parentGroup[key] = value;
                                            parentGroup.doTransform = true;
                                        },
                                        translateYSetter: function(value, key) {
                                            htmlGroupStyle.top = value + 'px';
                                            parentGroup[key] = value;
                                            parentGroup.doTransform = true;
                                        }
                                    });
                                    addSetters(parentGroup, htmlGroupStyle);
                                });

                            }
                        } else {
                            htmlGroup = container;
                        }

                        htmlGroup.appendChild(element);

                        // Shared with VML:
                        wrapper.added = true;
                        if (wrapper.alignOnAdd) {
                            wrapper.htmlUpdateTransform();
                        }

                        return wrapper;
                    };
                }
                return wrapper;
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

        var VMLRenderer,
            VMLRendererExtension,
            VMLElement,

            createElement = H.createElement,
            css = H.css,
            defined = H.defined,
            deg2rad = H.deg2rad,
            discardElement = H.discardElement,
            doc = H.doc,
            each = H.each,
            erase = H.erase,
            extend = H.extend,
            extendClass = H.extendClass,
            isArray = H.isArray,
            isNumber = H.isNumber,
            isObject = H.isObject,
            merge = H.merge,
            noop = H.noop,
            pick = H.pick,
            pInt = H.pInt,
            svg = H.svg,
            SVGElement = H.SVGElement,
            SVGRenderer = H.SVGRenderer,
            win = H.win;

        /* ****************************************************************************
         *                                                                            *
         * START OF INTERNET EXPLORER <= 8 SPECIFIC CODE                              *
         *                                                                            *
         * For applications and websites that don't need IE support, like platform    *
         * targeted mobile apps and web apps, this code can be removed.               *
         *                                                                            *
         *****************************************************************************/

        /**
         * @constructor
         */
        if (!svg) {

            /**
             * The VML element wrapper.
             */
            VMLElement = {

                docMode8: doc && doc.documentMode === 8,

                /**
                 * Initialize a new VML element wrapper. It builds the markup as a string
                 * to minimize DOM traffic.
                 * @param {Object} renderer
                 * @param {Object} nodeName
                 */
                init: function(renderer, nodeName) {
                    var wrapper = this,
                        markup = ['<', nodeName, ' filled="f" stroked="f"'],
                        style = ['position: ', 'absolute', ';'],
                        isDiv = nodeName === 'div';

                    // divs and shapes need size
                    if (nodeName === 'shape' || isDiv) {
                        style.push('left:0;top:0;width:1px;height:1px;');
                    }
                    style.push('visibility: ', isDiv ? 'hidden' : 'visible');

                    markup.push(' style="', style.join(''), '"/>');

                    // create element with default attributes and style
                    if (nodeName) {
                        markup = isDiv || nodeName === 'span' || nodeName === 'img' ?
                            markup.join('') :
                            renderer.prepVML(markup);
                        wrapper.element = createElement(markup);
                    }

                    wrapper.renderer = renderer;
                },

                /**
                 * Add the node to the given parent
                 * @param {Object} parent
                 */
                add: function(parent) {
                    var wrapper = this,
                        renderer = wrapper.renderer,
                        element = wrapper.element,
                        box = renderer.box,
                        inverted = parent && parent.inverted,

                        // get the parent node
                        parentNode = parent ?
                        parent.element || parent :
                        box;

                    if (parent) {
                        this.parentGroup = parent;
                    }

                    // if the parent group is inverted, apply inversion on all children
                    if (inverted) { // only on groups
                        renderer.invertChild(element, parentNode);
                    }

                    // append it
                    parentNode.appendChild(element);

                    // align text after adding to be able to read offset
                    wrapper.added = true;
                    if (wrapper.alignOnAdd && !wrapper.deferUpdateTransform) {
                        wrapper.updateTransform();
                    }

                    // fire an event for internal hooks
                    if (wrapper.onAdd) {
                        wrapper.onAdd();
                    }

                    // IE8 Standards can't set the class name before the element is appended
                    if (this.className) {
                        this.attr('class', this.className);
                    }

                    return wrapper;
                },

                /**
                 * VML always uses htmlUpdateTransform
                 */
                updateTransform: SVGElement.prototype.htmlUpdateTransform,

                /**
                 * Set the rotation of a span with oldIE's filter
                 */
                setSpanRotation: function() {
                    // Adjust for alignment and rotation. Rotation of useHTML content is not yet implemented
                    // but it can probably be implemented for Firefox 3.5+ on user request. FF3.5+
                    // has support for CSS3 transform. The getBBox method also needs to be updated
                    // to compensate for the rotation, like it currently does for SVG.
                    // Test case: http://jsfiddle.net/highcharts/Ybt44/

                    var rotation = this.rotation,
                        costheta = Math.cos(rotation * deg2rad),
                        sintheta = Math.sin(rotation * deg2rad);

                    css(this.element, {
                        filter: rotation ? ['progid:DXImageTransform.Microsoft.Matrix(M11=', costheta,
                            ', M12=', -sintheta, ', M21=', sintheta, ', M22=', costheta,
                            ', sizingMethod=\'auto expand\')'
                        ].join('') : 'none'
                    });
                },

                /**
                 * Get the positioning correction for the span after rotating.
                 */
                getSpanCorrection: function(width, baseline, alignCorrection, rotation, align) {

                    var costheta = rotation ? Math.cos(rotation * deg2rad) : 1,
                        sintheta = rotation ? Math.sin(rotation * deg2rad) : 0,
                        height = pick(this.elemHeight, this.element.offsetHeight),
                        quad,
                        nonLeft = align && align !== 'left';

                    // correct x and y
                    this.xCorr = costheta < 0 && -width;
                    this.yCorr = sintheta < 0 && -height;

                    // correct for baseline and corners spilling out after rotation
                    quad = costheta * sintheta < 0;
                    this.xCorr += sintheta * baseline * (quad ? 1 - alignCorrection : alignCorrection);
                    this.yCorr -= costheta * baseline * (rotation ? (quad ? alignCorrection : 1 - alignCorrection) : 1);
                    // correct for the length/height of the text
                    if (nonLeft) {
                        this.xCorr -= width * alignCorrection * (costheta < 0 ? -1 : 1);
                        if (rotation) {
                            this.yCorr -= height * alignCorrection * (sintheta < 0 ? -1 : 1);
                        }
                        css(this.element, {
                            textAlign: align
                        });
                    }
                },

                /**
                 * Converts a subset of an SVG path definition to its VML counterpart. Takes an array
                 * as the parameter and returns a string.
                 */
                pathToVML: function(value) {
                    // convert paths
                    var i = value.length,
                        path = [];

                    while (i--) {

                        // Multiply by 10 to allow subpixel precision.
                        // Substracting half a pixel seems to make the coordinates
                        // align with SVG, but this hasn't been tested thoroughly
                        if (isNumber(value[i])) {
                            path[i] = Math.round(value[i] * 10) - 5;
                        } else if (value[i] === 'Z') { // close the path
                            path[i] = 'x';
                        } else {
                            path[i] = value[i];

                            // When the start X and end X coordinates of an arc are too close,
                            // they are rounded to the same value above. In this case, substract or
                            // add 1 from the end X and Y positions. #186, #760, #1371, #1410.
                            if (value.isArc && (value[i] === 'wa' || value[i] === 'at')) {
                                // Start and end X
                                if (path[i + 5] === path[i + 7]) {
                                    path[i + 7] += value[i + 7] > value[i + 5] ? 1 : -1;
                                }
                                // Start and end Y
                                if (path[i + 6] === path[i + 8]) {
                                    path[i + 8] += value[i + 8] > value[i + 6] ? 1 : -1;
                                }
                            }
                        }
                    }


                    // Loop up again to handle path shortcuts (#2132)
                    /*while (i++ < path.length) {
                    	if (path[i] === 'H') { // horizontal line to
                    		path[i] = 'L';
                    		path.splice(i + 2, 0, path[i - 1]);
                    	} else if (path[i] === 'V') { // vertical line to
                    		path[i] = 'L';
                    		path.splice(i + 1, 0, path[i - 2]);
                    	}
                    }*/
                    return path.join(' ') || 'x';
                },

                /**
                 * Set the element's clipping to a predefined rectangle
                 *
                 * @param {String} id The id of the clip rectangle
                 */
                clip: function(clipRect) {
                    var wrapper = this,
                        clipMembers,
                        cssRet;

                    if (clipRect) {
                        clipMembers = clipRect.members;
                        erase(clipMembers, wrapper); // Ensure unique list of elements (#1258)
                        clipMembers.push(wrapper);
                        wrapper.destroyClip = function() {
                            erase(clipMembers, wrapper);
                        };
                        cssRet = clipRect.getCSS(wrapper);

                    } else {
                        if (wrapper.destroyClip) {
                            wrapper.destroyClip();
                        }
                        cssRet = {
                            clip: wrapper.docMode8 ? 'inherit' : 'rect(auto)'
                        }; // #1214
                    }

                    return wrapper.css(cssRet);

                },

                /**
                 * Set styles for the element
                 * @param {Object} styles
                 */
                css: SVGElement.prototype.htmlCss,

                /**
                 * Removes a child either by removeChild or move to garbageBin.
                 * Issue 490; in VML removeChild results in Orphaned nodes according to sIEve, discardElement does not.
                 */
                safeRemoveChild: function(element) {
                    // discardElement will detach the node from its parent before attaching it
                    // to the garbage bin. Therefore it is important that the node is attached and have parent.
                    if (element.parentNode) {
                        discardElement(element);
                    }
                },

                /**
                 * Extend element.destroy by removing it from the clip members array
                 */
                destroy: function() {
                    if (this.destroyClip) {
                        this.destroyClip();
                    }

                    return SVGElement.prototype.destroy.apply(this);
                },

                /**
                 * Add an event listener. VML override for normalizing event parameters.
                 * @param {String} eventType
                 * @param {Function} handler
                 */
                on: function(eventType, handler) {
                    // simplest possible event model for internal use
                    this.element['on' + eventType] = function() {
                        var evt = win.event;
                        evt.target = evt.srcElement;
                        handler(evt);
                    };
                    return this;
                },

                /**
                 * In stacked columns, cut off the shadows so that they don't overlap
                 */
                cutOffPath: function(path, length) {

                    var len;

                    path = path.split(/[ ,]/); // The extra comma tricks the trailing comma remover in "gulp scripts" task
                    len = path.length;

                    if (len === 9 || len === 11) {
                        path[len - 4] = path[len - 2] = pInt(path[len - 2]) - 10 * length;
                    }
                    return path.join(' ');
                },

                /**
                 * Apply a drop shadow by copying elements and giving them different strokes
                 * @param {Boolean|Object} shadowOptions
                 */
                shadow: function(shadowOptions, group, cutOff) {
                    var shadows = [],
                        i,
                        element = this.element,
                        renderer = this.renderer,
                        shadow,
                        elemStyle = element.style,
                        markup,
                        path = element.path,
                        strokeWidth,
                        modifiedPath,
                        shadowWidth,
                        shadowElementOpacity;

                    // some times empty paths are not strings
                    if (path && typeof path.value !== 'string') {
                        path = 'x';
                    }
                    modifiedPath = path;

                    if (shadowOptions) {
                        shadowWidth = pick(shadowOptions.width, 3);
                        shadowElementOpacity = (shadowOptions.opacity || 0.15) / shadowWidth;
                        for (i = 1; i <= 3; i++) {

                            strokeWidth = (shadowWidth * 2) + 1 - (2 * i);

                            // Cut off shadows for stacked column items
                            if (cutOff) {
                                modifiedPath = this.cutOffPath(path.value, strokeWidth + 0.5);
                            }

                            markup = ['<shape isShadow="true" strokeweight="', strokeWidth,
                                '" filled="false" path="', modifiedPath,
                                '" coordsize="10 10" style="', element.style.cssText, '" />'
                            ];

                            shadow = createElement(renderer.prepVML(markup),
                                null, {
                                    left: pInt(elemStyle.left) + pick(shadowOptions.offsetX, 1),
                                    top: pInt(elemStyle.top) + pick(shadowOptions.offsetY, 1)
                                }
                            );
                            if (cutOff) {
                                shadow.cutOff = strokeWidth + 1;
                            }

                            // apply the opacity
                            markup = [
                                '<stroke color="',
                                shadowOptions.color || '#000000',
                                '" opacity="', shadowElementOpacity * i, '"/>'
                            ];
                            createElement(renderer.prepVML(markup), null, null, shadow);


                            // insert it
                            if (group) {
                                group.element.appendChild(shadow);
                            } else {
                                element.parentNode.insertBefore(shadow, element);
                            }

                            // record it
                            shadows.push(shadow);

                        }

                        this.shadows = shadows;
                    }
                    return this;
                },
                updateShadows: noop, // Used in SVG only

                setAttr: function(key, value) {
                    if (this.docMode8) { // IE8 setAttribute bug
                        this.element[key] = value;
                    } else {
                        this.element.setAttribute(key, value);
                    }
                },
                classSetter: function(value) {
                    // IE8 Standards mode has problems retrieving the className unless set like this.
                    // IE8 Standards can't set the class name before the element is appended.
                    (this.added ? this.element : this).className = value;
                },
                dashstyleSetter: function(value, key, element) {
                    var strokeElem = element.getElementsByTagName('stroke')[0] ||
                        createElement(this.renderer.prepVML(['<stroke/>']), null, null, element);
                    strokeElem[key] = value || 'solid';
                    this[key] = value;
                    /* because changing stroke-width will change the dash length
				and cause an epileptic effect */
                },
                dSetter: function(value, key, element) {
                    var i,
                        shadows = this.shadows;
                    value = value || [];
                    this.d = value.join && value.join(' '); // used in getter for animation

                    element.path = value = this.pathToVML(value);

                    // update shadows
                    if (shadows) {
                        i = shadows.length;
                        while (i--) {
                            shadows[i].path = shadows[i].cutOff ? this.cutOffPath(value, shadows[i].cutOff) : value;
                        }
                    }
                    this.setAttr(key, value);
                },
                fillSetter: function(value, key, element) {
                    var nodeName = element.nodeName;
                    if (nodeName === 'SPAN') { // text color
                        element.style.color = value;
                    } else if (nodeName !== 'IMG') { // #1336
                        element.filled = value !== 'none';
                        this.setAttr('fillcolor', this.renderer.color(value, element, key, this));
                    }
                },
                'fill-opacitySetter': function(value, key, element) {
                    createElement(
                        this.renderer.prepVML(['<', key.split('-')[0], ' opacity="', value, '"/>']),
                        null,
                        null,
                        element
                    );
                },
                opacitySetter: noop, // Don't bother - animation is too slow and filters introduce artifacts
                rotationSetter: function(value, key, element) {
                    var style = element.style;
                    this[key] = style[key] = value; // style is for #1873

                    // Correction for the 1x1 size of the shape container. Used in gauge needles.
                    style.left = -Math.round(Math.sin(value * deg2rad) + 1) + 'px';
                    style.top = Math.round(Math.cos(value * deg2rad)) + 'px';
                },
                strokeSetter: function(value, key, element) {
                    this.setAttr('strokecolor', this.renderer.color(value, element, key, this));
                },
                'stroke-widthSetter': function(value, key, element) {
                    element.stroked = !!value; // VML "stroked" attribute
                    this[key] = value; // used in getter, issue #113
                    if (isNumber(value)) {
                        value += 'px';
                    }
                    this.setAttr('strokeweight', value);
                },
                titleSetter: function(value, key) {
                    this.setAttr(key, value);
                },
                visibilitySetter: function(value, key, element) {

                    // Handle inherited visibility
                    if (value === 'inherit') {
                        value = 'visible';
                    }

                    // Let the shadow follow the main element
                    if (this.shadows) {
                        each(this.shadows, function(shadow) {
                            shadow.style[key] = value;
                        });
                    }

                    // Instead of toggling the visibility CSS property, move the div out of the viewport.
                    // This works around #61 and #586
                    if (element.nodeName === 'DIV') {
                        value = value === 'hidden' ? '-999em' : 0;

                        // In order to redraw, IE7 needs the div to be visible when tucked away
                        // outside the viewport. So the visibility is actually opposite of
                        // the expected value. This applies to the tooltip only.
                        if (!this.docMode8) {
                            element.style[key] = value ? 'visible' : 'hidden';
                        }
                        key = 'top';
                    }
                    element.style[key] = value;
                },
                xSetter: function(value, key, element) {
                    this[key] = value; // used in getter

                    if (key === 'x') {
                        key = 'left';
                    } else if (key === 'y') {
                        key = 'top';
                    }
                    /* else {
                    				value = Math.max(0, value); // don't set width or height below zero (#311)
                    			}*/

                    // clipping rectangle special
                    if (this.updateClipping) {
                        this[key] = value; // the key is now 'left' or 'top' for 'x' and 'y'
                        this.updateClipping();
                    } else {
                        // normal
                        element.style[key] = value;
                    }
                },
                zIndexSetter: function(value, key, element) {
                    element.style[key] = value;
                }
            };
            VMLElement['stroke-opacitySetter'] = VMLElement['fill-opacitySetter'];
            H.VMLElement = VMLElement = extendClass(SVGElement, VMLElement);

            // Some shared setters
            VMLElement.prototype.ySetter =
                VMLElement.prototype.widthSetter =
                VMLElement.prototype.heightSetter =
                VMLElement.prototype.xSetter;


            /**
             * The VML renderer
             */
            VMLRendererExtension = { // inherit SVGRenderer

                Element: VMLElement,
                isIE8: win.navigator.userAgent.indexOf('MSIE 8.0') > -1,


                /**
                 * Initialize the VMLRenderer
                 * @param {Object} container
                 * @param {Number} width
                 * @param {Number} height
                 */
                init: function(container, width, height) {
                    var renderer = this,
                        boxWrapper,
                        box,
                        css;

                    renderer.alignedObjects = [];

                    boxWrapper = renderer.createElement('div')
                        .css({
                            position: 'relative'
                        });
                    box = boxWrapper.element;
                    container.appendChild(boxWrapper.element);


                    // generate the containing box
                    renderer.isVML = true;
                    renderer.box = box;
                    renderer.boxWrapper = boxWrapper;
                    renderer.gradients = {};
                    renderer.cache = {}; // Cache for numerical bounding boxes
                    renderer.cacheKeys = [];
                    renderer.imgCount = 0;


                    renderer.setSize(width, height, false);

                    // The only way to make IE6 and IE7 print is to use a global namespace. However,
                    // with IE8 the only way to make the dynamic shapes visible in screen and print mode
                    // seems to be to add the xmlns attribute and the behaviour style inline.
                    if (!doc.namespaces.hcv) {

                        doc.namespaces.add('hcv', 'urn:schemas-microsoft-com:vml');

                        // Setup default CSS (#2153, #2368, #2384)
                        css = 'hcv\\:fill, hcv\\:path, hcv\\:shape, hcv\\:stroke' +
                            '{ behavior:url(#default#VML); display: inline-block; } ';
                        try {
                            doc.createStyleSheet().cssText = css;
                        } catch (e) {
                            doc.styleSheets[0].cssText += css;
                        }

                    }
                },


                /**
                 * Detect whether the renderer is hidden. This happens when one of the parent elements
                 * has display: none
                 */
                isHidden: function() {
                    return !this.box.offsetWidth;
                },

                /**
                 * Define a clipping rectangle. In VML it is accomplished by storing the values
                 * for setting the CSS style to all associated members.
                 *
                 * @param {Number} x
                 * @param {Number} y
                 * @param {Number} width
                 * @param {Number} height
                 */
                clipRect: function(x, y, width, height) {

                    // create a dummy element
                    var clipRect = this.createElement(),
                        isObj = isObject(x);

                    // mimic a rectangle with its style object for automatic updating in attr
                    return extend(clipRect, {
                        members: [],
                        count: 0,
                        left: (isObj ? x.x : x) + 1,
                        top: (isObj ? x.y : y) + 1,
                        width: (isObj ? x.width : width) - 1,
                        height: (isObj ? x.height : height) - 1,
                        getCSS: function(wrapper) {
                            var element = wrapper.element,
                                nodeName = element.nodeName,
                                isShape = nodeName === 'shape',
                                inverted = wrapper.inverted,
                                rect = this,
                                top = rect.top - (isShape ? element.offsetTop : 0),
                                left = rect.left,
                                right = left + rect.width,
                                bottom = top + rect.height,
                                ret = {
                                    clip: 'rect(' +
                                        Math.round(inverted ? left : top) + 'px,' +
                                        Math.round(inverted ? bottom : right) + 'px,' +
                                        Math.round(inverted ? right : bottom) + 'px,' +
                                        Math.round(inverted ? top : left) + 'px)'
                                };

                            // issue 74 workaround
                            if (!inverted && wrapper.docMode8 && nodeName === 'DIV') {
                                extend(ret, {
                                    width: right + 'px',
                                    height: bottom + 'px'
                                });
                            }
                            return ret;
                        },

                        // used in attr and animation to update the clipping of all members
                        updateClipping: function() {
                            each(clipRect.members, function(member) {
                                // Member.element is falsy on deleted series, like in
                                // stock/members/series-remove demo. Should be removed
                                // from members, but this will do.
                                if (member.element) {
                                    member.css(clipRect.getCSS(member));
                                }
                            });
                        }
                    });

                },


                /**
                 * Take a color and return it if it's a string, make it a gradient if it's a
                 * gradient configuration object, and apply opacity.
                 *
                 * @param {Object} color The color or config object
                 */
                color: function(color, elem, prop, wrapper) {
                    var renderer = this,
                        colorObject,
                        regexRgba = /^rgba/,
                        markup,
                        fillType,
                        ret = 'none';

                    // Check for linear or radial gradient
                    if (color && color.linearGradient) {
                        fillType = 'gradient';
                    } else if (color && color.radialGradient) {
                        fillType = 'pattern';
                    }


                    if (fillType) {

                        var stopColor,
                            stopOpacity,
                            gradient = color.linearGradient || color.radialGradient,
                            x1,
                            y1,
                            x2,
                            y2,
                            opacity1,
                            opacity2,
                            color1,
                            color2,
                            fillAttr = '',
                            stops = color.stops,
                            firstStop,
                            lastStop,
                            colors = [],
                            addFillNode = function() {
                                // Add the fill subnode. When colors attribute is used, the meanings of opacity and o:opacity2
                                // are reversed.
                                markup = ['<fill colors="' + colors.join(',') +
                                    '" opacity="', opacity2, '" o:opacity2="',
                                    opacity1, '" type="', fillType, '" ', fillAttr,
                                    'focus="100%" method="any" />'
                                ];
                                createElement(renderer.prepVML(markup), null, null, elem);
                            };

                        // Extend from 0 to 1
                        firstStop = stops[0];
                        lastStop = stops[stops.length - 1];
                        if (firstStop[0] > 0) {
                            stops.unshift([
                                0,
                                firstStop[1]
                            ]);
                        }
                        if (lastStop[0] < 1) {
                            stops.push([
                                1,
                                lastStop[1]
                            ]);
                        }

                        // Compute the stops
                        each(stops, function(stop, i) {
                            if (regexRgba.test(stop[1])) {
                                colorObject = H.color(stop[1]);
                                stopColor = colorObject.get('rgb');
                                stopOpacity = colorObject.get('a');
                            } else {
                                stopColor = stop[1];
                                stopOpacity = 1;
                            }

                            // Build the color attribute
                            colors.push((stop[0] * 100) + '% ' + stopColor);

                            // Only start and end opacities are allowed, so we use the first and the last
                            if (!i) {
                                opacity1 = stopOpacity;
                                color2 = stopColor;
                            } else {
                                opacity2 = stopOpacity;
                                color1 = stopColor;
                            }
                        });

                        // Apply the gradient to fills only.
                        if (prop === 'fill') {

                            // Handle linear gradient angle
                            if (fillType === 'gradient') {
                                x1 = gradient.x1 || gradient[0] || 0;
                                y1 = gradient.y1 || gradient[1] || 0;
                                x2 = gradient.x2 || gradient[2] || 0;
                                y2 = gradient.y2 || gradient[3] || 0;
                                fillAttr = 'angle="' + (90 - Math.atan(
                                    (y2 - y1) / // y vector
                                    (x2 - x1) // x vector
                                ) * 180 / Math.PI) + '"';

                                addFillNode();

                                // Radial (circular) gradient
                            } else {

                                var r = gradient.r,
                                    sizex = r * 2,
                                    sizey = r * 2,
                                    cx = gradient.cx,
                                    cy = gradient.cy,
                                    radialReference = elem.radialReference,
                                    bBox,
                                    applyRadialGradient = function() {
                                        if (radialReference) {
                                            bBox = wrapper.getBBox();
                                            cx += (radialReference[0] - bBox.x) / bBox.width - 0.5;
                                            cy += (radialReference[1] - bBox.y) / bBox.height - 0.5;
                                            sizex *= radialReference[2] / bBox.width;
                                            sizey *= radialReference[2] / bBox.height;
                                        }
                                        fillAttr = 'src="' + H.getOptions().global.VMLRadialGradientURL + '" ' +
                                            'size="' + sizex + ',' + sizey + '" ' +
                                            'origin="0.5,0.5" ' +
                                            'position="' + cx + ',' + cy + '" ' +
                                            'color2="' + color2 + '" ';

                                        addFillNode();
                                    };

                                // Apply radial gradient
                                if (wrapper.added) {
                                    applyRadialGradient();
                                } else {
                                    // We need to know the bounding box to get the size and position right
                                    wrapper.onAdd = applyRadialGradient;
                                }

                                // The fill element's color attribute is broken in IE8 standards mode, so we
                                // need to set the parent shape's fillcolor attribute instead.
                                ret = color1;
                            }

                            // Gradients are not supported for VML stroke, return the first color. #722.
                        } else {
                            ret = stopColor;
                        }

                        // If the color is an rgba color, split it and add a fill node
                        // to hold the opacity component
                    } else if (regexRgba.test(color) && elem.tagName !== 'IMG') {

                        colorObject = H.color(color);

                        wrapper[prop + '-opacitySetter'](colorObject.get('a'), prop, elem);

                        ret = colorObject.get('rgb');


                    } else {
                        var propNodes = elem.getElementsByTagName(prop); // 'stroke' or 'fill' node
                        if (propNodes.length) {
                            propNodes[0].opacity = 1;
                            propNodes[0].type = 'solid';
                        }
                        ret = color;
                    }

                    return ret;
                },

                /**
                 * Take a VML string and prepare it for either IE8 or IE6/IE7.
                 * @param {Array} markup A string array of the VML markup to prepare
                 */
                prepVML: function(markup) {
                    var vmlStyle = 'display:inline-block;behavior:url(#default#VML);',
                        isIE8 = this.isIE8;

                    markup = markup.join('');

                    if (isIE8) { // add xmlns and style inline
                        markup = markup.replace('/>', ' xmlns="urn:schemas-microsoft-com:vml" />');
                        if (markup.indexOf('style="') === -1) {
                            markup = markup.replace('/>', ' style="' + vmlStyle + '" />');
                        } else {
                            markup = markup.replace('style="', 'style="' + vmlStyle);
                        }

                    } else { // add namespace
                        markup = markup.replace('<', '<hcv:');
                    }

                    return markup;
                },

                /**
                 * Create rotated and aligned text
                 * @param {String} str
                 * @param {Number} x
                 * @param {Number} y
                 */
                text: SVGRenderer.prototype.html,

                /**
                 * Create and return a path element
                 * @param {Array} path
                 */
                path: function(path) {
                    var attr = {
                        // subpixel precision down to 0.1 (width and height = 1px)
                        coordsize: '10 10'
                    };
                    if (isArray(path)) {
                        attr.d = path;
                    } else if (isObject(path)) { // attributes
                        extend(attr, path);
                    }
                    // create the shape
                    return this.createElement('shape').attr(attr);
                },

                /**
                 * Create and return a circle element. In VML circles are implemented as
                 * shapes, which is faster than v:oval
                 * @param {Number} x
                 * @param {Number} y
                 * @param {Number} r
                 */
                circle: function(x, y, r) {
                    var circle = this.symbol('circle');
                    if (isObject(x)) {
                        r = x.r;
                        y = x.y;
                        x = x.x;
                    }
                    circle.isCircle = true; // Causes x and y to mean center (#1682)
                    circle.r = r;
                    return circle.attr({
                        x: x,
                        y: y
                    });
                },

                /**
                 * Create a group using an outer div and an inner v:group to allow rotating
                 * and flipping. A simple v:group would have problems with positioning
                 * child HTML elements and CSS clip.
                 *
                 * @param {String} name The name of the group
                 */
                g: function(name) {
                    var wrapper,
                        attribs;

                    // set the class name
                    if (name) {
                        attribs = {
                            'className': 'highcharts-' + name,
                            'class': 'highcharts-' + name
                        };
                    }

                    // the div to hold HTML and clipping
                    wrapper = this.createElement('div').attr(attribs);

                    return wrapper;
                },

                /**
                 * VML override to create a regular HTML image
                 * @param {String} src
                 * @param {Number} x
                 * @param {Number} y
                 * @param {Number} width
                 * @param {Number} height
                 */
                image: function(src, x, y, width, height) {
                    var obj = this.createElement('img')
                        .attr({
                            src: src
                        });

                    if (arguments.length > 1) {
                        obj.attr({
                            x: x,
                            y: y,
                            width: width,
                            height: height
                        });
                    }
                    return obj;
                },

                /**
                 * For rectangles, VML uses a shape for rect to overcome bugs and rotation problems
                 */
                createElement: function(nodeName) {
                    return nodeName === 'rect' ?
                        this.symbol(nodeName) :
                        SVGRenderer.prototype.createElement.call(this, nodeName);
                },

                /**
                 * In the VML renderer, each child of an inverted div (group) is inverted
                 * @param {Object} element
                 * @param {Object} parentNode
                 */
                invertChild: function(element, parentNode) {
                    var ren = this,
                        parentStyle = parentNode.style,
                        imgStyle = element.tagName === 'IMG' && element.style; // #1111

                    css(element, {
                        flip: 'x',
                        left: pInt(parentStyle.width) - (imgStyle ? pInt(imgStyle.top) : 1),
                        top: pInt(parentStyle.height) - (imgStyle ? pInt(imgStyle.left) : 1),
                        rotation: -90
                    });

                    // Recursively invert child elements, needed for nested composite
                    // shapes like box plots and error bars. #1680, #1806.
                    each(element.childNodes, function(child) {
                        ren.invertChild(child, element);
                    });
                },

                /**
                 * Symbol definitions that override the parent SVG renderer's symbols
                 *
                 */
                symbols: {
                    // VML specific arc function
                    arc: function(x, y, w, h, options) {
                        var start = options.start,
                            end = options.end,
                            radius = options.r || w || h,
                            innerRadius = options.innerR,
                            cosStart = Math.cos(start),
                            sinStart = Math.sin(start),
                            cosEnd = Math.cos(end),
                            sinEnd = Math.sin(end),
                            ret;

                        if (end - start === 0) { // no angle, don't show it.
                            return ['x'];
                        }

                        ret = [
                            'wa', // clockwise arc to
                            x - radius, // left
                            y - radius, // top
                            x + radius, // right
                            y + radius, // bottom
                            x + radius * cosStart, // start x
                            y + radius * sinStart, // start y
                            x + radius * cosEnd, // end x
                            y + radius * sinEnd // end y
                        ];

                        if (options.open && !innerRadius) {
                            ret.push(
                                'e',
                                'M',
                                x, // - innerRadius,
                                y // - innerRadius
                            );
                        }

                        ret.push(
                            'at', // anti clockwise arc to
                            x - innerRadius, // left
                            y - innerRadius, // top
                            x + innerRadius, // right
                            y + innerRadius, // bottom
                            x + innerRadius * cosEnd, // start x
                            y + innerRadius * sinEnd, // start y
                            x + innerRadius * cosStart, // end x
                            y + innerRadius * sinStart, // end y
                            'x', // finish path
                            'e' // close
                        );

                        ret.isArc = true;
                        return ret;

                    },
                    // Add circle symbol path. This performs significantly faster than v:oval.
                    circle: function(x, y, w, h, wrapper) {

                        if (wrapper && defined(wrapper.r)) {
                            w = h = 2 * wrapper.r;
                        }

                        // Center correction, #1682
                        if (wrapper && wrapper.isCircle) {
                            x -= w / 2;
                            y -= h / 2;
                        }

                        // Return the path
                        return [
                            'wa', // clockwisearcto
                            x, // left
                            y, // top
                            x + w, // right
                            y + h, // bottom
                            x + w, // start x
                            y + h / 2, // start y
                            x + w, // end x
                            y + h / 2, // end y
                            //'x', // finish path
                            'e' // close
                        ];
                    },
                    /**
                     * Add rectangle symbol path which eases rotation and omits arcsize problems
                     * compared to the built-in VML roundrect shape. When borders are not rounded,
                     * use the simpler square path, else use the callout path without the arrow.
                     */
                    rect: function(x, y, w, h, options) {
                        return SVGRenderer.prototype.symbols[!defined(options) || !options.r ? 'square' : 'callout'].call(0, x, y, w, h, options);
                    }
                }
            };
            H.VMLRenderer = VMLRenderer = function() {
                this.init.apply(this, arguments);
            };
            VMLRenderer.prototype = merge(SVGRenderer.prototype, VMLRendererExtension);

            // general renderer
            H.Renderer = VMLRenderer;
        }

        // This method is used with exporting in old IE, when emulating SVG (see #2314)
        SVGRenderer.prototype.measureSpanWidth = function(text, styles) {
            var measuringSpan = doc.createElement('span'),
                offsetWidth,
                textNode = doc.createTextNode(text);

            measuringSpan.appendChild(textNode);
            css(measuringSpan, styles);
            this.box.appendChild(measuringSpan);
            offsetWidth = measuringSpan.offsetWidth;
            discardElement(measuringSpan); // #2463
            return offsetWidth;
        };


        /* ****************************************************************************
         *                                                                            *
         * END OF INTERNET EXPLORER <= 8 SPECIFIC CODE                                *
         *                                                                            *
         *****************************************************************************/


    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var color = H.color,
            each = H.each,
            getTZOffset = H.getTZOffset,
            isTouchDevice = H.isTouchDevice,
            merge = H.merge,
            pick = H.pick,
            svg = H.svg,
            win = H.win;

        /* ****************************************************************************
         * Handle the options                                                         *
         *****************************************************************************/
        H.defaultOptions = {

            colors: '#7cb5ec #434348 #90ed7d #f7a35c #8085e9 #f15c80 #e4d354 #2b908f #f45b5b #91e8e1'.split(' '),

            symbols: ['circle', 'diamond', 'square', 'triangle', 'triangle-down'],
            lang: {
                loading: 'Loading...',
                months: [
                    'January', 'February', 'March', 'April', 'May', 'June', 'July',
                    'August', 'September', 'October', 'November', 'December'
                ],
                shortMonths: [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                    'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ],
                weekdays: [
                    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
                    'Thursday', 'Friday', 'Saturday'
                ],
                // invalidDate: '',
                decimalPoint: '.',
                numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'], // SI prefixes used in axis labels
                resetZoom: 'Reset zoom',
                resetZoomTitle: 'Reset zoom level 1:1',
                thousandsSep: ' '
            },
            global: {
                useUTC: true,
                //timezoneOffset: 0,

                VMLRadialGradientURL: 'http://code.highcharts.com/5.0.7/gfx/vml-radial-gradient.png'

            },
            chart: {
                //animation: true,
                //alignTicks: false,
                //reflow: true,
                //className: null,
                //events: { load, selection },
                //margin: [null],
                //marginTop: null,
                //marginRight: null,
                //marginBottom: null,
                //marginLeft: null,
                borderRadius: 0,

                defaultSeriesType: 'line',
                ignoreHiddenSeries: true,
                //inverted: false,
                spacing: [10, 10, 15, 10],
                //spacingTop: 10,
                //spacingRight: 10,
                //spacingBottom: 15,
                //spacingLeft: 10,
                //zoomType: ''
                resetZoomButton: {
                    theme: {
                        zIndex: 20
                    },
                    position: {
                        align: 'right',
                        x: -10,
                        //verticalAlign: 'top',
                        y: 10
                    }
                    // relativeTo: 'plot'
                },
                width: null,
                height: null,


                borderColor: '#335cad',
                //borderWidth: 0,
                //style: {
                //	fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif', // default font
                //	fontSize: '12px'
                //},
                backgroundColor: '#ffffff',
                //plotBackgroundColor: null,
                plotBorderColor: '#cccccc'
                    //plotBorderWidth: 0,
                    //plotShadow: false

            },
            title: {
                text: 'Chart title',
                align: 'center',
                // floating: false,
                margin: 15,
                // x: 0,
                // verticalAlign: 'top',
                // y: null,
                // style: {}, // defined inline
                widthAdjust: -44

            },
            subtitle: {
                text: '',
                align: 'center',
                // floating: false
                // x: 0,
                // verticalAlign: 'top',
                // y: null,
                // style: {}, // defined inline
                widthAdjust: -44
            },

            plotOptions: {},
            labels: {
                //items: [],
                style: {
                    //font: defaultFont,
                    position: 'absolute',
                    color: '#333333'
                }
            },
            legend: {
                enabled: true,
                align: 'center',
                //floating: false,
                layout: 'horizontal',
                labelFormatter: function() {
                    return this.name;
                },
                //borderWidth: 0,
                borderColor: '#999999',
                borderRadius: 0,
                navigation: {

                    activeColor: '#003399',
                    inactiveColor: '#cccccc'

                    // animation: true,
                    // arrowSize: 12
                    // style: {} // text styles
                },
                // margin: 20,
                // reversed: false,
                // backgroundColor: null,
                /*style: {
                	padding: '5px'
                },*/

                itemStyle: {
                    color: '#333333',
                    fontSize: '12px',
                    fontWeight: 'bold'
                },
                itemHoverStyle: {
                    //cursor: 'pointer', removed as of #601
                    color: '#000000'
                },
                itemHiddenStyle: {
                    color: '#cccccc'
                },
                shadow: false,

                itemCheckboxStyle: {
                    position: 'absolute',
                    width: '13px', // for IE precision
                    height: '13px'
                },
                // itemWidth: undefined,
                squareSymbol: true,
                // symbolRadius: 0,
                // symbolWidth: 16,
                symbolPadding: 5,
                verticalAlign: 'bottom',
                // width: undefined,
                x: 0,
                y: 0,
                title: {
                    //text: null,

                    style: {
                        fontWeight: 'bold'
                    }

                }
            },

            loading: {
                // hideDuration: 100,
                // showDuration: 0,

                labelStyle: {
                    fontWeight: 'bold',
                    position: 'relative',
                    top: '45%'
                },
                style: {
                    position: 'absolute',
                    backgroundColor: '#ffffff',
                    opacity: 0.5,
                    textAlign: 'center'
                }

            },

            tooltip: {
                enabled: true,
                animation: svg,
                //crosshairs: null,
                borderRadius: 3,
                dateTimeLabelFormats: {
                    millisecond: '%A, %b %e, %H:%M:%S.%L',
                    second: '%A, %b %e, %H:%M:%S',
                    minute: '%A, %b %e, %H:%M',
                    hour: '%A, %b %e, %H:%M',
                    day: '%A, %b %e, %Y',
                    week: 'Week from %A, %b %e, %Y',
                    month: '%B %Y',
                    year: '%Y'
                },
                footerFormat: '',
                //formatter: defaultFormatter,
                /* todo: em font-size when finished comparing against HC4
                headerFormat: '<span style="font-size: 0.85em">{point.key}</span><br/>',
                */
                padding: 8,

                //shape: 'callout',
                //shared: false,
                snap: isTouchDevice ? 25 : 10,

                backgroundColor: color('#f7f7f7').setOpacity(0.85).get(),
                borderWidth: 1,
                headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
                pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
                shadow: true,
                style: {
                    color: '#333333',
                    cursor: 'default',
                    fontSize: '12px',
                    pointerEvents: 'none', // #1686 http://caniuse.com/#feat=pointer-events
                    whiteSpace: 'nowrap'
                }

                //xDateFormat: '%A, %b %e, %Y',
                //valueDecimals: null,
                //valuePrefix: '',
                //valueSuffix: ''
            },

            credits: {
                enabled: true,
                href: 'http://www.highcharts.com',
                position: {
                    align: 'right',
                    x: -10,
                    verticalAlign: 'bottom',
                    y: -5
                },

                style: {
                    cursor: 'pointer',
                    color: '#999999',
                    fontSize: '9px'
                },

                text: 'Highcharts.com'
            }
        };



        /**
         * Sets the getTimezoneOffset function. If the timezone option is set, a default
         * getTimezoneOffset function with that timezone is returned. If not, the
         * specified getTimezoneOffset function is returned. If neither are specified,
         * undefined is returned.
         * @return {function} a getTimezoneOffset function or undefined
         */
        function getTimezoneOffsetOption() {
            var globalOptions = H.defaultOptions.global,
                moment = win.moment;

            if (globalOptions.timezone) {
                if (!moment) {
                    // getTimezoneOffset-function stays undefined because it depends on
                    // Moment.js
                    H.error(25);

                } else {
                    return function(timestamp) {
                        return -moment.tz(
                            timestamp,
                            globalOptions.timezone
                        ).utcOffset();
                    };
                }
            }

            // If not timezone is set, look for the getTimezoneOffset callback
            return globalOptions.useUTC && globalOptions.getTimezoneOffset;
        }

        /**
         * Set the time methods globally based on the useUTC option. Time method can be
         *   either local time or UTC (default). It is called internally on initiating
         *   Highcharts and after running `Highcharts.setOptions`.
         *
         * @private
         */
        function setTimeMethods() {
            var globalOptions = H.defaultOptions.global,
                Date,
                useUTC = globalOptions.useUTC,
                GET = useUTC ? 'getUTC' : 'get',
                SET = useUTC ? 'setUTC' : 'set';

            H.Date = Date = globalOptions.Date || win.Date; // Allow using a different Date class
            Date.hcTimezoneOffset = useUTC && globalOptions.timezoneOffset;
            Date.hcGetTimezoneOffset = getTimezoneOffsetOption();
            Date.hcMakeTime = function(year, month, date, hours, minutes, seconds) {
                var d;
                if (useUTC) {
                    d = Date.UTC.apply(0, arguments);
                    d += getTZOffset(d);
                } else {
                    d = new Date(
                        year,
                        month,
                        pick(date, 1),
                        pick(hours, 0),
                        pick(minutes, 0),
                        pick(seconds, 0)
                    ).getTime();
                }
                return d;
            };
            each(['Minutes', 'Hours', 'Day', 'Date', 'Month', 'FullYear'], function(s) {
                Date['hcGet' + s] = GET + s;
            });
            each(['Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Date', 'Month', 'FullYear'], function(s) {
                Date['hcSet' + s] = SET + s;
            });
        }

        /**
         * Merge the default options with custom options and return the new options structure
         * @param {Object} options The new custom options
         */
        H.setOptions = function(options) {

            // Copy in the default options
            H.defaultOptions = merge(true, H.defaultOptions, options);

            // Apply UTC
            setTimeMethods();

            return H.defaultOptions;
        };

        /**
         * Get the updated default options. Until 3.0.7, merely exposing defaultOptions for outside modules
         * wasn't enough because the setOptions method created a new object.
         */
        H.getOptions = function() {
            return H.defaultOptions;
        };


        // Series defaults
        H.defaultPlotOptions = H.defaultOptions.plotOptions;

        // set the default time methods
        setTimeMethods();

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
            defined = H.defined,
            destroyObjectProperties = H.destroyObjectProperties,
            each = H.each,
            erase = H.erase,
            merge = H.merge,
            pick = H.pick;
        /*
         * The object wrapper for plot lines and plot bands
         * @param {Object} options
         */
        H.PlotLineOrBand = function(axis, options) {
            this.axis = axis;

            if (options) {
                this.options = options;
                this.id = options.id;
            }
        };

        H.PlotLineOrBand.prototype = {

            /**
             * Render the plot line or plot band. If it is already existing,
             * move it.
             */
            render: function() {
                var plotLine = this,
                    axis = plotLine.axis,
                    horiz = axis.horiz,
                    options = plotLine.options,
                    optionsLabel = options.label,
                    label = plotLine.label,
                    to = options.to,
                    from = options.from,
                    value = options.value,
                    isBand = defined(from) && defined(to),
                    isLine = defined(value),
                    svgElem = plotLine.svgElem,
                    isNew = !svgElem,
                    path = [],
                    addEvent,
                    eventType,
                    color = options.color,
                    zIndex = pick(options.zIndex, 0),
                    events = options.events,
                    attribs = {
                        'class': 'highcharts-plot-' + (isBand ? 'band ' : 'line ') + (options.className || '')
                    },
                    groupAttribs = {},
                    renderer = axis.chart.renderer,
                    groupName = isBand ? 'bands' : 'lines',
                    group,
                    log2lin = axis.log2lin;

                // logarithmic conversion
                if (axis.isLog) {
                    from = log2lin(from);
                    to = log2lin(to);
                    value = log2lin(value);
                }


                // Set the presentational attributes
                if (isLine) {
                    attribs = {
                        stroke: color,
                        'stroke-width': options.width
                    };
                    if (options.dashStyle) {
                        attribs.dashstyle = options.dashStyle;
                    }

                } else if (isBand) { // plot band
                    if (color) {
                        attribs.fill = color;
                    }
                    if (options.borderWidth) {
                        attribs.stroke = options.borderColor;
                        attribs['stroke-width'] = options.borderWidth;
                    }
                }


                // Grouping and zIndex
                groupAttribs.zIndex = zIndex;
                groupName += '-' + zIndex;

                group = axis[groupName];
                if (!group) {
                    axis[groupName] = group = renderer.g('plot-' + groupName)
                        .attr(groupAttribs).add();
                }

                // Create the path
                if (isNew) {
                    plotLine.svgElem = svgElem =
                        renderer
                        .path()
                        .attr(attribs).add(group);
                }


                // Set the path or return
                if (isLine) {
                    path = axis.getPlotLinePath(value, svgElem.strokeWidth());
                } else if (isBand) { // plot band
                    path = axis.getPlotBandPath(from, to, options);
                } else {
                    return;
                }


                // common for lines and bands
                if (isNew && path && path.length) {
                    svgElem.attr({
                        d: path
                    });

                    // events
                    if (events) {
                        addEvent = function(eventType) {
                            svgElem.on(eventType, function(e) {
                                events[eventType].apply(plotLine, [e]);
                            });
                        };
                        for (eventType in events) {
                            addEvent(eventType);
                        }
                    }
                } else if (svgElem) {
                    if (path) {
                        svgElem.show();
                        svgElem.animate({
                            d: path
                        });
                    } else {
                        svgElem.hide();
                        if (label) {
                            plotLine.label = label = label.destroy();
                        }
                    }
                }

                // the plot band/line label
                if (optionsLabel && defined(optionsLabel.text) && path && path.length &&
                    axis.width > 0 && axis.height > 0 && !path.flat) {
                    // apply defaults
                    optionsLabel = merge({
                        align: horiz && isBand && 'center',
                        x: horiz ? !isBand && 4 : 10,
                        verticalAlign: !horiz && isBand && 'middle',
                        y: horiz ? isBand ? 16 : 10 : isBand ? 6 : -4,
                        rotation: horiz && !isBand && 90
                    }, optionsLabel);

                    this.renderLabel(optionsLabel, path, isBand, zIndex);

                } else if (label) { // move out of sight
                    label.hide();
                }

                // chainable
                return plotLine;
            },

            /**
             * Render and align label for plot line or band.
             */
            renderLabel: function(optionsLabel, path, isBand, zIndex) {
                var plotLine = this,
                    label = plotLine.label,
                    renderer = plotLine.axis.chart.renderer,
                    attribs,
                    xs,
                    ys,
                    x,
                    y;

                // add the SVG element
                if (!label) {
                    attribs = {
                        align: optionsLabel.textAlign || optionsLabel.align,
                        rotation: optionsLabel.rotation,
                        'class': 'highcharts-plot-' + (isBand ? 'band' : 'line') + '-label ' + (optionsLabel.className || '')
                    };

                    attribs.zIndex = zIndex;

                    plotLine.label = label = renderer.text(
                            optionsLabel.text,
                            0,
                            0,
                            optionsLabel.useHTML
                        )
                        .attr(attribs)
                        .add();


                    label.css(optionsLabel.style);

                }

                // get the bounding box and align the label
                // #3000 changed to better handle choice between plotband or plotline
                xs = [path[1], path[4], (isBand ? path[6] : path[1])];
                ys = [path[2], path[5], (isBand ? path[7] : path[2])];
                x = arrayMin(xs);
                y = arrayMin(ys);

                label.align(optionsLabel, false, {
                    x: x,
                    y: y,
                    width: arrayMax(xs) - x,
                    height: arrayMax(ys) - y
                });
                label.show();
            },

            /**
             * Remove the plot line or band
             */
            destroy: function() {
                // remove it from the lookup
                erase(this.axis.plotLinesAndBands, this);

                delete this.axis;
                destroyObjectProperties(this);
            }
        };

        /**
         * Object with members for extending the Axis prototype
         * @todo Extend directly instead of adding object to Highcharts first
         */

        H.AxisPlotLineOrBandExtension = {

            /**
             * Create the path for a plot band
             */
            getPlotBandPath: function(from, to) {
                var toPath = this.getPlotLinePath(to, null, null, true),
                    path = this.getPlotLinePath(from, null, null, true);

                if (path && toPath) {

                    // Flat paths don't need labels (#3836)
                    path.flat = path.toString() === toPath.toString();

                    path.push(
                        toPath[4],
                        toPath[5],
                        toPath[1],
                        toPath[2],
                        'z' // #5909
                    );
                } else { // outside the axis area
                    path = null;
                }

                return path;
            },

            addPlotBand: function(options) {
                return this.addPlotBandOrLine(options, 'plotBands');
            },

            addPlotLine: function(options) {
                return this.addPlotBandOrLine(options, 'plotLines');
            },

            /**
             * Add a plot band or plot line after render time
             *
             * @param options {Object} The plotBand or plotLine configuration object
             */
            addPlotBandOrLine: function(options, coll) {
                var obj = new H.PlotLineOrBand(this, options).render(),
                    userOptions = this.userOptions;

                if (obj) { // #2189
                    // Add it to the user options for exporting and Axis.update
                    if (coll) {
                        userOptions[coll] = userOptions[coll] || [];
                        userOptions[coll].push(options);
                    }
                    this.plotLinesAndBands.push(obj);
                }

                return obj;
            },

            /**
             * Remove a plot band or plot line from the chart by id
             * @param {Object} id
             */
            removePlotBandOrLine: function(id) {
                var plotLinesAndBands = this.plotLinesAndBands,
                    options = this.options,
                    userOptions = this.userOptions,
                    i = plotLinesAndBands.length;
                while (i--) {
                    if (plotLinesAndBands[i].id === id) {
                        plotLinesAndBands[i].destroy();
                    }
                }
                each([options.plotLines || [], userOptions.plotLines || [], options.plotBands || [], userOptions.plotBands || []], function(arr) {
                    i = arr.length;
                    while (i--) {
                        if (arr[i].id === id) {
                            erase(arr, arr[i]);
                        }
                    }
                });
            }
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var correctFloat = H.correctFloat,
            defined = H.defined,
            destroyObjectProperties = H.destroyObjectProperties,
            isNumber = H.isNumber,
            merge = H.merge,
            pick = H.pick,
            deg2rad = H.deg2rad;

        /**
         * The Tick class
         */
        H.Tick = function(axis, pos, type, noLabel) {
            this.axis = axis;
            this.pos = pos;
            this.type = type || '';
            this.isNew = true;

            if (!type && !noLabel) {
                this.addLabel();
            }
        };

        H.Tick.prototype = {
            /**
             * Write the tick label
             */
            addLabel: function() {
                var tick = this,
                    axis = tick.axis,
                    options = axis.options,
                    chart = axis.chart,
                    categories = axis.categories,
                    names = axis.names,
                    pos = tick.pos,
                    labelOptions = options.labels,
                    str,
                    tickPositions = axis.tickPositions,
                    isFirst = pos === tickPositions[0],
                    isLast = pos === tickPositions[tickPositions.length - 1],
                    value = categories ?
                    pick(categories[pos], names[pos], pos) :
                    pos,
                    label = tick.label,
                    tickPositionInfo = tickPositions.info,
                    dateTimeLabelFormat;

                // Set the datetime label format. If a higher rank is set for this position, use that. If not,
                // use the general format.
                if (axis.isDatetimeAxis && tickPositionInfo) {
                    dateTimeLabelFormat =
                        options.dateTimeLabelFormats[
                            tickPositionInfo.higherRanks[pos] || tickPositionInfo.unitName
                        ];
                }
                // set properties for access in render method
                tick.isFirst = isFirst;
                tick.isLast = isLast;

                // get the string
                str = axis.labelFormatter.call({
                    axis: axis,
                    chart: chart,
                    isFirst: isFirst,
                    isLast: isLast,
                    dateTimeLabelFormat: dateTimeLabelFormat,
                    value: axis.isLog ? correctFloat(axis.lin2log(value)) : value
                });

                // prepare CSS
                //css = width && { width: Math.max(1, Math.round(width - 2 * (labelOptions.padding || 10))) + 'px' };

                // first call
                if (!defined(label)) {

                    tick.label = label =
                        defined(str) && labelOptions.enabled ?
                        chart.renderer.text(
                            str,
                            0,
                            0,
                            labelOptions.useHTML
                        )

                    // without position absolute, IE export sometimes is wrong
                    .css(merge(labelOptions.style))

                    .add(axis.labelGroup):
                        null;
                    tick.labelLength = label && label.getBBox().width; // Un-rotated length
                    tick.rotation = 0; // Base value to detect change for new calls to getBBox

                    // update
                } else if (label) {
                    label.attr({
                        text: str
                    });
                }
            },

            /**
             * Get the offset height or width of the label
             */
            getLabelSize: function() {
                return this.label ?
                    this.label.getBBox()[this.axis.horiz ? 'height' : 'width'] :
                    0;
            },

            /**
             * Handle the label overflow by adjusting the labels to the left and right edge, or
             * hide them if they collide into the neighbour label.
             */
            handleOverflow: function(xy) {
                var axis = this.axis,
                    pxPos = xy.x,
                    chartWidth = axis.chart.chartWidth,
                    spacing = axis.chart.spacing,
                    leftBound = pick(axis.labelLeft, Math.min(axis.pos, spacing[3])),
                    rightBound = pick(axis.labelRight, Math.max(axis.pos + axis.len, chartWidth - spacing[1])),
                    label = this.label,
                    rotation = this.rotation,
                    factor = {
                        left: 0,
                        center: 0.5,
                        right: 1
                    }[axis.labelAlign],
                    labelWidth = label.getBBox().width,
                    slotWidth = axis.getSlotWidth(),
                    modifiedSlotWidth = slotWidth,
                    xCorrection = factor,
                    goRight = 1,
                    leftPos,
                    rightPos,
                    textWidth,
                    css = {};

                // Check if the label overshoots the chart spacing box. If it does, move it.
                // If it now overshoots the slotWidth, add ellipsis.
                if (!rotation) {
                    leftPos = pxPos - factor * labelWidth;
                    rightPos = pxPos + (1 - factor) * labelWidth;

                    if (leftPos < leftBound) {
                        modifiedSlotWidth = xy.x + modifiedSlotWidth * (1 - factor) - leftBound;
                    } else if (rightPos > rightBound) {
                        modifiedSlotWidth = rightBound - xy.x + modifiedSlotWidth * factor;
                        goRight = -1;
                    }

                    modifiedSlotWidth = Math.min(slotWidth, modifiedSlotWidth); // #4177
                    if (modifiedSlotWidth < slotWidth && axis.labelAlign === 'center') {
                        xy.x += goRight * (slotWidth - modifiedSlotWidth - xCorrection *
                            (slotWidth - Math.min(labelWidth, modifiedSlotWidth)));
                    }
                    // If the label width exceeds the available space, set a text width to be
                    // picked up below. Also, if a width has been set before, we need to set a new
                    // one because the reported labelWidth will be limited by the box (#3938).
                    if (labelWidth > modifiedSlotWidth || (axis.autoRotation && (label.styles || {}).width)) {
                        textWidth = modifiedSlotWidth;
                    }

                    // Add ellipsis to prevent rotated labels to be clipped against the edge of the chart
                } else if (rotation < 0 && pxPos - factor * labelWidth < leftBound) {
                    textWidth = Math.round(pxPos / Math.cos(rotation * deg2rad) - leftBound);
                } else if (rotation > 0 && pxPos + factor * labelWidth > rightBound) {
                    textWidth = Math.round((chartWidth - pxPos) / Math.cos(rotation * deg2rad));
                }

                if (textWidth) {
                    css.width = textWidth;
                    if (!(axis.options.labels.style || {}).textOverflow) {
                        css.textOverflow = 'ellipsis';
                    }
                    label.css(css);
                }
            },

            /**
             * Get the x and y position for ticks and labels
             */
            getPosition: function(horiz, pos, tickmarkOffset, old) {
                var axis = this.axis,
                    chart = axis.chart,
                    cHeight = (old && chart.oldChartHeight) || chart.chartHeight;

                return {
                    x: horiz ?
                        axis.translate(pos + tickmarkOffset, null, null, old) + axis.transB : axis.left + axis.offset +
                        (axis.opposite ?
                            ((old && chart.oldChartWidth) || chart.chartWidth) - axis.right - axis.left :
                            0
                        ),

                    y: horiz ?
                        cHeight - axis.bottom + axis.offset - (axis.opposite ? axis.height : 0) : cHeight - axis.translate(pos + tickmarkOffset, null, null, old) - axis.transB
                };

            },

            /**
             * Get the x, y position of the tick label
             */
            getLabelPosition: function(x, y, label, horiz, labelOptions, tickmarkOffset, index, step) {
                var axis = this.axis,
                    transA = axis.transA,
                    reversed = axis.reversed,
                    staggerLines = axis.staggerLines,
                    rotCorr = axis.tickRotCorr || {
                        x: 0,
                        y: 0
                    },
                    yOffset = labelOptions.y,
                    line;

                if (!defined(yOffset)) {
                    if (axis.side === 0) {
                        yOffset = label.rotation ? -8 : -label.getBBox().height;
                    } else if (axis.side === 2) {
                        yOffset = rotCorr.y + 8;
                    } else {
                        // #3140, #3140
                        yOffset = Math.cos(label.rotation * deg2rad) * (rotCorr.y - label.getBBox(false, 0).height / 2);
                    }
                }

                x = x + labelOptions.x + rotCorr.x - (tickmarkOffset && horiz ?
                    tickmarkOffset * transA * (reversed ? -1 : 1) : 0);
                y = y + yOffset - (tickmarkOffset && !horiz ?
                    tickmarkOffset * transA * (reversed ? 1 : -1) : 0);

                // Correct for staggered labels
                if (staggerLines) {
                    line = (index / (step || 1) % staggerLines);
                    if (axis.opposite) {
                        line = staggerLines - line - 1;
                    }
                    y += line * (axis.labelOffset / staggerLines);
                }

                return {
                    x: x,
                    y: Math.round(y)
                };
            },

            /**
             * Extendible method to return the path of the marker
             */
            getMarkPath: function(x, y, tickLength, tickWidth, horiz, renderer) {
                return renderer.crispLine([
                    'M',
                    x,
                    y,
                    'L',
                    x + (horiz ? 0 : -tickLength),
                    y + (horiz ? tickLength : 0)
                ], tickWidth);
            },

            /**
             * Put everything in place
             *
             * @param index {Number}
             * @param old {Boolean} Use old coordinates to prepare an animation into new position
             */
            render: function(index, old, opacity) {
                var tick = this,
                    axis = tick.axis,
                    options = axis.options,
                    chart = axis.chart,
                    renderer = chart.renderer,
                    horiz = axis.horiz,
                    type = tick.type,
                    label = tick.label,
                    pos = tick.pos,
                    labelOptions = options.labels,
                    gridLine = tick.gridLine,
                    tickPrefix = type ? type + 'Tick' : 'tick',
                    tickSize = axis.tickSize(tickPrefix),
                    gridLinePath,
                    mark = tick.mark,
                    isNewMark = !mark,
                    step = labelOptions.step,
                    attribs = {},
                    show = true,
                    tickmarkOffset = axis.tickmarkOffset,
                    xy = tick.getPosition(horiz, pos, tickmarkOffset, old),
                    x = xy.x,
                    y = xy.y,
                    reverseCrisp = ((horiz && x === axis.pos + axis.len) ||
                        (!horiz && y === axis.pos)) ? -1 : 1; // #1480, #1687


                var gridPrefix = type ? type + 'Grid' : 'grid',
                    gridLineWidth = options[gridPrefix + 'LineWidth'],
                    gridLineColor = options[gridPrefix + 'LineColor'],
                    dashStyle = options[gridPrefix + 'LineDashStyle'],
                    tickWidth = pick(options[tickPrefix + 'Width'], !type && axis.isXAxis ? 1 : 0), // X axis defaults to 1
                    tickColor = options[tickPrefix + 'Color'];


                opacity = pick(opacity, 1);
                this.isActive = true;

                // Create the grid line
                if (!gridLine) {

                    attribs.stroke = gridLineColor;
                    attribs['stroke-width'] = gridLineWidth;
                    if (dashStyle) {
                        attribs.dashstyle = dashStyle;
                    }

                    if (!type) {
                        attribs.zIndex = 1;
                    }
                    if (old) {
                        attribs.opacity = 0;
                    }
                    tick.gridLine = gridLine = renderer.path()
                        .attr(attribs)
                        .addClass('highcharts-' + (type ? type + '-' : '') + 'grid-line')
                        .add(axis.gridGroup);
                }

                // If the parameter 'old' is set, the current call will be followed
                // by another call, therefore do not do any animations this time
                if (!old && gridLine) {
                    gridLinePath = axis.getPlotLinePath(pos + tickmarkOffset, gridLine.strokeWidth() * reverseCrisp, old, true);
                    if (gridLinePath) {
                        gridLine[tick.isNew ? 'attr' : 'animate']({
                            d: gridLinePath,
                            opacity: opacity
                        });
                    }
                }

                // create the tick mark
                if (tickSize) {

                    // negate the length
                    if (axis.opposite) {
                        tickSize[0] = -tickSize[0];
                    }

                    // First time, create it
                    if (isNewMark) {
                        tick.mark = mark = renderer.path()
                            .addClass('highcharts-' + (type ? type + '-' : '') + 'tick')
                            .add(axis.axisGroup);


                        mark.attr({
                            stroke: tickColor,
                            'stroke-width': tickWidth
                        });

                    }
                    mark[isNewMark ? 'attr' : 'animate']({
                        d: tick.getMarkPath(x, y, tickSize[0], mark.strokeWidth() * reverseCrisp, horiz, renderer),
                        opacity: opacity
                    });

                }

                // the label is created on init - now move it into place
                if (label && isNumber(x)) {
                    label.xy = xy = tick.getLabelPosition(x, y, label, horiz, labelOptions, tickmarkOffset, index, step);

                    // Apply show first and show last. If the tick is both first and last, it is
                    // a single centered tick, in which case we show the label anyway (#2100).
                    if ((tick.isFirst && !tick.isLast && !pick(options.showFirstLabel, 1)) ||
                        (tick.isLast && !tick.isFirst && !pick(options.showLastLabel, 1))) {
                        show = false;

                        // Handle label overflow and show or hide accordingly
                    } else if (horiz && !axis.isRadial && !labelOptions.step &&
                        !labelOptions.rotation && !old && opacity !== 0) {
                        tick.handleOverflow(xy);
                    }

                    // apply step
                    if (step && index % step) {
                        // show those indices dividable by step
                        show = false;
                    }

                    // Set the new position, and show or hide
                    if (show && isNumber(xy.y)) {
                        xy.opacity = opacity;
                        label[tick.isNew ? 'attr' : 'animate'](xy);
                    } else {
                        label.attr('y', -9999); // #1338
                    }
                    tick.isNew = false;
                }
            },

            /**
             * Destructor for the tick prototype
             */
            destroy: function() {
                destroyObjectProperties(this, this.axis);
            }
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';

        var addEvent = H.addEvent,
            animObject = H.animObject,
            arrayMax = H.arrayMax,
            arrayMin = H.arrayMin,
            AxisPlotLineOrBandExtension = H.AxisPlotLineOrBandExtension,
            color = H.color,
            correctFloat = H.correctFloat,
            defaultOptions = H.defaultOptions,
            defined = H.defined,
            deg2rad = H.deg2rad,
            destroyObjectProperties = H.destroyObjectProperties,
            each = H.each,
            extend = H.extend,
            fireEvent = H.fireEvent,
            format = H.format,
            getMagnitude = H.getMagnitude,
            grep = H.grep,
            inArray = H.inArray,
            isArray = H.isArray,
            isNumber = H.isNumber,
            isString = H.isString,
            merge = H.merge,
            normalizeTickInterval = H.normalizeTickInterval,
            pick = H.pick,
            PlotLineOrBand = H.PlotLineOrBand,
            removeEvent = H.removeEvent,
            splat = H.splat,
            syncTimeout = H.syncTimeout,
            Tick = H.Tick;

        /**
         * Create a new axis object.
         * @constructor Axis
         * @param {Object} chart
         * @param {Object} options
         */
        H.Axis = function() {
            this.init.apply(this, arguments);
        };

        H.Axis.prototype = {

            /**
             * Default options for the X axis - the Y axis has extended defaults
             */
            defaultOptions: {
                // allowDecimals: null,
                // alternateGridColor: null,
                // categories: [],
                dateTimeLabelFormats: {
                    millisecond: '%H:%M:%S.%L',
                    second: '%H:%M:%S',
                    minute: '%H:%M',
                    hour: '%H:%M',
                    day: '%e. %b',
                    week: '%e. %b',
                    month: '%b \'%y',
                    year: '%Y'
                },
                endOnTick: false,
                // reversed: false,

                labels: {
                    enabled: true,
                    // rotation: 0,
                    // align: 'center',
                    // step: null,

                    style: {
                        color: '#666666',
                        cursor: 'default',
                        fontSize: '11px'
                    },

                    x: 0
                        //y: undefined
                        /*formatter: function () {
                        	return this.value;
                        },*/
                },
                //linkedTo: null,
                //max: undefined,
                //min: undefined,
                minPadding: 0.01,
                maxPadding: 0.01,
                //minRange: null,
                //minorTickInterval: null,
                minorTickLength: 2,
                minorTickPosition: 'outside', // inside or outside
                //opposite: false,
                //offset: 0,
                //plotBands: [{
                //	events: {},
                //	zIndex: 1,
                //	labels: { align, x, verticalAlign, y, style, rotation, textAlign }
                //}],
                //plotLines: [{
                //	events: {}
                //  dashStyle: {}
                //	zIndex:
                //	labels: { align, x, verticalAlign, y, style, rotation, textAlign }
                //}],
                //reversed: false,
                // showFirstLabel: true,
                // showLastLabel: true,
                startOfWeek: 1,
                startOnTick: false,
                //tickInterval: null,
                tickLength: 10,
                tickmarkPlacement: 'between', // on or between
                tickPixelInterval: 100,
                tickPosition: 'outside',
                title: {
                    //text: null,
                    align: 'middle', // low, middle or high
                    //margin: 0 for horizontal, 10 for vertical axes,
                    //rotation: 0,
                    //side: 'outside',

                    style: {
                        color: '#666666'
                    }

                    //x: 0,
                    //y: 0
                },
                type: 'linear', // linear, logarithmic or datetime
                //visible: true

                minorGridLineColor: '#f2f2f2',
                // minorGridLineDashStyle: null,
                minorGridLineWidth: 1,
                minorTickColor: '#999999',
                //minorTickWidth: 0,
                lineColor: '#ccd6eb',
                lineWidth: 1,
                gridLineColor: '#e6e6e6',
                // gridLineDashStyle: 'solid',
                // gridLineWidth: 0,
                tickColor: '#ccd6eb'
                    // tickWidth: 1

            },

            /**
             * This options set extends the defaultOptions for Y axes
             */
            defaultYAxisOptions: {
                endOnTick: true,
                tickPixelInterval: 72,
                showLastLabel: true,
                labels: {
                    x: -8
                },
                maxPadding: 0.05,
                minPadding: 0.05,
                startOnTick: true,
                title: {
                    rotation: 270,
                    text: 'Values'
                },
                stackLabels: {
                    enabled: false,
                    //align: dynamic,
                    //y: dynamic,
                    //x: dynamic,
                    //verticalAlign: dynamic,
                    //textAlign: dynamic,
                    //rotation: 0,
                    formatter: function() {
                        return H.numberFormat(this.total, -1);
                    },

                    style: {
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#000000',
                        textOutline: '1px contrast'
                    }

                },

                gridLineWidth: 1,
                lineWidth: 0
                    // tickWidth: 0

            },

            /**
             * These options extend the defaultOptions for left axes
             */
            defaultLeftAxisOptions: {
                labels: {
                    x: -15
                },
                title: {
                    rotation: 270
                }
            },

            /**
             * These options extend the defaultOptions for right axes
             */
            defaultRightAxisOptions: {
                labels: {
                    x: 15
                },
                title: {
                    rotation: 90
                }
            },

            /**
             * These options extend the defaultOptions for bottom axes
             */
            defaultBottomAxisOptions: {
                labels: {
                    autoRotation: [-45],
                    x: 0
                        // overflow: undefined,
                        // staggerLines: null
                },
                title: {
                    rotation: 0
                }
            },
            /**
             * These options extend the defaultOptions for top axes
             */
            defaultTopAxisOptions: {
                labels: {
                    autoRotation: [-45],
                    x: 0
                        // overflow: undefined
                        // staggerLines: null
                },
                title: {
                    rotation: 0
                }
            },

            /**
             * Initialize the axis
             */
            init: function(chart, userOptions) {


                var isXAxis = userOptions.isX,
                    axis = this;

                axis.chart = chart;

                // Flag, is the axis horizontal
                axis.horiz = chart.inverted ? !isXAxis : isXAxis;

                // Flag, isXAxis
                axis.isXAxis = isXAxis;
                axis.coll = axis.coll || (isXAxis ? 'xAxis' : 'yAxis');

                axis.opposite = userOptions.opposite; // needed in setOptions
                axis.side = userOptions.side || (axis.horiz ?
                    (axis.opposite ? 0 : 2) : // top : bottom
                    (axis.opposite ? 1 : 3)); // right : left

                axis.setOptions(userOptions);


                var options = this.options,
                    type = options.type,
                    isDatetimeAxis = type === 'datetime';

                axis.labelFormatter = options.labels.formatter || axis.defaultLabelFormatter; // can be overwritten by dynamic format


                // Flag, stagger lines or not
                axis.userOptions = userOptions;

                //axis.axisTitleMargin = undefined,// = options.title.margin,
                axis.minPixelPadding = 0;

                axis.reversed = options.reversed;
                axis.visible = options.visible !== false;
                axis.zoomEnabled = options.zoomEnabled !== false;

                // Initial categories
                axis.hasNames = type === 'category' || options.categories === true;
                axis.categories = options.categories || axis.hasNames;
                axis.names = axis.names || []; // Preserve on update (#3830)

                // Elements
                //axis.axisGroup = undefined;
                //axis.gridGroup = undefined;
                //axis.axisTitle = undefined;
                //axis.axisLine = undefined;

                // Shorthand types
                axis.isLog = type === 'logarithmic';
                axis.isDatetimeAxis = isDatetimeAxis;

                // Flag, if axis is linked to another axis
                axis.isLinked = defined(options.linkedTo);
                // Linked axis.
                //axis.linkedParent = undefined;

                // Tick positions
                //axis.tickPositions = undefined; // array containing predefined positions
                // Tick intervals
                //axis.tickInterval = undefined;
                //axis.minorTickInterval = undefined;


                // Major ticks
                axis.ticks = {};
                axis.labelEdge = [];
                // Minor ticks
                axis.minorTicks = {};

                // List of plotLines/Bands
                axis.plotLinesAndBands = [];

                // Alternate bands
                axis.alternateBands = {};

                // Axis metrics
                //axis.left = undefined;
                //axis.top = undefined;
                //axis.width = undefined;
                //axis.height = undefined;
                //axis.bottom = undefined;
                //axis.right = undefined;
                //axis.transA = undefined;
                //axis.transB = undefined;
                //axis.oldTransA = undefined;
                axis.len = 0;
                //axis.oldMin = undefined;
                //axis.oldMax = undefined;
                //axis.oldUserMin = undefined;
                //axis.oldUserMax = undefined;
                //axis.oldAxisLength = undefined;
                axis.minRange = axis.userMinRange = options.minRange || options.maxZoom;
                axis.range = options.range;
                axis.offset = options.offset || 0;


                // Dictionary for stacks
                axis.stacks = {};
                axis.oldStacks = {};
                axis.stacksTouched = 0;

                // Min and max in the data
                //axis.dataMin = undefined,
                //axis.dataMax = undefined,

                // The axis range
                axis.max = null;
                axis.min = null;

                // User set min and max
                //axis.userMin = undefined,
                //axis.userMax = undefined,

                // Crosshair options
                axis.crosshair = pick(options.crosshair, splat(chart.options.tooltip.crosshairs)[isXAxis ? 0 : 1], false);
                // Run Axis

                var eventType,
                    events = axis.options.events;

                // Register
                if (inArray(axis, chart.axes) === -1) { // don't add it again on Axis.update()
                    if (isXAxis) { // #2713
                        chart.axes.splice(chart.xAxis.length, 0, axis);
                    } else {
                        chart.axes.push(axis);
                    }

                    chart[axis.coll].push(axis);
                }

                axis.series = axis.series || []; // populated by Series

                // inverted charts have reversed xAxes as default
                if (chart.inverted && isXAxis && axis.reversed === undefined) {
                    axis.reversed = true;
                }

                axis.removePlotBand = axis.removePlotBandOrLine;
                axis.removePlotLine = axis.removePlotBandOrLine;


                // register event listeners
                for (eventType in events) {
                    addEvent(axis, eventType, events[eventType]);
                }

                // extend logarithmic axis
                if (axis.isLog) {
                    axis.val2lin = axis.log2lin;
                    axis.lin2val = axis.lin2log;
                }
            },

            /**
             * Merge and set options
             */
            setOptions: function(userOptions) {
                this.options = merge(
                    this.defaultOptions,
                    this.coll === 'yAxis' && this.defaultYAxisOptions, [this.defaultTopAxisOptions, this.defaultRightAxisOptions,
                        this.defaultBottomAxisOptions, this.defaultLeftAxisOptions
                    ][this.side],
                    merge(
                        defaultOptions[this.coll], // if set in setOptions (#1053)
                        userOptions
                    )
                );
            },

            /**
             * The default label formatter. The context is a special config object for the label.
             */
            defaultLabelFormatter: function() {
                var axis = this.axis,
                    value = this.value,
                    categories = axis.categories,
                    dateTimeLabelFormat = this.dateTimeLabelFormat,
                    lang = defaultOptions.lang,
                    numericSymbols = lang.numericSymbols,
                    numSymMagnitude = lang.numericSymbolMagnitude || 1000,
                    i = numericSymbols && numericSymbols.length,
                    multi,
                    ret,
                    formatOption = axis.options.labels.format,

                    // make sure the same symbol is added for all labels on a linear axis
                    numericSymbolDetector = axis.isLog ? value : axis.tickInterval;

                if (formatOption) {
                    ret = format(formatOption, this);

                } else if (categories) {
                    ret = value;

                } else if (dateTimeLabelFormat) { // datetime axis
                    ret = H.dateFormat(dateTimeLabelFormat, value);

                } else if (i && numericSymbolDetector >= 1000) {
                    // Decide whether we should add a numeric symbol like k (thousands) or M (millions).
                    // If we are to enable this in tooltip or other places as well, we can move this
                    // logic to the numberFormatter and enable it by a parameter.
                    while (i-- && ret === undefined) {
                        multi = Math.pow(numSymMagnitude, i + 1);
                        if (numericSymbolDetector >= multi && (value * 10) % multi === 0 && numericSymbols[i] !== null && value !== 0) { // #5480
                            ret = H.numberFormat(value / multi, -1) + numericSymbols[i];
                        }
                    }
                }

                if (ret === undefined) {
                    if (Math.abs(value) >= 10000) { // add thousands separators
                        ret = H.numberFormat(value, -1);
                    } else { // small numbers
                        ret = H.numberFormat(value, -1, undefined, ''); // #2466
                    }
                }

                return ret;
            },

            /**
             * Get the minimum and maximum for the series of each axis
             */
            getSeriesExtremes: function() {
                var axis = this,
                    chart = axis.chart;
                axis.hasVisibleSeries = false;

                // Reset properties in case we're redrawing (#3353)
                axis.dataMin = axis.dataMax = axis.threshold = null;
                axis.softThreshold = !axis.isXAxis;

                if (axis.buildStacks) {
                    axis.buildStacks();
                }

                // loop through this axis' series
                each(axis.series, function(series) {

                    if (series.visible || !chart.options.chart.ignoreHiddenSeries) {

                        var seriesOptions = series.options,
                            xData,
                            threshold = seriesOptions.threshold,
                            seriesDataMin,
                            seriesDataMax;

                        axis.hasVisibleSeries = true;

                        // Validate threshold in logarithmic axes
                        if (axis.isLog && threshold <= 0) {
                            threshold = null;
                        }

                        // Get dataMin and dataMax for X axes
                        if (axis.isXAxis) {
                            xData = series.xData;
                            if (xData.length) {
                                // If xData contains values which is not numbers, then filter them out.
                                // To prevent performance hit, we only do this after we have already
                                // found seriesDataMin because in most cases all data is valid. #5234.
                                seriesDataMin = arrayMin(xData);
                                if (!isNumber(seriesDataMin) && !(seriesDataMin instanceof Date)) { // Date for #5010
                                    xData = grep(xData, function(x) {
                                        return isNumber(x);
                                    });
                                    seriesDataMin = arrayMin(xData); // Do it again with valid data
                                }

                                axis.dataMin = Math.min(pick(axis.dataMin, xData[0]), seriesDataMin);
                                axis.dataMax = Math.max(pick(axis.dataMax, xData[0]), arrayMax(xData));

                            }

                            // Get dataMin and dataMax for Y axes, as well as handle stacking and processed data
                        } else {

                            // Get this particular series extremes
                            series.getExtremes();
                            seriesDataMax = series.dataMax;
                            seriesDataMin = series.dataMin;

                            // Get the dataMin and dataMax so far. If percentage is used, the min and max are
                            // always 0 and 100. If seriesDataMin and seriesDataMax is null, then series
                            // doesn't have active y data, we continue with nulls
                            if (defined(seriesDataMin) && defined(seriesDataMax)) {
                                axis.dataMin = Math.min(pick(axis.dataMin, seriesDataMin), seriesDataMin);
                                axis.dataMax = Math.max(pick(axis.dataMax, seriesDataMax), seriesDataMax);
                            }

                            // Adjust to threshold
                            if (defined(threshold)) {
                                axis.threshold = threshold;
                            }
                            // If any series has a hard threshold, it takes precedence
                            if (!seriesOptions.softThreshold || axis.isLog) {
                                axis.softThreshold = false;
                            }
                        }
                    }
                });
            },

            /**
             * Translate from axis value to pixel position on the chart, or back
             *
             */
            translate: function(val, backwards, cvsCoord, old, handleLog, pointPlacement) {
                var axis = this.linkedParent || this, // #1417
                    sign = 1,
                    cvsOffset = 0,
                    localA = old ? axis.oldTransA : axis.transA,
                    localMin = old ? axis.oldMin : axis.min,
                    returnValue,
                    minPixelPadding = axis.minPixelPadding,
                    doPostTranslate = (axis.isOrdinal || axis.isBroken || (axis.isLog && handleLog)) && axis.lin2val;

                if (!localA) {
                    localA = axis.transA;
                }

                // In vertical axes, the canvas coordinates start from 0 at the top like in
                // SVG.
                if (cvsCoord) {
                    sign *= -1; // canvas coordinates inverts the value
                    cvsOffset = axis.len;
                }

                // Handle reversed axis
                if (axis.reversed) {
                    sign *= -1;
                    cvsOffset -= sign * (axis.sector || axis.len);
                }

                // From pixels to value
                if (backwards) { // reverse translation

                    val = val * sign + cvsOffset;
                    val -= minPixelPadding;
                    returnValue = val / localA + localMin; // from chart pixel to value
                    if (doPostTranslate) { // log and ordinal axes
                        returnValue = axis.lin2val(returnValue);
                    }

                    // From value to pixels
                } else {
                    if (doPostTranslate) { // log and ordinal axes
                        val = axis.val2lin(val);
                    }
                    returnValue = sign * (val - localMin) * localA + cvsOffset +
                        (sign * minPixelPadding) +
                        (isNumber(pointPlacement) ? localA * pointPlacement : 0);
                }

                return returnValue;
            },

            /**
             * Utility method to translate an axis value to pixel position.
             * @param {Number} value A value in terms of axis units
             * @param {Boolean} paneCoordinates Whether to return the pixel coordinate relative to the chart
             *        or just the axis/pane itself.
             */
            toPixels: function(value, paneCoordinates) {
                return this.translate(value, false, !this.horiz, null, true) + (paneCoordinates ? 0 : this.pos);
            },

            /**
             * Utility method to translate a pixel position in to an axis value.
             * @param {Number} pixel The pixel value coordinate
             * @param {Boolean} paneCoordiantes Whether the input pixel is relative to the chart or just the
             *        axis/pane itself.
             */
            toValue: function(pixel, paneCoordinates) {
                return this.translate(pixel - (paneCoordinates ? 0 : this.pos), true, !this.horiz, null, true);
            },

            /**
             * Create the path for a plot line that goes from the given value on
             * this axis, across the plot to the opposite side
             * @param {Number} value
             * @param {Number} lineWidth Used for calculation crisp line
             * @param {Number] old Use old coordinates (for resizing and rescaling)
             */
            getPlotLinePath: function(value, lineWidth, old, force, translatedValue) {
                var axis = this,
                    chart = axis.chart,
                    axisLeft = axis.left,
                    axisTop = axis.top,
                    x1,
                    y1,
                    x2,
                    y2,
                    cHeight = (old && chart.oldChartHeight) || chart.chartHeight,
                    cWidth = (old && chart.oldChartWidth) || chart.chartWidth,
                    skip,
                    transB = axis.transB,
                    /**
                     * Check if x is between a and b. If not, either move to a/b or skip,
                     * depending on the force parameter.
                     */
                    between = function(x, a, b) {
                        if (x < a || x > b) {
                            if (force) {
                                x = Math.min(Math.max(a, x), b);
                            } else {
                                skip = true;
                            }
                        }
                        return x;
                    };

                translatedValue = pick(translatedValue, axis.translate(value, null, null, old));
                x1 = x2 = Math.round(translatedValue + transB);
                y1 = y2 = Math.round(cHeight - translatedValue - transB);
                if (!isNumber(translatedValue)) { // no min or max
                    skip = true;

                } else if (axis.horiz) {
                    y1 = axisTop;
                    y2 = cHeight - axis.bottom;
                    x1 = x2 = between(x1, axisLeft, axisLeft + axis.width);
                } else {
                    x1 = axisLeft;
                    x2 = cWidth - axis.right;
                    y1 = y2 = between(y1, axisTop, axisTop + axis.height);
                }
                return skip && !force ?
                    null :
                    chart.renderer.crispLine(['M', x1, y1, 'L', x2, y2], lineWidth || 1);
            },

            /**
             * Set the tick positions of a linear axis to round values like whole tens or every five.
             */
            getLinearTickPositions: function(tickInterval, min, max) {
                var pos,
                    lastPos,
                    roundedMin = correctFloat(Math.floor(min / tickInterval) * tickInterval),
                    roundedMax = correctFloat(Math.ceil(max / tickInterval) * tickInterval),
                    tickPositions = [];

                // For single points, add a tick regardless of the relative position (#2662)
                if (min === max && isNumber(min)) {
                    return [min];
                }

                // Populate the intermediate values
                pos = roundedMin;
                while (pos <= roundedMax) {

                    // Place the tick on the rounded value
                    tickPositions.push(pos);

                    // Always add the raw tickInterval, not the corrected one.
                    pos = correctFloat(pos + tickInterval);

                    // If the interval is not big enough in the current min - max range to actually increase
                    // the loop variable, we need to break out to prevent endless loop. Issue #619
                    if (pos === lastPos) {
                        break;
                    }

                    // Record the last value
                    lastPos = pos;
                }
                return tickPositions;
            },

            /**
             * Return the minor tick positions. For logarithmic axes, reuse the same logic
             * as for major ticks.
             */
            getMinorTickPositions: function() {
                var axis = this,
                    options = axis.options,
                    tickPositions = axis.tickPositions,
                    minorTickInterval = axis.minorTickInterval,
                    minorTickPositions = [],
                    pos,
                    i,
                    pointRangePadding = axis.pointRangePadding || 0,
                    min = axis.min - pointRangePadding, // #1498
                    max = axis.max + pointRangePadding, // #1498
                    range = max - min,
                    len;

                // If minor ticks get too dense, they are hard to read, and may cause long running script. So we don't draw them.
                if (range && range / minorTickInterval < axis.len / 3) { // #3875

                    if (axis.isLog) {
                        len = tickPositions.length;
                        for (i = 1; i < len; i++) {
                            minorTickPositions = minorTickPositions.concat(
                                axis.getLogTickPositions(minorTickInterval, tickPositions[i - 1], tickPositions[i], true)
                            );
                        }
                    } else if (axis.isDatetimeAxis && options.minorTickInterval === 'auto') { // #1314
                        minorTickPositions = minorTickPositions.concat(
                            axis.getTimeTicks(
                                axis.normalizeTimeTickInterval(minorTickInterval),
                                min,
                                max,
                                options.startOfWeek
                            )
                        );
                    } else {
                        for (
                            pos = min + (tickPositions[0] - min) % minorTickInterval; pos <= max; pos += minorTickInterval
                        ) {
                            // Very, very, tight grid lines (#5771)
                            if (pos === minorTickPositions[0]) {
                                break;
                            }
                            minorTickPositions.push(pos);
                        }
                    }
                }

                if (minorTickPositions.length !== 0) { // don't change the extremes, when there is no minor ticks
                    axis.trimTicks(minorTickPositions, options.startOnTick, options.endOnTick); // #3652 #3743 #1498
                }
                return minorTickPositions;
            },

            /**
             * Adjust the min and max for the minimum range. Keep in mind that the series data is
             * not yet processed, so we don't have information on data cropping and grouping, or
             * updated axis.pointRange or series.pointRange. The data can't be processed until
             * we have finally established min and max.
             */
            adjustForMinRange: function() {
                var axis = this,
                    options = axis.options,
                    min = axis.min,
                    max = axis.max,
                    zoomOffset,
                    spaceAvailable = axis.dataMax - axis.dataMin >= axis.minRange,
                    closestDataRange,
                    i,
                    distance,
                    xData,
                    loopLength,
                    minArgs,
                    maxArgs,
                    minRange;

                // Set the automatic minimum range based on the closest point distance
                if (axis.isXAxis && axis.minRange === undefined && !axis.isLog) {

                    if (defined(options.min) || defined(options.max)) {
                        axis.minRange = null; // don't do this again

                    } else {

                        // Find the closest distance between raw data points, as opposed to
                        // closestPointRange that applies to processed points (cropped and grouped)
                        each(axis.series, function(series) {
                            xData = series.xData;
                            loopLength = series.xIncrement ? 1 : xData.length - 1;
                            for (i = loopLength; i > 0; i--) {
                                distance = xData[i] - xData[i - 1];
                                if (closestDataRange === undefined || distance < closestDataRange) {
                                    closestDataRange = distance;
                                }
                            }
                        });
                        axis.minRange = Math.min(closestDataRange * 5, axis.dataMax - axis.dataMin);
                    }
                }

                // if minRange is exceeded, adjust
                if (max - min < axis.minRange) {
                    minRange = axis.minRange;
                    zoomOffset = (minRange - max + min) / 2;

                    // if min and max options have been set, don't go beyond it
                    minArgs = [min - zoomOffset, pick(options.min, min - zoomOffset)];
                    if (spaceAvailable) { // if space is available, stay within the data range
                        minArgs[2] = axis.isLog ? axis.log2lin(axis.dataMin) : axis.dataMin;
                    }
                    min = arrayMax(minArgs);

                    maxArgs = [min + minRange, pick(options.max, min + minRange)];
                    if (spaceAvailable) { // if space is availabe, stay within the data range
                        maxArgs[2] = axis.isLog ? axis.log2lin(axis.dataMax) : axis.dataMax;
                    }

                    max = arrayMin(maxArgs);

                    // now if the max is adjusted, adjust the min back
                    if (max - min < minRange) {
                        minArgs[0] = max - minRange;
                        minArgs[1] = pick(options.min, max - minRange);
                        min = arrayMax(minArgs);
                    }
                }

                // Record modified extremes
                axis.min = min;
                axis.max = max;
            },

            /**
             * Find the closestPointRange across all series
             */
            getClosest: function() {
                var ret;

                if (this.categories) {
                    ret = 1;
                } else {
                    each(this.series, function(series) {
                        var seriesClosest = series.closestPointRange,
                            visible = series.visible ||
                            !series.chart.options.chart.ignoreHiddenSeries;

                        if (!series.noSharedTooltip &&
                            defined(seriesClosest) &&
                            visible
                        ) {
                            ret = defined(ret) ?
                                Math.min(ret, seriesClosest) :
                                seriesClosest;
                        }
                    });
                }
                return ret;
            },

            /**
             * When a point name is given and no x, search for the name in the existing categories,
             * or if categories aren't provided, search names or create a new category (#2522).
             */
            nameToX: function(point) {
                var explicitCategories = isArray(this.categories),
                    names = explicitCategories ? this.categories : this.names,
                    nameX = point.options.x,
                    x;

                point.series.requireSorting = false;

                if (!defined(nameX)) {
                    nameX = this.options.uniqueNames === false ?
                        point.series.autoIncrement() :
                        inArray(point.name, names);
                }
                if (nameX === -1) { // The name is not found in currenct categories
                    if (!explicitCategories) {
                        x = names.length;
                    }
                } else {
                    x = nameX;
                }

                // Write the last point's name to the names array
                this.names[x] = point.name;

                return x;
            },

            /**
             * When changes have been done to series data, update the axis.names.
             */
            updateNames: function() {
                var axis = this;

                if (this.names.length > 0) {
                    this.names.length = 0;
                    this.minRange = undefined;
                    each(this.series || [], function(series) {

                        // Reset incrementer (#5928)
                        series.xIncrement = null;

                        // When adding a series, points are not yet generated
                        if (!series.points || series.isDirtyData) {
                            series.processData();
                            series.generatePoints();
                        }

                        each(series.points, function(point, i) {
                            var x;
                            if (point.options) {
                                x = axis.nameToX(point);
                                if (x !== point.x) {
                                    point.x = x;
                                    series.xData[i] = x;
                                }
                            }
                        });
                    });
                }
            },

            /**
             * Update translation information
             */
            setAxisTranslation: function(saveOld) {
                var axis = this,
                    range = axis.max - axis.min,
                    pointRange = axis.axisPointRange || 0,
                    closestPointRange,
                    minPointOffset = 0,
                    pointRangePadding = 0,
                    linkedParent = axis.linkedParent,
                    ordinalCorrection,
                    hasCategories = !!axis.categories,
                    transA = axis.transA,
                    isXAxis = axis.isXAxis;

                // Adjust translation for padding. Y axis with categories need to go through the same (#1784).
                if (isXAxis || hasCategories || pointRange) {

                    // Get the closest points
                    closestPointRange = axis.getClosest();

                    if (linkedParent) {
                        minPointOffset = linkedParent.minPointOffset;
                        pointRangePadding = linkedParent.pointRangePadding;
                    } else {
                        each(axis.series, function(series) {
                            var seriesPointRange = hasCategories ?
                                1 :
                                (isXAxis ?
                                    pick(series.options.pointRange, closestPointRange, 0) :
                                    (axis.axisPointRange || 0)), // #2806
                                pointPlacement = series.options.pointPlacement;

                            pointRange = Math.max(pointRange, seriesPointRange);

                            if (!axis.single) {
                                // minPointOffset is the value padding to the left of the axis in order to make
                                // room for points with a pointRange, typically columns. When the pointPlacement option
                                // is 'between' or 'on', this padding does not apply.
                                minPointOffset = Math.max(
                                    minPointOffset,
                                    isString(pointPlacement) ? 0 : seriesPointRange / 2
                                );

                                // Determine the total padding needed to the length of the axis to make room for the
                                // pointRange. If the series' pointPlacement is 'on', no padding is added.
                                pointRangePadding = Math.max(
                                    pointRangePadding,
                                    pointPlacement === 'on' ? 0 : seriesPointRange
                                );
                            }
                        });
                    }

                    // Record minPointOffset and pointRangePadding
                    ordinalCorrection = axis.ordinalSlope && closestPointRange ? axis.ordinalSlope / closestPointRange : 1; // #988, #1853
                    axis.minPointOffset = minPointOffset = minPointOffset * ordinalCorrection;
                    axis.pointRangePadding = pointRangePadding = pointRangePadding * ordinalCorrection;

                    // pointRange means the width reserved for each point, like in a column chart
                    axis.pointRange = Math.min(pointRange, range);

                    // closestPointRange means the closest distance between points. In columns
                    // it is mostly equal to pointRange, but in lines pointRange is 0 while closestPointRange
                    // is some other value
                    if (isXAxis) {
                        axis.closestPointRange = closestPointRange;
                    }
                }

                // Secondary values
                if (saveOld) {
                    axis.oldTransA = transA;
                }
                axis.translationSlope = axis.transA = transA = axis.len / ((range + pointRangePadding) || 1);
                axis.transB = axis.horiz ? axis.left : axis.bottom; // translation addend
                axis.minPixelPadding = transA * minPointOffset;
            },

            minFromRange: function() {
                return this.max - this.range;
            },

            /**
             * Set the tick positions to round values and optionally extend the extremes
             * to the nearest tick
             */
            setTickInterval: function(secondPass) {
                var axis = this,
                    chart = axis.chart,
                    options = axis.options,
                    isLog = axis.isLog,
                    log2lin = axis.log2lin,
                    isDatetimeAxis = axis.isDatetimeAxis,
                    isXAxis = axis.isXAxis,
                    isLinked = axis.isLinked,
                    maxPadding = options.maxPadding,
                    minPadding = options.minPadding,
                    length,
                    linkedParentExtremes,
                    tickIntervalOption = options.tickInterval,
                    minTickInterval,
                    tickPixelIntervalOption = options.tickPixelInterval,
                    categories = axis.categories,
                    threshold = axis.threshold,
                    softThreshold = axis.softThreshold,
                    thresholdMin,
                    thresholdMax,
                    hardMin,
                    hardMax;

                if (!isDatetimeAxis && !categories && !isLinked) {
                    this.getTickAmount();
                }

                // Min or max set either by zooming/setExtremes or initial options
                hardMin = pick(axis.userMin, options.min);
                hardMax = pick(axis.userMax, options.max);

                // Linked axis gets the extremes from the parent axis
                if (isLinked) {
                    axis.linkedParent = chart[axis.coll][options.linkedTo];
                    linkedParentExtremes = axis.linkedParent.getExtremes();
                    axis.min = pick(linkedParentExtremes.min, linkedParentExtremes.dataMin);
                    axis.max = pick(linkedParentExtremes.max, linkedParentExtremes.dataMax);
                    if (options.type !== axis.linkedParent.options.type) {
                        H.error(11, 1); // Can't link axes of different type
                    }

                    // Initial min and max from the extreme data values
                } else {

                    // Adjust to hard threshold
                    if (!softThreshold && defined(threshold)) {
                        if (axis.dataMin >= threshold) {
                            thresholdMin = threshold;
                            minPadding = 0;
                        } else if (axis.dataMax <= threshold) {
                            thresholdMax = threshold;
                            maxPadding = 0;
                        }
                    }

                    axis.min = pick(hardMin, thresholdMin, axis.dataMin);
                    axis.max = pick(hardMax, thresholdMax, axis.dataMax);

                }

                if (isLog) {
                    if (!secondPass && Math.min(axis.min, pick(axis.dataMin, axis.min)) <= 0) { // #978
                        H.error(10, 1); // Can't plot negative values on log axis
                    }
                    // The correctFloat cures #934, float errors on full tens. But it
                    // was too aggressive for #4360 because of conversion back to lin,
                    // therefore use precision 15.
                    axis.min = correctFloat(log2lin(axis.min), 15);
                    axis.max = correctFloat(log2lin(axis.max), 15);
                }

                // handle zoomed range
                if (axis.range && defined(axis.max)) {
                    axis.userMin = axis.min = hardMin = Math.max(axis.min, axis.minFromRange()); // #618
                    axis.userMax = hardMax = axis.max;

                    axis.range = null; // don't use it when running setExtremes
                }

                // Hook for Highstock Scroller. Consider combining with beforePadding.
                fireEvent(axis, 'foundExtremes');

                // Hook for adjusting this.min and this.max. Used by bubble series.
                if (axis.beforePadding) {
                    axis.beforePadding();
                }

                // adjust min and max for the minimum range
                axis.adjustForMinRange();

                // Pad the values to get clear of the chart's edges. To avoid tickInterval taking the padding
                // into account, we do this after computing tick interval (#1337).
                if (!categories && !axis.axisPointRange && !axis.usePercentage && !isLinked && defined(axis.min) && defined(axis.max)) {
                    length = axis.max - axis.min;
                    if (length) {
                        if (!defined(hardMin) && minPadding) {
                            axis.min -= length * minPadding;
                        }
                        if (!defined(hardMax) && maxPadding) {
                            axis.max += length * maxPadding;
                        }
                    }
                }

                // Handle options for floor, ceiling, softMin and softMax
                if (isNumber(options.floor)) {
                    axis.min = Math.max(axis.min, options.floor);
                } else if (isNumber(options.softMin)) {
                    axis.min = Math.min(axis.min, options.softMin);
                }
                if (isNumber(options.ceiling)) {
                    axis.max = Math.min(axis.max, options.ceiling);
                } else if (isNumber(options.softMax)) {
                    axis.max = Math.max(axis.max, options.softMax);
                }

                // When the threshold is soft, adjust the extreme value only if
                // the data extreme and the padded extreme land on either side of the threshold. For example,
                // a series of [0, 1, 2, 3] would make the yAxis add a tick for -1 because of the
                // default minPadding and startOnTick options. This is prevented by the softThreshold
                // option.
                if (softThreshold && defined(axis.dataMin)) {
                    threshold = threshold || 0;
                    if (!defined(hardMin) && axis.min < threshold && axis.dataMin >= threshold) {
                        axis.min = threshold;
                    } else if (!defined(hardMax) && axis.max > threshold && axis.dataMax <= threshold) {
                        axis.max = threshold;
                    }
                }


                // get tickInterval
                if (axis.min === axis.max || axis.min === undefined || axis.max === undefined) {
                    axis.tickInterval = 1;
                } else if (isLinked && !tickIntervalOption &&
                    tickPixelIntervalOption === axis.linkedParent.options.tickPixelInterval) {
                    axis.tickInterval = tickIntervalOption = axis.linkedParent.tickInterval;
                } else {
                    axis.tickInterval = pick(
                        tickIntervalOption,
                        this.tickAmount ? ((axis.max - axis.min) / Math.max(this.tickAmount - 1, 1)) : undefined,
                        categories ? // for categoried axis, 1 is default, for linear axis use tickPix
                        1 :
                        // don't let it be more than the data range
                        (axis.max - axis.min) * tickPixelIntervalOption / Math.max(axis.len, tickPixelIntervalOption)
                    );
                }

                // Now we're finished detecting min and max, crop and group series data. This
                // is in turn needed in order to find tick positions in ordinal axes.
                if (isXAxis && !secondPass) {
                    each(axis.series, function(series) {
                        series.processData(axis.min !== axis.oldMin || axis.max !== axis.oldMax);
                    });
                }

                // set the translation factor used in translate function
                axis.setAxisTranslation(true);

                // hook for ordinal axes and radial axes
                if (axis.beforeSetTickPositions) {
                    axis.beforeSetTickPositions();
                }

                // hook for extensions, used in Highstock ordinal axes
                if (axis.postProcessTickInterval) {
                    axis.tickInterval = axis.postProcessTickInterval(axis.tickInterval);
                }

                // In column-like charts, don't cramp in more ticks than there are points (#1943, #4184)
                if (axis.pointRange && !tickIntervalOption) {
                    axis.tickInterval = Math.max(axis.pointRange, axis.tickInterval);
                }

                // Before normalizing the tick interval, handle minimum tick interval. This applies only if tickInterval is not defined.
                minTickInterval = pick(options.minTickInterval, axis.isDatetimeAxis && axis.closestPointRange);
                if (!tickIntervalOption && axis.tickInterval < minTickInterval) {
                    axis.tickInterval = minTickInterval;
                }

                // for linear axes, get magnitude and normalize the interval
                if (!isDatetimeAxis && !isLog && !tickIntervalOption) {
                    axis.tickInterval = normalizeTickInterval(
                        axis.tickInterval,
                        null,
                        getMagnitude(axis.tickInterval),
                        // If the tick interval is between 0.5 and 5 and the axis max is in the order of
                        // thousands, chances are we are dealing with years. Don't allow decimals. #3363.
                        pick(options.allowDecimals, !(axis.tickInterval > 0.5 && axis.tickInterval < 5 && axis.max > 1000 && axis.max < 9999)), !!this.tickAmount
                    );
                }

                // Prevent ticks from getting so close that we can't draw the labels
                if (!this.tickAmount) {
                    axis.tickInterval = axis.unsquish();
                }

                this.setTickPositions();
            },

            /**
             * Now we have computed the normalized tickInterval, get the tick positions
             */
            setTickPositions: function() {

                var options = this.options,
                    tickPositions,
                    tickPositionsOption = options.tickPositions,
                    tickPositioner = options.tickPositioner,
                    startOnTick = options.startOnTick,
                    endOnTick = options.endOnTick,
                    single;

                // Set the tickmarkOffset
                this.tickmarkOffset = (this.categories && options.tickmarkPlacement === 'between' &&
                    this.tickInterval === 1) ? 0.5 : 0; // #3202


                // get minorTickInterval
                this.minorTickInterval = options.minorTickInterval === 'auto' && this.tickInterval ?
                    this.tickInterval / 5 : options.minorTickInterval;

                // Find the tick positions
                this.tickPositions = tickPositions = tickPositionsOption && tickPositionsOption.slice(); // Work on a copy (#1565)
                if (!tickPositions) {

                    if (this.isDatetimeAxis) {
                        tickPositions = this.getTimeTicks(
                            this.normalizeTimeTickInterval(this.tickInterval, options.units),
                            this.min,
                            this.max,
                            options.startOfWeek,
                            this.ordinalPositions,
                            this.closestPointRange,
                            true
                        );
                    } else if (this.isLog) {
                        tickPositions = this.getLogTickPositions(this.tickInterval, this.min, this.max);
                    } else {
                        tickPositions = this.getLinearTickPositions(this.tickInterval, this.min, this.max);
                    }

                    // Too dense ticks, keep only the first and last (#4477)
                    if (tickPositions.length > this.len) {
                        tickPositions = [tickPositions[0], tickPositions.pop()];
                    }

                    this.tickPositions = tickPositions;

                    // Run the tick positioner callback, that allows modifying auto tick positions.
                    if (tickPositioner) {
                        tickPositioner = tickPositioner.apply(this, [this.min, this.max]);
                        if (tickPositioner) {
                            this.tickPositions = tickPositions = tickPositioner;
                        }
                    }

                }

                // reset min/max or remove extremes based on start/end on tick
                this.trimTicks(tickPositions, startOnTick, endOnTick);
                if (!this.isLinked) {
                    // When there is only one point, or all points have the same value on this axis, then min
                    // and max are equal and tickPositions.length is 0 or 1. In this case, add some padding
                    // in order to center the point, but leave it with one tick. #1337.
                    if (this.min === this.max && defined(this.min) && !this.tickAmount) {
                        // Substract half a unit (#2619, #2846, #2515, #3390)
                        single = true;
                        this.min -= 0.5;
                        this.max += 0.5;
                    }
                    this.single = single;
                    if (!tickPositionsOption && !tickPositioner) {
                        this.adjustTickAmount();
                    }
                }
            },

            /**
             * Handle startOnTick and endOnTick by either adapting to padding min/max or rounded min/max
             */
            trimTicks: function(tickPositions, startOnTick, endOnTick) {
                var roundedMin = tickPositions[0],
                    roundedMax = tickPositions[tickPositions.length - 1],
                    minPointOffset = this.minPointOffset || 0;

                if (!this.isLinked) {
                    if (startOnTick) {
                        this.min = roundedMin;
                    } else {
                        while (this.min - minPointOffset > tickPositions[0]) {
                            tickPositions.shift();
                        }
                    }

                    if (endOnTick) {
                        this.max = roundedMax;
                    } else {
                        while (this.max + minPointOffset < tickPositions[tickPositions.length - 1]) {
                            tickPositions.pop();
                        }
                    }

                    // If no tick are left, set one tick in the middle (#3195)
                    if (tickPositions.length === 0 && defined(roundedMin)) {
                        tickPositions.push((roundedMax + roundedMin) / 2);
                    }
                }
            },

            /**
             * Check if there are multiple axes in the same pane
             * @returns {Boolean} There are other axes
             */
            alignToOthers: function() {
                var others = {}, // Whether there is another axis to pair with this one
                    hasOther,
                    options = this.options;

                if (
                    // Only if alignTicks is true
                    this.chart.options.chart.alignTicks !== false &&
                    options.alignTicks !== false &&

                    // Don't try to align ticks on a log axis, they are not evenly
                    // spaced (#6021)
                    !this.isLog
                ) {
                    each(this.chart[this.coll], function(axis) {
                        var otherOptions = axis.options,
                            horiz = axis.horiz,
                            key = [
                                horiz ? otherOptions.left : otherOptions.top,
                                otherOptions.width,
                                otherOptions.height,
                                otherOptions.pane
                            ].join(',');


                        if (axis.series.length) { // #4442
                            if (others[key]) {
                                hasOther = true; // #4201
                            } else {
                                others[key] = 1;
                            }
                        }
                    });
                }
                return hasOther;
            },

            /**
             * Set the max ticks of either the x and y axis collection
             */
            getTickAmount: function() {
                var options = this.options,
                    tickAmount = options.tickAmount,
                    tickPixelInterval = options.tickPixelInterval;

                if (!defined(options.tickInterval) && this.len < tickPixelInterval && !this.isRadial &&
                    !this.isLog && options.startOnTick && options.endOnTick) {
                    tickAmount = 2;
                }

                if (!tickAmount && this.alignToOthers()) {
                    // Add 1 because 4 tick intervals require 5 ticks (including first and last)
                    tickAmount = Math.ceil(this.len / tickPixelInterval) + 1;
                }

                // For tick amounts of 2 and 3, compute five ticks and remove the intermediate ones. This
                // prevents the axis from adding ticks that are too far away from the data extremes.
                if (tickAmount < 4) {
                    this.finalTickAmt = tickAmount;
                    tickAmount = 5;
                }

                this.tickAmount = tickAmount;
            },

            /**
             * When using multiple axes, adjust the number of ticks to match the highest
             * number of ticks in that group
             */
            adjustTickAmount: function() {
                var tickInterval = this.tickInterval,
                    tickPositions = this.tickPositions,
                    tickAmount = this.tickAmount,
                    finalTickAmt = this.finalTickAmt,
                    currentTickAmount = tickPositions && tickPositions.length,
                    i,
                    len;

                if (currentTickAmount < tickAmount) {
                    while (tickPositions.length < tickAmount) {
                        tickPositions.push(correctFloat(
                            tickPositions[tickPositions.length - 1] + tickInterval
                        ));
                    }
                    this.transA *= (currentTickAmount - 1) / (tickAmount - 1);
                    this.max = tickPositions[tickPositions.length - 1];

                    // We have too many ticks, run second pass to try to reduce ticks
                } else if (currentTickAmount > tickAmount) {
                    this.tickInterval *= 2;
                    this.setTickPositions();
                }

                // The finalTickAmt property is set in getTickAmount
                if (defined(finalTickAmt)) {
                    i = len = tickPositions.length;
                    while (i--) {
                        if (
                            (finalTickAmt === 3 && i % 2 === 1) || // Remove every other tick
                            (finalTickAmt <= 2 && i > 0 && i < len - 1) // Remove all but first and last
                        ) {
                            tickPositions.splice(i, 1);
                        }
                    }
                    this.finalTickAmt = undefined;
                }
            },

            /**
             * Set the scale based on data min and max, user set min and max or options
             *
             */
            setScale: function() {
                var axis = this,
                    isDirtyData,
                    isDirtyAxisLength;

                axis.oldMin = axis.min;
                axis.oldMax = axis.max;
                axis.oldAxisLength = axis.len;

                // set the new axisLength
                axis.setAxisSize();
                //axisLength = horiz ? axisWidth : axisHeight;
                isDirtyAxisLength = axis.len !== axis.oldAxisLength;

                // is there new data?
                each(axis.series, function(series) {
                    if (series.isDirtyData || series.isDirty ||
                        series.xAxis.isDirty) { // when x axis is dirty, we need new data extremes for y as well
                        isDirtyData = true;
                    }
                });

                // do we really need to go through all this?
                if (isDirtyAxisLength || isDirtyData || axis.isLinked || axis.forceRedraw ||
                    axis.userMin !== axis.oldUserMin || axis.userMax !== axis.oldUserMax || axis.alignToOthers()) {

                    if (axis.resetStacks) {
                        axis.resetStacks();
                    }

                    axis.forceRedraw = false;

                    // get data extremes if needed
                    axis.getSeriesExtremes();

                    // get fixed positions based on tickInterval
                    axis.setTickInterval();

                    // record old values to decide whether a rescale is necessary later on (#540)
                    axis.oldUserMin = axis.userMin;
                    axis.oldUserMax = axis.userMax;

                    // Mark as dirty if it is not already set to dirty and extremes have changed. #595.
                    if (!axis.isDirty) {
                        axis.isDirty = isDirtyAxisLength || axis.min !== axis.oldMin || axis.max !== axis.oldMax;
                    }
                } else if (axis.cleanStacks) {
                    axis.cleanStacks();
                }
            },

            /**
             * Set the extremes and optionally redraw
             * @param {Number} newMin
             * @param {Number} newMax
             * @param {Boolean} redraw
             * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
             *    configuration
             * @param {Object} eventArguments
             *
             */
            setExtremes: function(newMin, newMax, redraw, animation, eventArguments) {
                var axis = this,
                    chart = axis.chart;

                redraw = pick(redraw, true); // defaults to true

                each(axis.series, function(serie) {
                    delete serie.kdTree;
                });

                // Extend the arguments with min and max
                eventArguments = extend(eventArguments, {
                    min: newMin,
                    max: newMax
                });

                // Fire the event
                fireEvent(axis, 'setExtremes', eventArguments, function() { // the default event handler

                    axis.userMin = newMin;
                    axis.userMax = newMax;
                    axis.eventArgs = eventArguments;

                    if (redraw) {
                        chart.redraw(animation);
                    }
                });
            },

            /**
             * Overridable method for zooming chart. Pulled out in a separate method to allow overriding
             * in stock charts.
             */
            zoom: function(newMin, newMax) {
                var dataMin = this.dataMin,
                    dataMax = this.dataMax,
                    options = this.options,
                    min = Math.min(dataMin, pick(options.min, dataMin)),
                    max = Math.max(dataMax, pick(options.max, dataMax));

                if (newMin !== this.min || newMax !== this.max) { // #5790

                    // Prevent pinch zooming out of range. Check for defined is for #1946. #1734.
                    if (!this.allowZoomOutside) {
                        // #6014, sometimes newMax will be smaller than min (or newMin will be larger than max).
                        if (defined(dataMin)) {
                            if (newMin < min) {
                                newMin = min;
                            }
                            if (newMin > max) {
                                newMin = max;
                            }
                        }
                        if (defined(dataMax)) {
                            if (newMax < min) {
                                newMax = min;
                            }
                            if (newMax > max) {
                                newMax = max;
                            }
                        }
                    }

                    // In full view, displaying the reset zoom button is not required
                    this.displayBtn = newMin !== undefined || newMax !== undefined;

                    // Do it
                    this.setExtremes(
                        newMin,
                        newMax,
                        false,
                        undefined, {
                            trigger: 'zoom'
                        }
                    );
                }

                return true;
            },

            /**
             * Update the axis metrics
             */
            setAxisSize: function() {
                var chart = this.chart,
                    options = this.options,
                    offsets = options.offsets || [0, 0, 0, 0], // top / right / bottom / left
                    horiz = this.horiz,
                    width = pick(options.width, chart.plotWidth - offsets[3] + offsets[1]),
                    height = pick(options.height, chart.plotHeight - offsets[0] + offsets[2]),
                    top = pick(options.top, chart.plotTop + offsets[0]),
                    left = pick(options.left, chart.plotLeft + offsets[3]),
                    percentRegex = /%$/;

                // Check for percentage based input values. Rounding fixes problems with
                // column overflow and plot line filtering (#4898, #4899)
                if (percentRegex.test(height)) {
                    height = Math.round(parseFloat(height) / 100 * chart.plotHeight);
                }
                if (percentRegex.test(top)) {
                    top = Math.round(parseFloat(top) / 100 * chart.plotHeight + chart.plotTop);
                }

                // Expose basic values to use in Series object and navigator
                this.left = left;
                this.top = top;
                this.width = width;
                this.height = height;
                this.bottom = chart.chartHeight - height - top;
                this.right = chart.chartWidth - width - left;

                // Direction agnostic properties
                this.len = Math.max(horiz ? width : height, 0); // Math.max fixes #905
                this.pos = horiz ? left : top; // distance from SVG origin
            },

            /**
             * Get the actual axis extremes
             */
            getExtremes: function() {
                var axis = this,
                    isLog = axis.isLog,
                    lin2log = axis.lin2log;

                return {
                    min: isLog ? correctFloat(lin2log(axis.min)) : axis.min,
                    max: isLog ? correctFloat(lin2log(axis.max)) : axis.max,
                    dataMin: axis.dataMin,
                    dataMax: axis.dataMax,
                    userMin: axis.userMin,
                    userMax: axis.userMax
                };
            },

            /**
             * Get the zero plane either based on zero or on the min or max value.
             * Used in bar and area plots
             */
            getThreshold: function(threshold) {
                var axis = this,
                    isLog = axis.isLog,
                    lin2log = axis.lin2log,
                    realMin = isLog ? lin2log(axis.min) : axis.min,
                    realMax = isLog ? lin2log(axis.max) : axis.max;

                if (threshold === null) {
                    threshold = realMin;
                } else if (realMin > threshold) {
                    threshold = realMin;
                } else if (realMax < threshold) {
                    threshold = realMax;
                }

                return axis.translate(threshold, 0, 1, 0, 1);
            },

            /**
             * Compute auto alignment for the axis label based on which side the axis is on
             * and the given rotation for the label
             */
            autoLabelAlign: function(rotation) {
                var ret,
                    angle = (pick(rotation, 0) - (this.side * 90) + 720) % 360;

                if (angle > 15 && angle < 165) {
                    ret = 'right';
                } else if (angle > 195 && angle < 345) {
                    ret = 'left';
                } else {
                    ret = 'center';
                }
                return ret;
            },

            /**
             * Get the tick length and width for the axis.
             * @param   {String} prefix 'tick' or 'minorTick'
             * @returns {Array}        An array of tickLength and tickWidth
             */
            tickSize: function(prefix) {
                var options = this.options,
                    tickLength = options[prefix + 'Length'],
                    tickWidth = pick(options[prefix + 'Width'], prefix === 'tick' && this.isXAxis ? 1 : 0); // X axis defaults to 1

                if (tickWidth && tickLength) {
                    // Negate the length
                    if (options[prefix + 'Position'] === 'inside') {
                        tickLength = -tickLength;
                    }
                    return [tickLength, tickWidth];
                }

            },

            /**
             * Return the size of the labels
             */
            labelMetrics: function() {
                return this.chart.renderer.fontMetrics(
                    this.options.labels.style && this.options.labels.style.fontSize,
                    this.ticks[0] && this.ticks[0].label
                );
            },

            /**
             * Prevent the ticks from getting so close we can't draw the labels. On a horizontal
             * axis, this is handled by rotating the labels, removing ticks and adding ellipsis.
             * On a vertical axis remove ticks and add ellipsis.
             */
            unsquish: function() {
                var labelOptions = this.options.labels,
                    horiz = this.horiz,
                    tickInterval = this.tickInterval,
                    newTickInterval = tickInterval,
                    slotSize = this.len / (((this.categories ? 1 : 0) + this.max - this.min) / tickInterval),
                    rotation,
                    rotationOption = labelOptions.rotation,
                    labelMetrics = this.labelMetrics(),
                    step,
                    bestScore = Number.MAX_VALUE,
                    autoRotation,
                    // Return the multiple of tickInterval that is needed to avoid collision
                    getStep = function(spaceNeeded) {
                        var step = spaceNeeded / (slotSize || 1);
                        step = step > 1 ? Math.ceil(step) : 1;
                        return step * tickInterval;
                    };

                if (horiz) {
                    autoRotation = !labelOptions.staggerLines && !labelOptions.step && ( // #3971
                        defined(rotationOption) ? [rotationOption] :
                        slotSize < pick(labelOptions.autoRotationLimit, 80) && labelOptions.autoRotation
                    );

                    if (autoRotation) {

                        // Loop over the given autoRotation options, and determine which gives the best score. The
                        // best score is that with the lowest number of steps and a rotation closest to horizontal.
                        each(autoRotation, function(rot) {
                            var score;

                            if (rot === rotationOption || (rot && rot >= -90 && rot <= 90)) { // #3891

                                step = getStep(Math.abs(labelMetrics.h / Math.sin(deg2rad * rot)));

                                score = step + Math.abs(rot / 360);

                                if (score < bestScore) {
                                    bestScore = score;
                                    rotation = rot;
                                    newTickInterval = step;
                                }
                            }
                        });
                    }

                } else if (!labelOptions.step) { // #4411
                    newTickInterval = getStep(labelMetrics.h);
                }

                this.autoRotation = autoRotation;
                this.labelRotation = pick(rotation, rotationOption);

                return newTickInterval;
            },

            /**
             * Get the general slot width for this axis. This may change between the pre-render (from Axis.getOffset) 
             * and the final tick rendering and placement (#5086).
             */
            getSlotWidth: function() {
                var chart = this.chart,
                    horiz = this.horiz,
                    labelOptions = this.options.labels,
                    slotCount = Math.max(this.tickPositions.length - (this.categories ? 0 : 1), 1),
                    marginLeft = chart.margin[3];

                return (
                    horiz &&
                    (labelOptions.step || 0) < 2 &&
                    !labelOptions.rotation && // #4415
                    ((this.staggerLines || 1) * this.len) / slotCount
                ) || (!horiz && (
                    (marginLeft && (marginLeft - chart.spacing[3])) ||
                    chart.chartWidth * 0.33
                )); // #1580, #1931

            },

            /**
             * Render the axis labels and determine whether ellipsis or rotation need to be applied
             */
            renderUnsquish: function() {
                var chart = this.chart,
                    renderer = chart.renderer,
                    tickPositions = this.tickPositions,
                    ticks = this.ticks,
                    labelOptions = this.options.labels,
                    horiz = this.horiz,
                    slotWidth = this.getSlotWidth(),
                    innerWidth = Math.max(1, Math.round(slotWidth - 2 * (labelOptions.padding || 5))),
                    attr = {},
                    labelMetrics = this.labelMetrics(),
                    textOverflowOption = labelOptions.style && labelOptions.style.textOverflow,
                    css,
                    maxLabelLength = 0,
                    label,
                    i,
                    pos;

                // Set rotation option unless it is "auto", like in gauges
                if (!isString(labelOptions.rotation)) {
                    attr.rotation = labelOptions.rotation || 0; // #4443
                }

                // Get the longest label length
                each(tickPositions, function(tick) {
                    tick = ticks[tick];
                    if (tick && tick.labelLength > maxLabelLength) {
                        maxLabelLength = tick.labelLength;
                    }
                });
                this.maxLabelLength = maxLabelLength;


                // Handle auto rotation on horizontal axis
                if (this.autoRotation) {

                    // Apply rotation only if the label is too wide for the slot, and
                    // the label is wider than its height.
                    if (maxLabelLength > innerWidth && maxLabelLength > labelMetrics.h) {
                        attr.rotation = this.labelRotation;
                    } else {
                        this.labelRotation = 0;
                    }

                    // Handle word-wrap or ellipsis on vertical axis
                } else if (slotWidth) {
                    // For word-wrap or ellipsis
                    css = {
                        width: innerWidth + 'px'
                    };

                    if (!textOverflowOption) {
                        css.textOverflow = 'clip';

                        // On vertical axis, only allow word wrap if there is room for more lines.
                        i = tickPositions.length;
                        while (!horiz && i--) {
                            pos = tickPositions[i];
                            label = ticks[pos].label;
                            if (label) {
                                // Reset ellipsis in order to get the correct bounding box (#4070)
                                if (label.styles && label.styles.textOverflow === 'ellipsis') {
                                    label.css({
                                        textOverflow: 'clip'
                                    });

                                    // Set the correct width in order to read the bounding box height (#4678, #5034)
                                } else if (ticks[pos].labelLength > slotWidth) {
                                    label.css({
                                        width: slotWidth + 'px'
                                    });
                                }

                                if (label.getBBox().height > this.len / tickPositions.length - (labelMetrics.h - labelMetrics.f)) {
                                    label.specCss = {
                                        textOverflow: 'ellipsis'
                                    };
                                }
                            }
                        }
                    }
                }


                // Add ellipsis if the label length is significantly longer than ideal
                if (attr.rotation) {
                    css = {
                        width: (maxLabelLength > chart.chartHeight * 0.5 ? chart.chartHeight * 0.33 : chart.chartHeight) + 'px'
                    };
                    if (!textOverflowOption) {
                        css.textOverflow = 'ellipsis';
                    }
                }

                // Set the explicit or automatic label alignment
                this.labelAlign = labelOptions.align || this.autoLabelAlign(this.labelRotation);
                if (this.labelAlign) {
                    attr.align = this.labelAlign;
                }

                // Apply general and specific CSS
                each(tickPositions, function(pos) {
                    var tick = ticks[pos],
                        label = tick && tick.label;
                    if (label) {
                        label.attr(attr); // This needs to go before the CSS in old IE (#4502)
                        if (css) {
                            label.css(merge(css, label.specCss));
                        }
                        delete label.specCss;
                        tick.rotation = attr.rotation;
                    }
                });

                // Note: Why is this not part of getLabelPosition?
                this.tickRotCorr = renderer.rotCorr(labelMetrics.b, this.labelRotation || 0, this.side !== 0);
            },

            /**
             * Return true if the axis has associated data
             */
            hasData: function() {
                return this.hasVisibleSeries || (defined(this.min) && defined(this.max) && !!this.tickPositions);
            },

            /**
             * Adds the title defined in axis.options.title.
             * @param {Boolean} display - whether or not to display the title
             */
            addTitle: function(display) {
                var axis = this,
                    renderer = axis.chart.renderer,
                    horiz = axis.horiz,
                    opposite = axis.opposite,
                    options = axis.options,
                    axisTitleOptions = options.title,
                    textAlign;

                if (!axis.axisTitle) {
                    textAlign = axisTitleOptions.textAlign;
                    if (!textAlign) {
                        textAlign = (horiz ? {
                            low: 'left',
                            middle: 'center',
                            high: 'right'
                        } : {
                            low: opposite ? 'right' : 'left',
                            middle: 'center',
                            high: opposite ? 'left' : 'right'
                        })[axisTitleOptions.align];
                    }
                    axis.axisTitle = renderer.text(
                            axisTitleOptions.text,
                            0,
                            0,
                            axisTitleOptions.useHTML
                        )
                        .attr({
                            zIndex: 7,
                            rotation: axisTitleOptions.rotation || 0,
                            align: textAlign
                        })
                        .addClass('highcharts-axis-title')

                    .css(axisTitleOptions.style)

                    .add(axis.axisGroup);
                    axis.axisTitle.isNew = true;
                }

                // hide or show the title depending on whether showEmpty is set
                axis.axisTitle[display ? 'show' : 'hide'](true);
            },

            /**
             * Generates a tick for initial positioning.
             * @param  {number} pos - The tick position in axis values.
             * @param  {number} i - The index of the tick in axis.tickPositions.
             */
            generateTick: function(pos) {
                var ticks = this.ticks;

                if (!ticks[pos]) {
                    ticks[pos] = new Tick(this, pos);
                } else {
                    ticks[pos].addLabel(); // update labels depending on tick interval
                }
            },

            /**
             * Render the tick labels to a preliminary position to get their sizes
             */
            getOffset: function() {
                var axis = this,
                    chart = axis.chart,
                    renderer = chart.renderer,
                    options = axis.options,
                    tickPositions = axis.tickPositions,
                    ticks = axis.ticks,
                    horiz = axis.horiz,
                    side = axis.side,
                    invertedSide = chart.inverted ? [1, 0, 3, 2][side] : side,
                    hasData,
                    showAxis,
                    titleOffset = 0,
                    titleOffsetOption,
                    titleMargin = 0,
                    axisTitleOptions = options.title,
                    labelOptions = options.labels,
                    labelOffset = 0, // reset
                    labelOffsetPadded,
                    axisOffset = chart.axisOffset,
                    clipOffset = chart.clipOffset,
                    clip,
                    directionFactor = [-1, 1, 1, -1][side],
                    n,
                    className = options.className,
                    axisParent = axis.axisParent, // Used in color axis
                    lineHeightCorrection,
                    tickSize = this.tickSize('tick');

                // For reuse in Axis.render
                hasData = axis.hasData();
                axis.showAxis = showAxis = hasData || pick(options.showEmpty, true);

                // Set/reset staggerLines
                axis.staggerLines = axis.horiz && labelOptions.staggerLines;

                // Create the axisGroup and gridGroup elements on first iteration
                if (!axis.axisGroup) {
                    axis.gridGroup = renderer.g('grid')
                        .attr({
                            zIndex: options.gridZIndex || 1
                        })
                        .addClass('highcharts-' + this.coll.toLowerCase() + '-grid ' + (className || ''))
                        .add(axisParent);
                    axis.axisGroup = renderer.g('axis')
                        .attr({
                            zIndex: options.zIndex || 2
                        })
                        .addClass('highcharts-' + this.coll.toLowerCase() + ' ' + (className || ''))
                        .add(axisParent);
                    axis.labelGroup = renderer.g('axis-labels')
                        .attr({
                            zIndex: labelOptions.zIndex || 7
                        })
                        .addClass('highcharts-' + axis.coll.toLowerCase() + '-labels ' + (className || ''))
                        .add(axisParent);
                }

                if (hasData || axis.isLinked) {

                    // Generate ticks
                    each(tickPositions, function(pos, i) {
                        // i is not used here, but may be used in overrides
                        axis.generateTick(pos, i);
                    });

                    axis.renderUnsquish();


                    // Left side must be align: right and right side must have align: left for labels
                    if (labelOptions.reserveSpace !== false && (side === 0 || side === 2 || {
                            1: 'left',
                            3: 'right'
                        }[side] === axis.labelAlign || axis.labelAlign === 'center')) {
                        each(tickPositions, function(pos) {

                            // get the highest offset
                            labelOffset = Math.max(
                                ticks[pos].getLabelSize(),
                                labelOffset
                            );
                        });
                    }

                    if (axis.staggerLines) {
                        labelOffset *= axis.staggerLines;
                        axis.labelOffset = labelOffset * (axis.opposite ? -1 : 1);
                    }


                } else { // doesn't have data
                    for (n in ticks) {
                        ticks[n].destroy();
                        delete ticks[n];
                    }
                }

                if (axisTitleOptions && axisTitleOptions.text && axisTitleOptions.enabled !== false) {
                    axis.addTitle(showAxis);

                    if (showAxis) {
                        titleOffset = axis.axisTitle.getBBox()[horiz ? 'height' : 'width'];
                        titleOffsetOption = axisTitleOptions.offset;
                        titleMargin = defined(titleOffsetOption) ? 0 : pick(axisTitleOptions.margin, horiz ? 5 : 10);
                    }
                }

                // Render the axis line
                axis.renderLine();

                // handle automatic or user set offset
                axis.offset = directionFactor * pick(options.offset, axisOffset[side]);

                axis.tickRotCorr = axis.tickRotCorr || {
                    x: 0,
                    y: 0
                }; // polar
                if (side === 0) {
                    lineHeightCorrection = -axis.labelMetrics().h;
                } else if (side === 2) {
                    lineHeightCorrection = axis.tickRotCorr.y;
                } else {
                    lineHeightCorrection = 0;
                }

                // Find the padded label offset
                labelOffsetPadded = Math.abs(labelOffset) + titleMargin;
                if (labelOffset) {
                    labelOffsetPadded -= lineHeightCorrection;
                    labelOffsetPadded += directionFactor * (horiz ? pick(labelOptions.y, axis.tickRotCorr.y + directionFactor * 8) : labelOptions.x);
                }
                axis.axisTitleMargin = pick(titleOffsetOption, labelOffsetPadded);

                axisOffset[side] = Math.max(
                    axisOffset[side],
                    axis.axisTitleMargin + titleOffset + directionFactor * axis.offset,
                    labelOffsetPadded, // #3027
                    hasData && tickPositions.length && tickSize ? tickSize[0] : 0 // #4866
                );

                // Decide the clipping needed to keep the graph inside the plot area and axis lines
                clip = options.offset ? 0 : Math.floor(axis.axisLine.strokeWidth() / 2) * 2; // #4308, #4371
                clipOffset[invertedSide] = Math.max(clipOffset[invertedSide], clip);
            },

            /**
             * Get the path for the axis line
             */
            getLinePath: function(lineWidth) {
                var chart = this.chart,
                    opposite = this.opposite,
                    offset = this.offset,
                    horiz = this.horiz,
                    lineLeft = this.left + (opposite ? this.width : 0) + offset,
                    lineTop = chart.chartHeight - this.bottom - (opposite ? this.height : 0) + offset;

                if (opposite) {
                    lineWidth *= -1; // crispify the other way - #1480, #1687
                }

                return chart.renderer
                    .crispLine([
                        'M',
                        horiz ?
                        this.left :
                        lineLeft,
                        horiz ?
                        lineTop :
                        this.top,
                        'L',
                        horiz ?
                        chart.chartWidth - this.right :
                        lineLeft,
                        horiz ?
                        lineTop :
                        chart.chartHeight - this.bottom
                    ], lineWidth);
            },

            /**
             * Render the axis line
             */
            renderLine: function() {
                if (!this.axisLine) {
                    this.axisLine = this.chart.renderer.path()
                        .addClass('highcharts-axis-line')
                        .add(this.axisGroup);


                    this.axisLine.attr({
                        stroke: this.options.lineColor,
                        'stroke-width': this.options.lineWidth,
                        zIndex: 7
                    });

                }
            },

            /**
             * Position the title
             */
            getTitlePosition: function() {
                // compute anchor points for each of the title align options
                var horiz = this.horiz,
                    axisLeft = this.left,
                    axisTop = this.top,
                    axisLength = this.len,
                    axisTitleOptions = this.options.title,
                    margin = horiz ? axisLeft : axisTop,
                    opposite = this.opposite,
                    offset = this.offset,
                    xOption = axisTitleOptions.x || 0,
                    yOption = axisTitleOptions.y || 0,
                    fontSize = this.chart.renderer.fontMetrics(axisTitleOptions.style && axisTitleOptions.style.fontSize, this.axisTitle).f,

                    // the position in the length direction of the axis
                    alongAxis = {
                        low: margin + (horiz ? 0 : axisLength),
                        middle: margin + axisLength / 2,
                        high: margin + (horiz ? axisLength : 0)
                    }[axisTitleOptions.align],

                    // the position in the perpendicular direction of the axis
                    offAxis = (horiz ? axisTop + this.height : axisLeft) +
                    (horiz ? 1 : -1) * // horizontal axis reverses the margin
                    (opposite ? -1 : 1) * // so does opposite axes
                    this.axisTitleMargin +
                    (this.side === 2 ? fontSize : 0);

                return {
                    x: horiz ?
                        alongAxis + xOption : offAxis + (opposite ? this.width : 0) + offset + xOption,
                    y: horiz ?
                        offAxis + yOption - (opposite ? this.height : 0) + offset : alongAxis + yOption
                };
            },

            /**
             * Render a minor tick into the given position. If a minor tick already 
             * exists in this position, move it.
             * @param  {number} pos - The position in axis values.
             */
            renderMinorTick: function(pos) {
                var slideInTicks = this.chart.hasRendered && isNumber(this.oldMin),
                    minorTicks = this.minorTicks;

                if (!minorTicks[pos]) {
                    minorTicks[pos] = new Tick(this, pos, 'minor');
                }

                // Render new ticks in old position
                if (slideInTicks && minorTicks[pos].isNew) {
                    minorTicks[pos].render(null, true);
                }

                minorTicks[pos].render(null, false, 1);
            },

            /**
             * Render a major tick into the given position. If a tick already exists
             * in this position, move it.
             * @param  {number} pos - The position in axis values
             * @param  {number} i - The tick index
             */
            renderTick: function(pos, i) {
                var isLinked = this.isLinked,
                    ticks = this.ticks,
                    slideInTicks = this.chart.hasRendered && isNumber(this.oldMin);

                // Linked axes need an extra check to find out if
                if (!isLinked || (pos >= this.min && pos <= this.max)) {

                    if (!ticks[pos]) {
                        ticks[pos] = new Tick(this, pos);
                    }

                    // render new ticks in old position
                    if (slideInTicks && ticks[pos].isNew) {
                        ticks[pos].render(i, true, 0.1);
                    }

                    ticks[pos].render(i);
                }
            },

            /**
             * Render the axis
             */
            render: function() {
                var axis = this,
                    chart = axis.chart,
                    renderer = chart.renderer,
                    options = axis.options,
                    isLog = axis.isLog,
                    lin2log = axis.lin2log,
                    isLinked = axis.isLinked,
                    tickPositions = axis.tickPositions,
                    axisTitle = axis.axisTitle,
                    ticks = axis.ticks,
                    minorTicks = axis.minorTicks,
                    alternateBands = axis.alternateBands,
                    stackLabelOptions = options.stackLabels,
                    alternateGridColor = options.alternateGridColor,
                    tickmarkOffset = axis.tickmarkOffset,
                    axisLine = axis.axisLine,
                    showAxis = axis.showAxis,
                    animation = animObject(renderer.globalAnimation),
                    from,
                    to;

                // Reset
                axis.labelEdge.length = 0;
                //axis.justifyToPlot = overflow === 'justify';
                axis.overlap = false;

                // Mark all elements inActive before we go over and mark the active ones
                each([ticks, minorTicks, alternateBands], function(coll) {
                    var pos;
                    for (pos in coll) {
                        coll[pos].isActive = false;
                    }
                });

                // If the series has data draw the ticks. Else only the line and title
                if (axis.hasData() || isLinked) {

                    // minor ticks
                    if (axis.minorTickInterval && !axis.categories) {
                        each(axis.getMinorTickPositions(), function(pos) {
                            axis.renderMinorTick(pos);
                        });
                    }

                    // Major ticks. Pull out the first item and render it last so that
                    // we can get the position of the neighbour label. #808.
                    if (tickPositions.length) { // #1300
                        each(tickPositions, function(pos, i) {
                            axis.renderTick(pos, i);
                        });
                        // In a categorized axis, the tick marks are displayed between labels. So
                        // we need to add a tick mark and grid line at the left edge of the X axis.
                        if (tickmarkOffset && (axis.min === 0 || axis.single)) {
                            if (!ticks[-1]) {
                                ticks[-1] = new Tick(axis, -1, null, true);
                            }
                            ticks[-1].render(-1);
                        }

                    }

                    // alternate grid color
                    if (alternateGridColor) {
                        each(tickPositions, function(pos, i) {
                            to = tickPositions[i + 1] !== undefined ? tickPositions[i + 1] + tickmarkOffset : axis.max - tickmarkOffset;
                            if (i % 2 === 0 && pos < axis.max && to <= axis.max + (chart.polar ? -tickmarkOffset : tickmarkOffset)) { // #2248, #4660
                                if (!alternateBands[pos]) {
                                    alternateBands[pos] = new PlotLineOrBand(axis);
                                }
                                from = pos + tickmarkOffset; // #949
                                alternateBands[pos].options = {
                                    from: isLog ? lin2log(from) : from,
                                    to: isLog ? lin2log(to) : to,
                                    color: alternateGridColor
                                };
                                alternateBands[pos].render();
                                alternateBands[pos].isActive = true;
                            }
                        });
                    }

                    // custom plot lines and bands
                    if (!axis._addedPlotLB) { // only first time
                        each((options.plotLines || []).concat(options.plotBands || []), function(plotLineOptions) {
                            axis.addPlotBandOrLine(plotLineOptions);
                        });
                        axis._addedPlotLB = true;
                    }

                } // end if hasData

                // Remove inactive ticks
                each([ticks, minorTicks, alternateBands], function(coll) {
                    var pos,
                        i,
                        forDestruction = [],
                        delay = animation.duration,
                        destroyInactiveItems = function() {
                            i = forDestruction.length;
                            while (i--) {
                                // When resizing rapidly, the same items may be destroyed in different timeouts,
                                // or the may be reactivated
                                if (coll[forDestruction[i]] && !coll[forDestruction[i]].isActive) {
                                    coll[forDestruction[i]].destroy();
                                    delete coll[forDestruction[i]];
                                }
                            }

                        };

                    for (pos in coll) {

                        if (!coll[pos].isActive) {
                            // Render to zero opacity
                            coll[pos].render(pos, false, 0);
                            coll[pos].isActive = false;
                            forDestruction.push(pos);
                        }
                    }

                    // When the objects are finished fading out, destroy them
                    syncTimeout(
                        destroyInactiveItems,
                        coll === alternateBands || !chart.hasRendered || !delay ? 0 : delay
                    );
                });

                // Set the axis line path
                if (axisLine) {
                    axisLine[axisLine.isPlaced ? 'animate' : 'attr']({
                        d: this.getLinePath(axisLine.strokeWidth())
                    });
                    axisLine.isPlaced = true;

                    // Show or hide the line depending on options.showEmpty
                    axisLine[showAxis ? 'show' : 'hide'](true);
                }

                if (axisTitle && showAxis) {

                    axisTitle[axisTitle.isNew ? 'attr' : 'animate'](
                        axis.getTitlePosition()
                    );
                    axisTitle.isNew = false;
                }

                // Stacked totals:
                if (stackLabelOptions && stackLabelOptions.enabled) {
                    axis.renderStackTotals();
                }
                // End stacked totals

                axis.isDirty = false;
            },

            /**
             * Redraw the axis to reflect changes in the data or axis extremes
             */
            redraw: function() {

                if (this.visible) {
                    // render the axis
                    this.render();

                    // move plot lines and bands
                    each(this.plotLinesAndBands, function(plotLine) {
                        plotLine.render();
                    });
                }

                // mark associated series as dirty and ready for redraw
                each(this.series, function(series) {
                    series.isDirty = true;
                });

            },

            // Properties to survive after destroy, needed for Axis.update (#4317,
            // #5773, #5881).
            keepProps: ['extKey', 'hcEvents', 'names', 'series', 'userMax', 'userMin'],

            /**
             * Destroys an Axis instance.
             */
            destroy: function(keepEvents) {
                var axis = this,
                    stacks = axis.stacks,
                    stackKey,
                    plotLinesAndBands = axis.plotLinesAndBands,
                    i,
                    n;

                // Remove the events
                if (!keepEvents) {
                    removeEvent(axis);
                }

                // Destroy each stack total
                for (stackKey in stacks) {
                    destroyObjectProperties(stacks[stackKey]);

                    stacks[stackKey] = null;
                }

                // Destroy collections
                each([axis.ticks, axis.minorTicks, axis.alternateBands], function(coll) {
                    destroyObjectProperties(coll);
                });
                if (plotLinesAndBands) {
                    i = plotLinesAndBands.length;
                    while (i--) { // #1975
                        plotLinesAndBands[i].destroy();
                    }
                }

                // Destroy local variables
                each(['stackTotalGroup', 'axisLine', 'axisTitle', 'axisGroup', 'gridGroup', 'labelGroup', 'cross'], function(prop) {
                    if (axis[prop]) {
                        axis[prop] = axis[prop].destroy();
                    }
                });

                // Delete all properties and fall back to the prototype.
                for (n in axis) {
                    if (axis.hasOwnProperty(n) && inArray(n, axis.keepProps) === -1) {
                        delete axis[n];
                    }
                }
            },

            /**
             * Draw the crosshair
             * 
             * @param  {Object} e The event arguments from the modified pointer event
             * @param  {Object} point The Point object
             */
            drawCrosshair: function(e, point) {

                var path,
                    options = this.crosshair,
                    snap = pick(options.snap, true),
                    pos,
                    categorized,
                    graphic = this.cross;

                // Use last available event when updating non-snapped crosshairs without
                // mouse interaction (#5287)
                if (!e) {
                    e = this.cross && this.cross.e;
                }

                if (
                    // Disabled in options
                    !this.crosshair ||
                    // Snap
                    ((defined(point) || !snap) === false)
                ) {
                    this.hideCrosshair();
                } else {

                    // Get the path
                    if (!snap) {
                        pos = e && (this.horiz ? e.chartX - this.pos : this.len - e.chartY + this.pos);
                    } else if (defined(point)) {
                        pos = this.isXAxis ? point.plotX : this.len - point.plotY; // #3834
                    }

                    if (defined(pos)) {
                        path = this.getPlotLinePath(
                            // First argument, value, only used on radial
                            point && (this.isXAxis ? point.x : pick(point.stackY, point.y)),
                            null,
                            null,
                            null,
                            pos // Translated position
                        ) || null; // #3189
                    }

                    if (!defined(path)) {
                        this.hideCrosshair();
                        return;
                    }

                    categorized = this.categories && !this.isRadial;

                    // Draw the cross
                    if (!graphic) {
                        this.cross = graphic = this.chart.renderer
                            .path()
                            .addClass('highcharts-crosshair highcharts-crosshair-' +
                                (categorized ? 'category ' : 'thin ') + options.className)
                            .attr({
                                zIndex: pick(options.zIndex, 2)
                            })
                            .add();


                        // Presentational attributes
                        graphic.attr({
                            'stroke': options.color || (categorized ? color('#ccd6eb').setOpacity(0.25).get() : '#cccccc'),
                            'stroke-width': pick(options.width, 1)
                        });
                        if (options.dashStyle) {
                            graphic.attr({
                                dashstyle: options.dashStyle
                            });
                        }


                    }

                    graphic.show().attr({
                        d: path
                    });

                    if (categorized && !options.width) {
                        graphic.attr({
                            'stroke-width': this.transA
                        });
                    }
                    this.cross.e = e;
                }
            },

            /**
             *	Hide the crosshair.
             */
            hideCrosshair: function() {
                if (this.cross) {
                    this.cross.hide();
                }
            }
        }; // end Axis

        extend(H.Axis.prototype, AxisPlotLineOrBandExtension);

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Axis = H.Axis,
            Date = H.Date,
            dateFormat = H.dateFormat,
            defaultOptions = H.defaultOptions,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            getMagnitude = H.getMagnitude,
            getTZOffset = H.getTZOffset,
            normalizeTickInterval = H.normalizeTickInterval,
            pick = H.pick,
            timeUnits = H.timeUnits;
        /**
         * Set the tick positions to a time unit that makes sense, for example
         * on the first of each month or on every Monday. Return an array
         * with the time positions. Used in datetime axes as well as for grouping
         * data on a datetime axis.
         *
         * @param {Object} normalizedInterval The interval in axis values (ms) and the count
         * @param {Number} min The minimum in axis values
         * @param {Number} max The maximum in axis values
         * @param {Number} startOfWeek
         */
        Axis.prototype.getTimeTicks = function(normalizedInterval, min, max, startOfWeek) {
            var tickPositions = [],
                i,
                higherRanks = {},
                useUTC = defaultOptions.global.useUTC,
                minYear, // used in months and years as a basis for Date.UTC()
                minDate = new Date(min - getTZOffset(min)),
                makeTime = Date.hcMakeTime,
                interval = normalizedInterval.unitRange,
                count = normalizedInterval.count,
                variableDayLength;

            if (defined(min)) { // #1300
                minDate[Date.hcSetMilliseconds](interval >= timeUnits.second ? 0 : // #3935
                    count * Math.floor(minDate.getMilliseconds() / count)); // #3652, #3654

                if (interval >= timeUnits.second) { // second
                    minDate[Date.hcSetSeconds](interval >= timeUnits.minute ? 0 : // #3935
                        count * Math.floor(minDate.getSeconds() / count));
                }

                if (interval >= timeUnits.minute) { // minute
                    minDate[Date.hcSetMinutes](interval >= timeUnits.hour ? 0 :
                        count * Math.floor(minDate[Date.hcGetMinutes]() / count));
                }

                if (interval >= timeUnits.hour) { // hour
                    minDate[Date.hcSetHours](interval >= timeUnits.day ? 0 :
                        count * Math.floor(minDate[Date.hcGetHours]() / count));
                }

                if (interval >= timeUnits.day) { // day
                    minDate[Date.hcSetDate](interval >= timeUnits.month ? 1 :
                        count * Math.floor(minDate[Date.hcGetDate]() / count));
                }

                if (interval >= timeUnits.month) { // month
                    minDate[Date.hcSetMonth](interval >= timeUnits.year ? 0 :
                        count * Math.floor(minDate[Date.hcGetMonth]() / count));
                    minYear = minDate[Date.hcGetFullYear]();
                }

                if (interval >= timeUnits.year) { // year
                    minYear -= minYear % count;
                    minDate[Date.hcSetFullYear](minYear);
                }

                // week is a special case that runs outside the hierarchy
                if (interval === timeUnits.week) {
                    // get start of current week, independent of count
                    minDate[Date.hcSetDate](minDate[Date.hcGetDate]() - minDate[Date.hcGetDay]() +
                        pick(startOfWeek, 1));
                }


                // Get basics for variable time spans
                minYear = minDate[Date.hcGetFullYear]();
                var minMonth = minDate[Date.hcGetMonth](),
                    minDateDate = minDate[Date.hcGetDate](),
                    minHours = minDate[Date.hcGetHours]();


                // Handle local timezone offset
                if (Date.hcTimezoneOffset || Date.hcGetTimezoneOffset) {

                    // Detect whether we need to take the DST crossover into
                    // consideration. If we're crossing over DST, the day length may be
                    // 23h or 25h and we need to compute the exact clock time for each
                    // tick instead of just adding hours. This comes at a cost, so first
                    // we found out if it is needed. #4951.
                    variableDayLength =
                        (!useUTC || !!Date.hcGetTimezoneOffset) &&
                        (
                            // Long range, assume we're crossing over.
                            max - min > 4 * timeUnits.month ||
                            // Short range, check if min and max are in different time 
                            // zones.
                            getTZOffset(min) !== getTZOffset(max)
                        );

                    // Adjust minDate to the offset date
                    minDate = minDate.getTime();
                    minDate = new Date(minDate + getTZOffset(minDate));
                }


                // Iterate and add tick positions at appropriate values
                var time = minDate.getTime();
                i = 1;
                while (time < max) {
                    tickPositions.push(time);

                    // if the interval is years, use Date.UTC to increase years
                    if (interval === timeUnits.year) {
                        time = makeTime(minYear + i * count, 0);

                        // if the interval is months, use Date.UTC to increase months
                    } else if (interval === timeUnits.month) {
                        time = makeTime(minYear, minMonth + i * count);

                        // if we're using global time, the interval is not fixed as it jumps
                        // one hour at the DST crossover
                    } else if (variableDayLength && (interval === timeUnits.day || interval === timeUnits.week)) {
                        time = makeTime(minYear, minMonth, minDateDate +
                            i * count * (interval === timeUnits.day ? 1 : 7));

                    } else if (variableDayLength && interval === timeUnits.hour) {
                        time = makeTime(minYear, minMonth, minDateDate, minHours + i * count);

                        // else, the interval is fixed and we use simple addition
                    } else {
                        time += interval * count;
                    }

                    i++;
                }

                // push the last time
                tickPositions.push(time);


                // Handle higher ranks. Mark new days if the time is on midnight
                // (#950, #1649, #1760, #3349). Use a reasonable dropout threshold to 
                // prevent looping over dense data grouping (#6156).
                if (interval <= timeUnits.hour && tickPositions.length < 10000) {
                    each(tickPositions, function(time) {
                        if (
                            // Speed optimization, no need to run dateFormat unless
                            // we're on a full or half hour
                            time % 1800000 === 0 &&
                            // Check for local or global midnight
                            dateFormat('%H%M%S%L', time) === '000000000'
                        ) {
                            higherRanks[time] = 'day';
                        }
                    });
                }
            }


            // record information on the chosen unit - for dynamic label formatter
            tickPositions.info = extend(normalizedInterval, {
                higherRanks: higherRanks,
                totalRange: interval * count
            });

            return tickPositions;
        };

        /**
         * Get a normalized tick interval for dates. Returns a configuration object with
         * unit range (interval), count and name. Used to prepare data for getTimeTicks.
         * Previously this logic was part of getTimeTicks, but as getTimeTicks now runs
         * of segments in stock charts, the normalizing logic was extracted in order to
         * prevent it for running over again for each segment having the same interval.
         * #662, #697.
         */
        Axis.prototype.normalizeTimeTickInterval = function(tickInterval, unitsOption) {
            var units = unitsOption || [
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
                        'day', [1, 2]
                    ],
                    [
                        'week', [1, 2]
                    ],
                    [
                        'month', [1, 2, 3, 4, 6]
                    ],
                    [
                        'year',
                        null
                    ]
                ],
                unit = units[units.length - 1], // default unit is years
                interval = timeUnits[unit[0]],
                multiples = unit[1],
                count,
                i;

            // loop through the units to find the one that best fits the tickInterval
            for (i = 0; i < units.length; i++) {
                unit = units[i];
                interval = timeUnits[unit[0]];
                multiples = unit[1];


                if (units[i + 1]) {
                    // lessThan is in the middle between the highest multiple and the next unit.
                    var lessThan = (interval * multiples[multiples.length - 1] +
                        timeUnits[units[i + 1][0]]) / 2;

                    // break and keep the current unit
                    if (tickInterval <= lessThan) {
                        break;
                    }
                }
            }

            // prevent 2.5 years intervals, though 25, 250 etc. are allowed
            if (interval === timeUnits.year && tickInterval < 5 * interval) {
                multiples = [1, 2, 5];
            }

            // get the count
            count = normalizeTickInterval(
                tickInterval / interval,
                multiples,
                unit[0] === 'year' ? Math.max(getMagnitude(tickInterval / interval), 1) : 1 // #1913, #2360
            );

            return {
                unitRange: interval,
                count: count,
                unitName: unit[0]
            };
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Axis = H.Axis,
            getMagnitude = H.getMagnitude,
            map = H.map,
            normalizeTickInterval = H.normalizeTickInterval,
            pick = H.pick;
        /**
         * Methods defined on the Axis prototype
         */

        /**
         * Set the tick positions of a logarithmic axis
         */
        Axis.prototype.getLogTickPositions = function(interval, min, max, minor) {
            var axis = this,
                options = axis.options,
                axisLength = axis.len,
                lin2log = axis.lin2log,
                log2lin = axis.log2lin,
                // Since we use this method for both major and minor ticks,
                // use a local variable and return the result
                positions = [];

            // Reset
            if (!minor) {
                axis._minorAutoInterval = null;
            }

            // First case: All ticks fall on whole logarithms: 1, 10, 100 etc.
            if (interval >= 0.5) {
                interval = Math.round(interval);
                positions = axis.getLinearTickPositions(interval, min, max);

                // Second case: We need intermediary ticks. For example
                // 1, 2, 4, 6, 8, 10, 20, 40 etc.
            } else if (interval >= 0.08) {
                var roundedMin = Math.floor(min),
                    intermediate,
                    i,
                    j,
                    len,
                    pos,
                    lastPos,
                    break2;

                if (interval > 0.3) {
                    intermediate = [1, 2, 4];
                } else if (interval > 0.15) { // 0.2 equals five minor ticks per 1, 10, 100 etc
                    intermediate = [1, 2, 4, 6, 8];
                } else { // 0.1 equals ten minor ticks per 1, 10, 100 etc
                    intermediate = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                }

                for (i = roundedMin; i < max + 1 && !break2; i++) {
                    len = intermediate.length;
                    for (j = 0; j < len && !break2; j++) {
                        pos = log2lin(lin2log(i) * intermediate[j]);
                        if (pos > min && (!minor || lastPos <= max) && lastPos !== undefined) { // #1670, lastPos is #3113
                            positions.push(lastPos);
                        }

                        if (lastPos > max) {
                            break2 = true;
                        }
                        lastPos = pos;
                    }
                }

                // Third case: We are so deep in between whole logarithmic values that
                // we might as well handle the tick positions like a linear axis. For
                // example 1.01, 1.02, 1.03, 1.04.
            } else {
                var realMin = lin2log(min),
                    realMax = lin2log(max),
                    tickIntervalOption = options[minor ? 'minorTickInterval' : 'tickInterval'],
                    filteredTickIntervalOption = tickIntervalOption === 'auto' ? null : tickIntervalOption,
                    tickPixelIntervalOption = options.tickPixelInterval / (minor ? 5 : 1),
                    totalPixelLength = minor ? axisLength / axis.tickPositions.length : axisLength;

                interval = pick(
                    filteredTickIntervalOption,
                    axis._minorAutoInterval,
                    (realMax - realMin) * tickPixelIntervalOption / (totalPixelLength || 1)
                );

                interval = normalizeTickInterval(
                    interval,
                    null,
                    getMagnitude(interval)
                );

                positions = map(axis.getLinearTickPositions(
                    interval,
                    realMin,
                    realMax
                ), log2lin);

                if (!minor) {
                    axis._minorAutoInterval = interval / 5;
                }
            }

            // Set the axis-level tickInterval variable
            if (!minor) {
                axis.tickInterval = interval;
            }
            return positions;
        };

        Axis.prototype.log2lin = function(num) {
            return Math.log(num) / Math.LN10;
        };

        Axis.prototype.lin2log = function(num) {
            return Math.pow(10, num);
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var dateFormat = H.dateFormat,
            each = H.each,
            extend = H.extend,
            format = H.format,
            isNumber = H.isNumber,
            map = H.map,
            merge = H.merge,
            pick = H.pick,
            splat = H.splat,
            syncTimeout = H.syncTimeout,
            timeUnits = H.timeUnits;
        /**
         * The tooltip object
         * @param {Object} chart The chart instance
         * @param {Object} options Tooltip options
         */
        H.Tooltip = function() {
            this.init.apply(this, arguments);
        };

        H.Tooltip.prototype = {

            init: function(chart, options) {

                // Save the chart and options
                this.chart = chart;
                this.options = options;

                // Keep track of the current series
                //this.currentSeries = undefined;

                // List of crosshairs
                this.crosshairs = [];

                // Current values of x and y when animating
                this.now = {
                    x: 0,
                    y: 0
                };

                // The tooltip is initially hidden
                this.isHidden = true;



                // Public property for getting the shared state.
                this.split = options.split && !chart.inverted;
                this.shared = options.shared || this.split;

            },

            /**
             * Destroy the single tooltips in a split tooltip.
             * If the tooltip is active then it is not destroyed, unless forced to.
             * @param  {boolean} force Force destroy all tooltips.
             * @return {undefined}
             */
            cleanSplit: function(force) {
                each(this.chart.series, function(series) {
                    var tt = series && series.tt;
                    if (tt) {
                        if (!tt.isActive || force) {
                            series.tt = tt.destroy();
                        } else {
                            tt.isActive = false;
                        }
                    }
                });
            },




            /**
             * Create the Tooltip label element if it doesn't exist, then return the
             * label.
             */
            getLabel: function() {

                var renderer = this.chart.renderer,
                    options = this.options;

                if (!this.label) {
                    // Create the label
                    if (this.split) {
                        this.label = renderer.g('tooltip');
                    } else {
                        this.label = renderer.label(
                                '',
                                0,
                                0,
                                options.shape || 'callout',
                                null,
                                null,
                                options.useHTML,
                                null,
                                'tooltip'
                            )
                            .attr({
                                padding: options.padding,
                                r: options.borderRadius
                            });


                        this.label
                            .attr({
                                'fill': options.backgroundColor,
                                'stroke-width': options.borderWidth
                            })
                            // #2301, #2657
                            .css(options.style)
                            .shadow(options.shadow);

                    }



                    this.label
                        .attr({
                            zIndex: 8
                        })
                        .add();
                }
                return this.label;
            },

            update: function(options) {
                this.destroy();
                this.init(this.chart, merge(true, this.options, options));
            },

            /**
             * Destroy the tooltip and its elements.
             */
            destroy: function() {
                // Destroy and clear local variables
                if (this.label) {
                    this.label = this.label.destroy();
                }
                if (this.split && this.tt) {
                    this.cleanSplit(this.chart, true);
                    this.tt = this.tt.destroy();
                }
                clearTimeout(this.hideTimer);
                clearTimeout(this.tooltipTimeout);
            },

            /**
             * Provide a soft movement for the tooltip
             *
             * @param {Number} x
             * @param {Number} y
             * @private
             */
            move: function(x, y, anchorX, anchorY) {
                var tooltip = this,
                    now = tooltip.now,
                    animate = tooltip.options.animation !== false && !tooltip.isHidden &&
                    // When we get close to the target position, abort animation and land on the right place (#3056)
                    (Math.abs(x - now.x) > 1 || Math.abs(y - now.y) > 1),
                    skipAnchor = tooltip.followPointer || tooltip.len > 1;

                // Get intermediate values for animation
                extend(now, {
                    x: animate ? (2 * now.x + x) / 3 : x,
                    y: animate ? (now.y + y) / 2 : y,
                    anchorX: skipAnchor ? undefined : animate ? (2 * now.anchorX + anchorX) / 3 : anchorX,
                    anchorY: skipAnchor ? undefined : animate ? (now.anchorY + anchorY) / 2 : anchorY
                });

                // Move to the intermediate value
                tooltip.getLabel().attr(now);


                // Run on next tick of the mouse tracker
                if (animate) {

                    // Never allow two timeouts
                    clearTimeout(this.tooltipTimeout);

                    // Set the fixed interval ticking for the smooth tooltip
                    this.tooltipTimeout = setTimeout(function() {
                        // The interval function may still be running during destroy,
                        // so check that the chart is really there before calling.
                        if (tooltip) {
                            tooltip.move(x, y, anchorX, anchorY);
                        }
                    }, 32);

                }
            },

            /**
             * Hide the tooltip
             */
            hide: function(delay) {
                var tooltip = this;
                clearTimeout(this.hideTimer); // disallow duplicate timers (#1728, #1766)
                delay = pick(delay, this.options.hideDelay, 500);
                if (!this.isHidden) {
                    this.hideTimer = syncTimeout(function() {
                        tooltip.getLabel()[delay ? 'fadeOut' : 'hide']();
                        tooltip.isHidden = true;
                    }, delay);
                }
            },

            /**
             * Extendable method to get the anchor position of the tooltip
             * from a point or set of points
             */
            getAnchor: function(points, mouseEvent) {
                var ret,
                    chart = this.chart,
                    inverted = chart.inverted,
                    plotTop = chart.plotTop,
                    plotLeft = chart.plotLeft,
                    plotX = 0,
                    plotY = 0,
                    yAxis,
                    xAxis;

                points = splat(points);

                // Pie uses a special tooltipPos
                ret = points[0].tooltipPos;

                // When tooltip follows mouse, relate the position to the mouse
                if (this.followPointer && mouseEvent) {
                    if (mouseEvent.chartX === undefined) {
                        mouseEvent = chart.pointer.normalize(mouseEvent);
                    }
                    ret = [
                        mouseEvent.chartX - chart.plotLeft,
                        mouseEvent.chartY - plotTop
                    ];
                }
                // When shared, use the average position
                if (!ret) {
                    each(points, function(point) {
                        yAxis = point.series.yAxis;
                        xAxis = point.series.xAxis;
                        plotX += point.plotX + (!inverted && xAxis ? xAxis.left - plotLeft : 0);
                        plotY += (point.plotLow ? (point.plotLow + point.plotHigh) / 2 : point.plotY) +
                            (!inverted && yAxis ? yAxis.top - plotTop : 0); // #1151
                    });

                    plotX /= points.length;
                    plotY /= points.length;

                    ret = [
                        inverted ? chart.plotWidth - plotY : plotX,
                        this.shared && !inverted && points.length > 1 && mouseEvent ?
                        mouseEvent.chartY - plotTop : // place shared tooltip next to the mouse (#424)
                        inverted ? chart.plotHeight - plotX : plotY
                    ];
                }

                return map(ret, Math.round);
            },

            /**
             * Place the tooltip in a chart without spilling over
             * and not covering the point it self.
             */
            getPosition: function(boxWidth, boxHeight, point) {

                var chart = this.chart,
                    distance = this.distance,
                    ret = {},
                    h = point.h || 0, // #4117
                    swapped,
                    first = ['y', chart.chartHeight, boxHeight,
                        point.plotY + chart.plotTop, chart.plotTop,
                        chart.plotTop + chart.plotHeight
                    ],
                    second = ['x', chart.chartWidth, boxWidth,
                        point.plotX + chart.plotLeft, chart.plotLeft,
                        chart.plotLeft + chart.plotWidth
                    ],
                    // The far side is right or bottom
                    preferFarSide = !this.followPointer && pick(point.ttBelow, !chart.inverted === !!point.negative), // #4984
                    /**
                     * Handle the preferred dimension. When the preferred dimension is tooltip
                     * on top or bottom of the point, it will look for space there.
                     */
                    firstDimension = function(dim, outerSize, innerSize, point, min, max) {
                        var roomLeft = innerSize < point - distance,
                            roomRight = point + distance + innerSize < outerSize,
                            alignedLeft = point - distance - innerSize,
                            alignedRight = point + distance;

                        if (preferFarSide && roomRight) {
                            ret[dim] = alignedRight;
                        } else if (!preferFarSide && roomLeft) {
                            ret[dim] = alignedLeft;
                        } else if (roomLeft) {
                            ret[dim] = Math.min(max - innerSize, alignedLeft - h < 0 ? alignedLeft : alignedLeft - h);
                        } else if (roomRight) {
                            ret[dim] = Math.max(
                                min,
                                alignedRight + h + innerSize > outerSize ?
                                alignedRight :
                                alignedRight + h
                            );
                        } else {
                            return false;
                        }
                    },
                    /**
                     * Handle the secondary dimension. If the preferred dimension is tooltip
                     * on top or bottom of the point, the second dimension is to align the tooltip
                     * above the point, trying to align center but allowing left or right
                     * align within the chart box.
                     */
                    secondDimension = function(dim, outerSize, innerSize, point) {
                        var retVal;

                        // Too close to the edge, return false and swap dimensions
                        if (point < distance || point > outerSize - distance) {
                            retVal = false;
                            // Align left/top
                        } else if (point < innerSize / 2) {
                            ret[dim] = 1;
                            // Align right/bottom
                        } else if (point > outerSize - innerSize / 2) {
                            ret[dim] = outerSize - innerSize - 2;
                            // Align center
                        } else {
                            ret[dim] = point - innerSize / 2;
                        }
                        return retVal;
                    },
                    /**
                     * Swap the dimensions
                     */
                    swap = function(count) {
                        var temp = first;
                        first = second;
                        second = temp;
                        swapped = count;
                    },
                    run = function() {
                        if (firstDimension.apply(0, first) !== false) {
                            if (secondDimension.apply(0, second) === false && !swapped) {
                                swap(true);
                                run();
                            }
                        } else if (!swapped) {
                            swap(true);
                            run();
                        } else {
                            ret.x = ret.y = 0;
                        }
                    };

                // Under these conditions, prefer the tooltip on the side of the point
                if (chart.inverted || this.len > 1) {
                    swap();
                }
                run();

                return ret;

            },

            /**
             * In case no user defined formatter is given, this will be used. Note that the context
             * here is an object holding point, series, x, y etc.
             *
             * @returns {String|Array<String>}
             */
            defaultFormatter: function(tooltip) {
                var items = this.points || splat(this),
                    s;

                // Build the header
                s = [tooltip.tooltipFooterHeaderFormatter(items[0])];

                // build the values
                s = s.concat(tooltip.bodyFormatter(items));

                // footer
                s.push(tooltip.tooltipFooterHeaderFormatter(items[0], true));

                return s;
            },

            /**
             * Refresh the tooltip's text and position.
             * @param {Object} point
             */
            refresh: function(point, mouseEvent) {
                var tooltip = this,
                    chart = tooltip.chart,
                    label,
                    options = tooltip.options,
                    x,
                    y,
                    anchor,
                    textConfig = {},
                    text,
                    pointConfig = [],
                    formatter = options.formatter || tooltip.defaultFormatter,
                    hoverPoints = chart.hoverPoints,
                    shared = tooltip.shared,
                    currentSeries;

                clearTimeout(this.hideTimer);

                // get the reference point coordinates (pie charts use tooltipPos)
                tooltip.followPointer = splat(point)[0].series.tooltipOptions.followPointer;
                anchor = tooltip.getAnchor(point, mouseEvent);
                x = anchor[0];
                y = anchor[1];

                // shared tooltip, array is sent over
                if (shared && !(point.series && point.series.noSharedTooltip)) {

                    // hide previous hoverPoints and set new

                    chart.hoverPoints = point;
                    if (hoverPoints) {
                        each(hoverPoints, function(point) {
                            point.setState();
                        });
                    }

                    each(point, function(item) {
                        item.setState('hover');

                        pointConfig.push(item.getLabelConfig());
                    });

                    textConfig = {
                        x: point[0].category,
                        y: point[0].y
                    };
                    textConfig.points = pointConfig;
                    point = point[0];

                    // single point tooltip
                } else {
                    textConfig = point.getLabelConfig();
                }
                this.len = pointConfig.length; // #6128
                text = formatter.call(textConfig, tooltip);

                // register the current series
                currentSeries = point.series;
                this.distance = pick(currentSeries.tooltipOptions.distance, 16);

                // update the inner HTML
                if (text === false) {
                    this.hide();
                } else {

                    label = tooltip.getLabel();

                    // show it
                    if (tooltip.isHidden) {
                        label.attr({
                            opacity: 1
                        }).show();
                    }

                    // update text
                    if (tooltip.split) {
                        this.renderSplit(text, chart.hoverPoints);
                    } else {
                        label.attr({
                            text: text && text.join ? text.join('') : text
                        });

                        // Set the stroke color of the box to reflect the point
                        label.removeClass(/highcharts-color-[\d]+/g)
                            .addClass('highcharts-color-' + pick(point.colorIndex, currentSeries.colorIndex));


                        label.attr({
                            stroke: options.borderColor || point.color || currentSeries.color || '#666666'
                        });


                        tooltip.updatePosition({
                            plotX: x,
                            plotY: y,
                            negative: point.negative,
                            ttBelow: point.ttBelow,
                            h: anchor[2] || 0
                        });
                    }

                    this.isHidden = false;
                }
            },

            /**
             * Render the split tooltip. Loops over each point's text and adds
             * a label next to the point, then uses the distribute function to 
             * find best non-overlapping positions.
             */
            renderSplit: function(labels, points) {
                var tooltip = this,
                    boxes = [],
                    chart = this.chart,
                    ren = chart.renderer,
                    rightAligned = true,
                    options = this.options,
                    headerHeight,
                    tooltipLabel = this.getLabel();

                // Create the individual labels for header and points, ignore footer
                each(labels.slice(0, points.length + 1), function(str, i) {
                    var point = points[i - 1] ||
                        // Item 0 is the header. Instead of this, we could also use the crosshair label
                        {
                            isHeader: true,
                            plotX: points[0].plotX
                        },
                        owner = point.series || tooltip,
                        tt = owner.tt,
                        series = point.series || {},
                        colorClass = 'highcharts-color-' + pick(point.colorIndex, series.colorIndex, 'none'),
                        target,
                        x,
                        bBox,
                        boxWidth;

                    // Store the tooltip referance on the series
                    if (!tt) {
                        owner.tt = tt = ren.label(null, null, null, 'callout')
                            .addClass('highcharts-tooltip-box ' + colorClass)
                            .attr({
                                'padding': options.padding,
                                'r': options.borderRadius,

                                'fill': options.backgroundColor,
                                'stroke': point.color || series.color || '#333333',
                                'stroke-width': options.borderWidth

                            })
                            .add(tooltipLabel);
                    }

                    tt.isActive = true;
                    tt.attr({
                        text: str
                    });

                    tt.css(options.style);


                    // Get X position now, so we can move all to the other side in case of overflow
                    bBox = tt.getBBox();
                    boxWidth = bBox.width + tt.strokeWidth();
                    if (point.isHeader) {
                        headerHeight = bBox.height;
                        x = Math.max(
                            0, // No left overflow
                            Math.min(
                                point.plotX + chart.plotLeft - boxWidth / 2,
                                chart.chartWidth - boxWidth // No right overflow (#5794)
                            )
                        );
                    } else {
                        x = point.plotX + chart.plotLeft - pick(options.distance, 16) -
                            boxWidth;
                    }


                    // If overflow left, we don't use this x in the next loop
                    if (x < 0) {
                        rightAligned = false;
                    }

                    // Prepare for distribution
                    target = (point.series && point.series.yAxis && point.series.yAxis.pos) + (point.plotY || 0);
                    target -= chart.plotTop;
                    boxes.push({
                        target: point.isHeader ? chart.plotHeight + headerHeight : target,
                        rank: point.isHeader ? 1 : 0,
                        size: owner.tt.getBBox().height + 1,
                        point: point,
                        x: x,
                        tt: tt
                    });
                });

                // Clean previous run (for missing points)
                this.cleanSplit();

                // Distribute and put in place
                H.distribute(boxes, chart.plotHeight + headerHeight);
                each(boxes, function(box) {
                    var point = box.point,
                        series = point.series;

                    // Put the label in place
                    box.tt.attr({
                        visibility: box.pos === undefined ? 'hidden' : 'inherit',
                        x: (rightAligned || point.isHeader ?
                            box.x :
                            point.plotX + chart.plotLeft + pick(options.distance, 16)),
                        y: box.pos + chart.plotTop,
                        anchorX: point.isHeader ?
                            point.plotX + chart.plotLeft : point.plotX + series.xAxis.pos,
                        anchorY: point.isHeader ?
                            box.pos + chart.plotTop - 15 : point.plotY + series.yAxis.pos
                    });
                });
            },

            /**
             * Find the new position and perform the move
             */
            updatePosition: function(point) {
                var chart = this.chart,
                    label = this.getLabel(),
                    pos = (this.options.positioner || this.getPosition).call(
                        this,
                        label.width,
                        label.height,
                        point
                    );

                // do the move
                this.move(
                    Math.round(pos.x),
                    Math.round(pos.y || 0), // can be undefined (#3977) 
                    point.plotX + chart.plotLeft,
                    point.plotY + chart.plotTop
                );
            },

            /**
             * Get the optimal date format for a point, based on a range.
             * @param  {number} range - The time range
             * @param  {number|Date} date - The date of the point in question
             * @param  {number} startOfWeek - An integer representing the first day of
             * the week, where 0 is Sunday
             * @param  {Object} dateTimeLabelFormats - A map of time units to formats
             * @return {string} - the optimal date format for a point
             */
            getDateFormat: function(range, date, startOfWeek, dateTimeLabelFormats) {
                var dateStr = dateFormat('%m-%d %H:%M:%S.%L', date),
                    format,
                    n,
                    blank = '01-01 00:00:00.000',
                    strpos = {
                        millisecond: 15,
                        second: 12,
                        minute: 9,
                        hour: 6,
                        day: 3
                    },
                    lastN = 'millisecond'; // for sub-millisecond data, #4223
                for (n in timeUnits) {

                    // If the range is exactly one week and we're looking at a Sunday/Monday, go for the week format
                    if (range === timeUnits.week && +dateFormat('%w', date) === startOfWeek &&
                        dateStr.substr(6) === blank.substr(6)) {
                        n = 'week';
                        break;
                    }

                    // The first format that is too great for the range
                    if (timeUnits[n] > range) {
                        n = lastN;
                        break;
                    }

                    // If the point is placed every day at 23:59, we need to show
                    // the minutes as well. #2637.
                    if (strpos[n] && dateStr.substr(strpos[n]) !== blank.substr(strpos[n])) {
                        break;
                    }

                    // Weeks are outside the hierarchy, only apply them on Mondays/Sundays like in the first condition
                    if (n !== 'week') {
                        lastN = n;
                    }
                }

                if (n) {
                    format = dateTimeLabelFormats[n];
                }

                return format;
            },

            /**
             * Get the best X date format based on the closest point range on the axis.
             */
            getXDateFormat: function(point, options, xAxis) {
                var xDateFormat,
                    dateTimeLabelFormats = options.dateTimeLabelFormats,
                    closestPointRange = xAxis && xAxis.closestPointRange;

                if (closestPointRange) {
                    xDateFormat = this.getDateFormat(
                        closestPointRange,
                        point.x,
                        xAxis.options.startOfWeek,
                        dateTimeLabelFormats
                    );
                } else {
                    xDateFormat = dateTimeLabelFormats.day;
                }

                return xDateFormat || dateTimeLabelFormats.year; // #2546, 2581
            },

            /**
             * Format the footer/header of the tooltip
             * #3397: abstraction to enable formatting of footer and header
             */
            tooltipFooterHeaderFormatter: function(labelConfig, isFooter) {
                var footOrHead = isFooter ? 'footer' : 'header',
                    series = labelConfig.series,
                    tooltipOptions = series.tooltipOptions,
                    xDateFormat = tooltipOptions.xDateFormat,
                    xAxis = series.xAxis,
                    isDateTime = xAxis && xAxis.options.type === 'datetime' && isNumber(labelConfig.key),
                    formatString = tooltipOptions[footOrHead + 'Format'];

                // Guess the best date format based on the closest point distance (#568, #3418)
                if (isDateTime && !xDateFormat) {
                    xDateFormat = this.getXDateFormat(labelConfig, tooltipOptions, xAxis);
                }

                // Insert the footer date format if any
                if (isDateTime && xDateFormat) {
                    formatString = formatString.replace('{point.key}', '{point.key:' + xDateFormat + '}');
                }

                return format(formatString, {
                    point: labelConfig,
                    series: series
                });
            },

            /**
             * Build the body (lines) of the tooltip by iterating over the items and returning one entry for each item,
             * abstracting this functionality allows to easily overwrite and extend it.
             */
            bodyFormatter: function(items) {
                return map(items, function(item) {
                    var tooltipOptions = item.series.tooltipOptions;
                    return (tooltipOptions.pointFormatter || item.point.tooltipFormatter)
                        .call(item.point, tooltipOptions.pointFormat);
                });
            }

        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            attr = H.attr,
            charts = H.charts,
            color = H.color,
            css = H.css,
            defined = H.defined,
            doc = H.doc,
            each = H.each,
            extend = H.extend,
            fireEvent = H.fireEvent,
            offset = H.offset,
            pick = H.pick,
            removeEvent = H.removeEvent,
            splat = H.splat,
            Tooltip = H.Tooltip,
            win = H.win;

        /**
         * The mouse tracker object. All methods starting with "on" are primary DOM
         * event handlers. Subsequent methods should be named differently from what they
         * are doing.
         *
         * @constructor Pointer
         * @param {Object} chart The Chart instance
         * @param {Object} options The root options object
         */
        H.Pointer = function(chart, options) {
            this.init(chart, options);
        };

        H.Pointer.prototype = {
            /**
             * Initialize Pointer
             */
            init: function(chart, options) {

                // Store references
                this.options = options;
                this.chart = chart;

                // Do we need to handle click on a touch device?
                this.runChartClick = options.chart.events && !!options.chart.events.click;

                this.pinchDown = [];
                this.lastValidTouch = {};

                if (Tooltip && options.tooltip.enabled) {
                    chart.tooltip = new Tooltip(chart, options.tooltip);
                    this.followTouchMove = pick(options.tooltip.followTouchMove, true);
                }

                this.setDOMEvents();
            },

            /**
             * Resolve the zoomType option, this is reset on all touch start and mouse
             * down events.
             */
            zoomOption: function(e) {
                var chart = this.chart,
                    options = chart.options.chart,
                    zoomType = options.zoomType || '',
                    inverted = chart.inverted,
                    zoomX,
                    zoomY;

                // Look for the pinchType option
                if (/touch/.test(e.type)) {
                    zoomType = pick(options.pinchType, zoomType);
                }

                this.zoomX = zoomX = /x/.test(zoomType);
                this.zoomY = zoomY = /y/.test(zoomType);
                this.zoomHor = (zoomX && !inverted) || (zoomY && inverted);
                this.zoomVert = (zoomY && !inverted) || (zoomX && inverted);
                this.hasZoom = zoomX || zoomY;
            },

            /**
             * Add crossbrowser support for chartX and chartY
             * @param {Object} e The event object in standard browsers
             */
            normalize: function(e, chartPosition) {
                var chartX,
                    chartY,
                    ePos;

                // IE normalizing
                e = e || win.event;
                if (!e.target) {
                    e.target = e.srcElement;
                }

                // iOS (#2757)
                ePos = e.touches ? (e.touches.length ? e.touches.item(0) : e.changedTouches[0]) : e;

                // Get mouse position
                if (!chartPosition) {
                    this.chartPosition = chartPosition = offset(this.chart.container);
                }

                // chartX and chartY
                if (ePos.pageX === undefined) { // IE < 9. #886.
                    chartX = Math.max(e.x, e.clientX - chartPosition.left); // #2005, #2129: the second case is 
                    // for IE10 quirks mode within framesets
                    chartY = e.y;
                } else {
                    chartX = ePos.pageX - chartPosition.left;
                    chartY = ePos.pageY - chartPosition.top;
                }

                return extend(e, {
                    chartX: Math.round(chartX),
                    chartY: Math.round(chartY)
                });
            },

            /**
             * Get the click position in terms of axis values.
             *
             * @param {Object} e A pointer event
             */
            getCoordinates: function(e) {
                var coordinates = {
                    xAxis: [],
                    yAxis: []
                };

                each(this.chart.axes, function(axis) {
                    coordinates[axis.isXAxis ? 'xAxis' : 'yAxis'].push({
                        axis: axis,
                        value: axis.toValue(e[axis.horiz ? 'chartX' : 'chartY'])
                    });
                });
                return coordinates;
            },

            /**
             * With line type charts with a single tracker, get the point closest to the mouse.
             * Run Point.onMouseOver and display tooltip for the point or points.
             */
            runPointActions: function(e) {

                var pointer = this,
                    chart = pointer.chart,
                    series = chart.series,
                    tooltip = chart.tooltip,
                    shared = tooltip ? tooltip.shared : false,
                    followPointer,
                    updatePosition = true,
                    hoverPoint = chart.hoverPoint,
                    hoverSeries = chart.hoverSeries,
                    i,
                    anchor,
                    noSharedTooltip,
                    stickToHoverSeries,
                    directTouch,
                    kdpoints = [],
                    kdpointT;

                // For hovering over the empty parts of the plot area (hoverSeries is undefined).
                // If there is one series with point tracking (combo chart), don't go to nearest neighbour.
                if (!shared && !hoverSeries) {
                    for (i = 0; i < series.length; i++) {
                        if (series[i].directTouch || !series[i].options.stickyTracking) {
                            series = [];
                        }
                    }
                }

                // If it has a hoverPoint and that series requires direct touch (like columns, #3899), or we're on
                // a noSharedTooltip series among shared tooltip series (#4546), use the hoverPoint . Otherwise,
                // search the k-d tree.
                stickToHoverSeries = hoverSeries && (shared ? hoverSeries.noSharedTooltip : hoverSeries.directTouch);
                if (stickToHoverSeries && hoverPoint) {
                    kdpoints = [hoverPoint];

                    // Handle shared tooltip or cases where a series is not yet hovered
                } else {
                    // When we have non-shared tooltip and sticky tracking is disabled,
                    // search for the closest point only on hovered series: #5533, #5476
                    if (!shared && hoverSeries && !hoverSeries.options.stickyTracking) {
                        series = [hoverSeries];
                    }
                    // Find nearest points on all series
                    each(series, function(s) {
                        // Skip hidden series
                        noSharedTooltip = s.noSharedTooltip && shared;
                        directTouch = !shared && s.directTouch;
                        if (s.visible && !noSharedTooltip && !directTouch && pick(s.options.enableMouseTracking, true)) { // #3821
                            kdpointT = s.searchPoint(e, !noSharedTooltip && s.kdDimensions === 1); // #3828
                            if (kdpointT && kdpointT.series) { // Point.series becomes null when reset and before redraw (#5197)
                                kdpoints.push(kdpointT);
                            }
                        }
                    });

                    // Sort kdpoints by distance to mouse pointer
                    kdpoints.sort(function(p1, p2) {
                        var isCloserX = p1.distX - p2.distX,
                            isCloser = p1.dist - p2.dist,
                            isAbove = (p2.series.group && p2.series.group.zIndex) -
                            (p1.series.group && p1.series.group.zIndex);

                        // We have two points which are not in the same place on xAxis and shared tooltip:
                        if (isCloserX !== 0 && shared) { // #5721
                            return isCloserX;
                        }
                        // Points are not exactly in the same place on x/yAxis:
                        if (isCloser !== 0) {
                            return isCloser;
                        }
                        // The same xAxis and yAxis position, sort by z-index:
                        if (isAbove !== 0) {
                            return isAbove;
                        }

                        // The same zIndex, sort by array index:
                        return p1.series.index > p2.series.index ? -1 : 1;
                    });
                }

                // Remove points with different x-positions, required for shared tooltip and crosshairs (#4645):
                if (shared) {
                    i = kdpoints.length;
                    while (i--) {
                        if (kdpoints[i].x !== kdpoints[0].x || kdpoints[i].series.noSharedTooltip) {
                            kdpoints.splice(i, 1);
                        }
                    }
                }

                // Refresh tooltip for kdpoint if new hover point or tooltip was hidden // #3926, #4200
                if (kdpoints[0] && (kdpoints[0] !== this.prevKDPoint || (tooltip && tooltip.isHidden))) {
                    // Draw tooltip if necessary
                    if (shared && !kdpoints[0].series.noSharedTooltip) {
                        // Do mouseover on all points (#3919, #3985, #4410, #5622)
                        for (i = 0; i < kdpoints.length; i++) {
                            kdpoints[i].onMouseOver(e, kdpoints[i] !== ((hoverSeries && hoverSeries.directTouch && hoverPoint) || kdpoints[0]));
                        }

                        if (kdpoints.length && tooltip) {
                            // Keep the order of series in tooltip:
                            tooltip.refresh(kdpoints.sort(function(p1, p2) {
                                return p1.series.index - p2.series.index;
                            }), e);
                        }
                    } else {
                        if (tooltip) {
                            tooltip.refresh(kdpoints[0], e);
                        }
                        if (!hoverSeries || !hoverSeries.directTouch) { // #4448
                            kdpoints[0].onMouseOver(e);
                        }
                    }
                    this.prevKDPoint = kdpoints[0];
                    updatePosition = false;
                }
                // Update positions (regardless of kdpoint or hoverPoint)
                if (updatePosition) {
                    followPointer = hoverSeries && hoverSeries.tooltipOptions.followPointer;
                    if (tooltip && followPointer && !tooltip.isHidden) {
                        anchor = tooltip.getAnchor([{}], e);
                        tooltip.updatePosition({
                            plotX: anchor[0],
                            plotY: anchor[1]
                        });
                    }
                }

                // Start the event listener to pick up the tooltip and crosshairs
                if (!pointer.unDocMouseMove) {
                    pointer.unDocMouseMove = addEvent(doc, 'mousemove', function(e) {
                        if (charts[H.hoverChartIndex]) {
                            charts[H.hoverChartIndex].pointer.onDocumentMouseMove(e);
                        }
                    });
                }

                // Crosshair. For each hover point, loop over axes and draw cross if that point
                // belongs to the axis (#4927).
                each(shared ? kdpoints : [pick(hoverPoint, kdpoints[0])], function drawPointCrosshair(point) { // #5269
                    each(chart.axes, function drawAxisCrosshair(axis) {
                        // In case of snap = false, point is undefined, and we draw the crosshair anyway (#5066)
                        if (!point || point.series && point.series[axis.coll] === axis) { // #5658
                            axis.drawCrosshair(e, point);
                        }
                    });
                });
            },

            /**
             * Reset the tracking by hiding the tooltip, the hover series state and the hover point
             *
             * @param allowMove {Boolean} Instead of destroying the tooltip altogether, allow moving it if possible
             */
            reset: function(allowMove, delay) {
                var pointer = this,
                    chart = pointer.chart,
                    hoverSeries = chart.hoverSeries,
                    hoverPoint = chart.hoverPoint,
                    hoverPoints = chart.hoverPoints,
                    tooltip = chart.tooltip,
                    tooltipPoints = tooltip && tooltip.shared ? hoverPoints : hoverPoint;

                // Check if the points have moved outside the plot area (#1003, #4736, #5101)
                if (allowMove && tooltipPoints) {
                    each(splat(tooltipPoints), function(point) {
                        if (point.series.isCartesian && point.plotX === undefined) {
                            allowMove = false;
                        }
                    });
                }

                // Just move the tooltip, #349
                if (allowMove) {
                    if (tooltip && tooltipPoints) {
                        tooltip.refresh(tooltipPoints);
                        if (hoverPoint) { // #2500
                            hoverPoint.setState(hoverPoint.state, true);
                            each(chart.axes, function(axis) {
                                if (axis.crosshair) {
                                    axis.drawCrosshair(null, hoverPoint);
                                }
                            });
                        }
                    }

                    // Full reset
                } else {

                    if (hoverPoint) {
                        hoverPoint.onMouseOut();
                    }

                    if (hoverPoints) {
                        each(hoverPoints, function(point) {
                            point.setState();
                        });
                    }

                    if (hoverSeries) {
                        hoverSeries.onMouseOut();
                    }

                    if (tooltip) {
                        tooltip.hide(delay);
                    }

                    if (pointer.unDocMouseMove) {
                        pointer.unDocMouseMove = pointer.unDocMouseMove();
                    }

                    // Remove crosshairs
                    each(chart.axes, function(axis) {
                        axis.hideCrosshair();
                    });

                    pointer.hoverX = pointer.prevKDPoint = chart.hoverPoints = chart.hoverPoint = null;
                }
            },

            /**
             * Scale series groups to a certain scale and translation
             */
            scaleGroups: function(attribs, clip) {

                var chart = this.chart,
                    seriesAttribs;

                // Scale each series
                each(chart.series, function(series) {
                    seriesAttribs = attribs || series.getPlotBox(); // #1701
                    if (series.xAxis && series.xAxis.zoomEnabled && series.group) {
                        series.group.attr(seriesAttribs);
                        if (series.markerGroup) {
                            series.markerGroup.attr(seriesAttribs);
                            series.markerGroup.clip(clip ? chart.clipRect : null);
                        }
                        if (series.dataLabelsGroup) {
                            series.dataLabelsGroup.attr(seriesAttribs);
                        }
                    }
                });

                // Clip
                chart.clipRect.attr(clip || chart.clipBox);
            },

            /**
             * Start a drag operation
             */
            dragStart: function(e) {
                var chart = this.chart;

                // Record the start position
                chart.mouseIsDown = e.type;
                chart.cancelClick = false;
                chart.mouseDownX = this.mouseDownX = e.chartX;
                chart.mouseDownY = this.mouseDownY = e.chartY;
            },

            /**
             * Perform a drag operation in response to a mousemove event while the mouse is down
             */
            drag: function(e) {

                var chart = this.chart,
                    chartOptions = chart.options.chart,
                    chartX = e.chartX,
                    chartY = e.chartY,
                    zoomHor = this.zoomHor,
                    zoomVert = this.zoomVert,
                    plotLeft = chart.plotLeft,
                    plotTop = chart.plotTop,
                    plotWidth = chart.plotWidth,
                    plotHeight = chart.plotHeight,
                    clickedInside,
                    size,
                    selectionMarker = this.selectionMarker,
                    mouseDownX = this.mouseDownX,
                    mouseDownY = this.mouseDownY,
                    panKey = chartOptions.panKey && e[chartOptions.panKey + 'Key'];

                // If the device supports both touch and mouse (like IE11), and we are touch-dragging
                // inside the plot area, don't handle the mouse event. #4339.
                if (selectionMarker && selectionMarker.touch) {
                    return;
                }

                // If the mouse is outside the plot area, adjust to cooordinates
                // inside to prevent the selection marker from going outside
                if (chartX < plotLeft) {
                    chartX = plotLeft;
                } else if (chartX > plotLeft + plotWidth) {
                    chartX = plotLeft + plotWidth;
                }

                if (chartY < plotTop) {
                    chartY = plotTop;
                } else if (chartY > plotTop + plotHeight) {
                    chartY = plotTop + plotHeight;
                }

                // determine if the mouse has moved more than 10px
                this.hasDragged = Math.sqrt(
                    Math.pow(mouseDownX - chartX, 2) +
                    Math.pow(mouseDownY - chartY, 2)
                );

                if (this.hasDragged > 10) {
                    clickedInside = chart.isInsidePlot(mouseDownX - plotLeft, mouseDownY - plotTop);

                    // make a selection
                    if (chart.hasCartesianSeries && (this.zoomX || this.zoomY) && clickedInside && !panKey) {
                        if (!selectionMarker) {
                            this.selectionMarker = selectionMarker = chart.renderer.rect(
                                    plotLeft,
                                    plotTop,
                                    zoomHor ? 1 : plotWidth,
                                    zoomVert ? 1 : plotHeight,
                                    0
                                )
                                .attr({

                                    fill: chartOptions.selectionMarkerFill || color('#335cad').setOpacity(0.25).get(),

                                    'class': 'highcharts-selection-marker',
                                    'zIndex': 7
                                })
                                .add();
                        }
                    }

                    // adjust the width of the selection marker
                    if (selectionMarker && zoomHor) {
                        size = chartX - mouseDownX;
                        selectionMarker.attr({
                            width: Math.abs(size),
                            x: (size > 0 ? 0 : size) + mouseDownX
                        });
                    }
                    // adjust the height of the selection marker
                    if (selectionMarker && zoomVert) {
                        size = chartY - mouseDownY;
                        selectionMarker.attr({
                            height: Math.abs(size),
                            y: (size > 0 ? 0 : size) + mouseDownY
                        });
                    }

                    // panning
                    if (clickedInside && !selectionMarker && chartOptions.panning) {
                        chart.pan(e, chartOptions.panning);
                    }
                }
            },

            /**
             * On mouse up or touch end across the entire document, drop the selection.
             */
            drop: function(e) {
                var pointer = this,
                    chart = this.chart,
                    hasPinched = this.hasPinched;

                if (this.selectionMarker) {
                    var selectionData = {
                            originalEvent: e, // #4890
                            xAxis: [],
                            yAxis: []
                        },
                        selectionBox = this.selectionMarker,
                        selectionLeft = selectionBox.attr ? selectionBox.attr('x') : selectionBox.x,
                        selectionTop = selectionBox.attr ? selectionBox.attr('y') : selectionBox.y,
                        selectionWidth = selectionBox.attr ? selectionBox.attr('width') : selectionBox.width,
                        selectionHeight = selectionBox.attr ? selectionBox.attr('height') : selectionBox.height,
                        runZoom;

                    // a selection has been made
                    if (this.hasDragged || hasPinched) {

                        // record each axis' min and max
                        each(chart.axes, function(axis) {
                            if (axis.zoomEnabled && defined(axis.min) && (hasPinched || pointer[{
                                    xAxis: 'zoomX',
                                    yAxis: 'zoomY'
                                }[axis.coll]])) { // #859, #3569
                                var horiz = axis.horiz,
                                    minPixelPadding = e.type === 'touchend' ? axis.minPixelPadding : 0, // #1207, #3075
                                    selectionMin = axis.toValue((horiz ? selectionLeft : selectionTop) + minPixelPadding),
                                    selectionMax = axis.toValue((horiz ? selectionLeft + selectionWidth : selectionTop + selectionHeight) - minPixelPadding);

                                selectionData[axis.coll].push({
                                    axis: axis,
                                    min: Math.min(selectionMin, selectionMax), // for reversed axes
                                    max: Math.max(selectionMin, selectionMax)
                                });
                                runZoom = true;
                            }
                        });
                        if (runZoom) {
                            fireEvent(chart, 'selection', selectionData, function(args) {
                                chart.zoom(extend(args, hasPinched ? {
                                    animation: false
                                } : null));
                            });
                        }

                    }
                    this.selectionMarker = this.selectionMarker.destroy();

                    // Reset scaling preview
                    if (hasPinched) {
                        this.scaleGroups();
                    }
                }

                // Reset all
                if (chart) { // it may be destroyed on mouse up - #877
                    css(chart.container, {
                        cursor: chart._cursor
                    });
                    chart.cancelClick = this.hasDragged > 10; // #370
                    chart.mouseIsDown = this.hasDragged = this.hasPinched = false;
                    this.pinchDown = [];
                }
            },

            onContainerMouseDown: function(e) {

                e = this.normalize(e);

                this.zoomOption(e);

                // issue #295, dragging not always working in Firefox
                if (e.preventDefault) {
                    e.preventDefault();
                }

                this.dragStart(e);
            },



            onDocumentMouseUp: function(e) {
                if (charts[H.hoverChartIndex]) {
                    charts[H.hoverChartIndex].pointer.drop(e);
                }
            },

            /**
             * Special handler for mouse move that will hide the tooltip when the mouse leaves the plotarea.
             * Issue #149 workaround. The mouseleave event does not always fire.
             */
            onDocumentMouseMove: function(e) {
                var chart = this.chart,
                    chartPosition = this.chartPosition;

                e = this.normalize(e, chartPosition);

                // If we're outside, hide the tooltip
                if (chartPosition && !this.inClass(e.target, 'highcharts-tracker') &&
                    !chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
                    this.reset();
                }
            },

            /**
             * When mouse leaves the container, hide the tooltip.
             */
            onContainerMouseLeave: function(e) {
                var chart = charts[H.hoverChartIndex];
                if (chart && (e.relatedTarget || e.toElement)) { // #4886, MS Touch end fires mouseleave but with no related target
                    chart.pointer.reset();
                    chart.pointer.chartPosition = null; // also reset the chart position, used in #149 fix
                }
            },

            // The mousemove, touchmove and touchstart event handler
            onContainerMouseMove: function(e) {

                var chart = this.chart;

                if (!defined(H.hoverChartIndex) || !charts[H.hoverChartIndex] || !charts[H.hoverChartIndex].mouseIsDown) {
                    H.hoverChartIndex = chart.index;
                }

                e = this.normalize(e);
                e.returnValue = false; // #2251, #3224

                if (chart.mouseIsDown === 'mousedown') {
                    this.drag(e);
                }

                // Show the tooltip and run mouse over events (#977)
                if ((this.inClass(e.target, 'highcharts-tracker') ||
                        chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) && !chart.openMenu) {
                    this.runPointActions(e);
                }
            },

            /**
             * Utility to detect whether an element has, or has a parent with, a specific
             * class name. Used on detection of tracker objects and on deciding whether
             * hovering the tooltip should cause the active series to mouse out.
             */
            inClass: function(element, className) {
                var elemClassName;
                while (element) {
                    elemClassName = attr(element, 'class');
                    if (elemClassName) {
                        if (elemClassName.indexOf(className) !== -1) {
                            return true;
                        }
                        if (elemClassName.indexOf('highcharts-container') !== -1) {
                            return false;
                        }
                    }
                    element = element.parentNode;
                }
            },

            onTrackerMouseOut: function(e) {
                var series = this.chart.hoverSeries,
                    relatedTarget = e.relatedTarget || e.toElement;

                if (series && relatedTarget && !series.options.stickyTracking &&
                    !this.inClass(relatedTarget, 'highcharts-tooltip') &&
                    (!this.inClass(relatedTarget, 'highcharts-series-' + series.index) || // #2499, #4465
                        !this.inClass(relatedTarget, 'highcharts-tracker') // #5553
                    )
                ) {
                    series.onMouseOut();
                }
            },

            onContainerClick: function(e) {
                var chart = this.chart,
                    hoverPoint = chart.hoverPoint,
                    plotLeft = chart.plotLeft,
                    plotTop = chart.plotTop;

                e = this.normalize(e);

                if (!chart.cancelClick) {

                    // On tracker click, fire the series and point events. #783, #1583
                    if (hoverPoint && this.inClass(e.target, 'highcharts-tracker')) {

                        // the series click event
                        fireEvent(hoverPoint.series, 'click', extend(e, {
                            point: hoverPoint
                        }));

                        // the point click event
                        if (chart.hoverPoint) { // it may be destroyed (#1844)
                            hoverPoint.firePointEvent('click', e);
                        }

                        // When clicking outside a tracker, fire a chart event
                    } else {
                        extend(e, this.getCoordinates(e));

                        // fire a click event in the chart
                        if (chart.isInsidePlot(e.chartX - plotLeft, e.chartY - plotTop)) {
                            fireEvent(chart, 'click', e);
                        }
                    }


                }
            },

            /**
             * Set the JS DOM events on the container and document. This method should contain
             * a one-to-one assignment between methods and their handlers. Any advanced logic should
             * be moved to the handler reflecting the event's name.
             */
            setDOMEvents: function() {

                var pointer = this,
                    container = pointer.chart.container;

                container.onmousedown = function(e) {
                    pointer.onContainerMouseDown(e);
                };
                container.onmousemove = function(e) {
                    pointer.onContainerMouseMove(e);
                };
                container.onclick = function(e) {
                    pointer.onContainerClick(e);
                };
                addEvent(container, 'mouseleave', pointer.onContainerMouseLeave);
                if (H.chartCount === 1) {
                    addEvent(doc, 'mouseup', pointer.onDocumentMouseUp);
                }
                if (H.hasTouch) {
                    container.ontouchstart = function(e) {
                        pointer.onContainerTouchStart(e);
                    };
                    container.ontouchmove = function(e) {
                        pointer.onContainerTouchMove(e);
                    };
                    if (H.chartCount === 1) {
                        addEvent(doc, 'touchend', pointer.onDocumentTouchEnd);
                    }
                }

            },

            /**
             * Destroys the Pointer object and disconnects DOM events.
             */
            destroy: function() {
                var prop;

                removeEvent(this.chart.container, 'mouseleave', this.onContainerMouseLeave);
                if (!H.chartCount) {
                    removeEvent(doc, 'mouseup', this.onDocumentMouseUp);
                    removeEvent(doc, 'touchend', this.onDocumentTouchEnd);
                }

                // memory and CPU leak
                clearInterval(this.tooltipTimeout);

                for (prop in this) {
                    this[prop] = null;
                }
            }
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var charts = H.charts,
            each = H.each,
            extend = H.extend,
            map = H.map,
            noop = H.noop,
            pick = H.pick,
            Pointer = H.Pointer;

        /* Support for touch devices */
        extend(Pointer.prototype, /** @lends Pointer.prototype */ {

            /**
             * Run translation operations
             */
            pinchTranslate: function(pinchDown, touches, transform, selectionMarker, clip, lastValidTouch) {
                if (this.zoomHor) {
                    this.pinchTranslateDirection(true, pinchDown, touches, transform, selectionMarker, clip, lastValidTouch);
                }
                if (this.zoomVert) {
                    this.pinchTranslateDirection(false, pinchDown, touches, transform, selectionMarker, clip, lastValidTouch);
                }
            },

            /**
             * Run translation operations for each direction (horizontal and vertical) independently
             */
            pinchTranslateDirection: function(horiz, pinchDown, touches, transform,
                selectionMarker, clip, lastValidTouch, forcedScale) {
                var chart = this.chart,
                    xy = horiz ? 'x' : 'y',
                    XY = horiz ? 'X' : 'Y',
                    sChartXY = 'chart' + XY,
                    wh = horiz ? 'width' : 'height',
                    plotLeftTop = chart['plot' + (horiz ? 'Left' : 'Top')],
                    selectionWH,
                    selectionXY,
                    clipXY,
                    scale = forcedScale || 1,
                    inverted = chart.inverted,
                    bounds = chart.bounds[horiz ? 'h' : 'v'],
                    singleTouch = pinchDown.length === 1,
                    touch0Start = pinchDown[0][sChartXY],
                    touch0Now = touches[0][sChartXY],
                    touch1Start = !singleTouch && pinchDown[1][sChartXY],
                    touch1Now = !singleTouch && touches[1][sChartXY],
                    outOfBounds,
                    transformScale,
                    scaleKey,
                    setScale = function() {
                        // Don't zoom if fingers are too close on this axis
                        if (!singleTouch && Math.abs(touch0Start - touch1Start) > 20) {
                            scale = forcedScale || Math.abs(touch0Now - touch1Now) / Math.abs(touch0Start - touch1Start);
                        }

                        clipXY = ((plotLeftTop - touch0Now) / scale) + touch0Start;
                        selectionWH = chart['plot' + (horiz ? 'Width' : 'Height')] / scale;
                    };

                // Set the scale, first pass
                setScale();

                selectionXY = clipXY; // the clip position (x or y) is altered if out of bounds, the selection position is not

                // Out of bounds
                if (selectionXY < bounds.min) {
                    selectionXY = bounds.min;
                    outOfBounds = true;
                } else if (selectionXY + selectionWH > bounds.max) {
                    selectionXY = bounds.max - selectionWH;
                    outOfBounds = true;
                }

                // Is the chart dragged off its bounds, determined by dataMin and dataMax?
                if (outOfBounds) {

                    // Modify the touchNow position in order to create an elastic drag movement. This indicates
                    // to the user that the chart is responsive but can't be dragged further.
                    touch0Now -= 0.8 * (touch0Now - lastValidTouch[xy][0]);
                    if (!singleTouch) {
                        touch1Now -= 0.8 * (touch1Now - lastValidTouch[xy][1]);
                    }

                    // Set the scale, second pass to adapt to the modified touchNow positions
                    setScale();

                } else {
                    lastValidTouch[xy] = [touch0Now, touch1Now];
                }

                // Set geometry for clipping, selection and transformation
                if (!inverted) {
                    clip[xy] = clipXY - plotLeftTop;
                    clip[wh] = selectionWH;
                }
                scaleKey = inverted ? (horiz ? 'scaleY' : 'scaleX') : 'scale' + XY;
                transformScale = inverted ? 1 / scale : scale;

                selectionMarker[wh] = selectionWH;
                selectionMarker[xy] = selectionXY;
                transform[scaleKey] = scale;
                transform['translate' + XY] = (transformScale * plotLeftTop) + (touch0Now - (transformScale * touch0Start));
            },

            /**
             * Handle touch events with two touches
             */
            pinch: function(e) {

                var self = this,
                    chart = self.chart,
                    pinchDown = self.pinchDown,
                    touches = e.touches,
                    touchesLength = touches.length,
                    lastValidTouch = self.lastValidTouch,
                    hasZoom = self.hasZoom,
                    selectionMarker = self.selectionMarker,
                    transform = {},
                    fireClickEvent = touchesLength === 1 && ((self.inClass(e.target, 'highcharts-tracker') &&
                        chart.runTrackerClick) || self.runChartClick),
                    clip = {};

                // Don't initiate panning until the user has pinched. This prevents us from
                // blocking page scrolling as users scroll down a long page (#4210).
                if (touchesLength > 1) {
                    self.initiated = true;
                }

                // On touch devices, only proceed to trigger click if a handler is defined
                if (hasZoom && self.initiated && !fireClickEvent) {
                    e.preventDefault();
                }

                // Normalize each touch
                map(touches, function(e) {
                    return self.normalize(e);
                });

                // Register the touch start position
                if (e.type === 'touchstart') {
                    each(touches, function(e, i) {
                        pinchDown[i] = {
                            chartX: e.chartX,
                            chartY: e.chartY
                        };
                    });
                    lastValidTouch.x = [pinchDown[0].chartX, pinchDown[1] && pinchDown[1].chartX];
                    lastValidTouch.y = [pinchDown[0].chartY, pinchDown[1] && pinchDown[1].chartY];

                    // Identify the data bounds in pixels
                    each(chart.axes, function(axis) {
                        if (axis.zoomEnabled) {
                            var bounds = chart.bounds[axis.horiz ? 'h' : 'v'],
                                minPixelPadding = axis.minPixelPadding,
                                min = axis.toPixels(pick(axis.options.min, axis.dataMin)),
                                max = axis.toPixels(pick(axis.options.max, axis.dataMax)),
                                absMin = Math.min(min, max),
                                absMax = Math.max(min, max);

                            // Store the bounds for use in the touchmove handler
                            bounds.min = Math.min(axis.pos, absMin - minPixelPadding);
                            bounds.max = Math.max(axis.pos + axis.len, absMax + minPixelPadding);
                        }
                    });
                    self.res = true; // reset on next move

                    // Optionally move the tooltip on touchmove
                } else if (self.followTouchMove && touchesLength === 1) {
                    this.runPointActions(self.normalize(e));

                    // Event type is touchmove, handle panning and pinching
                } else if (pinchDown.length) { // can be 0 when releasing, if touchend fires first


                    // Set the marker
                    if (!selectionMarker) {
                        self.selectionMarker = selectionMarker = extend({
                            destroy: noop,
                            touch: true
                        }, chart.plotBox);
                    }

                    self.pinchTranslate(pinchDown, touches, transform, selectionMarker, clip, lastValidTouch);

                    self.hasPinched = hasZoom;

                    // Scale and translate the groups to provide visual feedback during pinching
                    self.scaleGroups(transform, clip);

                    if (self.res) {
                        self.res = false;
                        this.reset(false, 0);
                    }
                }
            },

            /**
             * General touch handler shared by touchstart and touchmove.
             */
            touch: function(e, start) {
                var chart = this.chart,
                    hasMoved,
                    pinchDown,
                    isInside;

                if (chart.index !== H.hoverChartIndex) {
                    this.onContainerMouseLeave({
                        relatedTarget: true
                    });
                }
                H.hoverChartIndex = chart.index;

                if (e.touches.length === 1) {

                    e = this.normalize(e);

                    isInside = chart.isInsidePlot(
                        e.chartX - chart.plotLeft,
                        e.chartY - chart.plotTop
                    );
                    if (isInside && !chart.openMenu) {

                        // Run mouse events and display tooltip etc
                        if (start) {
                            this.runPointActions(e);
                        }

                        // Android fires touchmove events after the touchstart even if the
                        // finger hasn't moved, or moved only a pixel or two. In iOS however,
                        // the touchmove doesn't fire unless the finger moves more than ~4px.
                        // So we emulate this behaviour in Android by checking how much it
                        // moved, and cancelling on small distances. #3450.
                        if (e.type === 'touchmove') {
                            pinchDown = this.pinchDown;
                            hasMoved = pinchDown[0] ? Math.sqrt( // #5266
                                Math.pow(pinchDown[0].chartX - e.chartX, 2) +
                                Math.pow(pinchDown[0].chartY - e.chartY, 2)
                            ) >= 4 : false;
                        }

                        if (pick(hasMoved, true)) {
                            this.pinch(e);
                        }

                    } else if (start) {
                        // Hide the tooltip on touching outside the plot area (#1203)
                        this.reset();
                    }

                } else if (e.touches.length === 2) {
                    this.pinch(e);
                }
            },

            onContainerTouchStart: function(e) {
                this.zoomOption(e);
                this.touch(e, true);
            },

            onContainerTouchMove: function(e) {
                this.touch(e);
            },

            onDocumentTouchEnd: function(e) {
                if (charts[H.hoverChartIndex]) {
                    charts[H.hoverChartIndex].pointer.drop(e);
                }
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
        var addEvent = H.addEvent,
            charts = H.charts,
            css = H.css,
            doc = H.doc,
            extend = H.extend,
            noop = H.noop,
            Pointer = H.Pointer,
            removeEvent = H.removeEvent,
            win = H.win,
            wrap = H.wrap;

        if (win.PointerEvent || win.MSPointerEvent) {

            // The touches object keeps track of the points being touched at all times
            var touches = {},
                hasPointerEvent = !!win.PointerEvent,
                getWebkitTouches = function() {
                    var key,
                        fake = [];
                    fake.item = function(i) {
                        return this[i];
                    };
                    for (key in touches) {
                        if (touches.hasOwnProperty(key)) {
                            fake.push({
                                pageX: touches[key].pageX,
                                pageY: touches[key].pageY,
                                target: touches[key].target
                            });
                        }
                    }
                    return fake;
                },
                translateMSPointer = function(e, method, wktype, func) {
                    var p;
                    if ((e.pointerType === 'touch' || e.pointerType === e.MSPOINTER_TYPE_TOUCH) && charts[H.hoverChartIndex]) {
                        func(e);
                        p = charts[H.hoverChartIndex].pointer;
                        p[method]({
                            type: wktype,
                            target: e.currentTarget,
                            preventDefault: noop,
                            touches: getWebkitTouches()
                        });
                    }
                };

            /**
             * Extend the Pointer prototype with methods for each event handler and more
             */
            extend(Pointer.prototype, /** @lends Pointer.prototype */ {
                onContainerPointerDown: function(e) {
                    translateMSPointer(e, 'onContainerTouchStart', 'touchstart', function(e) {
                        touches[e.pointerId] = {
                            pageX: e.pageX,
                            pageY: e.pageY,
                            target: e.currentTarget
                        };
                    });
                },
                onContainerPointerMove: function(e) {
                    translateMSPointer(e, 'onContainerTouchMove', 'touchmove', function(e) {
                        touches[e.pointerId] = {
                            pageX: e.pageX,
                            pageY: e.pageY
                        };
                        if (!touches[e.pointerId].target) {
                            touches[e.pointerId].target = e.currentTarget;
                        }
                    });
                },
                onDocumentPointerUp: function(e) {
                    translateMSPointer(e, 'onDocumentTouchEnd', 'touchend', function(e) {
                        delete touches[e.pointerId];
                    });
                },

                /**
                 * Add or remove the MS Pointer specific events
                 */
                batchMSEvents: function(fn) {
                    fn(this.chart.container, hasPointerEvent ? 'pointerdown' : 'MSPointerDown', this.onContainerPointerDown);
                    fn(this.chart.container, hasPointerEvent ? 'pointermove' : 'MSPointerMove', this.onContainerPointerMove);
                    fn(doc, hasPointerEvent ? 'pointerup' : 'MSPointerUp', this.onDocumentPointerUp);
                }
            });

            // Disable default IE actions for pinch and such on chart element
            wrap(Pointer.prototype, 'init', function(proceed, chart, options) {
                proceed.call(this, chart, options);
                if (this.hasZoom) { // #4014
                    css(chart.container, {
                        '-ms-touch-action': 'none',
                        'touch-action': 'none'
                    });
                }
            });

            // Add IE specific touch events to chart
            wrap(Pointer.prototype, 'setDOMEvents', function(proceed) {
                proceed.apply(this);
                if (this.hasZoom || this.followTouchMove) {
                    this.batchMSEvents(addEvent);
                }
            });
            // Destroy MS events also
            wrap(Pointer.prototype, 'destroy', function(proceed) {
                this.batchMSEvents(removeEvent);
                proceed.call(this);
            });
        }

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Legend,

            addEvent = H.addEvent,
            css = H.css,
            discardElement = H.discardElement,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            isFirefox = H.isFirefox,
            marginNames = H.marginNames,
            merge = H.merge,
            pick = H.pick,
            setAnimation = H.setAnimation,
            stableSort = H.stableSort,
            win = H.win,
            wrap = H.wrap;
        /**
         * The overview of the chart's series.
         * @class
         */
        Legend = H.Legend = function(chart, options) {
            this.init(chart, options);
        };

        Legend.prototype = {

            /**
             * Initialize the legend
             */
            init: function(chart, options) {

                this.chart = chart;

                this.setOptions(options);

                if (options.enabled) {

                    // Render it
                    this.render();

                    // move checkboxes
                    addEvent(this.chart, 'endResize', function() {
                        this.legend.positionCheckboxes();
                    });
                }
            },

            setOptions: function(options) {

                var padding = pick(options.padding, 8);

                this.options = options;


                this.itemStyle = options.itemStyle;
                this.itemHiddenStyle = merge(this.itemStyle, options.itemHiddenStyle);

                this.itemMarginTop = options.itemMarginTop || 0;
                this.padding = padding;
                this.initialItemX = padding;
                this.initialItemY = padding - 5; // 5 is the number of pixels above the text
                this.maxItemWidth = 0;
                this.itemHeight = 0;
                this.symbolWidth = pick(options.symbolWidth, 16);
                this.pages = [];

            },

            /**
             * Update the legend with new options. Equivalent to running chart.update with a legend
             * configuration option.
             * @param {Object} options Legend options
             * @param {Boolean} redraw Whether to redraw the chart, defaults to true.
             */
            update: function(options, redraw) {
                var chart = this.chart;

                this.setOptions(merge(true, this.options, options));
                this.destroy();
                chart.isDirtyLegend = chart.isDirtyBox = true;
                if (pick(redraw, true)) {
                    chart.redraw();
                }
            },

            /**
             * Set the colors for the legend item
             * @param {Object} item A Series or Point instance
             * @param {Object} visible Dimmed or colored
             */
            colorizeItem: function(item, visible) {
                item.legendGroup[visible ? 'removeClass' : 'addClass']('highcharts-legend-item-hidden');


                var legend = this,
                    options = legend.options,
                    legendItem = item.legendItem,
                    legendLine = item.legendLine,
                    legendSymbol = item.legendSymbol,
                    hiddenColor = legend.itemHiddenStyle.color,
                    textColor = visible ? options.itemStyle.color : hiddenColor,
                    symbolColor = visible ? (item.color || hiddenColor) : hiddenColor,
                    markerOptions = item.options && item.options.marker,
                    symbolAttr = {
                        fill: symbolColor
                    },
                    key;

                if (legendItem) {
                    legendItem.css({
                        fill: textColor,
                        color: textColor
                    }); // color for #1553, oldIE
                }
                if (legendLine) {
                    legendLine.attr({
                        stroke: symbolColor
                    });
                }

                if (legendSymbol) {

                    // Apply marker options
                    if (markerOptions && legendSymbol.isMarker) { // #585
                        //symbolAttr.stroke = symbolColor;
                        symbolAttr = item.pointAttribs();
                        if (!visible) {
                            for (key in symbolAttr) {
                                symbolAttr[key] = hiddenColor;
                            }
                        }
                    }

                    legendSymbol.attr(symbolAttr);
                }

            },

            /**
             * Position the legend item
             * @param {Object} item A Series or Point instance
             */
            positionItem: function(item) {
                var legend = this,
                    options = legend.options,
                    symbolPadding = options.symbolPadding,
                    ltr = !options.rtl,
                    legendItemPos = item._legendItemPos,
                    itemX = legendItemPos[0],
                    itemY = legendItemPos[1],
                    checkbox = item.checkbox,
                    legendGroup = item.legendGroup;

                if (legendGroup && legendGroup.element) {
                    legendGroup.translate(
                        ltr ? itemX : legend.legendWidth - itemX - 2 * symbolPadding - 4,
                        itemY
                    );
                }

                if (checkbox) {
                    checkbox.x = itemX;
                    checkbox.y = itemY;
                }
            },

            /**
             * Destroy a single legend item
             * @param {Object} item The series or point
             */
            destroyItem: function(item) {
                var checkbox = item.checkbox;

                // destroy SVG elements
                each(['legendItem', 'legendLine', 'legendSymbol', 'legendGroup'], function(key) {
                    if (item[key]) {
                        item[key] = item[key].destroy();
                    }
                });

                if (checkbox) {
                    discardElement(item.checkbox);
                }
            },

            /**
             * Destroys the legend.
             */
            destroy: function() {
                function destroyItems(key) {
                    if (this[key]) {
                        this[key] = this[key].destroy();
                    }
                }

                // Destroy items
                each(this.getAllItems(), function(item) {
                    each(['legendItem', 'legendGroup'], destroyItems, item);
                });

                each(['box', 'title', 'group'], destroyItems, this);
                this.display = null; // Reset in .render on update.
            },

            /**
             * Position the checkboxes after the width is determined
             */
            positionCheckboxes: function(scrollOffset) {
                var alignAttr = this.group && this.group.alignAttr,
                    translateY,
                    clipHeight = this.clipHeight || this.legendHeight,
                    titleHeight = this.titleHeight;

                if (alignAttr) {
                    translateY = alignAttr.translateY;
                    each(this.allItems, function(item) {
                        var checkbox = item.checkbox,
                            top;

                        if (checkbox) {
                            top = translateY + titleHeight + checkbox.y + (scrollOffset || 0) + 3;
                            css(checkbox, {
                                left: (alignAttr.translateX + item.checkboxOffset + checkbox.x - 20) + 'px',
                                top: top + 'px',
                                display: top > translateY - 6 && top < translateY + clipHeight - 6 ? '' : 'none'
                            });
                        }
                    });
                }
            },

            /**
             * Render the legend title on top of the legend
             */
            renderTitle: function() {
                var options = this.options,
                    padding = this.padding,
                    titleOptions = options.title,
                    titleHeight = 0,
                    bBox;

                if (titleOptions.text) {
                    if (!this.title) {
                        this.title = this.chart.renderer.label(titleOptions.text, padding - 3, padding - 4, null, null, null, null, null, 'legend-title')
                            .attr({
                                zIndex: 1
                            })

                        .css(titleOptions.style)

                        .add(this.group);
                    }
                    bBox = this.title.getBBox();
                    titleHeight = bBox.height;
                    this.offsetWidth = bBox.width; // #1717
                    this.contentGroup.attr({
                        translateY: titleHeight
                    });
                }
                this.titleHeight = titleHeight;
            },

            /**
             * Set the legend item text
             */
            setText: function(item) {
                var options = this.options;
                item.legendItem.attr({
                    text: options.labelFormat ? H.format(options.labelFormat, item) : options.labelFormatter.call(item)
                });
            },

            /**
             * Render a single specific legend item
             * @param {Object} item A series or point
             */
            renderItem: function(item) {
                var legend = this,
                    chart = legend.chart,
                    renderer = chart.renderer,
                    options = legend.options,
                    horizontal = options.layout === 'horizontal',
                    symbolWidth = legend.symbolWidth,
                    symbolPadding = options.symbolPadding,

                    itemStyle = legend.itemStyle,
                    itemHiddenStyle = legend.itemHiddenStyle,

                    padding = legend.padding,
                    itemDistance = horizontal ? pick(options.itemDistance, 20) : 0,
                    ltr = !options.rtl,
                    itemHeight,
                    widthOption = options.width,
                    itemMarginBottom = options.itemMarginBottom || 0,
                    itemMarginTop = legend.itemMarginTop,
                    initialItemX = legend.initialItemX,
                    bBox,
                    itemWidth,
                    li = item.legendItem,
                    isSeries = !item.series,
                    series = !isSeries && item.series.drawLegendSymbol ? item.series : item,
                    seriesOptions = series.options,
                    showCheckbox = legend.createCheckboxForItem && seriesOptions && seriesOptions.showCheckbox,
                    useHTML = options.useHTML,
                    fontSize = 12;

                if (!li) { // generate it once, later move it

                    // Generate the group box
                    // A group to hold the symbol and text. Text is to be appended in Legend class.
                    item.legendGroup = renderer.g('legend-item')
                        .addClass('highcharts-' + series.type + '-series highcharts-color-' + item.colorIndex +
                            (item.options.className ? ' ' + item.options.className : '') +
                            (isSeries ? ' highcharts-series-' + item.index : '')
                        )
                        .attr({
                            zIndex: 1
                        })
                        .add(legend.scrollGroup);

                    // Generate the list item text and add it to the group
                    item.legendItem = li = renderer.text(
                        '',
                        ltr ? symbolWidth + symbolPadding : -symbolPadding,
                        legend.baseline || 0,
                        useHTML
                    )

                    .css(merge(item.visible ? itemStyle : itemHiddenStyle)) // merge to prevent modifying original (#1021)

                    .attr({
                            align: ltr ? 'left' : 'right',
                            zIndex: 2
                        })
                        .add(item.legendGroup);

                    // Get the baseline for the first item - the font size is equal for all
                    if (!legend.baseline) {

                        fontSize = itemStyle.fontSize;

                        legend.fontMetrics = renderer.fontMetrics(
                            fontSize,
                            li
                        );
                        legend.baseline = legend.fontMetrics.f + 3 + itemMarginTop;
                        li.attr('y', legend.baseline);
                    }

                    // Draw the legend symbol inside the group box
                    legend.symbolHeight = options.symbolHeight || legend.fontMetrics.f;
                    series.drawLegendSymbol(legend, item);

                    if (legend.setItemEvents) {
                        legend.setItemEvents(item, li, useHTML);
                    }

                    // add the HTML checkbox on top
                    if (showCheckbox) {
                        legend.createCheckboxForItem(item);
                    }
                }

                // Colorize the items
                legend.colorizeItem(item, item.visible);

                // Always update the text
                legend.setText(item);

                // calculate the positions for the next line
                bBox = li.getBBox();

                itemWidth = item.checkboxOffset =
                    options.itemWidth ||
                    item.legendItemWidth ||
                    symbolWidth + symbolPadding + bBox.width + itemDistance + (showCheckbox ? 20 : 0);
                legend.itemHeight = itemHeight = Math.round(item.legendItemHeight || bBox.height);

                // if the item exceeds the width, start a new line
                if (horizontal && legend.itemX - initialItemX + itemWidth >
                    (widthOption || (chart.chartWidth - 2 * padding - initialItemX - options.x))) {
                    legend.itemX = initialItemX;
                    legend.itemY += itemMarginTop + legend.lastLineHeight + itemMarginBottom;
                    legend.lastLineHeight = 0; // reset for next line (#915, #3976)
                }

                // If the item exceeds the height, start a new column
                /*if (!horizontal && legend.itemY + options.y + itemHeight > chart.chartHeight - spacingTop - spacingBottom) {
                	legend.itemY = legend.initialItemY;
                	legend.itemX += legend.maxItemWidth;
                	legend.maxItemWidth = 0;
                }*/

                // Set the edge positions
                legend.maxItemWidth = Math.max(legend.maxItemWidth, itemWidth);
                legend.lastItemY = itemMarginTop + legend.itemY + itemMarginBottom;
                legend.lastLineHeight = Math.max(itemHeight, legend.lastLineHeight); // #915

                // cache the position of the newly generated or reordered items
                item._legendItemPos = [legend.itemX, legend.itemY];

                // advance
                if (horizontal) {
                    legend.itemX += itemWidth;

                } else {
                    legend.itemY += itemMarginTop + itemHeight + itemMarginBottom;
                    legend.lastLineHeight = itemHeight;
                }

                // the width of the widest item
                legend.offsetWidth = widthOption || Math.max(
                    (horizontal ? legend.itemX - initialItemX - itemDistance : itemWidth) + padding,
                    legend.offsetWidth
                );
            },

            /**
             * Get all items, which is one item per series for normal series and one item per point
             * for pie series.
             */
            getAllItems: function() {
                var allItems = [];
                each(this.chart.series, function(series) {
                    var seriesOptions = series && series.options;

                    // Handle showInLegend. If the series is linked to another series, defaults to false.
                    if (series && pick(seriesOptions.showInLegend, !defined(seriesOptions.linkedTo) ? undefined : false, true)) {

                        // Use points or series for the legend item depending on legendType
                        allItems = allItems.concat(
                            series.legendItems ||
                            (seriesOptions.legendType === 'point' ?
                                series.data :
                                series)
                        );
                    }
                });
                return allItems;
            },

            /**
             * Adjust the chart margins by reserving space for the legend on only one side
             * of the chart. If the position is set to a corner, top or bottom is reserved
             * for horizontal legends and left or right for vertical ones.
             */
            adjustMargins: function(margin, spacing) {
                var chart = this.chart,
                    options = this.options,
                    // Use the first letter of each alignment option in order to detect the side
                    alignment = options.align.charAt(0) + options.verticalAlign.charAt(0) + options.layout.charAt(0); // #4189 - use charAt(x) notation instead of [x] for IE7

                if (!options.floating) {

                    each([
                        /(lth|ct|rth)/,
                        /(rtv|rm|rbv)/,
                        /(rbh|cb|lbh)/,
                        /(lbv|lm|ltv)/
                    ], function(alignments, side) {
                        if (alignments.test(alignment) && !defined(margin[side])) {
                            // Now we have detected on which side of the chart we should reserve space for the legend
                            chart[marginNames[side]] = Math.max(
                                chart[marginNames[side]],
                                chart.legend[(side + 1) % 2 ? 'legendHeight' : 'legendWidth'] + [1, -1, -1, 1][side] * options[(side % 2) ? 'x' : 'y'] +
                                pick(options.margin, 12) +
                                spacing[side]
                            );
                        }
                    });
                }
            },

            /**
             * Render the legend. This method can be called both before and after
             * chart.render. If called after, it will only rearrange items instead
             * of creating new ones.
             */
            render: function() {
                var legend = this,
                    chart = legend.chart,
                    renderer = chart.renderer,
                    legendGroup = legend.group,
                    allItems,
                    display,
                    legendWidth,
                    legendHeight,
                    box = legend.box,
                    options = legend.options,
                    padding = legend.padding;

                legend.itemX = legend.initialItemX;
                legend.itemY = legend.initialItemY;
                legend.offsetWidth = 0;
                legend.lastItemY = 0;

                if (!legendGroup) {
                    legend.group = legendGroup = renderer.g('legend')
                        .attr({
                            zIndex: 7
                        })
                        .add();
                    legend.contentGroup = renderer.g()
                        .attr({
                            zIndex: 1
                        }) // above background
                        .add(legendGroup);
                    legend.scrollGroup = renderer.g()
                        .add(legend.contentGroup);
                }

                legend.renderTitle();

                // add each series or point
                allItems = legend.getAllItems();

                // sort by legendIndex
                stableSort(allItems, function(a, b) {
                    return ((a.options && a.options.legendIndex) || 0) - ((b.options && b.options.legendIndex) || 0);
                });

                // reversed legend
                if (options.reversed) {
                    allItems.reverse();
                }

                legend.allItems = allItems;
                legend.display = display = !!allItems.length;

                // render the items
                legend.lastLineHeight = 0;
                each(allItems, function(item) {
                    legend.renderItem(item);
                });

                // Get the box
                legendWidth = (options.width || legend.offsetWidth) + padding;
                legendHeight = legend.lastItemY + legend.lastLineHeight + legend.titleHeight;
                legendHeight = legend.handleOverflow(legendHeight);
                legendHeight += padding;

                // Draw the border and/or background
                if (!box) {
                    legend.box = box = renderer.rect()
                        .addClass('highcharts-legend-box')
                        .attr({
                            r: options.borderRadius
                        })
                        .add(legendGroup);
                    box.isNew = true;
                }


                // Presentational
                box
                    .attr({
                        stroke: options.borderColor,
                        'stroke-width': options.borderWidth || 0,
                        fill: options.backgroundColor || 'none'
                    })
                    .shadow(options.shadow);


                if (legendWidth > 0 && legendHeight > 0) {
                    box[box.isNew ? 'attr' : 'animate'](
                        box.crisp({
                            x: 0,
                            y: 0,
                            width: legendWidth,
                            height: legendHeight
                        }, box.strokeWidth())
                    );
                    box.isNew = false;
                }

                // hide the border if no items
                box[display ? 'show' : 'hide']();



                legend.legendWidth = legendWidth;
                legend.legendHeight = legendHeight;

                // Now that the legend width and height are established, put the items in the
                // final position
                each(allItems, function(item) {
                    legend.positionItem(item);
                });

                // 1.x compatibility: positioning based on style
                /*var props = ['left', 'right', 'top', 'bottom'],
                	prop,
                	i = 4;
                while (i--) {
                	prop = props[i];
                	if (options.style[prop] && options.style[prop] !== 'auto') {
                		options[i < 2 ? 'align' : 'verticalAlign'] = prop;
                		options[i < 2 ? 'x' : 'y'] = pInt(options.style[prop]) * (i % 2 ? -1 : 1);
                	}
                }*/

                if (display) {
                    legendGroup.align(extend({
                        width: legendWidth,
                        height: legendHeight
                    }, options), true, 'spacingBox');
                }

                if (!chart.isResizing) {
                    this.positionCheckboxes();
                }
            },

            /**
             * Set up the overflow handling by adding navigation with up and down arrows below the
             * legend.
             */
            handleOverflow: function(legendHeight) {
                var legend = this,
                    chart = this.chart,
                    renderer = chart.renderer,
                    options = this.options,
                    optionsY = options.y,
                    alignTop = options.verticalAlign === 'top',
                    spaceHeight = chart.spacingBox.height + (alignTop ? -optionsY : optionsY) - this.padding,
                    maxHeight = options.maxHeight,
                    clipHeight,
                    clipRect = this.clipRect,
                    navOptions = options.navigation,
                    animation = pick(navOptions.animation, true),
                    arrowSize = navOptions.arrowSize || 12,
                    nav = this.nav,
                    pages = this.pages,
                    padding = this.padding,
                    lastY,
                    allItems = this.allItems,
                    clipToHeight = function(height) {
                        if (height) {
                            clipRect.attr({
                                height: height
                            });
                        } else if (clipRect) { // Reset (#5912)
                            legend.clipRect = clipRect.destroy();
                            legend.contentGroup.clip();
                        }

                        // useHTML
                        if (legend.contentGroup.div) {
                            legend.contentGroup.div.style.clip = height ?
                                'rect(' + padding + 'px,9999px,' +
                                (padding + height) + 'px,0)' :
                                'auto';
                        }
                    };


                // Adjust the height
                if (options.layout === 'horizontal' && options.verticalAlign !== 'middle' && !options.floating) {
                    spaceHeight /= 2;
                }
                if (maxHeight) {
                    spaceHeight = Math.min(spaceHeight, maxHeight);
                }

                // Reset the legend height and adjust the clipping rectangle
                pages.length = 0;
                if (legendHeight > spaceHeight && navOptions.enabled !== false) {

                    this.clipHeight = clipHeight = Math.max(spaceHeight - 20 - this.titleHeight - padding, 0);
                    this.currentPage = pick(this.currentPage, 1);
                    this.fullHeight = legendHeight;

                    // Fill pages with Y positions so that the top of each a legend item defines
                    // the scroll top for each page (#2098)
                    each(allItems, function(item, i) {
                        var y = item._legendItemPos[1],
                            h = Math.round(item.legendItem.getBBox().height),
                            len = pages.length;

                        if (!len || (y - pages[len - 1] > clipHeight && (lastY || y) !== pages[len - 1])) {
                            pages.push(lastY || y);
                            len++;
                        }

                        if (i === allItems.length - 1 && y + h - pages[len - 1] > clipHeight) {
                            pages.push(y);
                        }
                        if (y !== lastY) {
                            lastY = y;
                        }
                    });

                    // Only apply clipping if needed. Clipping causes blurred legend in PDF export (#1787)
                    if (!clipRect) {
                        clipRect = legend.clipRect = renderer.clipRect(0, padding, 9999, 0);
                        legend.contentGroup.clip(clipRect);
                    }

                    clipToHeight(clipHeight);

                    // Add navigation elements
                    if (!nav) {
                        this.nav = nav = renderer.g().attr({
                            zIndex: 1
                        }).add(this.group);
                        this.up = renderer.symbol('triangle', 0, 0, arrowSize, arrowSize)
                            .on('click', function() {
                                legend.scroll(-1, animation);
                            })
                            .add(nav);
                        this.pager = renderer.text('', 15, 10)
                            .addClass('highcharts-legend-navigation')

                        .css(navOptions.style)

                        .add(nav);
                        this.down = renderer.symbol('triangle-down', 0, 0, arrowSize, arrowSize)
                            .on('click', function() {
                                legend.scroll(1, animation);
                            })
                            .add(nav);
                    }

                    // Set initial position
                    legend.scroll(0);

                    legendHeight = spaceHeight;

                    // Reset
                } else if (nav) {
                    clipToHeight();
                    nav.hide();
                    this.scrollGroup.attr({
                        translateY: 1
                    });
                    this.clipHeight = 0; // #1379
                }

                return legendHeight;
            },

            /**
             * Scroll the legend by a number of pages
             * @param {Object} scrollBy
             * @param {Object} animation
             */
            scroll: function(scrollBy, animation) {
                var pages = this.pages,
                    pageCount = pages.length,
                    currentPage = this.currentPage + scrollBy,
                    clipHeight = this.clipHeight,
                    navOptions = this.options.navigation,
                    pager = this.pager,
                    padding = this.padding,
                    scrollOffset;

                // When resizing while looking at the last page
                if (currentPage > pageCount) {
                    currentPage = pageCount;
                }

                if (currentPage > 0) {

                    if (animation !== undefined) {
                        setAnimation(animation, this.chart);
                    }

                    this.nav.attr({
                        translateX: padding,
                        translateY: clipHeight + this.padding + 7 + this.titleHeight,
                        visibility: 'visible'
                    });
                    this.up.attr({
                        'class': currentPage === 1 ? 'highcharts-legend-nav-inactive' : 'highcharts-legend-nav-active'
                    });
                    pager.attr({
                        text: currentPage + '/' + pageCount
                    });
                    this.down.attr({
                        'x': 18 + this.pager.getBBox().width, // adjust to text width
                        'class': currentPage === pageCount ? 'highcharts-legend-nav-inactive' : 'highcharts-legend-nav-active'
                    });


                    this.up
                        .attr({
                            fill: currentPage === 1 ? navOptions.inactiveColor : navOptions.activeColor
                        })
                        .css({
                            cursor: currentPage === 1 ? 'default' : 'pointer'
                        });
                    this.down
                        .attr({
                            fill: currentPage === pageCount ? navOptions.inactiveColor : navOptions.activeColor
                        })
                        .css({
                            cursor: currentPage === pageCount ? 'default' : 'pointer'
                        });


                    scrollOffset = -pages[currentPage - 1] + this.initialItemY;

                    this.scrollGroup.animate({
                        translateY: scrollOffset
                    });

                    this.currentPage = currentPage;
                    this.positionCheckboxes(scrollOffset);
                }

            }

        };

        /*
         * LegendSymbolMixin
         */

        H.LegendSymbolMixin = {

            /**
             * Get the series' symbol in the legend
             *
             * @param {Object} legend The legend object
             * @param {Object} item The series (this) or point
             */
            drawRectangle: function(legend, item) {
                var options = legend.options,
                    symbolHeight = legend.symbolHeight,
                    square = options.squareSymbol,
                    symbolWidth = square ? symbolHeight : legend.symbolWidth;

                item.legendSymbol = this.chart.renderer.rect(
                        square ? (legend.symbolWidth - symbolHeight) / 2 : 0,
                        legend.baseline - symbolHeight + 1, // #3988
                        symbolWidth,
                        symbolHeight,
                        pick(legend.options.symbolRadius, symbolHeight / 2)
                    )
                    .addClass('highcharts-point')
                    .attr({
                        zIndex: 3
                    }).add(item.legendGroup);

            },

            /**
             * Get the series' symbol in the legend. This method should be overridable to create custom
             * symbols through Highcharts.seriesTypes[type].prototype.drawLegendSymbols.
             *
             * @param {Object} legend The legend object
             */
            drawLineMarker: function(legend) {

                var options = this.options,
                    markerOptions = options.marker,
                    radius,
                    legendSymbol,
                    symbolWidth = legend.symbolWidth,
                    symbolHeight = legend.symbolHeight,
                    generalRadius = symbolHeight / 2,
                    renderer = this.chart.renderer,
                    legendItemGroup = this.legendGroup,
                    verticalCenter = legend.baseline - Math.round(legend.fontMetrics.b * 0.3),
                    attr = {};

                // Draw the line

                attr = {
                    'stroke-width': options.lineWidth || 0
                };
                if (options.dashStyle) {
                    attr.dashstyle = options.dashStyle;
                }


                this.legendLine = renderer.path([
                        'M',
                        0,
                        verticalCenter,
                        'L',
                        symbolWidth,
                        verticalCenter
                    ])
                    .addClass('highcharts-graph')
                    .attr(attr)
                    .add(legendItemGroup);

                // Draw the marker
                if (markerOptions && markerOptions.enabled !== false) {

                    // Do not allow the marker to be larger than the symbolHeight
                    radius = Math.min(
                        pick(markerOptions.radius, generalRadius),
                        generalRadius
                    );

                    // Restrict symbol markers size
                    if (this.symbol.indexOf('url') === 0) {
                        markerOptions = merge(markerOptions, {
                            width: symbolHeight,
                            height: symbolHeight
                        });
                        radius = 0;
                    }

                    this.legendSymbol = legendSymbol = renderer.symbol(
                            this.symbol,
                            (symbolWidth / 2) - radius,
                            verticalCenter - radius,
                            2 * radius,
                            2 * radius,
                            markerOptions
                        )
                        .addClass('highcharts-point')
                        .add(legendItemGroup);
                    legendSymbol.isMarker = true;
                }
            }
        };

        // Workaround for #2030, horizontal legend items not displaying in IE11 Preview,
        // and for #2580, a similar drawing flaw in Firefox 26.
        // Explore if there's a general cause for this. The problem may be related
        // to nested group elements, as the legend item texts are within 4 group elements.
        if (/Trident\/7\.0/.test(win.navigator.userAgent) || isFirefox) {
            wrap(Legend.prototype, 'positionItem', function(proceed, item) {
                var legend = this,
                    runPositionItem = function() { // If chart destroyed in sync, this is undefined (#2030)
                        if (item._legendItemPos) {
                            proceed.call(legend, item);
                        }
                    };

                // Do it now, for export and to get checkbox placement
                runPositionItem();

                // Do it after to work around the core issue
                setTimeout(runPositionItem);
            });
        }

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            animate = H.animate,
            animObject = H.animObject,
            attr = H.attr,
            doc = H.doc,
            Axis = H.Axis, // @todo add as requirement
            createElement = H.createElement,
            defaultOptions = H.defaultOptions,
            discardElement = H.discardElement,
            charts = H.charts,
            css = H.css,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            find = H.find,
            fireEvent = H.fireEvent,
            getStyle = H.getStyle,
            grep = H.grep,
            isNumber = H.isNumber,
            isObject = H.isObject,
            isString = H.isString,
            Legend = H.Legend, // @todo add as requirement
            marginNames = H.marginNames,
            merge = H.merge,
            Pointer = H.Pointer, // @todo add as requirement
            pick = H.pick,
            pInt = H.pInt,
            removeEvent = H.removeEvent,
            seriesTypes = H.seriesTypes,
            splat = H.splat,
            svg = H.svg,
            syncTimeout = H.syncTimeout,
            win = H.win,
            Renderer = H.Renderer;
        /**
         * The Chart class.
         * @class Highcharts.Chart
         * @memberOf Highcharts
         * @param {String|HTMLDOMElement} renderTo - The DOM element to render to, or its
         * id.
         * @param {ChartOptions} options - The chart options structure.
         * @param {Function} callback - Function to run when the chart has loaded.
         */
        var Chart = H.Chart = function() {
            this.getArgs.apply(this, arguments);
        };

        H.chart = function(a, b, c) {
            return new Chart(a, b, c);
        };

        Chart.prototype = {

            /**
             * Hook for modules
             */
            callbacks: [],

            /**
             * Handle the arguments passed to the constructor
             * @returns {Array} Arguments without renderTo
             */
            getArgs: function() {
                var args = [].slice.call(arguments);

                // Remove the optional first argument, renderTo, and
                // set it on this.
                if (isString(args[0]) || args[0].nodeName) {
                    this.renderTo = args.shift();
                }
                this.init(args[0], args[1]);
            },

            /**
             * Initialize the chart
             */
            init: function(userOptions, callback) {

                // Handle regular options
                var options,
                    seriesOptions = userOptions.series; // skip merging data points to increase performance

                userOptions.series = null;
                options = merge(defaultOptions, userOptions); // do the merge
                options.series = userOptions.series = seriesOptions; // set back the series data
                this.userOptions = userOptions;
                this.respRules = [];

                var optionsChart = options.chart;

                var chartEvents = optionsChart.events;

                this.margin = [];
                this.spacing = [];

                //this.runChartClick = chartEvents && !!chartEvents.click;
                this.bounds = {
                    h: {},
                    v: {}
                }; // Pixel data bounds for touch zoom

                this.callback = callback;
                this.isResizing = 0;
                this.options = options;
                //chartTitleOptions = undefined;
                //chartSubtitleOptions = undefined;

                this.axes = [];
                this.series = [];
                this.hasCartesianSeries = optionsChart.showAxes;
                //this.axisOffset = undefined;
                //this.inverted = undefined;
                //this.loadingShown = undefined;
                //this.container = undefined;
                //this.chartWidth = undefined;
                //this.chartHeight = undefined;
                //this.marginRight = undefined;
                //this.marginBottom = undefined;
                //this.containerWidth = undefined;
                //this.containerHeight = undefined;
                //this.oldChartWidth = undefined;
                //this.oldChartHeight = undefined;

                //this.renderTo = undefined;
                //this.renderToClone = undefined;

                //this.spacingBox = undefined

                //this.legend = undefined;

                // Elements
                //this.chartBackground = undefined;
                //this.plotBackground = undefined;
                //this.plotBGImage = undefined;
                //this.plotBorder = undefined;
                //this.loadingDiv = undefined;
                //this.loadingSpan = undefined;

                var chart = this,
                    eventType;

                // Add the chart to the global lookup
                chart.index = charts.length;
                charts.push(chart);
                H.chartCount++;

                // Chart event handlers
                if (chartEvents) {
                    for (eventType in chartEvents) {
                        addEvent(chart, eventType, chartEvents[eventType]);
                    }
                }

                chart.xAxis = [];
                chart.yAxis = [];

                chart.pointCount = chart.colorCounter = chart.symbolCounter = 0;

                chart.firstRender();
            },

            /**
             * Initialize an individual series, called internally before render time
             */
            initSeries: function(options) {
                var chart = this,
                    optionsChart = chart.options.chart,
                    type = options.type || optionsChart.type || optionsChart.defaultSeriesType,
                    series,
                    Constr = seriesTypes[type];

                // No such series type
                if (!Constr) {
                    H.error(17, true);
                }

                series = new Constr();
                series.init(this, options);
                return series;
            },

            /**
             * Order all series above a given index. When series are added and ordered
             * by configuration, only the last series is handled (#248, #1123, #2456,
             * #6112). This function is called on series initialization and destroy.
             *
             * @param {number} fromIndex - If this is given, only the series above this
             *    index are handled.
             */
            orderSeries: function(fromIndex) {
                var series = this.series,
                    i = fromIndex || 0;
                for (; i < series.length; i++) {
                    if (series[i]) {
                        series[i].index = i;
                        series[i].name = series[i].name ||
                            'Series ' + (series[i].index + 1);
                    }
                }
            },

            /**
             * Check whether a given point is within the plot area
             *
             * @param {Number} plotX Pixel x relative to the plot area
             * @param {Number} plotY Pixel y relative to the plot area
             * @param {Boolean} inverted Whether the chart is inverted
             */
            isInsidePlot: function(plotX, plotY, inverted) {
                var x = inverted ? plotY : plotX,
                    y = inverted ? plotX : plotY;

                return x >= 0 &&
                    x <= this.plotWidth &&
                    y >= 0 &&
                    y <= this.plotHeight;
            },

            /**
             * Redraw legend, axes or series based on updated data
             *
             * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
             *	configuration
             */
            redraw: function(animation) {
                var chart = this,
                    axes = chart.axes,
                    series = chart.series,
                    pointer = chart.pointer,
                    legend = chart.legend,
                    redrawLegend = chart.isDirtyLegend,
                    hasStackedSeries,
                    hasDirtyStacks,
                    hasCartesianSeries = chart.hasCartesianSeries,
                    isDirtyBox = chart.isDirtyBox,
                    seriesLength = series.length,
                    i = seriesLength,
                    serie,
                    renderer = chart.renderer,
                    isHiddenChart = renderer.isHidden(),
                    afterRedraw = [];

                // Handle responsive rules, not only on resize (#6130)
                if (chart.setResponsive) {
                    chart.setResponsive(false);
                }

                H.setAnimation(animation, chart);

                if (isHiddenChart) {
                    chart.cloneRenderTo();
                }

                // Adjust title layout (reflow multiline text)
                chart.layOutTitles();

                // link stacked series
                while (i--) {
                    serie = series[i];

                    if (serie.options.stacking) {
                        hasStackedSeries = true;

                        if (serie.isDirty) {
                            hasDirtyStacks = true;
                            break;
                        }
                    }
                }
                if (hasDirtyStacks) { // mark others as dirty
                    i = seriesLength;
                    while (i--) {
                        serie = series[i];
                        if (serie.options.stacking) {
                            serie.isDirty = true;
                        }
                    }
                }

                // Handle updated data in the series
                each(series, function(serie) {
                    if (serie.isDirty) {
                        if (serie.options.legendType === 'point') {
                            if (serie.updateTotals) {
                                serie.updateTotals();
                            }
                            redrawLegend = true;
                        }
                    }
                    if (serie.isDirtyData) {
                        fireEvent(serie, 'updatedData');
                    }
                });

                // handle added or removed series
                if (redrawLegend && legend.options.enabled) { // series or pie points are added or removed
                    // draw legend graphics
                    legend.render();

                    chart.isDirtyLegend = false;
                }

                // reset stacks
                if (hasStackedSeries) {
                    chart.getStacks();
                }


                if (hasCartesianSeries) {
                    // set axes scales
                    each(axes, function(axis) {
                        axis.updateNames();
                        axis.setScale();
                    });
                }

                chart.getMargins(); // #3098

                if (hasCartesianSeries) {
                    // If one axis is dirty, all axes must be redrawn (#792, #2169)
                    each(axes, function(axis) {
                        if (axis.isDirty) {
                            isDirtyBox = true;
                        }
                    });

                    // redraw axes
                    each(axes, function(axis) {

                        // Fire 'afterSetExtremes' only if extremes are set
                        var key = axis.min + ',' + axis.max;
                        if (axis.extKey !== key) { // #821, #4452
                            axis.extKey = key;
                            afterRedraw.push(function() { // prevent a recursive call to chart.redraw() (#1119)
                                fireEvent(axis, 'afterSetExtremes', extend(axis.eventArgs, axis.getExtremes())); // #747, #751
                                delete axis.eventArgs;
                            });
                        }
                        if (isDirtyBox || hasStackedSeries) {
                            axis.redraw();
                        }
                    });
                }

                // the plot areas size has changed
                if (isDirtyBox) {
                    chart.drawChartBox();
                }

                // Fire an event before redrawing series, used by the boost module to
                // clear previous series renderings.
                fireEvent(chart, 'predraw');

                // redraw affected series
                each(series, function(serie) {
                    if ((isDirtyBox || serie.isDirty) && serie.visible) {
                        serie.redraw();
                    }
                    // Set it here, otherwise we will have unlimited 'updatedData' calls
                    // for a hidden series after setData(). Fixes #6012
                    serie.isDirtyData = false;
                });

                // move tooltip or reset
                if (pointer) {
                    pointer.reset(true);
                }

                // redraw if canvas
                renderer.draw();

                // Fire the events
                fireEvent(chart, 'redraw');
                fireEvent(chart, 'render');

                if (isHiddenChart) {
                    chart.cloneRenderTo(true);
                }

                // Fire callbacks that are put on hold until after the redraw
                each(afterRedraw, function(callback) {
                    callback.call();
                });
            },

            /**
             * Get an axis, series or point object by id.
             * @param id {String} The id as given in the configuration options
             */
            get: function(id) {

                var ret,
                    series = this.series,
                    i;

                function itemById(item) {
                    return item.id === id || (item.options && item.options.id === id);
                }

                ret =
                    // Search axes
                    find(this.axes, itemById) ||

                    // Search series
                    find(this.series, itemById);

                // Search points
                for (i = 0; !ret && i < series.length; i++) {
                    ret = find(series[i].points || [], itemById);
                }

                return ret;
            },

            /**
             * Create the Axis instances based on the config options
             */
            getAxes: function() {
                var chart = this,
                    options = this.options,
                    xAxisOptions = options.xAxis = splat(options.xAxis || {}),
                    yAxisOptions = options.yAxis = splat(options.yAxis || {}),
                    optionsArray;

                // make sure the options are arrays and add some members
                each(xAxisOptions, function(axis, i) {
                    axis.index = i;
                    axis.isX = true;
                });

                each(yAxisOptions, function(axis, i) {
                    axis.index = i;
                });

                // concatenate all axis options into one array
                optionsArray = xAxisOptions.concat(yAxisOptions);

                each(optionsArray, function(axisOptions) {
                    new Axis(chart, axisOptions); // eslint-disable-line no-new
                });
            },


            /**
             * Get the currently selected points from all series
             */
            getSelectedPoints: function() {
                var points = [];
                each(this.series, function(serie) {
                    points = points.concat(grep(serie.points || [], function(point) {
                        return point.selected;
                    }));
                });
                return points;
            },

            /**
             * Get the currently selected series
             */
            getSelectedSeries: function() {
                return grep(this.series, function(serie) {
                    return serie.selected;
                });
            },

            /**
             * Show the title and subtitle of the chart
             *
             * @param titleOptions {Object} New title options
             * @param subtitleOptions {Object} New subtitle options
             *
             */
            setTitle: function(titleOptions, subtitleOptions, redraw) {
                var chart = this,
                    options = chart.options,
                    chartTitleOptions,
                    chartSubtitleOptions;

                chartTitleOptions = options.title = merge(

                    // Default styles
                    {
                        style: {
                            color: '#333333',
                            fontSize: options.isStock ? '16px' : '18px' // #2944
                        }
                    },

                    options.title,
                    titleOptions
                );
                chartSubtitleOptions = options.subtitle = merge(

                    // Default styles
                    {
                        style: {
                            color: '#666666'
                        }
                    },

                    options.subtitle,
                    subtitleOptions
                );

                // add title and subtitle
                each([
                    ['title', titleOptions, chartTitleOptions],
                    ['subtitle', subtitleOptions, chartSubtitleOptions]
                ], function(arr, i) {
                    var name = arr[0],
                        title = chart[name],
                        titleOptions = arr[1],
                        chartTitleOptions = arr[2];

                    if (title && titleOptions) {
                        chart[name] = title = title.destroy(); // remove old
                    }

                    if (chartTitleOptions && chartTitleOptions.text && !title) {
                        chart[name] = chart.renderer.text(
                                chartTitleOptions.text,
                                0,
                                0,
                                chartTitleOptions.useHTML
                            )
                            .attr({
                                align: chartTitleOptions.align,
                                'class': 'highcharts-' + name,
                                zIndex: chartTitleOptions.zIndex || 4
                            })
                            .add();

                        // Update methods, shortcut to Chart.setTitle
                        chart[name].update = function(o) {
                            chart.setTitle(!i && o, i && o);
                        };


                        // Presentational
                        chart[name].css(chartTitleOptions.style);


                    }
                });
                chart.layOutTitles(redraw);
            },

            /**
             * Lay out the chart titles and cache the full offset height for use in getMargins
             */
            layOutTitles: function(redraw) {
                var titleOffset = 0,
                    requiresDirtyBox,
                    renderer = this.renderer,
                    spacingBox = this.spacingBox;

                // Lay out the title and the subtitle respectively
                each(['title', 'subtitle'], function(key) {
                    var title = this[key],
                        titleOptions = this.options[key],
                        titleSize;

                    if (title) {

                        titleSize = titleOptions.style.fontSize;

                        titleSize = renderer.fontMetrics(titleSize, title).b;

                        title
                            .css({
                                width: (titleOptions.width || spacingBox.width + titleOptions.widthAdjust) + 'px'
                            })
                            .align(extend({
                                y: titleOffset + titleSize + (key === 'title' ? -3 : 2)
                            }, titleOptions), false, 'spacingBox');

                        if (!titleOptions.floating && !titleOptions.verticalAlign) {
                            titleOffset = Math.ceil(titleOffset + title.getBBox().height);
                        }
                    }
                }, this);

                requiresDirtyBox = this.titleOffset !== titleOffset;
                this.titleOffset = titleOffset; // used in getMargins

                if (!this.isDirtyBox && requiresDirtyBox) {
                    this.isDirtyBox = requiresDirtyBox;
                    // Redraw if necessary (#2719, #2744)
                    if (this.hasRendered && pick(redraw, true) && this.isDirtyBox) {
                        this.redraw();
                    }
                }
            },

            /**
             * Get chart width and height according to options and container size
             */
            getChartSize: function() {
                var chart = this,
                    optionsChart = chart.options.chart,
                    widthOption = optionsChart.width,
                    heightOption = optionsChart.height,
                    renderTo = chart.renderToClone || chart.renderTo;

                // Get inner width and height
                if (!defined(widthOption)) {
                    chart.containerWidth = getStyle(renderTo, 'width');
                }
                if (!defined(heightOption)) {
                    chart.containerHeight = getStyle(renderTo, 'height');
                }

                chart.chartWidth = Math.max( // #1393
                    0,
                    widthOption || chart.containerWidth || 600 // #1460
                );
                chart.chartHeight = Math.max(
                    0,
                    heightOption || chart.containerHeight || 400
                );
            },

            /**
             * Create a clone of the chart's renderTo div and place it outside the viewport to allow
             * size computation on chart.render and chart.redraw
             */
            cloneRenderTo: function(revert) {
                var clone = this.renderToClone,
                    container = this.container;

                // Destroy the clone and bring the container back to the real renderTo div
                if (revert) {
                    if (clone) {
                        while (clone.childNodes.length) { // #5231
                            this.renderTo.appendChild(clone.firstChild);
                        }
                        discardElement(clone);
                        delete this.renderToClone;
                    }

                    // Set up the clone
                } else {
                    if (container && container.parentNode === this.renderTo) {
                        this.renderTo.removeChild(container); // do not clone this
                    }
                    this.renderToClone = clone = this.renderTo.cloneNode(0);
                    css(clone, {
                        position: 'absolute',
                        top: '-9999px',
                        display: 'block' // #833
                    });
                    if (clone.style.setProperty) { // #2631
                        clone.style.setProperty('display', 'block', 'important');
                    }
                    doc.body.appendChild(clone);
                    if (container) {
                        clone.appendChild(container);
                    }
                }
            },

            /**
             * Setter for the chart class name
             */
            setClassName: function(className) {
                this.container.className = 'highcharts-container ' + (className || '');
            },

            /**
             * Get the containing element, determine the size and create the inner container
             * div to hold the chart
             */
            getContainer: function() {
                var chart = this,
                    container,
                    options = chart.options,
                    optionsChart = options.chart,
                    chartWidth,
                    chartHeight,
                    renderTo = chart.renderTo,
                    indexAttrName = 'data-highcharts-chart',
                    oldChartIndex,
                    Ren,
                    containerId = H.uniqueKey(),
                    containerStyle,
                    key;

                if (!renderTo) {
                    chart.renderTo = renderTo = optionsChart.renderTo;
                }

                if (isString(renderTo)) {
                    chart.renderTo = renderTo = doc.getElementById(renderTo);
                }

                // Display an error if the renderTo is wrong
                if (!renderTo) {
                    H.error(13, true);
                }

                // If the container already holds a chart, destroy it. The check for hasRendered is there
                // because web pages that are saved to disk from the browser, will preserve the data-highcharts-chart
                // attribute and the SVG contents, but not an interactive chart. So in this case,
                // charts[oldChartIndex] will point to the wrong chart if any (#2609).
                oldChartIndex = pInt(attr(renderTo, indexAttrName));
                if (isNumber(oldChartIndex) && charts[oldChartIndex] && charts[oldChartIndex].hasRendered) {
                    charts[oldChartIndex].destroy();
                }

                // Make a reference to the chart from the div
                attr(renderTo, indexAttrName, chart.index);

                // remove previous chart
                renderTo.innerHTML = '';

                // If the container doesn't have an offsetWidth, it has or is a child of
                // a node that has display:none. We need to temporarily move it out to a
                // visible state to determine the size, else the legend and tooltips
                // won't render properly. The skipClone option is used in sparklines as
                // a micro optimization, saving about 1-2 ms each chart.
                if (!optionsChart.skipClone && !renderTo.offsetWidth) {
                    chart.cloneRenderTo();
                }

                // get the width and height
                chart.getChartSize();
                chartWidth = chart.chartWidth;
                chartHeight = chart.chartHeight;

                // Create the inner container

                containerStyle = extend({
                    position: 'relative',
                    overflow: 'hidden', // needed for context menu (avoid scrollbars) and
                    // content overflow in IE
                    width: chartWidth + 'px',
                    height: chartHeight + 'px',
                    textAlign: 'left',
                    lineHeight: 'normal', // #427
                    zIndex: 0, // #1072
                    '-webkit-tap-highlight-color': 'rgba(0,0,0,0)'
                }, optionsChart.style);

                chart.container = container = createElement(
                    'div', {
                        id: containerId
                    },
                    containerStyle,
                    chart.renderToClone || renderTo
                );

                // cache the cursor (#1650)
                chart._cursor = container.style.cursor;

                // Initialize the renderer
                Ren = H[optionsChart.renderer] || Renderer;
                chart.renderer = new Ren(
                    container,
                    chartWidth,
                    chartHeight,
                    null,
                    optionsChart.forExport,
                    options.exporting && options.exporting.allowHTML
                );


                chart.setClassName(optionsChart.className);

                chart.renderer.setStyle(optionsChart.style);


                // Add a reference to the charts index
                chart.renderer.chartIndex = chart.index;
            },

            /**
             * Calculate margins by rendering axis labels in a preliminary position. Title,
             * subtitle and legend have already been rendered at this stage, but will be
             * moved into their final positions
             */
            getMargins: function(skipAxes) {
                var chart = this,
                    spacing = chart.spacing,
                    margin = chart.margin,
                    titleOffset = chart.titleOffset;

                chart.resetMargins();

                // Adjust for title and subtitle
                if (titleOffset && !defined(margin[0])) {
                    chart.plotTop = Math.max(chart.plotTop, titleOffset + chart.options.title.margin + spacing[0]);
                }

                // Adjust for legend
                if (chart.legend.display) {
                    chart.legend.adjustMargins(margin, spacing);
                }

                // adjust for scroller
                if (chart.extraMargin) {
                    chart[chart.extraMargin.type] = (chart[chart.extraMargin.type] || 0) + chart.extraMargin.value;
                }
                if (chart.extraTopMargin) {
                    chart.plotTop += chart.extraTopMargin;
                }
                if (!skipAxes) {
                    this.getAxisMargins();
                }
            },

            getAxisMargins: function() {

                var chart = this,
                    axisOffset = chart.axisOffset = [0, 0, 0, 0], // top, right, bottom, left
                    margin = chart.margin;

                // pre-render axes to get labels offset width
                if (chart.hasCartesianSeries) {
                    each(chart.axes, function(axis) {
                        if (axis.visible) {
                            axis.getOffset();
                        }
                    });
                }

                // Add the axis offsets
                each(marginNames, function(m, side) {
                    if (!defined(margin[side])) {
                        chart[m] += axisOffset[side];
                    }
                });

                chart.setChartSize();

            },

            /**
             * Resize the chart to its container if size is not explicitly set
             */
            reflow: function(e) {
                var chart = this,
                    optionsChart = chart.options.chart,
                    renderTo = chart.renderTo,
                    hasUserWidth = defined(optionsChart.width),
                    width = optionsChart.width || getStyle(renderTo, 'width'),
                    height = optionsChart.height || getStyle(renderTo, 'height'),
                    target = e ? e.target : win;

                // Width and height checks for display:none. Target is doc in IE8 and Opera,
                // win in Firefox, Chrome and IE9.
                if (!hasUserWidth && !chart.isPrinting && width && height && (target === win || target === doc)) { // #1093
                    if (width !== chart.containerWidth || height !== chart.containerHeight) {
                        clearTimeout(chart.reflowTimeout);
                        // When called from window.resize, e is set, else it's called directly (#2224)
                        chart.reflowTimeout = syncTimeout(function() {
                            if (chart.container) { // It may have been destroyed in the meantime (#1257)
                                chart.setSize(undefined, undefined, false);
                            }
                        }, e ? 100 : 0);
                    }
                    chart.containerWidth = width;
                    chart.containerHeight = height;
                }
            },

            /**
             * Add the event handlers necessary for auto resizing
             */
            initReflow: function() {
                var chart = this,
                    unbind;

                unbind = addEvent(win, 'resize', function(e) {
                    chart.reflow(e);
                });
                addEvent(chart, 'destroy', unbind);

                // The following will add listeners to re-fit the chart before and after
                // printing (#2284). However it only works in WebKit. Should have worked
                // in Firefox, but not supported in IE.
                /*
                if (win.matchMedia) {
                	win.matchMedia('print').addListener(function reflow() {
                		chart.reflow();
                	});
                }
                */
            },

            /**
             * Resize the chart to a given width and height
             * @param {Number} width
             * @param {Number} height
             * @param {Object|Boolean} animation
             */
            setSize: function(width, height, animation) {
                var chart = this,
                    renderer = chart.renderer,
                    globalAnimation;

                // Handle the isResizing counter
                chart.isResizing += 1;

                // set the animation for the current process
                H.setAnimation(animation, chart);

                chart.oldChartHeight = chart.chartHeight;
                chart.oldChartWidth = chart.chartWidth;
                if (width !== undefined) {
                    chart.options.chart.width = width;
                }
                if (height !== undefined) {
                    chart.options.chart.height = height;
                }
                chart.getChartSize();

                // Resize the container with the global animation applied if enabled (#2503)

                globalAnimation = renderer.globalAnimation;
                (globalAnimation ? animate : css)(chart.container, {
                    width: chart.chartWidth + 'px',
                    height: chart.chartHeight + 'px'
                }, globalAnimation);


                chart.setChartSize(true);
                renderer.setSize(chart.chartWidth, chart.chartHeight, animation);

                // handle axes
                each(chart.axes, function(axis) {
                    axis.isDirty = true;
                    axis.setScale();
                });

                chart.isDirtyLegend = true; // force legend redraw
                chart.isDirtyBox = true; // force redraw of plot and chart border

                chart.layOutTitles(); // #2857
                chart.getMargins();

                chart.redraw(animation);


                chart.oldChartHeight = null;
                fireEvent(chart, 'resize');

                // Fire endResize and set isResizing back. If animation is disabled, fire without delay
                syncTimeout(function() {
                    if (chart) {
                        fireEvent(chart, 'endResize', null, function() {
                            chart.isResizing -= 1;
                        });
                    }
                }, animObject(globalAnimation).duration);
            },

            /**
             * Set the public chart properties. This is done before and after the pre-render
             * to determine margin sizes
             */
            setChartSize: function(skipAxes) {
                var chart = this,
                    inverted = chart.inverted,
                    renderer = chart.renderer,
                    chartWidth = chart.chartWidth,
                    chartHeight = chart.chartHeight,
                    optionsChart = chart.options.chart,
                    spacing = chart.spacing,
                    clipOffset = chart.clipOffset,
                    clipX,
                    clipY,
                    plotLeft,
                    plotTop,
                    plotWidth,
                    plotHeight,
                    plotBorderWidth;

                chart.plotLeft = plotLeft = Math.round(chart.plotLeft);
                chart.plotTop = plotTop = Math.round(chart.plotTop);
                chart.plotWidth = plotWidth = Math.max(0, Math.round(chartWidth - plotLeft - chart.marginRight));
                chart.plotHeight = plotHeight = Math.max(0, Math.round(chartHeight - plotTop - chart.marginBottom));

                chart.plotSizeX = inverted ? plotHeight : plotWidth;
                chart.plotSizeY = inverted ? plotWidth : plotHeight;

                chart.plotBorderWidth = optionsChart.plotBorderWidth || 0;

                // Set boxes used for alignment
                chart.spacingBox = renderer.spacingBox = {
                    x: spacing[3],
                    y: spacing[0],
                    width: chartWidth - spacing[3] - spacing[1],
                    height: chartHeight - spacing[0] - spacing[2]
                };
                chart.plotBox = renderer.plotBox = {
                    x: plotLeft,
                    y: plotTop,
                    width: plotWidth,
                    height: plotHeight
                };

                plotBorderWidth = 2 * Math.floor(chart.plotBorderWidth / 2);
                clipX = Math.ceil(Math.max(plotBorderWidth, clipOffset[3]) / 2);
                clipY = Math.ceil(Math.max(plotBorderWidth, clipOffset[0]) / 2);
                chart.clipBox = {
                    x: clipX,
                    y: clipY,
                    width: Math.floor(chart.plotSizeX - Math.max(plotBorderWidth, clipOffset[1]) / 2 - clipX),
                    height: Math.max(0, Math.floor(chart.plotSizeY - Math.max(plotBorderWidth, clipOffset[2]) / 2 - clipY))
                };

                if (!skipAxes) {
                    each(chart.axes, function(axis) {
                        axis.setAxisSize();
                        axis.setAxisTranslation();
                    });
                }
            },

            /**
             * Initial margins before auto size margins are applied
             */
            resetMargins: function() {
                var chart = this,
                    chartOptions = chart.options.chart;

                // Create margin and spacing array
                each(['margin', 'spacing'], function splashArrays(target) {
                    var value = chartOptions[target],
                        values = isObject(value) ? value : [value, value, value, value];

                    each(['Top', 'Right', 'Bottom', 'Left'], function(sideName, side) {
                        chart[target][side] = pick(chartOptions[target + sideName], values[side]);
                    });
                });

                // Set margin names like chart.plotTop, chart.plotLeft, chart.marginRight, chart.marginBottom.
                each(marginNames, function(m, side) {
                    chart[m] = pick(chart.margin[side], chart.spacing[side]);
                });
                chart.axisOffset = [0, 0, 0, 0]; // top, right, bottom, left
                chart.clipOffset = [0, 0, 0, 0];
            },

            /**
             * Draw the borders and backgrounds for chart and plot area
             */
            drawChartBox: function() {
                var chart = this,
                    optionsChart = chart.options.chart,
                    renderer = chart.renderer,
                    chartWidth = chart.chartWidth,
                    chartHeight = chart.chartHeight,
                    chartBackground = chart.chartBackground,
                    plotBackground = chart.plotBackground,
                    plotBorder = chart.plotBorder,
                    chartBorderWidth,

                    plotBGImage = chart.plotBGImage,
                    chartBackgroundColor = optionsChart.backgroundColor,
                    plotBackgroundColor = optionsChart.plotBackgroundColor,
                    plotBackgroundImage = optionsChart.plotBackgroundImage,

                    mgn,
                    bgAttr,
                    plotLeft = chart.plotLeft,
                    plotTop = chart.plotTop,
                    plotWidth = chart.plotWidth,
                    plotHeight = chart.plotHeight,
                    plotBox = chart.plotBox,
                    clipRect = chart.clipRect,
                    clipBox = chart.clipBox,
                    verb = 'animate';

                // Chart area
                if (!chartBackground) {
                    chart.chartBackground = chartBackground = renderer.rect()
                        .addClass('highcharts-background')
                        .add();
                    verb = 'attr';
                }


                // Presentational
                chartBorderWidth = optionsChart.borderWidth || 0;
                mgn = chartBorderWidth + (optionsChart.shadow ? 8 : 0);

                bgAttr = {
                    fill: chartBackgroundColor || 'none'
                };

                if (chartBorderWidth || chartBackground['stroke-width']) { // #980
                    bgAttr.stroke = optionsChart.borderColor;
                    bgAttr['stroke-width'] = chartBorderWidth;
                }
                chartBackground
                    .attr(bgAttr)
                    .shadow(optionsChart.shadow);

                chartBackground[verb]({
                    x: mgn / 2,
                    y: mgn / 2,
                    width: chartWidth - mgn - chartBorderWidth % 2,
                    height: chartHeight - mgn - chartBorderWidth % 2,
                    r: optionsChart.borderRadius
                });

                // Plot background
                verb = 'animate';
                if (!plotBackground) {
                    verb = 'attr';
                    chart.plotBackground = plotBackground = renderer.rect()
                        .addClass('highcharts-plot-background')
                        .add();
                }
                plotBackground[verb](plotBox);


                // Presentational attributes for the background
                plotBackground
                    .attr({
                        fill: plotBackgroundColor || 'none'
                    })
                    .shadow(optionsChart.plotShadow);

                // Create the background image
                if (plotBackgroundImage) {
                    if (!plotBGImage) {
                        chart.plotBGImage = renderer.image(plotBackgroundImage, plotLeft, plotTop, plotWidth, plotHeight)
                            .add();
                    } else {
                        plotBGImage.animate(plotBox);
                    }
                }


                // Plot clip
                if (!clipRect) {
                    chart.clipRect = renderer.clipRect(clipBox);
                } else {
                    clipRect.animate({
                        width: clipBox.width,
                        height: clipBox.height
                    });
                }

                // Plot area border
                verb = 'animate';
                if (!plotBorder) {
                    verb = 'attr';
                    chart.plotBorder = plotBorder = renderer.rect()
                        .addClass('highcharts-plot-border')
                        .attr({
                            zIndex: 1 // Above the grid
                        })
                        .add();
                }


                // Presentational
                plotBorder.attr({
                    stroke: optionsChart.plotBorderColor,
                    'stroke-width': optionsChart.plotBorderWidth || 0,
                    fill: 'none'
                });


                plotBorder[verb](plotBorder.crisp({
                    x: plotLeft,
                    y: plotTop,
                    width: plotWidth,
                    height: plotHeight
                }, -plotBorder.strokeWidth())); //#3282 plotBorder should be negative;

                // reset
                chart.isDirtyBox = false;
            },

            /**
             * Detect whether a certain chart property is needed based on inspecting its options
             * and series. This mainly applies to the chart.inverted property, and in extensions to
             * the chart.angular and chart.polar properties.
             */
            propFromSeries: function() {
                var chart = this,
                    optionsChart = chart.options.chart,
                    klass,
                    seriesOptions = chart.options.series,
                    i,
                    value;


                each(['inverted', 'angular', 'polar'], function(key) {

                    // The default series type's class
                    klass = seriesTypes[optionsChart.type || optionsChart.defaultSeriesType];

                    // Get the value from available chart-wide properties
                    value =
                        optionsChart[key] || // It is set in the options
                        (klass && klass.prototype[key]); // The default series class requires it

                    // 4. Check if any the chart's series require it
                    i = seriesOptions && seriesOptions.length;
                    while (!value && i--) {
                        klass = seriesTypes[seriesOptions[i].type];
                        if (klass && klass.prototype[key]) {
                            value = true;
                        }
                    }

                    // Set the chart property
                    chart[key] = value;
                });

            },

            /**
             * Link two or more series together. This is done initially from Chart.render,
             * and after Chart.addSeries and Series.remove.
             */
            linkSeries: function() {
                var chart = this,
                    chartSeries = chart.series;

                // Reset links
                each(chartSeries, function(series) {
                    series.linkedSeries.length = 0;
                });

                // Apply new links
                each(chartSeries, function(series) {
                    var linkedTo = series.options.linkedTo;
                    if (isString(linkedTo)) {
                        if (linkedTo === ':previous') {
                            linkedTo = chart.series[series.index - 1];
                        } else {
                            linkedTo = chart.get(linkedTo);
                        }
                        if (linkedTo && linkedTo.linkedParent !== series) { // #3341 avoid mutual linking
                            linkedTo.linkedSeries.push(series);
                            series.linkedParent = linkedTo;
                            series.visible = pick(series.options.visible, linkedTo.options.visible, series.visible); // #3879
                        }
                    }
                });
            },

            /**
             * Render series for the chart
             */
            renderSeries: function() {
                each(this.series, function(serie) {
                    serie.translate();
                    serie.render();
                });
            },

            /**
             * Render labels for the chart
             */
            renderLabels: function() {
                var chart = this,
                    labels = chart.options.labels;
                if (labels.items) {
                    each(labels.items, function(label) {
                        var style = extend(labels.style, label.style),
                            x = pInt(style.left) + chart.plotLeft,
                            y = pInt(style.top) + chart.plotTop + 12;

                        // delete to prevent rewriting in IE
                        delete style.left;
                        delete style.top;

                        chart.renderer.text(
                                label.html,
                                x,
                                y
                            )
                            .attr({
                                zIndex: 2
                            })
                            .css(style)
                            .add();

                    });
                }
            },

            /**
             * Render all graphics for the chart
             */
            render: function() {
                var chart = this,
                    axes = chart.axes,
                    renderer = chart.renderer,
                    options = chart.options,
                    tempWidth,
                    tempHeight,
                    redoHorizontal,
                    redoVertical;

                // Title
                chart.setTitle();


                // Legend
                chart.legend = new Legend(chart, options.legend);

                // Get stacks
                if (chart.getStacks) {
                    chart.getStacks();
                }

                // Get chart margins
                chart.getMargins(true);
                chart.setChartSize();

                // Record preliminary dimensions for later comparison
                tempWidth = chart.plotWidth;
                tempHeight = chart.plotHeight = chart.plotHeight - 21; // 21 is the most common correction for X axis labels

                // Get margins by pre-rendering axes
                each(axes, function(axis) {
                    axis.setScale();
                });
                chart.getAxisMargins();

                // If the plot area size has changed significantly, calculate tick positions again
                redoHorizontal = tempWidth / chart.plotWidth > 1.1;
                redoVertical = tempHeight / chart.plotHeight > 1.05; // Height is more sensitive

                if (redoHorizontal || redoVertical) {

                    each(axes, function(axis) {
                        if ((axis.horiz && redoHorizontal) || (!axis.horiz && redoVertical)) {
                            axis.setTickInterval(true); // update to reflect the new margins
                        }
                    });
                    chart.getMargins(); // second pass to check for new labels
                }

                // Draw the borders and backgrounds
                chart.drawChartBox();


                // Axes
                if (chart.hasCartesianSeries) {
                    each(axes, function(axis) {
                        if (axis.visible) {
                            axis.render();
                        }
                    });
                }

                // The series
                if (!chart.seriesGroup) {
                    chart.seriesGroup = renderer.g('series-group')
                        .attr({
                            zIndex: 3
                        })
                        .add();
                }
                chart.renderSeries();

                // Labels
                chart.renderLabels();

                // Credits
                chart.addCredits();

                // Handle responsiveness
                if (chart.setResponsive) {
                    chart.setResponsive();
                }

                // Set flag
                chart.hasRendered = true;

            },

            /**
             * Show chart credits based on config options
             */
            addCredits: function(credits) {
                var chart = this;

                credits = merge(true, this.options.credits, credits);
                if (credits.enabled && !this.credits) {
                    this.credits = this.renderer.text(
                            credits.text + (this.mapCredits || ''),
                            0,
                            0
                        )
                        .addClass('highcharts-credits')
                        .on('click', function() {
                            if (credits.href) {
                                win.location.href = credits.href;
                            }
                        })
                        .attr({
                            align: credits.position.align,
                            zIndex: 8
                        })

                    .css(credits.style)

                    .add()
                        .align(credits.position);

                    // Dynamically update
                    this.credits.update = function(options) {
                        chart.credits = chart.credits.destroy();
                        chart.addCredits(options);
                    };
                }
            },

            /**
             * Clean up memory usage
             */
            destroy: function() {
                var chart = this,
                    axes = chart.axes,
                    series = chart.series,
                    container = chart.container,
                    i,
                    parentNode = container && container.parentNode;

                // fire the chart.destoy event
                fireEvent(chart, 'destroy');

                // Delete the chart from charts lookup array
                charts[chart.index] = undefined;
                H.chartCount--;
                chart.renderTo.removeAttribute('data-highcharts-chart');

                // remove events
                removeEvent(chart);

                // ==== Destroy collections:
                // Destroy axes
                i = axes.length;
                while (i--) {
                    axes[i] = axes[i].destroy();
                }

                // Destroy scroller & scroller series before destroying base series
                if (this.scroller && this.scroller.destroy) {
                    this.scroller.destroy();
                }

                // Destroy each series
                i = series.length;
                while (i--) {
                    series[i] = series[i].destroy();
                }

                // ==== Destroy chart properties:
                each([
                    'title', 'subtitle', 'chartBackground', 'plotBackground',
                    'plotBGImage', 'plotBorder', 'seriesGroup', 'clipRect', 'credits',
                    'pointer', 'rangeSelector', 'legend', 'resetZoomButton', 'tooltip',
                    'renderer'
                ], function(name) {
                    var prop = chart[name];

                    if (prop && prop.destroy) {
                        chart[name] = prop.destroy();
                    }
                });

                // remove container and all SVG
                if (container) { // can break in IE when destroyed before finished loading
                    container.innerHTML = '';
                    removeEvent(container);
                    if (parentNode) {
                        discardElement(container);
                    }

                }

                // clean it all up
                for (i in chart) {
                    delete chart[i];
                }

            },


            /**
             * VML namespaces can't be added until after complete. Listening
             * for Perini's doScroll hack is not enough.
             */
            isReadyToRender: function() {
                var chart = this;

                // Note: win == win.top is required
                if ((!svg && (win == win.top && doc.readyState !== 'complete'))) { // eslint-disable-line eqeqeq
                    doc.attachEvent('onreadystatechange', function() {
                        doc.detachEvent('onreadystatechange', chart.firstRender);
                        if (doc.readyState === 'complete') {
                            chart.firstRender();
                        }
                    });
                    return false;
                }
                return true;
            },

            /**
             * Prepare for first rendering after all data are loaded
             */
            firstRender: function() {
                var chart = this,
                    options = chart.options;

                // Check whether the chart is ready to render
                if (!chart.isReadyToRender()) {
                    return;
                }

                // Create the container
                chart.getContainer();

                // Run an early event after the container and renderer are established
                fireEvent(chart, 'init');


                chart.resetMargins();
                chart.setChartSize();

                // Set the common chart properties (mainly invert) from the given series
                chart.propFromSeries();

                // get axes
                chart.getAxes();

                // Initialize the series
                each(options.series || [], function(serieOptions) {
                    chart.initSeries(serieOptions);
                });

                chart.linkSeries();

                // Run an event after axes and series are initialized, but before render. At this stage,
                // the series data is indexed and cached in the xData and yData arrays, so we can access
                // those before rendering. Used in Highstock.
                fireEvent(chart, 'beforeRender');

                // depends on inverted and on margins being set
                if (Pointer) {
                    chart.pointer = new Pointer(chart, options);
                }

                chart.render();

                // Fire the load event if there are no external images
                if (!chart.renderer.imgCount && chart.onload) {
                    chart.onload();
                }

                // If the chart was rendered outside the top container, put it back in (#3679)
                chart.cloneRenderTo(true);

            },

            /** 
             * On chart load
             */
            onload: function() {

                // Run callbacks
                each([this.callback].concat(this.callbacks), function(fn) {
                    if (fn && this.index !== undefined) { // Chart destroyed in its own callback (#3600)
                        fn.apply(this, [this]);
                    }
                }, this);

                fireEvent(this, 'load');
                fireEvent(this, 'render');


                // Set up auto resize, check for not destroyed (#6068)
                if (defined(this.index) && this.options.chart.reflow !== false) {
                    this.initReflow();
                }

                // Don't run again
                this.onload = null;
            }

        }; // end Chart

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Point,

            each = H.each,
            extend = H.extend,
            erase = H.erase,
            fireEvent = H.fireEvent,
            format = H.format,
            isArray = H.isArray,
            isNumber = H.isNumber,
            pick = H.pick,
            removeEvent = H.removeEvent;

        /**
         * The Point object. The point objects are generated from the series.data 
         * configuration objects or raw numbers. They can be accessed from the
         * Series.points array.
         * @constructor Point
         */
        Point = H.Point = function() {};
        Point.prototype = {

            /**
             * Initialize the point. Called internally based on the series.data option.
             * @function #init
             * @memberOf Point
             * @param {Object} series The series object containing this point.
             * @param {Object} options The data in either number, array or object
             *        format.
             * @param {Number} x Optionally, the X value of the.
             * @returns {Object} The Point instance.
             */
            init: function(series, options, x) {

                var point = this,
                    colors,
                    colorCount = series.chart.options.chart.colorCount,
                    colorIndex;

                point.series = series;

                point.color = series.color; // #3445

                point.applyOptions(options, x);

                if (series.options.colorByPoint) {

                    colors = series.options.colors || series.chart.options.colors;
                    point.color = point.color || colors[series.colorCounter];
                    colorCount = colors.length;

                    colorIndex = series.colorCounter;
                    series.colorCounter++;
                    // loop back to zero
                    if (series.colorCounter === colorCount) {
                        series.colorCounter = 0;
                    }
                } else {
                    colorIndex = series.colorIndex;
                }
                point.colorIndex = pick(point.colorIndex, colorIndex);

                series.chart.pointCount++;
                return point;
            },
            /**
             * Apply the options containing the x and y data and possible some extra
             * properties. Called on point init or from point.update.
             *
             * @function #applyOptions
             * @memberOf Point
             * @param {Object} options The point options as defined in series.data.
             * @param {Number} x Optionally, the X value.
             * @returns {Object} The Point instance.
             */
            applyOptions: function(options, x) {
                var point = this,
                    series = point.series,
                    pointValKey = series.options.pointValKey || series.pointValKey;

                options = Point.prototype.optionsToObject.call(this, options);

                // copy options directly to point
                extend(point, options);
                point.options = point.options ? extend(point.options, options) : options;

                // Since options are copied into the Point instance, some accidental options must be shielded (#5681)
                if (options.group) {
                    delete point.group;
                }

                // For higher dimension series types. For instance, for ranges, point.y is mapped to point.low.
                if (pointValKey) {
                    point.y = point[pointValKey];
                }
                point.isNull = pick(
                    point.isValid && !point.isValid(),
                    point.x === null || !isNumber(point.y, true)
                ); // #3571, check for NaN

                // The point is initially selected by options (#5777)
                if (point.selected) {
                    point.state = 'select';
                }

                // If no x is set by now, get auto incremented value. All points must have an
                // x value, however the y value can be null to create a gap in the series
                if ('name' in point && x === undefined && series.xAxis && series.xAxis.hasNames) {
                    point.x = series.xAxis.nameToX(point);
                }
                if (point.x === undefined && series) {
                    if (x === undefined) {
                        point.x = series.autoIncrement(point);
                    } else {
                        point.x = x;
                    }
                }

                return point;
            },

            /**
             * Transform number or array configs into objects
             */
            optionsToObject: function(options) {
                var ret = {},
                    series = this.series,
                    keys = series.options.keys,
                    pointArrayMap = keys || series.pointArrayMap || ['y'],
                    valueCount = pointArrayMap.length,
                    firstItemType,
                    i = 0,
                    j = 0;

                if (isNumber(options) || options === null) {
                    ret[pointArrayMap[0]] = options;

                } else if (isArray(options)) {
                    // with leading x value
                    if (!keys && options.length > valueCount) {
                        firstItemType = typeof options[0];
                        if (firstItemType === 'string') {
                            ret.name = options[0];
                        } else if (firstItemType === 'number') {
                            ret.x = options[0];
                        }
                        i++;
                    }
                    while (j < valueCount) {
                        if (!keys || options[i] !== undefined) { // Skip undefined positions for keys
                            ret[pointArrayMap[j]] = options[i];
                        }
                        i++;
                        j++;
                    }
                } else if (typeof options === 'object') {
                    ret = options;

                    // This is the fastest way to detect if there are individual point dataLabels that need
                    // to be considered in drawDataLabels. These can only occur in object configs.
                    if (options.dataLabels) {
                        series._hasPointLabels = true;
                    }

                    // Same approach as above for markers
                    if (options.marker) {
                        series._hasPointMarkers = true;
                    }
                }
                return ret;
            },

            /**
             * Get the CSS class names for individual points
             * @returns {String} The class name
             */
            getClassName: function() {
                return 'highcharts-point' +
                    (this.selected ? ' highcharts-point-select' : '') +
                    (this.negative ? ' highcharts-negative' : '') +
                    (this.isNull ? ' highcharts-null-point' : '') +
                    (this.colorIndex !== undefined ? ' highcharts-color-' +
                        this.colorIndex : '') +
                    (this.options.className ? ' ' + this.options.className : '') +
                    (this.zone && this.zone.className ? ' ' +
                        this.zone.className.replace('highcharts-negative', '') : '');
            },

            /**
             * Return the zone that the point belongs to
             */
            getZone: function() {
                var series = this.series,
                    zones = series.zones,
                    zoneAxis = series.zoneAxis || 'y',
                    i = 0,
                    zone;

                zone = zones[i];
                while (this[zoneAxis] >= zone.value) {
                    zone = zones[++i];
                }

                if (zone && zone.color && !this.options.color) {
                    this.color = zone.color;
                }

                return zone;
            },

            /**
             * Destroy a point to clear memory. Its reference still stays in series.data.
             */
            destroy: function() {
                var point = this,
                    series = point.series,
                    chart = series.chart,
                    hoverPoints = chart.hoverPoints,
                    prop;

                chart.pointCount--;

                if (hoverPoints) {
                    point.setState();
                    erase(hoverPoints, point);
                    if (!hoverPoints.length) {
                        chart.hoverPoints = null;
                    }

                }
                if (point === chart.hoverPoint) {
                    point.onMouseOut();
                }

                // remove all events
                if (point.graphic || point.dataLabel) { // removeEvent and destroyElements are performance expensive
                    removeEvent(point);
                    point.destroyElements();
                }

                if (point.legendItem) { // pies have legend items
                    chart.legend.destroyItem(point);
                }

                for (prop in point) {
                    point[prop] = null;
                }


            },

            /**
             * Destroy SVG elements associated with the point
             */
            destroyElements: function() {
                var point = this,
                    props = ['graphic', 'dataLabel', 'dataLabelUpper', 'connector', 'shadowGroup'],
                    prop,
                    i = 6;
                while (i--) {
                    prop = props[i];
                    if (point[prop]) {
                        point[prop] = point[prop].destroy();
                    }
                }
            },

            /**
             * Return the configuration hash needed for the data label and tooltip formatters
             */
            getLabelConfig: function() {
                return {
                    x: this.category,
                    y: this.y,
                    color: this.color,
                    colorIndex: this.colorIndex,
                    key: this.name || this.category,
                    series: this.series,
                    point: this,
                    percentage: this.percentage,
                    total: this.total || this.stackTotal
                };
            },

            /**
             * Extendable method for formatting each point's tooltip line
             *
             * @return {String} A string to be concatenated in to the common tooltip text
             */
            tooltipFormatter: function(pointFormat) {

                // Insert options for valueDecimals, valuePrefix, and valueSuffix
                var series = this.series,
                    seriesTooltipOptions = series.tooltipOptions,
                    valueDecimals = pick(seriesTooltipOptions.valueDecimals, ''),
                    valuePrefix = seriesTooltipOptions.valuePrefix || '',
                    valueSuffix = seriesTooltipOptions.valueSuffix || '';

                // Loop over the point array map and replace unformatted values with sprintf formatting markup
                each(series.pointArrayMap || ['y'], function(key) {
                    key = '{point.' + key; // without the closing bracket
                    if (valuePrefix || valueSuffix) {
                        pointFormat = pointFormat.replace(key + '}', valuePrefix + key + '}' + valueSuffix);
                    }
                    pointFormat = pointFormat.replace(key + '}', key + ':,.' + valueDecimals + 'f}');
                });

                return format(pointFormat, {
                    point: this,
                    series: this.series
                });
            },

            /**
             * Fire an event on the Point object.
             * @param {String} eventType
             * @param {Object} eventArgs Additional event arguments
             * @param {Function} defaultFunction Default event handler
             */
            firePointEvent: function(eventType, eventArgs, defaultFunction) {
                var point = this,
                    series = this.series,
                    seriesOptions = series.options;

                // load event handlers on demand to save time on mouseover/out
                if (seriesOptions.point.events[eventType] || (point.options && point.options.events && point.options.events[eventType])) {
                    this.importEvents();
                }

                // add default handler if in selection mode
                if (eventType === 'click' && seriesOptions.allowPointSelect) {
                    defaultFunction = function(event) {
                        // Control key is for Windows, meta (= Cmd key) for Mac, Shift for Opera
                        if (point.select) { // Could be destroyed by prior event handlers (#2911)
                            point.select(null, event.ctrlKey || event.metaKey || event.shiftKey);
                        }
                    };
                }

                fireEvent(this, eventType, eventArgs, defaultFunction);
            },
            visible: true
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            animObject = H.animObject,
            arrayMax = H.arrayMax,
            arrayMin = H.arrayMin,
            correctFloat = H.correctFloat,
            Date = H.Date,
            defaultOptions = H.defaultOptions,
            defaultPlotOptions = H.defaultPlotOptions,
            defined = H.defined,
            each = H.each,
            erase = H.erase,
            extend = H.extend,
            fireEvent = H.fireEvent,
            grep = H.grep,
            isArray = H.isArray,
            isNumber = H.isNumber,
            isString = H.isString,
            LegendSymbolMixin = H.LegendSymbolMixin, // @todo add as a requirement
            merge = H.merge,
            pick = H.pick,
            Point = H.Point, // @todo  add as a requirement
            removeEvent = H.removeEvent,
            splat = H.splat,
            SVGElement = H.SVGElement,
            syncTimeout = H.syncTimeout,
            win = H.win;

        /**
         * The base function which all other series types inherit from. The data in the series is stored
         * in various arrays.
         *
         * - First, series.options.data contains all the original config options for
         * each point whether added by options or methods like series.addPoint.
         * - Next, series.data contains those values converted to points, but in case the series data length
         * exceeds the cropThreshold, or if the data is grouped, series.data doesn't contain all the points. It
         * only contains the points that have been created on demand.
         * - Then there's series.points that contains all currently visible point objects. In case of cropping,
         * the cropped-away points are not part of this array. The series.points array starts at series.cropStart
         * compared to series.data and series.options.data. If however the series data is grouped, these can't
         * be correlated one to one.
         * - series.xData and series.processedXData contain clean x values, equivalent to series.data and series.points.
         * - series.yData and series.processedYData contain clean y values, equivalent to series.data and series.points.
         *
         * @constructor Series
         * @param {Object} chart - The chart instance.
         * @param {Object} options - The series options.
         */
        H.Series = H.seriesType('line', null, { // base series options

            //cursor: 'default',
            //dashStyle: null,
            //linecap: 'round',
            lineWidth: 2,
            //shadow: false,

            allowPointSelect: false,
            showCheckbox: false,
            animation: {
                duration: 1000
            },
            //clip: true,
            //connectNulls: false,
            //enableMouseTracking: true,
            events: {},
            //legendIndex: 0,
            // stacking: null,
            marker: {

                lineWidth: 0,
                lineColor: '#ffffff',
                //fillColor: null,

                //enabled: true,
                //symbol: null,
                radius: 4,
                states: { // states for a single point
                    hover: {
                        animation: {
                            duration: 50
                        },
                        enabled: true,
                        radiusPlus: 2,

                        lineWidthPlus: 1

                    },

                    select: {
                        fillColor: '#cccccc',
                        lineColor: '#000000',
                        lineWidth: 2
                    }

                }
            },
            point: {
                events: {}
            },
            dataLabels: {
                align: 'center',
                // defer: true,
                // enabled: false,
                formatter: function() {
                    return this.y === null ? '' : H.numberFormat(this.y, -1);
                },

                style: {
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: 'contrast',
                    textOutline: '1px contrast'
                },
                // backgroundColor: undefined,
                // borderColor: undefined,
                // borderWidth: undefined,
                // shadow: false

                verticalAlign: 'bottom', // above singular point
                x: 0,
                y: 0,
                // borderRadius: undefined,
                padding: 5
            },
            cropThreshold: 300, // draw points outside the plot area when the number of points is less than this
            pointRange: 0,
            //pointStart: 0,
            //pointInterval: 1,
            //showInLegend: null, // auto: true for standalone series, false for linked series
            softThreshold: true,
            states: { // states for the entire series
                hover: {
                    //enabled: false,
                    lineWidthPlus: 1,
                    marker: {
                        // lineWidth: base + 1,
                        // radius: base + 1
                    },
                    halo: {
                        size: 10,

                        opacity: 0.25

                    }
                },
                select: {
                    marker: {}
                }
            },
            stickyTracking: true,
            //tooltip: {
            //pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b>'
            //valueDecimals: null,
            //xDateFormat: '%A, %b %e, %Y',
            //valuePrefix: '',
            //ySuffix: ''
            //}
            turboThreshold: 1000
                // zIndex: null


        }, /** @lends Series.prototype */ {
            isCartesian: true,
            pointClass: Point,
            sorted: true, // requires the data to be sorted
            requireSorting: true,
            directTouch: false,
            axisTypes: ['xAxis', 'yAxis'],
            colorCounter: 0,
            parallelArrays: ['x', 'y'], // each point's x and y values are stored in this.xData and this.yData
            coll: 'series',
            init: function(chart, options) {
                var series = this,
                    eventType,
                    events,
                    chartSeries = chart.series,
                    lastSeries;

                series.chart = chart;
                series.options = options = series.setOptions(options); // merge with plotOptions
                series.linkedSeries = [];

                // bind the axes
                series.bindAxes();

                // set some variables
                extend(series, {
                    name: options.name,
                    state: '',
                    visible: options.visible !== false, // true by default
                    selected: options.selected === true // false by default
                });

                // register event listeners
                events = options.events;
                for (eventType in events) {
                    addEvent(series, eventType, events[eventType]);
                }
                if (
                    (events && events.click) ||
                    (options.point && options.point.events && options.point.events.click) ||
                    options.allowPointSelect
                ) {
                    chart.runTrackerClick = true;
                }

                series.getColor();
                series.getSymbol();

                // Set the data
                each(series.parallelArrays, function(key) {
                    series[key + 'Data'] = [];
                });
                series.setData(options.data, false);

                // Mark cartesian
                if (series.isCartesian) {
                    chart.hasCartesianSeries = true;
                }

                // Get the index and register the series in the chart. The index is one
                // more than the current latest series index (#5960).
                if (chartSeries.length) {
                    lastSeries = chartSeries[chartSeries.length - 1];
                }
                series._i = pick(lastSeries && lastSeries._i, -1) + 1;

                // Insert the series and re-order all series above the insertion point.
                chart.orderSeries(this.insert(chartSeries));
            },

            /**
             * Insert the series in a collection with other series, either the chart
             * series or yAxis series, in the correct order according to the index 
             * option.
             * @param  {Array} collection A collection of series.
             * @returns {Number} The index of the series in the collection.
             */
            insert: function(collection) {
                var indexOption = this.options.index,
                    i;

                // Insert by index option
                if (isNumber(indexOption)) {
                    i = collection.length;
                    while (i--) {
                        // Loop down until the interted element has higher index
                        if (indexOption >=
                            pick(collection[i].options.index, collection[i]._i)) {
                            collection.splice(i + 1, 0, this);
                            break;
                        }
                    }
                    if (i === -1) {
                        collection.unshift(this);
                    }
                    i = i + 1;

                    // Or just push it to the end
                } else {
                    collection.push(this);
                }
                return pick(i, collection.length - 1);
            },

            /**
             * Set the xAxis and yAxis properties of cartesian series, and register the
             * series in the `axis.series` array.
             *
             * @function #bindAxes
             * @memberOf Series
             * @returns {void}
             */
            bindAxes: function() {
                var series = this,
                    seriesOptions = series.options,
                    chart = series.chart,
                    axisOptions;

                each(series.axisTypes || [], function(AXIS) { // repeat for xAxis and yAxis

                    each(chart[AXIS], function(axis) { // loop through the chart's axis objects
                        axisOptions = axis.options;

                        // apply if the series xAxis or yAxis option mathches the number of the
                        // axis, or if undefined, use the first axis
                        if ((seriesOptions[AXIS] === axisOptions.index) ||
                            (seriesOptions[AXIS] !== undefined && seriesOptions[AXIS] === axisOptions.id) ||
                            (seriesOptions[AXIS] === undefined && axisOptions.index === 0)) {

                            // register this series in the axis.series lookup
                            series.insert(axis.series);

                            // set this series.xAxis or series.yAxis reference
                            series[AXIS] = axis;

                            // mark dirty for redraw
                            axis.isDirty = true;
                        }
                    });

                    // The series needs an X and an Y axis
                    if (!series[AXIS] && series.optionalAxis !== AXIS) {
                        H.error(18, true);
                    }

                });
            },

            /**
             * For simple series types like line and column, the data values are held in arrays like
             * xData and yData for quick lookup to find extremes and more. For multidimensional series
             * like bubble and map, this can be extended with arrays like zData and valueData by
             * adding to the series.parallelArrays array.
             */
            updateParallelArrays: function(point, i) {
                var series = point.series,
                    args = arguments,
                    fn = isNumber(i) ?
                    // Insert the value in the given position
                    function(key) {
                        var val = key === 'y' && series.toYData ? series.toYData(point) : point[key];
                        series[key + 'Data'][i] = val;
                    } :
                    // Apply the method specified in i with the following arguments as arguments
                    function(key) {
                        Array.prototype[i].apply(series[key + 'Data'], Array.prototype.slice.call(args, 2));
                    };

                each(series.parallelArrays, fn);
            },

            /**
             * Return an auto incremented x value based on the pointStart and pointInterval options.
             * This is only used if an x value is not given for the point that calls autoIncrement.
             */
            autoIncrement: function() {

                var options = this.options,
                    xIncrement = this.xIncrement,
                    date,
                    pointInterval,
                    pointIntervalUnit = options.pointIntervalUnit;

                xIncrement = pick(xIncrement, options.pointStart, 0);

                this.pointInterval = pointInterval = pick(this.pointInterval, options.pointInterval, 1);

                // Added code for pointInterval strings
                if (pointIntervalUnit) {
                    date = new Date(xIncrement);

                    if (pointIntervalUnit === 'day') {
                        date = +date[Date.hcSetDate](date[Date.hcGetDate]() + pointInterval);
                    } else if (pointIntervalUnit === 'month') {
                        date = +date[Date.hcSetMonth](date[Date.hcGetMonth]() + pointInterval);
                    } else if (pointIntervalUnit === 'year') {
                        date = +date[Date.hcSetFullYear](date[Date.hcGetFullYear]() + pointInterval);
                    }
                    pointInterval = date - xIncrement;

                }

                this.xIncrement = xIncrement + pointInterval;
                return xIncrement;
            },

            /**
             * Set the series options by merging from the options tree
             * @param {Object} itemOptions
             */
            setOptions: function(itemOptions) {
                var chart = this.chart,
                    chartOptions = chart.options,
                    plotOptions = chartOptions.plotOptions,
                    userOptions = chart.userOptions || {},
                    userPlotOptions = userOptions.plotOptions || {},
                    typeOptions = plotOptions[this.type],
                    options,
                    zones;

                this.userOptions = itemOptions;

                // General series options take precedence over type options because otherwise, default
                // type options like column.animation would be overwritten by the general option.
                // But issues have been raised here (#3881), and the solution may be to distinguish
                // between default option and userOptions like in the tooltip below.
                options = merge(
                    typeOptions,
                    plotOptions.series,
                    itemOptions
                );

                // The tooltip options are merged between global and series specific options
                this.tooltipOptions = merge(
                    defaultOptions.tooltip,
                    defaultOptions.plotOptions[this.type].tooltip,
                    userOptions.tooltip,
                    userPlotOptions.series && userPlotOptions.series.tooltip,
                    userPlotOptions[this.type] && userPlotOptions[this.type].tooltip,
                    itemOptions.tooltip
                );

                // Delete marker object if not allowed (#1125)
                if (typeOptions.marker === null) {
                    delete options.marker;
                }

                // Handle color zones
                this.zoneAxis = options.zoneAxis;
                zones = this.zones = (options.zones || []).slice();
                if ((options.negativeColor || options.negativeFillColor) && !options.zones) {
                    zones.push({
                        value: options[this.zoneAxis + 'Threshold'] || options.threshold || 0,
                        className: 'highcharts-negative',

                        color: options.negativeColor,
                        fillColor: options.negativeFillColor

                    });
                }
                if (zones.length) { // Push one extra zone for the rest
                    if (defined(zones[zones.length - 1].value)) {
                        zones.push({

                            color: this.color,
                            fillColor: this.fillColor

                        });
                    }
                }
                return options;
            },

            getCyclic: function(prop, value, defaults) {
                var i,
                    chart = this.chart,
                    userOptions = this.userOptions,
                    indexName = prop + 'Index',
                    counterName = prop + 'Counter',
                    len = defaults ? defaults.length : pick(
                        chart.options.chart[prop + 'Count'],
                        chart[prop + 'Count']
                    ),
                    setting;

                if (!value) {
                    // Pick up either the colorIndex option, or the _colorIndex after Series.update()
                    setting = pick(userOptions[indexName], userOptions['_' + indexName]);
                    if (defined(setting)) { // after Series.update()
                        i = setting;
                    } else {
                        // #6138
                        if (!chart.series.length) {
                            chart[counterName] = 0;
                        }
                        userOptions['_' + indexName] = i = chart[counterName] % len;
                        chart[counterName] += 1;
                    }
                    if (defaults) {
                        value = defaults[i];
                    }
                }
                // Set the colorIndex
                if (i !== undefined) {
                    this[indexName] = i;
                }
                this[prop] = value;
            },

            /**
             * Get the series' color
             */

            getColor: function() {
                if (this.options.colorByPoint) {
                    this.options.color = null; // #4359, selected slice got series.color even when colorByPoint was set.
                } else {
                    this.getCyclic('color', this.options.color || defaultPlotOptions[this.type].color, this.chart.options.colors);
                }
            },

            /**
             * Get the series' symbol
             */
            getSymbol: function() {
                var seriesMarkerOption = this.options.marker;

                this.getCyclic('symbol', seriesMarkerOption.symbol, this.chart.options.symbols);
            },

            drawLegendSymbol: LegendSymbolMixin.drawLineMarker,

            /**
             * Replace the series data with a new set of data
             * @param {Object} data
             * @param {Object} redraw
             */
            setData: function(data, redraw, animation, updatePoints) {
                var series = this,
                    oldData = series.points,
                    oldDataLength = (oldData && oldData.length) || 0,
                    dataLength,
                    options = series.options,
                    chart = series.chart,
                    firstPoint = null,
                    xAxis = series.xAxis,
                    i,
                    turboThreshold = options.turboThreshold,
                    pt,
                    xData = this.xData,
                    yData = this.yData,
                    pointArrayMap = series.pointArrayMap,
                    valueCount = pointArrayMap && pointArrayMap.length;

                data = data || [];
                dataLength = data.length;
                redraw = pick(redraw, true);

                // If the point count is the same as is was, just run Point.update which is
                // cheaper, allows animation, and keeps references to points.
                if (updatePoints !== false && dataLength && oldDataLength === dataLength && !series.cropped && !series.hasGroupedData && series.visible) {
                    each(data, function(point, i) {
                        // .update doesn't exist on a linked, hidden series (#3709)
                        if (oldData[i].update && point !== options.data[i]) {
                            oldData[i].update(point, false, null, false);
                        }
                    });

                } else {

                    // Reset properties
                    series.xIncrement = null;

                    series.colorCounter = 0; // for series with colorByPoint (#1547)

                    // Update parallel arrays
                    each(this.parallelArrays, function(key) {
                        series[key + 'Data'].length = 0;
                    });

                    // In turbo mode, only one- or twodimensional arrays of numbers are allowed. The
                    // first value is tested, and we assume that all the rest are defined the same
                    // way. Although the 'for' loops are similar, they are repeated inside each
                    // if-else conditional for max performance.
                    if (turboThreshold && dataLength > turboThreshold) {

                        // find the first non-null point
                        i = 0;
                        while (firstPoint === null && i < dataLength) {
                            firstPoint = data[i];
                            i++;
                        }


                        if (isNumber(firstPoint)) { // assume all points are numbers
                            for (i = 0; i < dataLength; i++) {
                                xData[i] = this.autoIncrement();
                                yData[i] = data[i];
                            }
                        } else if (isArray(firstPoint)) { // assume all points are arrays
                            if (valueCount) { // [x, low, high] or [x, o, h, l, c]
                                for (i = 0; i < dataLength; i++) {
                                    pt = data[i];
                                    xData[i] = pt[0];
                                    yData[i] = pt.slice(1, valueCount + 1);
                                }
                            } else { // [x, y]
                                for (i = 0; i < dataLength; i++) {
                                    pt = data[i];
                                    xData[i] = pt[0];
                                    yData[i] = pt[1];
                                }
                            }
                        } else {
                            H.error(12); // Highcharts expects configs to be numbers or arrays in turbo mode
                        }
                    } else {
                        for (i = 0; i < dataLength; i++) {
                            if (data[i] !== undefined) { // stray commas in oldIE
                                pt = {
                                    series: series
                                };
                                series.pointClass.prototype.applyOptions.apply(pt, [data[i]]);
                                series.updateParallelArrays(pt, i);
                            }
                        }
                    }

                    // Forgetting to cast strings to numbers is a common caveat when handling CSV or JSON
                    if (isString(yData[0])) {
                        H.error(14, true);
                    }

                    series.data = [];
                    series.options.data = series.userOptions.data = data;

                    // destroy old points
                    i = oldDataLength;
                    while (i--) {
                        if (oldData[i] && oldData[i].destroy) {
                            oldData[i].destroy();
                        }
                    }

                    // reset minRange (#878)
                    if (xAxis) {
                        xAxis.minRange = xAxis.userMinRange;
                    }

                    // redraw
                    series.isDirty = chart.isDirtyBox = true;
                    series.isDirtyData = !!oldData;
                    animation = false;
                }

                // Typically for pie series, points need to be processed and generated
                // prior to rendering the legend
                if (options.legendType === 'point') {
                    this.processData();
                    this.generatePoints();
                }

                if (redraw) {
                    chart.redraw(animation);
                }
            },

            /**
             * Process the data by cropping away unused data points if the series is longer
             * than the crop threshold. This saves computing time for large series.
             */
            processData: function(force) {
                var series = this,
                    processedXData = series.xData, // copied during slice operation below
                    processedYData = series.yData,
                    dataLength = processedXData.length,
                    croppedData,
                    cropStart = 0,
                    cropped,
                    distance,
                    closestPointRange,
                    xAxis = series.xAxis,
                    i, // loop variable
                    options = series.options,
                    cropThreshold = options.cropThreshold,
                    getExtremesFromAll = series.getExtremesFromAll || options.getExtremesFromAll, // #4599
                    isCartesian = series.isCartesian,
                    xExtremes,
                    val2lin = xAxis && xAxis.val2lin,
                    isLog = xAxis && xAxis.isLog,
                    min,
                    max;

                // If the series data or axes haven't changed, don't go through this. Return false to pass
                // the message on to override methods like in data grouping.
                if (isCartesian && !series.isDirty && !xAxis.isDirty && !series.yAxis.isDirty && !force) {
                    return false;
                }

                if (xAxis) {
                    xExtremes = xAxis.getExtremes(); // corrected for log axis (#3053)
                    min = xExtremes.min;
                    max = xExtremes.max;
                }

                // optionally filter out points outside the plot area
                if (isCartesian && series.sorted && !getExtremesFromAll && (!cropThreshold || dataLength > cropThreshold || series.forceCrop)) {

                    // it's outside current extremes
                    if (processedXData[dataLength - 1] < min || processedXData[0] > max) {
                        processedXData = [];
                        processedYData = [];

                        // only crop if it's actually spilling out
                    } else if (processedXData[0] < min || processedXData[dataLength - 1] > max) {
                        croppedData = this.cropData(series.xData, series.yData, min, max);
                        processedXData = croppedData.xData;
                        processedYData = croppedData.yData;
                        cropStart = croppedData.start;
                        cropped = true;
                    }
                }


                // Find the closest distance between processed points
                i = processedXData.length || 1;
                while (--i) {
                    distance = isLog ?
                        val2lin(processedXData[i]) - val2lin(processedXData[i - 1]) :
                        processedXData[i] - processedXData[i - 1];

                    if (distance > 0 && (closestPointRange === undefined || distance < closestPointRange)) {
                        closestPointRange = distance;

                        // Unsorted data is not supported by the line tooltip, as well as data grouping and
                        // navigation in Stock charts (#725) and width calculation of columns (#1900)
                    } else if (distance < 0 && series.requireSorting) {
                        H.error(15);
                    }
                }

                // Record the properties
                series.cropped = cropped; // undefined or true
                series.cropStart = cropStart;
                series.processedXData = processedXData;
                series.processedYData = processedYData;

                series.closestPointRange = closestPointRange;

            },

            /**
             * Iterate over xData and crop values between min and max. Returns object containing crop start/end
             * cropped xData with corresponding part of yData, dataMin and dataMax within the cropped range
             */
            cropData: function(xData, yData, min, max) {
                var dataLength = xData.length,
                    cropStart = 0,
                    cropEnd = dataLength,
                    cropShoulder = pick(this.cropShoulder, 1), // line-type series need one point outside
                    i,
                    j;

                // iterate up to find slice start
                for (i = 0; i < dataLength; i++) {
                    if (xData[i] >= min) {
                        cropStart = Math.max(0, i - cropShoulder);
                        break;
                    }
                }

                // proceed to find slice end
                for (j = i; j < dataLength; j++) {
                    if (xData[j] > max) {
                        cropEnd = j + cropShoulder;
                        break;
                    }
                }

                return {
                    xData: xData.slice(cropStart, cropEnd),
                    yData: yData.slice(cropStart, cropEnd),
                    start: cropStart,
                    end: cropEnd
                };
            },


            /**
             * Generate the data point after the data has been processed by cropping away
             * unused points and optionally grouped in Highcharts Stock.
             */
            generatePoints: function() {
                var series = this,
                    options = series.options,
                    dataOptions = options.data,
                    data = series.data,
                    dataLength,
                    processedXData = series.processedXData,
                    processedYData = series.processedYData,
                    PointClass = series.pointClass,
                    processedDataLength = processedXData.length,
                    cropStart = series.cropStart || 0,
                    cursor,
                    hasGroupedData = series.hasGroupedData,
                    point,
                    points = [],
                    i;

                if (!data && !hasGroupedData) {
                    var arr = [];
                    arr.length = dataOptions.length;
                    data = series.data = arr;
                }

                for (i = 0; i < processedDataLength; i++) {
                    cursor = cropStart + i;
                    if (!hasGroupedData) {
                        point = data[cursor];
                        if (!point && dataOptions[cursor] !== undefined) { // #970
                            data[cursor] = point = (new PointClass()).init(series, dataOptions[cursor], processedXData[i]);
                        }
                    } else {
                        // splat the y data in case of ohlc data array
                        point = (new PointClass()).init(series, [processedXData[i]].concat(splat(processedYData[i])));
                        point.dataGroup = series.groupMap[i];
                    }
                    point.index = cursor; // For faster access in Point.update
                    points[i] = point;
                }

                // Hide cropped-away points - this only runs when the number of points is above cropThreshold, or when
                // swithching view from non-grouped data to grouped data (#637)
                if (data && (processedDataLength !== (dataLength = data.length) || hasGroupedData)) {
                    for (i = 0; i < dataLength; i++) {
                        if (i === cropStart && !hasGroupedData) { // when has grouped data, clear all points
                            i += processedDataLength;
                        }
                        if (data[i]) {
                            data[i].destroyElements();
                            data[i].plotX = undefined; // #1003
                        }
                    }
                }

                series.data = data;
                series.points = points;
            },

            /**
             * Calculate Y extremes for visible data
             */
            getExtremes: function(yData) {
                var xAxis = this.xAxis,
                    yAxis = this.yAxis,
                    xData = this.processedXData,
                    yDataLength,
                    activeYData = [],
                    activeCounter = 0,
                    xExtremes = xAxis.getExtremes(), // #2117, need to compensate for log X axis
                    xMin = xExtremes.min,
                    xMax = xExtremes.max,
                    validValue,
                    withinRange,
                    x,
                    y,
                    i,
                    j;

                yData = yData || this.stackedYData || this.processedYData || [];
                yDataLength = yData.length;

                for (i = 0; i < yDataLength; i++) {

                    x = xData[i];
                    y = yData[i];

                    // For points within the visible range, including the first point outside the
                    // visible range, consider y extremes
                    validValue = (isNumber(y, true) || isArray(y)) && (!yAxis.isLog || (y.length || y > 0));
                    withinRange = this.getExtremesFromAll || this.options.getExtremesFromAll || this.cropped ||
                        ((xData[i + 1] || x) >= xMin && (xData[i - 1] || x) <= xMax);

                    if (validValue && withinRange) {

                        j = y.length;
                        if (j) { // array, like ohlc or range data
                            while (j--) {
                                if (y[j] !== null) {
                                    activeYData[activeCounter++] = y[j];
                                }
                            }
                        } else {
                            activeYData[activeCounter++] = y;
                        }
                    }
                }
                this.dataMin = arrayMin(activeYData);
                this.dataMax = arrayMax(activeYData);
            },

            /**
             * Translate data points from raw data values to chart specific positioning
             * data needed later in drawPoints, drawGraph and drawTracker.
             *
             * @function #translate
             * @memberOf Series
             * @returns {void}
             */
            translate: function() {
                if (!this.processedXData) { // hidden series
                    this.processData();
                }
                this.generatePoints();
                var series = this,
                    options = series.options,
                    stacking = options.stacking,
                    xAxis = series.xAxis,
                    categories = xAxis.categories,
                    yAxis = series.yAxis,
                    points = series.points,
                    dataLength = points.length,
                    hasModifyValue = !!series.modifyValue,
                    i,
                    pointPlacement = options.pointPlacement,
                    dynamicallyPlaced = pointPlacement === 'between' || isNumber(pointPlacement),
                    threshold = options.threshold,
                    stackThreshold = options.startFromThreshold ? threshold : 0,
                    plotX,
                    plotY,
                    lastPlotX,
                    stackIndicator,
                    closestPointRangePx = Number.MAX_VALUE;

                // Point placement is relative to each series pointRange (#5889)
                if (pointPlacement === 'between') {
                    pointPlacement = 0.5;
                }
                if (isNumber(pointPlacement)) {
                    pointPlacement *= pick(options.pointRange || xAxis.pointRange);
                }

                // Translate each point
                for (i = 0; i < dataLength; i++) {
                    var point = points[i],
                        xValue = point.x,
                        yValue = point.y,
                        yBottom = point.low,
                        stack = stacking && yAxis.stacks[(series.negStacks && yValue < (stackThreshold ? 0 : threshold) ? '-' : '') + series.stackKey],
                        pointStack,
                        stackValues;

                    // Discard disallowed y values for log axes (#3434)
                    if (yAxis.isLog && yValue !== null && yValue <= 0) {
                        point.isNull = true;
                    }

                    // Get the plotX translation
                    point.plotX = plotX = correctFloat( // #5236
                        Math.min(Math.max(-1e5, xAxis.translate(
                            xValue,
                            0,
                            0,
                            0,
                            1,
                            pointPlacement,
                            this.type === 'flags'
                        )), 1e5) // #3923
                    );

                    // Calculate the bottom y value for stacked series
                    if (stacking && series.visible && !point.isNull && stack && stack[xValue]) {
                        stackIndicator = series.getStackIndicator(stackIndicator, xValue, series.index);
                        pointStack = stack[xValue];
                        stackValues = pointStack.points[stackIndicator.key];
                        yBottom = stackValues[0];
                        yValue = stackValues[1];

                        if (yBottom === stackThreshold && stackIndicator.key === stack[xValue].base) {
                            yBottom = pick(threshold, yAxis.min);
                        }
                        if (yAxis.isLog && yBottom <= 0) { // #1200, #1232
                            yBottom = null;
                        }

                        point.total = point.stackTotal = pointStack.total;
                        point.percentage = pointStack.total && (point.y / pointStack.total * 100);
                        point.stackY = yValue;

                        // Place the stack label
                        pointStack.setOffset(series.pointXOffset || 0, series.barW || 0);

                    }

                    // Set translated yBottom or remove it
                    point.yBottom = defined(yBottom) ?
                        yAxis.translate(yBottom, 0, 1, 0, 1) :
                        null;

                    // general hook, used for Highstock compare mode
                    if (hasModifyValue) {
                        yValue = series.modifyValue(yValue, point);
                    }

                    // Set the the plotY value, reset it for redraws
                    point.plotY = plotY = (typeof yValue === 'number' && yValue !== Infinity) ?
                        Math.min(Math.max(-1e5, yAxis.translate(yValue, 0, 1, 0, 1)), 1e5) : // #3201
                        undefined;

                    point.isInside = plotY !== undefined && plotY >= 0 && plotY <= yAxis.len && // #3519
                        plotX >= 0 && plotX <= xAxis.len;


                    // Set client related positions for mouse tracking
                    point.clientX = dynamicallyPlaced ? correctFloat(xAxis.translate(xValue, 0, 0, 0, 1, pointPlacement)) : plotX; // #1514, #5383, #5518

                    point.negative = point.y < (threshold || 0);

                    // some API data
                    point.category = categories && categories[point.x] !== undefined ?
                        categories[point.x] : point.x;

                    // Determine auto enabling of markers (#3635, #5099)
                    if (!point.isNull) {
                        if (lastPlotX !== undefined) {
                            closestPointRangePx = Math.min(closestPointRangePx, Math.abs(plotX - lastPlotX));
                        }
                        lastPlotX = plotX;
                    }

                    // Find point zone
                    point.zone = this.zones.length && point.getZone();
                }
                series.closestPointRangePx = closestPointRangePx;
            },

            /**
             * Return the series points with null points filtered out
             */
            getValidPoints: function(points, insideOnly) {
                var chart = this.chart;
                return grep(points || this.points || [], function isValidPoint(point) { // #3916, #5029
                    if (insideOnly && !chart.isInsidePlot(point.plotX, point.plotY, chart.inverted)) { // #5085
                        return false;
                    }
                    return !point.isNull;
                });
            },

            /**
             * Set the clipping for the series. For animated series it is called twice, first to initiate
             * animating the clip then the second time without the animation to set the final clip.
             */
            setClip: function(animation) {
                var chart = this.chart,
                    options = this.options,
                    renderer = chart.renderer,
                    inverted = chart.inverted,
                    seriesClipBox = this.clipBox,
                    clipBox = seriesClipBox || chart.clipBox,
                    sharedClipKey = this.sharedClipKey || ['_sharedClip', animation && animation.duration, animation && animation.easing, clipBox.height, options.xAxis, options.yAxis].join(','), // #4526
                    clipRect = chart[sharedClipKey],
                    markerClipRect = chart[sharedClipKey + 'm'];

                // If a clipping rectangle with the same properties is currently present in the chart, use that.
                if (!clipRect) {

                    // When animation is set, prepare the initial positions
                    if (animation) {
                        clipBox.width = 0;

                        chart[sharedClipKey + 'm'] = markerClipRect = renderer.clipRect(-99, // include the width of the first marker
                            inverted ? -chart.plotLeft : -chart.plotTop,
                            99,
                            inverted ? chart.chartWidth : chart.chartHeight
                        );
                    }
                    chart[sharedClipKey] = clipRect = renderer.clipRect(clipBox);
                    // Create hashmap for series indexes
                    clipRect.count = {
                        length: 0
                    };

                }
                if (animation) {
                    if (!clipRect.count[this.index]) {
                        clipRect.count[this.index] = true;
                        clipRect.count.length += 1;
                    }
                }

                if (options.clip !== false) {
                    this.group.clip(animation || seriesClipBox ? clipRect : chart.clipRect);
                    this.markerGroup.clip(markerClipRect);
                    this.sharedClipKey = sharedClipKey;
                }

                // Remove the shared clipping rectangle when all series are shown
                if (!animation) {
                    if (clipRect.count[this.index]) {
                        delete clipRect.count[this.index];
                        clipRect.count.length -= 1;
                    }

                    if (clipRect.count.length === 0 && sharedClipKey && chart[sharedClipKey]) {
                        if (!seriesClipBox) {
                            chart[sharedClipKey] = chart[sharedClipKey].destroy();
                        }
                        if (chart[sharedClipKey + 'm']) {
                            this.markerGroup.clip();
                            chart[sharedClipKey + 'm'] = chart[sharedClipKey + 'm'].destroy();
                        }
                    }
                }
            },

            /**
             * Animate in the series
             */
            animate: function(init) {
                var series = this,
                    chart = series.chart,
                    clipRect,
                    animation = animObject(series.options.animation),
                    sharedClipKey;

                // Initialize the animation. Set up the clipping rectangle.
                if (init) {

                    series.setClip(animation);

                    // Run the animation
                } else {
                    sharedClipKey = this.sharedClipKey;
                    clipRect = chart[sharedClipKey];
                    if (clipRect) {
                        clipRect.animate({
                            width: chart.plotSizeX
                        }, animation);
                    }
                    if (chart[sharedClipKey + 'm']) {
                        chart[sharedClipKey + 'm'].animate({
                            width: chart.plotSizeX + 99
                        }, animation);
                    }

                    // Delete this function to allow it only once
                    series.animate = null;

                }
            },

            /**
             * This runs after animation to land on the final plot clipping
             */
            afterAnimate: function() {
                this.setClip();
                fireEvent(this, 'afterAnimate');
            },

            /**
             * Draw the markers.
             *
             * @function #drawPoints
             * @memberOf Series
             * @returns {void}
             */
            drawPoints: function() {
                var series = this,
                    points = series.points,
                    chart = series.chart,
                    plotY,
                    i,
                    point,
                    symbol,
                    graphic,
                    options = series.options,
                    seriesMarkerOptions = options.marker,
                    pointMarkerOptions,
                    hasPointMarker,
                    enabled,
                    isInside,
                    markerGroup = series.markerGroup,
                    xAxis = series.xAxis,
                    markerAttribs,
                    globallyEnabled = pick(
                        seriesMarkerOptions.enabled,
                        xAxis.isRadial ? true : null,
                        series.closestPointRangePx > 2 * seriesMarkerOptions.radius
                    );

                if (seriesMarkerOptions.enabled !== false || series._hasPointMarkers) {

                    for (i = 0; i < points.length; i++) {
                        point = points[i];
                        plotY = point.plotY;
                        graphic = point.graphic;
                        pointMarkerOptions = point.marker || {};
                        hasPointMarker = !!point.marker;
                        enabled = (globallyEnabled && pointMarkerOptions.enabled === undefined) || pointMarkerOptions.enabled;
                        isInside = point.isInside;

                        // only draw the point if y is defined
                        if (enabled && isNumber(plotY) && point.y !== null) {

                            // Shortcuts
                            symbol = pick(pointMarkerOptions.symbol, series.symbol);
                            point.hasImage = symbol.indexOf('url') === 0;

                            markerAttribs = series.markerAttribs(
                                point,
                                point.selected && 'select'
                            );

                            if (graphic) { // update
                                graphic[isInside ? 'show' : 'hide'](true) // Since the marker group isn't clipped, each individual marker must be toggled
                                    .animate(markerAttribs);
                            } else if (isInside && (markerAttribs.width > 0 || point.hasImage)) {
                                point.graphic = graphic = chart.renderer.symbol(
                                        symbol,
                                        markerAttribs.x,
                                        markerAttribs.y,
                                        markerAttribs.width,
                                        markerAttribs.height,
                                        hasPointMarker ? pointMarkerOptions : seriesMarkerOptions
                                    )
                                    .add(markerGroup);
                            }


                            // Presentational attributes
                            if (graphic) {
                                graphic.attr(series.pointAttribs(point, point.selected && 'select'));
                            }


                            if (graphic) {
                                graphic.addClass(point.getClassName(), true);
                            }

                        } else if (graphic) {
                            point.graphic = graphic.destroy(); // #1269
                        }
                    }
                }

            },

            /**
             * Get non-presentational attributes for the point.
             */
            markerAttribs: function(point, state) {
                var seriesMarkerOptions = this.options.marker,
                    seriesStateOptions,
                    pointMarkerOptions = point.marker || {},
                    pointStateOptions,
                    radius = pick(
                        pointMarkerOptions.radius,
                        seriesMarkerOptions.radius
                    ),
                    attribs;

                // Handle hover and select states
                if (state) {
                    seriesStateOptions = seriesMarkerOptions.states[state];
                    pointStateOptions = pointMarkerOptions.states &&
                        pointMarkerOptions.states[state];

                    radius = pick(
                        pointStateOptions && pointStateOptions.radius,
                        seriesStateOptions && seriesStateOptions.radius,
                        radius + (seriesStateOptions && seriesStateOptions.radiusPlus || 0)
                    );
                }

                if (point.hasImage) {
                    radius = 0; // and subsequently width and height is not set
                }

                attribs = {
                    x: Math.floor(point.plotX) - radius, // Math.floor for #1843
                    y: point.plotY - radius
                };

                if (radius) {
                    attribs.width = attribs.height = 2 * radius;
                }

                return attribs;

            },


            /**
             * Get presentational attributes for marker-based series (line, spline, scatter, bubble, mappoint...)
             */
            pointAttribs: function(point, state) {
                var seriesMarkerOptions = this.options.marker,
                    seriesStateOptions,
                    pointOptions = point && point.options,
                    pointMarkerOptions = (pointOptions && pointOptions.marker) || {},
                    pointStateOptions,
                    color = this.color,
                    pointColorOption = pointOptions && pointOptions.color,
                    pointColor = point && point.color,
                    strokeWidth = pick(
                        pointMarkerOptions.lineWidth,
                        seriesMarkerOptions.lineWidth
                    ),
                    zoneColor = point && point.zone && point.zone.color,
                    fill,
                    stroke;

                color = pointColorOption || zoneColor || pointColor || color;
                fill = pointMarkerOptions.fillColor || seriesMarkerOptions.fillColor || color;
                stroke = pointMarkerOptions.lineColor || seriesMarkerOptions.lineColor || color;

                // Handle hover and select states
                if (state) {
                    seriesStateOptions = seriesMarkerOptions.states[state];
                    pointStateOptions = (pointMarkerOptions.states && pointMarkerOptions.states[state]) || {};
                    strokeWidth = pick(
                        pointStateOptions.lineWidth,
                        seriesStateOptions.lineWidth,
                        strokeWidth + pick(
                            pointStateOptions.lineWidthPlus,
                            seriesStateOptions.lineWidthPlus,
                            0
                        )
                    );
                    fill = pointStateOptions.fillColor || seriesStateOptions.fillColor || fill;
                    stroke = pointStateOptions.lineColor || seriesStateOptions.lineColor || stroke;
                }

                return {
                    'stroke': stroke,
                    'stroke-width': strokeWidth,
                    'fill': fill
                };
            },

            /**
             * Clear DOM objects and free up memory
             */
            destroy: function() {
                var series = this,
                    chart = series.chart,
                    issue134 = /AppleWebKit\/533/.test(win.navigator.userAgent),
                    destroy,
                    i,
                    data = series.data || [],
                    point,
                    prop,
                    axis;

                // add event hook
                fireEvent(series, 'destroy');

                // remove all events
                removeEvent(series);

                // erase from axes
                each(series.axisTypes || [], function(AXIS) {
                    axis = series[AXIS];
                    if (axis && axis.series) {
                        erase(axis.series, series);
                        axis.isDirty = axis.forceRedraw = true;
                    }
                });

                // remove legend items
                if (series.legendItem) {
                    series.chart.legend.destroyItem(series);
                }

                // destroy all points with their elements
                i = data.length;
                while (i--) {
                    point = data[i];
                    if (point && point.destroy) {
                        point.destroy();
                    }
                }
                series.points = null;

                // Clear the animation timeout if we are destroying the series during initial animation
                clearTimeout(series.animationTimeout);

                // Destroy all SVGElements associated to the series
                for (prop in series) {
                    if (series[prop] instanceof SVGElement && !series[prop].survive) { // Survive provides a hook for not destroying

                        // issue 134 workaround
                        destroy = issue134 && prop === 'group' ?
                            'hide' :
                            'destroy';

                        series[prop][destroy]();
                    }
                }

                // remove from hoverSeries
                if (chart.hoverSeries === series) {
                    chart.hoverSeries = null;
                }
                erase(chart.series, series);
                chart.orderSeries();

                // clear all members
                for (prop in series) {
                    delete series[prop];
                }
            },

            /**
             * Get the graph path
             */
            getGraphPath: function(points, nullsAsZeroes, connectCliffs) {
                var series = this,
                    options = series.options,
                    step = options.step,
                    reversed,
                    graphPath = [],
                    xMap = [],
                    gap;

                points = points || series.points;

                // Bottom of a stack is reversed
                reversed = points.reversed;
                if (reversed) {
                    points.reverse();
                }
                // Reverse the steps (#5004)
                step = {
                    right: 1,
                    center: 2
                }[step] || (step && 3);
                if (step && reversed) {
                    step = 4 - step;
                }

                // Remove invalid points, especially in spline (#5015)
                if (options.connectNulls && !nullsAsZeroes && !connectCliffs) {
                    points = this.getValidPoints(points);
                }

                // Build the line
                each(points, function(point, i) {

                    var plotX = point.plotX,
                        plotY = point.plotY,
                        lastPoint = points[i - 1],
                        pathToPoint; // the path to this point from the previous

                    if ((point.leftCliff || (lastPoint && lastPoint.rightCliff)) && !connectCliffs) {
                        gap = true; // ... and continue
                    }

                    // Line series, nullsAsZeroes is not handled
                    if (point.isNull && !defined(nullsAsZeroes) && i > 0) {
                        gap = !options.connectNulls;

                        // Area series, nullsAsZeroes is set
                    } else if (point.isNull && !nullsAsZeroes) {
                        gap = true;

                    } else {

                        if (i === 0 || gap) {
                            pathToPoint = ['M', point.plotX, point.plotY];

                        } else if (series.getPointSpline) { // generate the spline as defined in the SplineSeries object

                            pathToPoint = series.getPointSpline(points, point, i);

                        } else if (step) {

                            if (step === 1) { // right
                                pathToPoint = [
                                    'L',
                                    lastPoint.plotX,
                                    plotY
                                ];

                            } else if (step === 2) { // center
                                pathToPoint = [
                                    'L',
                                    (lastPoint.plotX + plotX) / 2,
                                    lastPoint.plotY,
                                    'L',
                                    (lastPoint.plotX + plotX) / 2,
                                    plotY
                                ];

                            } else {
                                pathToPoint = [
                                    'L',
                                    plotX,
                                    lastPoint.plotY
                                ];
                            }
                            pathToPoint.push('L', plotX, plotY);

                        } else {
                            // normal line to next point
                            pathToPoint = [
                                'L',
                                plotX,
                                plotY
                            ];
                        }

                        // Prepare for animation. When step is enabled, there are two path nodes for each x value.
                        xMap.push(point.x);
                        if (step) {
                            xMap.push(point.x);
                        }

                        graphPath.push.apply(graphPath, pathToPoint);
                        gap = false;
                    }
                });

                graphPath.xMap = xMap;
                series.graphPath = graphPath;

                return graphPath;

            },

            /**
             * Draw the actual graph
             */
            drawGraph: function() {
                var series = this,
                    options = this.options,
                    graphPath = (this.gappedPath || this.getGraphPath).call(this),
                    props = [
                        [
                            'graph',
                            'highcharts-graph',

                            options.lineColor || this.color,
                            options.dashStyle

                        ]
                    ];

                // Add the zone properties if any
                each(this.zones, function(zone, i) {
                    props.push([
                        'zone-graph-' + i,
                        'highcharts-graph highcharts-zone-graph-' + i + ' ' + (zone.className || ''),

                        zone.color || series.color,
                        zone.dashStyle || options.dashStyle

                    ]);
                });

                // Draw the graph
                each(props, function(prop, i) {
                    var graphKey = prop[0],
                        graph = series[graphKey],
                        attribs;

                    if (graph) {
                        graph.endX = graphPath.xMap;
                        graph.animate({
                            d: graphPath
                        });

                    } else if (graphPath.length) { // #1487

                        series[graphKey] = series.chart.renderer.path(graphPath)
                            .addClass(prop[1])
                            .attr({
                                zIndex: 1
                            }) // #1069
                            .add(series.group);


                        attribs = {
                            'stroke': prop[2],
                            'stroke-width': options.lineWidth,
                            'fill': (series.fillGraph && series.color) || 'none' // Polygon series use filled graph
                        };

                        if (prop[3]) {
                            attribs.dashstyle = prop[3];
                        } else if (options.linecap !== 'square') {
                            attribs['stroke-linecap'] = attribs['stroke-linejoin'] = 'round';
                        }

                        graph = series[graphKey]
                            .attr(attribs)
                            .shadow((i < 2) && options.shadow); // add shadow to normal series (0) or to first zone (1) #3932

                    }

                    // Helpers for animation
                    if (graph) {
                        graph.startX = graphPath.xMap;
                        //graph.shiftUnit = options.step ? 2 : 1;
                        graph.isArea = graphPath.isArea; // For arearange animation
                    }
                });
            },

            /**
             * Clip the graphs into the positive and negative coloured graphs
             */
            applyZones: function() {
                var series = this,
                    chart = this.chart,
                    renderer = chart.renderer,
                    zones = this.zones,
                    translatedFrom,
                    translatedTo,
                    clips = this.clips || [],
                    clipAttr,
                    graph = this.graph,
                    area = this.area,
                    chartSizeMax = Math.max(chart.chartWidth, chart.chartHeight),
                    axis = this[(this.zoneAxis || 'y') + 'Axis'],
                    extremes,
                    reversed,
                    inverted = chart.inverted,
                    horiz,
                    pxRange,
                    pxPosMin,
                    pxPosMax,
                    ignoreZones = false;

                if (zones.length && (graph || area) && axis && axis.min !== undefined) {
                    reversed = axis.reversed;
                    horiz = axis.horiz;
                    // The use of the Color Threshold assumes there are no gaps
                    // so it is safe to hide the original graph and area
                    if (graph) {
                        graph.hide();
                    }
                    if (area) {
                        area.hide();
                    }

                    // Create the clips
                    extremes = axis.getExtremes();
                    each(zones, function(threshold, i) {

                        translatedFrom = reversed ?
                            (horiz ? chart.plotWidth : 0) :
                            (horiz ? 0 : axis.toPixels(extremes.min));
                        translatedFrom = Math.min(Math.max(pick(translatedTo, translatedFrom), 0), chartSizeMax);
                        translatedTo = Math.min(Math.max(Math.round(axis.toPixels(pick(threshold.value, extremes.max), true)), 0), chartSizeMax);

                        if (ignoreZones) {
                            translatedFrom = translatedTo = axis.toPixels(extremes.max);
                        }

                        pxRange = Math.abs(translatedFrom - translatedTo);
                        pxPosMin = Math.min(translatedFrom, translatedTo);
                        pxPosMax = Math.max(translatedFrom, translatedTo);
                        if (axis.isXAxis) {
                            clipAttr = {
                                x: inverted ? pxPosMax : pxPosMin,
                                y: 0,
                                width: pxRange,
                                height: chartSizeMax
                            };
                            if (!horiz) {
                                clipAttr.x = chart.plotHeight - clipAttr.x;
                            }
                        } else {
                            clipAttr = {
                                x: 0,
                                y: inverted ? pxPosMax : pxPosMin,
                                width: chartSizeMax,
                                height: pxRange
                            };
                            if (horiz) {
                                clipAttr.y = chart.plotWidth - clipAttr.y;
                            }
                        }


                        /// VML SUPPPORT
                        if (inverted && renderer.isVML) {
                            if (axis.isXAxis) {
                                clipAttr = {
                                    x: 0,
                                    y: reversed ? pxPosMin : pxPosMax,
                                    height: clipAttr.width,
                                    width: chart.chartWidth
                                };
                            } else {
                                clipAttr = {
                                    x: clipAttr.y - chart.plotLeft - chart.spacingBox.x,
                                    y: 0,
                                    width: clipAttr.height,
                                    height: chart.chartHeight
                                };
                            }
                        }
                        /// END OF VML SUPPORT


                        if (clips[i]) {
                            clips[i].animate(clipAttr);
                        } else {
                            clips[i] = renderer.clipRect(clipAttr);

                            if (graph) {
                                series['zone-graph-' + i].clip(clips[i]);
                            }

                            if (area) {
                                series['zone-area-' + i].clip(clips[i]);
                            }
                        }
                        // if this zone extends out of the axis, ignore the others
                        ignoreZones = threshold.value > extremes.max;
                    });
                    this.clips = clips;
                }
            },

            /**
             * Initialize and perform group inversion on series.group and series.markerGroup
             */
            invertGroups: function(inverted) {
                var series = this,
                    chart = series.chart,
                    remover;

                function setInvert() {
                    each(['group', 'markerGroup'], function(groupName) {
                        if (series[groupName]) {
                            series[groupName].width = series.yAxis.len;
                            series[groupName].height = series.xAxis.len;
                            series[groupName].invert(inverted);
                        }
                    });
                }

                // Pie, go away (#1736)
                if (!series.xAxis) {
                    return;
                }

                // A fixed size is needed for inversion to work
                remover = addEvent(chart, 'resize', setInvert);
                addEvent(series, 'destroy', remover);

                // Do it now
                setInvert(inverted); // do it now

                // On subsequent render and redraw, just do setInvert without setting up events again
                series.invertGroups = setInvert;
            },

            /**
             * General abstraction for creating plot groups like series.group, series.dataLabelsGroup and
             * series.markerGroup. On subsequent calls, the group will only be adjusted to the updated plot size.
             */
            plotGroup: function(prop, name, visibility, zIndex, parent) {
                var group = this[prop],
                    isNew = !group;

                // Generate it on first call
                if (isNew) {
                    this[prop] = group = this.chart.renderer.g(name)
                        .attr({
                            zIndex: zIndex || 0.1 // IE8 and pointer logic use this
                        })
                        .add(parent);

                    group.addClass('highcharts-series-' + this.index + ' highcharts-' + this.type + '-series highcharts-color-' + this.colorIndex +
                        ' ' + (this.options.className || ''));
                }

                // Place it on first and subsequent (redraw) calls
                group.attr({
                    visibility: visibility
                })[isNew ? 'attr' : 'animate'](this.getPlotBox());
                return group;
            },

            /**
             * Get the translation and scale for the plot area of this series
             */
            getPlotBox: function() {
                var chart = this.chart,
                    xAxis = this.xAxis,
                    yAxis = this.yAxis;

                // Swap axes for inverted (#2339)
                if (chart.inverted) {
                    xAxis = yAxis;
                    yAxis = this.xAxis;
                }
                return {
                    translateX: xAxis ? xAxis.left : chart.plotLeft,
                    translateY: yAxis ? yAxis.top : chart.plotTop,
                    scaleX: 1, // #1623
                    scaleY: 1
                };
            },

            /**
             * Render the graph and markers
             */
            render: function() {
                var series = this,
                    chart = series.chart,
                    group,
                    options = series.options,
                    // Animation doesn't work in IE8 quirks when the group div is hidden,
                    // and looks bad in other oldIE
                    animDuration = !!series.animate && chart.renderer.isSVG && animObject(options.animation).duration,
                    visibility = series.visible ? 'inherit' : 'hidden', // #2597
                    zIndex = options.zIndex,
                    hasRendered = series.hasRendered,
                    chartSeriesGroup = chart.seriesGroup,
                    inverted = chart.inverted;

                // the group
                group = series.plotGroup(
                    'group',
                    'series',
                    visibility,
                    zIndex,
                    chartSeriesGroup
                );

                series.markerGroup = series.plotGroup(
                    'markerGroup',
                    'markers',
                    visibility,
                    zIndex,
                    chartSeriesGroup
                );

                // initiate the animation
                if (animDuration) {
                    series.animate(true);
                }

                // SVGRenderer needs to know this before drawing elements (#1089, #1795)
                group.inverted = series.isCartesian ? inverted : false;

                // draw the graph if any
                if (series.drawGraph) {
                    series.drawGraph();
                    series.applyZones();
                }

                /*		each(series.points, function (point) {
                			if (point.redraw) {
                				point.redraw();
                			}
                		});*/

                // draw the data labels (inn pies they go before the points)
                if (series.drawDataLabels) {
                    series.drawDataLabels();
                }

                // draw the points
                if (series.visible) {
                    series.drawPoints();
                }


                // draw the mouse tracking area
                if (series.drawTracker && series.options.enableMouseTracking !== false) {
                    series.drawTracker();
                }

                // Handle inverted series and tracker groups
                series.invertGroups(inverted);

                // Initial clipping, must be defined after inverting groups for VML. Applies to columns etc. (#3839).
                if (options.clip !== false && !series.sharedClipKey && !hasRendered) {
                    group.clip(chart.clipRect);
                }

                // Run the animation
                if (animDuration) {
                    series.animate();
                }

                // Call the afterAnimate function on animation complete (but don't overwrite the animation.complete option
                // which should be available to the user).
                if (!hasRendered) {
                    series.animationTimeout = syncTimeout(function() {
                        series.afterAnimate();
                    }, animDuration);
                }

                series.isDirty = false; // means data is in accordance with what you see
                // (See #322) series.isDirty = series.isDirtyData = false; // means data is in accordance with what you see
                series.hasRendered = true;
            },

            /**
             * Redraw the series after an update in the axes.
             */
            redraw: function() {
                var series = this,
                    chart = series.chart,
                    wasDirty = series.isDirty || series.isDirtyData, // cache it here as it is set to false in render, but used after
                    group = series.group,
                    xAxis = series.xAxis,
                    yAxis = series.yAxis;

                // reposition on resize
                if (group) {
                    if (chart.inverted) {
                        group.attr({
                            width: chart.plotWidth,
                            height: chart.plotHeight
                        });
                    }

                    group.animate({
                        translateX: pick(xAxis && xAxis.left, chart.plotLeft),
                        translateY: pick(yAxis && yAxis.top, chart.plotTop)
                    });
                }

                series.translate();
                series.render();
                if (wasDirty) { // #3868, #3945
                    delete this.kdTree;
                }
            },

            /**
             * KD Tree && PointSearching Implementation
             */

            kdDimensions: 1,
            kdAxisArray: ['clientX', 'plotY'],

            searchPoint: function(e, compareX) {
                var series = this,
                    xAxis = series.xAxis,
                    yAxis = series.yAxis,
                    inverted = series.chart.inverted;

                return this.searchKDTree({
                    clientX: inverted ? xAxis.len - e.chartY + xAxis.pos : e.chartX - xAxis.pos,
                    plotY: inverted ? yAxis.len - e.chartX + yAxis.pos : e.chartY - yAxis.pos
                }, compareX);
            },

            /**
             * Build the k-d-tree that is used by mouse and touch interaction to get the
             * closest point. Line-like series typically have a one-dimensional tree 
             * where points are searched along the X axis, while scatter-like series
             * typically search in two dimensions, X and Y.
             */
            buildKDTree: function() {

                // Prevent multiple k-d-trees from being built simultaneously (#6235)
                this.buildingKdTree = true;

                var series = this,
                    dimensions = series.kdDimensions;

                // Internal function
                function _kdtree(points, depth, dimensions) {
                    var axis,
                        median,
                        length = points && points.length;

                    if (length) {

                        // alternate between the axis
                        axis = series.kdAxisArray[depth % dimensions];

                        // sort point array
                        points.sort(function(a, b) {
                            return a[axis] - b[axis];
                        });

                        median = Math.floor(length / 2);

                        // build and return nod
                        return {
                            point: points[median],
                            left: _kdtree(points.slice(0, median), depth + 1, dimensions),
                            right: _kdtree(points.slice(median + 1), depth + 1, dimensions)
                        };

                    }
                }

                // Start the recursive build process with a clone of the points array and null points filtered out (#3873)
                function startRecursive() {
                    series.kdTree = _kdtree(
                        series.getValidPoints(
                            null, !series.directTouch // For line-type series restrict to plot area, but column-type series not (#3916, #4511)
                        ),
                        dimensions,
                        dimensions
                    );
                    series.buildingKdTree = false;
                }
                delete series.kdTree;

                // For testing tooltips, don't build async
                syncTimeout(startRecursive, series.options.kdNow ? 0 : 1);
            },

            searchKDTree: function(point, compareX) {
                var series = this,
                    kdX = this.kdAxisArray[0],
                    kdY = this.kdAxisArray[1],
                    kdComparer = compareX ? 'distX' : 'dist';

                // Set the one and two dimensional distance on the point object
                function setDistance(p1, p2) {
                    var x = (defined(p1[kdX]) && defined(p2[kdX])) ? Math.pow(p1[kdX] - p2[kdX], 2) : null,
                        y = (defined(p1[kdY]) && defined(p2[kdY])) ? Math.pow(p1[kdY] - p2[kdY], 2) : null,
                        r = (x || 0) + (y || 0);

                    p2.dist = defined(r) ? Math.sqrt(r) : Number.MAX_VALUE;
                    p2.distX = defined(x) ? Math.sqrt(x) : Number.MAX_VALUE;
                }

                function _search(search, tree, depth, dimensions) {
                    var point = tree.point,
                        axis = series.kdAxisArray[depth % dimensions],
                        tdist,
                        sideA,
                        sideB,
                        ret = point,
                        nPoint1,
                        nPoint2;

                    setDistance(search, point);

                    // Pick side based on distance to splitting point
                    tdist = search[axis] - point[axis];
                    sideA = tdist < 0 ? 'left' : 'right';
                    sideB = tdist < 0 ? 'right' : 'left';

                    // End of tree
                    if (tree[sideA]) {
                        nPoint1 = _search(search, tree[sideA], depth + 1, dimensions);

                        ret = (nPoint1[kdComparer] < ret[kdComparer] ? nPoint1 : point);
                    }
                    if (tree[sideB]) {
                        // compare distance to current best to splitting point to decide wether to check side B or not
                        if (Math.sqrt(tdist * tdist) < ret[kdComparer]) {
                            nPoint2 = _search(search, tree[sideB], depth + 1, dimensions);
                            ret = (nPoint2[kdComparer] < ret[kdComparer] ? nPoint2 : ret);
                        }
                    }

                    return ret;
                }

                if (!this.kdTree && !this.buildingKdTree) {
                    this.buildKDTree();
                }

                if (this.kdTree) {
                    return _search(point,
                        this.kdTree, this.kdDimensions, this.kdDimensions);
                }
            }

        }); // end Series prototype

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Axis = H.Axis,
            Chart = H.Chart,
            correctFloat = H.correctFloat,
            defined = H.defined,
            destroyObjectProperties = H.destroyObjectProperties,
            each = H.each,
            format = H.format,
            pick = H.pick,
            Series = H.Series;

        /**
         * The class for stacks. Each stack, on a specific X value and either negative
         * or positive, has its own stack item.
         *
         * @class
         */
        function StackItem(axis, options, isNegative, x, stackOption) {

            var inverted = axis.chart.inverted;

            this.axis = axis;

            // Tells if the stack is negative
            this.isNegative = isNegative;

            // Save the options to be able to style the label
            this.options = options;

            // Save the x value to be able to position the label later
            this.x = x;

            // Initialize total value
            this.total = null;

            // This will keep each points' extremes stored by series.index and point 
            // index
            this.points = {};

            // Save the stack option on the series configuration object, and whether to 
            // treat it as percent
            this.stack = stackOption;
            this.leftCliff = 0;
            this.rightCliff = 0;

            // The align options and text align varies on whether the stack is negative 
            // and if the chart is inverted or not.
            // First test the user supplied value, then use the dynamic.
            this.alignOptions = {
                align: options.align ||
                    (inverted ? (isNegative ? 'left' : 'right') : 'center'),
                verticalAlign: options.verticalAlign ||
                    (inverted ? 'middle' : (isNegative ? 'bottom' : 'top')),
                y: pick(options.y, inverted ? 4 : (isNegative ? 14 : -6)),
                x: pick(options.x, inverted ? (isNegative ? -6 : 6) : 0)
            };

            this.textAlign = options.textAlign ||
                (inverted ? (isNegative ? 'right' : 'left') : 'center');
        }

        StackItem.prototype = {
            destroy: function() {
                destroyObjectProperties(this, this.axis);
            },

            /**
             * Renders the stack total label and adds it to the stack label group.
             */
            render: function(group) {
                var options = this.options,
                    formatOption = options.format,
                    str = formatOption ?
                    format(formatOption, this) :
                    options.formatter.call(this); // format the text in the label

                // Change the text to reflect the new total and set visibility to hidden
                // in case the serie is hidden
                if (this.label) {
                    this.label.attr({
                        text: str,
                        visibility: 'hidden'
                    });
                    // Create new label
                } else {
                    this.label =
                        this.axis.chart.renderer.text(str, null, null, options.useHTML)
                        .css(options.style)
                        .attr({
                            align: this.textAlign,
                            rotation: options.rotation,
                            visibility: 'hidden' // hidden until setOffset is called
                        })
                        .add(group); // add to the labels-group
                }
            },

            /**
             * Sets the offset that the stack has from the x value and repositions the
             * label.
             */
            setOffset: function(xOffset, xWidth) {
                var stackItem = this,
                    axis = stackItem.axis,
                    chart = axis.chart,
                    inverted = chart.inverted,
                    reversed = axis.reversed,
                    neg = (this.isNegative && !reversed) ||
                    (!this.isNegative && reversed), // #4056
                    // stack value translated mapped to chart coordinates
                    y = axis.translate(
                        axis.usePercentage ? 100 : this.total,
                        0,
                        0,
                        0,
                        1
                    ),
                    yZero = axis.translate(0), // stack origin
                    h = Math.abs(y - yZero), // stack height
                    x = chart.xAxis[0].translate(this.x) + xOffset, // stack x position
                    plotHeight = chart.plotHeight,
                    stackBox = { // this is the box for the complete stack
                        x: inverted ? (neg ? y : y - h) : x,
                        y: inverted ?
                            plotHeight - x - xWidth : (neg ? (plotHeight - y - h) :
                                plotHeight - y),
                        width: inverted ? h : xWidth,
                        height: inverted ? xWidth : h
                    },
                    label = this.label,
                    alignAttr;

                if (label) {
                    // Align the label to the box
                    label.align(this.alignOptions, null, stackBox);

                    // Set visibility (#678)
                    alignAttr = label.alignAttr;
                    label[
                        this.options.crop === false || chart.isInsidePlot(
                            alignAttr.x,
                            alignAttr.y
                        ) ? 'show' : 'hide'](true);
                }
            }
        };

        /**
         * Generate stacks for each series and calculate stacks total values
         */
        Chart.prototype.getStacks = function() {
            var chart = this;

            // reset stacks for each yAxis
            each(chart.yAxis, function(axis) {
                if (axis.stacks && axis.hasVisibleSeries) {
                    axis.oldStacks = axis.stacks;
                }
            });

            each(chart.series, function(series) {
                if (series.options.stacking && (series.visible === true ||
                        chart.options.chart.ignoreHiddenSeries === false)) {
                    series.stackKey = series.type + pick(series.options.stack, '');
                }
            });
        };


        // Stacking methods defined on the Axis prototype

        /**
         * Build the stacks from top down
         */
        Axis.prototype.buildStacks = function() {
            var axisSeries = this.series,
                series,
                reversedStacks = pick(this.options.reversedStacks, true),
                len = axisSeries.length,
                i;
            if (!this.isXAxis) {
                this.usePercentage = false;
                i = len;
                while (i--) {
                    axisSeries[reversedStacks ? i : len - i - 1].setStackedPoints();
                }

                i = len;
                while (i--) {
                    series = axisSeries[reversedStacks ? i : len - i - 1];
                    if (series.setStackCliffs) {
                        series.setStackCliffs();
                    }
                }
                // Loop up again to compute percent stack
                if (this.usePercentage) {
                    for (i = 0; i < len; i++) {
                        axisSeries[i].setPercentStacks();
                    }
                }
            }
        };

        Axis.prototype.renderStackTotals = function() {
            var axis = this,
                chart = axis.chart,
                renderer = chart.renderer,
                stacks = axis.stacks,
                stackKey,
                oneStack,
                stackCategory,
                stackTotalGroup = axis.stackTotalGroup;

            // Create a separate group for the stack total labels
            if (!stackTotalGroup) {
                axis.stackTotalGroup = stackTotalGroup =
                    renderer.g('stack-labels')
                    .attr({
                        visibility: 'visible',
                        zIndex: 6
                    })
                    .add();
            }

            // plotLeft/Top will change when y axis gets wider so we need to translate
            // the stackTotalGroup at every render call. See bug #506 and #516
            stackTotalGroup.translate(chart.plotLeft, chart.plotTop);

            // Render each stack total
            for (stackKey in stacks) {
                oneStack = stacks[stackKey];
                for (stackCategory in oneStack) {
                    oneStack[stackCategory].render(stackTotalGroup);
                }
            }
        };

        /**
         * Set all the stacks to initial states and destroy unused ones.
         */
        Axis.prototype.resetStacks = function() {
            var stacks = this.stacks,
                type,
                i;
            if (!this.isXAxis) {
                for (type in stacks) {
                    for (i in stacks[type]) {

                        // Clean up memory after point deletion (#1044, #4320)
                        if (stacks[type][i].touched < this.stacksTouched) {
                            stacks[type][i].destroy();
                            delete stacks[type][i];

                            // Reset stacks
                        } else {
                            stacks[type][i].total = null;
                            stacks[type][i].cum = null;
                        }
                    }
                }
            }
        };

        Axis.prototype.cleanStacks = function() {
            var stacks, type, i;

            if (!this.isXAxis) {
                if (this.oldStacks) {
                    stacks = this.stacks = this.oldStacks;
                }

                // reset stacks
                for (type in stacks) {
                    for (i in stacks[type]) {
                        stacks[type][i].cum = stacks[type][i].total;
                    }
                }
            }
        };


        // Stacking methods defnied for Series prototype

        /**
         * Adds series' points value to corresponding stack
         */
        Series.prototype.setStackedPoints = function() {
            if (!this.options.stacking || (this.visible !== true &&
                    this.chart.options.chart.ignoreHiddenSeries !== false)) {
                return;
            }

            var series = this,
                xData = series.processedXData,
                yData = series.processedYData,
                stackedYData = [],
                yDataLength = yData.length,
                seriesOptions = series.options,
                threshold = seriesOptions.threshold,
                stackThreshold = seriesOptions.startFromThreshold ? threshold : 0,
                stackOption = seriesOptions.stack,
                stacking = seriesOptions.stacking,
                stackKey = series.stackKey,
                negKey = '-' + stackKey,
                negStacks = series.negStacks,
                yAxis = series.yAxis,
                stacks = yAxis.stacks,
                oldStacks = yAxis.oldStacks,
                stackIndicator,
                isNegative,
                stack,
                other,
                key,
                pointKey,
                i,
                x,
                y;


            yAxis.stacksTouched += 1;

            // loop over the non-null y values and read them into a local array
            for (i = 0; i < yDataLength; i++) {
                x = xData[i];
                y = yData[i];
                stackIndicator = series.getStackIndicator(
                    stackIndicator,
                    x,
                    series.index
                );
                pointKey = stackIndicator.key;
                // Read stacked values into a stack based on the x value,
                // the sign of y and the stack key. Stacking is also handled for null
                // values (#739)
                isNegative = negStacks && y < (stackThreshold ? 0 : threshold);
                key = isNegative ? negKey : stackKey;

                // Create empty object for this stack if it doesn't exist yet
                if (!stacks[key]) {
                    stacks[key] = {};
                }

                // Initialize StackItem for this x
                if (!stacks[key][x]) {
                    if (oldStacks[key] && oldStacks[key][x]) {
                        stacks[key][x] = oldStacks[key][x];
                        stacks[key][x].total = null;
                    } else {
                        stacks[key][x] = new StackItem(
                            yAxis,
                            yAxis.options.stackLabels,
                            isNegative,
                            x,
                            stackOption
                        );
                    }
                }

                // If the StackItem doesn't exist, create it first
                stack = stacks[key][x];
                if (y !== null) {
                    stack.points[pointKey] = stack.points[series.index] = [pick(stack.cum, stackThreshold)];

                    // Record the base of the stack
                    if (!defined(stack.cum)) {
                        stack.base = pointKey;
                    }
                    stack.touched = yAxis.stacksTouched;


                    // In area charts, if there are multiple points on the same X value,
                    // let the area fill the full span of those points
                    if (stackIndicator.index > 0 && series.singleStacks === false) {
                        stack.points[pointKey][0] =
                            stack.points[series.index + ',' + x + ',0'][0];
                    }
                }

                // Add value to the stack total
                if (stacking === 'percent') {

                    // Percent stacked column, totals are the same for the positive and
                    // negative stacks
                    other = isNegative ? stackKey : negKey;
                    if (negStacks && stacks[other] && stacks[other][x]) {
                        other = stacks[other][x];
                        stack.total = other.total =
                            Math.max(other.total, stack.total) + Math.abs(y) || 0;

                        // Percent stacked areas
                    } else {
                        stack.total = correctFloat(stack.total + (Math.abs(y) || 0));
                    }
                } else {
                    stack.total = correctFloat(stack.total + (y || 0));
                }

                stack.cum = pick(stack.cum, stackThreshold) + (y || 0);

                if (y !== null) {
                    stack.points[pointKey].push(stack.cum);
                    stackedYData[i] = stack.cum;
                }

            }

            if (stacking === 'percent') {
                yAxis.usePercentage = true;
            }

            this.stackedYData = stackedYData; // To be used in getExtremes

            // Reset old stacks
            yAxis.oldStacks = {};
        };

        /**
         * Iterate over all stacks and compute the absolute values to percent
         */
        Series.prototype.setPercentStacks = function() {
            var series = this,
                stackKey = series.stackKey,
                stacks = series.yAxis.stacks,
                processedXData = series.processedXData,
                stackIndicator;

            each([stackKey, '-' + stackKey], function(key) {
                var i = processedXData.length,
                    x,
                    stack,
                    pointExtremes,
                    totalFactor;

                while (i--) {
                    x = processedXData[i];
                    stackIndicator = series.getStackIndicator(
                        stackIndicator,
                        x,
                        series.index,
                        key
                    );
                    stack = stacks[key] && stacks[key][x];
                    pointExtremes = stack && stack.points[stackIndicator.key];
                    if (pointExtremes) {
                        totalFactor = stack.total ? 100 / stack.total : 0;
                        // Y bottom value
                        pointExtremes[0] = correctFloat(pointExtremes[0] * totalFactor);
                        // Y value
                        pointExtremes[1] = correctFloat(pointExtremes[1] * totalFactor);
                        series.stackedYData[i] = pointExtremes[1];
                    }
                }
            });
        };

        /**
         * Get stack indicator, according to it's x-value, to determine points with the
         * same x-value
         */
        Series.prototype.getStackIndicator = function(stackIndicator, x, index, key) {
            // Update stack indicator, when:
            // first point in a stack || x changed || stack type (negative vs positive)
            // changed:
            if (!defined(stackIndicator) || stackIndicator.x !== x ||
                (key && stackIndicator.key !== key)) {
                stackIndicator = {
                    x: x,
                    index: 0,
                    key: key
                };
            } else {
                stackIndicator.index++;
            }

            stackIndicator.key = [index, x, stackIndicator.index].join(',');

            return stackIndicator;
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            animate = H.animate,
            Axis = H.Axis,
            Chart = H.Chart,
            createElement = H.createElement,
            css = H.css,
            defined = H.defined,
            each = H.each,
            erase = H.erase,
            extend = H.extend,
            fireEvent = H.fireEvent,
            inArray = H.inArray,
            isNumber = H.isNumber,
            isObject = H.isObject,
            merge = H.merge,
            pick = H.pick,
            Point = H.Point,
            Series = H.Series,
            seriesTypes = H.seriesTypes,
            setAnimation = H.setAnimation,
            splat = H.splat;

        // Extend the Chart prototype for dynamic methods
        extend(Chart.prototype, /** @lends Highcharts.Chart.prototype */ {

            /**
             * Add a series dynamically after  time
             *
             * @param {Object} options The config options
             * @param {Boolean} redraw Whether to redraw the chart after adding. Defaults to true.
             * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
             *    configuration
             *
             * @return {Object} series The newly created series object
             */
            addSeries: function(options, redraw, animation) {
                var series,
                    chart = this;

                if (options) {
                    redraw = pick(redraw, true); // defaults to true

                    fireEvent(chart, 'addSeries', {
                        options: options
                    }, function() {
                        series = chart.initSeries(options);

                        chart.isDirtyLegend = true; // the series array is out of sync with the display
                        chart.linkSeries();
                        if (redraw) {
                            chart.redraw(animation);
                        }
                    });
                }

                return series;
            },

            /**
             * Add an axis to the chart
             * @param {Object} options The axis option
             * @param {Boolean} isX Whether it is an X axis or a value axis
             */
            addAxis: function(options, isX, redraw, animation) {
                var key = isX ? 'xAxis' : 'yAxis',
                    chartOptions = this.options,
                    userOptions = merge(options, {
                        index: this[key].length,
                        isX: isX
                    });

                new Axis(this, userOptions); // eslint-disable-line no-new

                // Push the new axis options to the chart options
                chartOptions[key] = splat(chartOptions[key] || {});
                chartOptions[key].push(userOptions);

                if (pick(redraw, true)) {
                    this.redraw(animation);
                }
            },

            /**
             * Dim the chart and show a loading text or symbol
             * @param {String} str An optional text to show in the loading label instead of the default one
             */
            showLoading: function(str) {
                var chart = this,
                    options = chart.options,
                    loadingDiv = chart.loadingDiv,
                    loadingOptions = options.loading,
                    setLoadingSize = function() {
                        if (loadingDiv) {
                            css(loadingDiv, {
                                left: chart.plotLeft + 'px',
                                top: chart.plotTop + 'px',
                                width: chart.plotWidth + 'px',
                                height: chart.plotHeight + 'px'
                            });
                        }
                    };

                // create the layer at the first call
                if (!loadingDiv) {
                    chart.loadingDiv = loadingDiv = createElement('div', {
                        className: 'highcharts-loading highcharts-loading-hidden'
                    }, null, chart.container);

                    chart.loadingSpan = createElement(
                        'span', {
                            className: 'highcharts-loading-inner'
                        },
                        null,
                        loadingDiv
                    );
                    addEvent(chart, 'redraw', setLoadingSize); // #1080
                }

                loadingDiv.className = 'highcharts-loading';

                // Update text
                chart.loadingSpan.innerHTML = str || options.lang.loading;


                // Update visuals
                css(loadingDiv, extend(loadingOptions.style, {
                    zIndex: 10
                }));
                css(chart.loadingSpan, loadingOptions.labelStyle);

                // Show it
                if (!chart.loadingShown) {
                    css(loadingDiv, {
                        opacity: 0,
                        display: ''
                    });
                    animate(loadingDiv, {
                        opacity: loadingOptions.style.opacity || 0.5
                    }, {
                        duration: loadingOptions.showDuration || 0
                    });
                }


                chart.loadingShown = true;
                setLoadingSize();
            },

            /**
             * Hide the loading layer
             */
            hideLoading: function() {
                var options = this.options,
                    loadingDiv = this.loadingDiv;

                if (loadingDiv) {
                    loadingDiv.className = 'highcharts-loading highcharts-loading-hidden';

                    animate(loadingDiv, {
                        opacity: 0
                    }, {
                        duration: options.loading.hideDuration || 100,
                        complete: function() {
                            css(loadingDiv, {
                                display: 'none'
                            });
                        }
                    });

                }
                this.loadingShown = false;
            },

            /** 
             * These properties cause isDirtyBox to be set to true when updating. Can be extended from plugins.
             */
            propsRequireDirtyBox: ['backgroundColor', 'borderColor', 'borderWidth', 'margin', 'marginTop', 'marginRight',
                'marginBottom', 'marginLeft', 'spacing', 'spacingTop', 'spacingRight', 'spacingBottom', 'spacingLeft',
                'borderRadius', 'plotBackgroundColor', 'plotBackgroundImage', 'plotBorderColor', 'plotBorderWidth',
                'plotShadow', 'shadow'
            ],

            /** 
             * These properties cause all series to be updated when updating. Can be
             * extended from plugins.
             */
            propsRequireUpdateSeries: ['chart.inverted', 'chart.polar',
                'chart.ignoreHiddenSeries', 'chart.type', 'colors', 'plotOptions'
            ],

            /**
             * Chart.update function that takes the whole options stucture.
             */
            update: function(options, redraw) {
                var key,
                    adders = {
                        credits: 'addCredits',
                        title: 'setTitle',
                        subtitle: 'setSubtitle'
                    },
                    optionsChart = options.chart,
                    updateAllAxes,
                    updateAllSeries,
                    newWidth,
                    newHeight;

                // If the top-level chart option is present, some special updates are required		
                if (optionsChart) {
                    merge(true, this.options.chart, optionsChart);

                    // Setter function
                    if ('className' in optionsChart) {
                        this.setClassName(optionsChart.className);
                    }

                    if ('inverted' in optionsChart || 'polar' in optionsChart) {
                        this.propFromSeries(); // Parses options.chart.inverted and options.chart.polar together with the available series
                        updateAllAxes = true;
                    }

                    for (key in optionsChart) {
                        if (optionsChart.hasOwnProperty(key)) {
                            if (inArray('chart.' + key, this.propsRequireUpdateSeries) !== -1) {
                                updateAllSeries = true;
                            }
                            // Only dirty box
                            if (inArray(key, this.propsRequireDirtyBox) !== -1) {
                                this.isDirtyBox = true;
                            }

                        }
                    }


                    if ('style' in optionsChart) {
                        this.renderer.setStyle(optionsChart.style);
                    }

                }

                // Some option stuctures correspond one-to-one to chart objects that have
                // update methods, for example
                // options.credits => chart.credits
                // options.legend => chart.legend
                // options.title => chart.title
                // options.tooltip => chart.tooltip
                // options.subtitle => chart.subtitle
                // options.navigator => chart.navigator
                // options.scrollbar => chart.scrollbar
                for (key in options) {
                    if (this[key] && typeof this[key].update === 'function') {
                        this[key].update(options[key], false);

                        // If a one-to-one object does not exist, look for an adder function
                    } else if (typeof this[adders[key]] === 'function') {
                        this[adders[key]](options[key]);
                    }

                    if (key !== 'chart' && inArray(key, this.propsRequireUpdateSeries) !== -1) {
                        updateAllSeries = true;
                    }
                }


                if (options.colors) {
                    this.options.colors = options.colors;
                }


                if (options.plotOptions) {
                    merge(true, this.options.plotOptions, options.plotOptions);
                }

                // Setters for collections. For axes and series, each item is referred
                // by an id. If the id is not found, it defaults to the corresponding
                // item in the collection, so setting one series without an id, will
                // update the first series in the chart. Setting two series without
                // an id will update the first and the second respectively (#6019)
                // // docs: New behaviour for unidentified items, add it to docs for 
                // chart.update and responsive.
                each(['xAxis', 'yAxis', 'series'], function(coll) {
                    if (options[coll]) {
                        each(splat(options[coll]), function(newOptions, i) {
                            var item = (
                                defined(newOptions.id) &&
                                this.get(newOptions.id)
                            ) || this[coll][i];
                            if (item && item.coll === coll) {
                                item.update(newOptions, false);
                            }
                        }, this);
                    }
                }, this);

                if (updateAllAxes) {
                    each(this.axes, function(axis) {
                        axis.update({}, false);
                    });
                }

                // Certain options require the whole series structure to be thrown away
                // and rebuilt
                if (updateAllSeries) {
                    each(this.series, function(series) {
                        series.update({}, false);
                    });
                }

                // For loading, just update the options, do not redraw
                if (options.loading) {
                    merge(true, this.options.loading, options.loading);
                }

                // Update size. Redraw is forced.
                newWidth = optionsChart && optionsChart.width;
                newHeight = optionsChart && optionsChart.height;
                if ((isNumber(newWidth) && newWidth !== this.chartWidth) ||
                    (isNumber(newHeight) && newHeight !== this.chartHeight)) {
                    this.setSize(newWidth, newHeight);
                } else if (pick(redraw, true)) {
                    this.redraw();
                }
            },

            /**
             * Setter function to allow use from chart.update
             */
            setSubtitle: function(options) {
                this.setTitle(undefined, options);
            }


        });

        // extend the Point prototype for dynamic methods
        extend(Point.prototype, /** @lends Point.prototype */ {
            /**
             * Point.update with new options (typically x/y data) and optionally redraw the series.
             *
             * @param {Object} options Point options as defined in the series.data array
             * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
             * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
             *    configuration
             */
            update: function(options, redraw, animation, runEvent) {
                var point = this,
                    series = point.series,
                    graphic = point.graphic,
                    i,
                    chart = series.chart,
                    seriesOptions = series.options;

                redraw = pick(redraw, true);

                function update() {

                    point.applyOptions(options);

                    // Update visuals
                    if (point.y === null && graphic) { // #4146
                        point.graphic = graphic.destroy();
                    }
                    if (isObject(options, true)) {
                        // Destroy so we can get new elements
                        if (graphic && graphic.element) {
                            if (options && options.marker && options.marker.symbol) {
                                point.graphic = graphic.destroy();
                            }
                        }
                        if (options && options.dataLabels && point.dataLabel) { // #2468
                            point.dataLabel = point.dataLabel.destroy();
                        }
                    }

                    // record changes in the parallel arrays
                    i = point.index;
                    series.updateParallelArrays(point, i);

                    // Record the options to options.data. If there is an object from before,
                    // use point options, otherwise use raw options. (#4701)
                    seriesOptions.data[i] = isObject(seriesOptions.data[i], true) ? point.options : options;

                    // redraw
                    series.isDirty = series.isDirtyData = true;
                    if (!series.fixedBox && series.hasCartesianSeries) { // #1906, #2320
                        chart.isDirtyBox = true;
                    }

                    if (seriesOptions.legendType === 'point') { // #1831, #1885
                        chart.isDirtyLegend = true;
                    }
                    if (redraw) {
                        chart.redraw(animation);
                    }
                }

                // Fire the event with a default handler of doing the update
                if (runEvent === false) { // When called from setData
                    update();
                } else {
                    point.firePointEvent('update', {
                        options: options
                    }, update);
                }
            },

            /**
             * Remove a point and optionally redraw the series and if necessary the axes
             * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
             * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
             *    configuration
             */
            remove: function(redraw, animation) {
                this.series.removePoint(inArray(this, this.series.data), redraw, animation);
            }
        });

        // Extend the series prototype for dynamic methods
        extend(Series.prototype, /** @lends Series.prototype */ {
            /**
             * Add a point dynamically after chart load time
             * @param {Object} options Point options as given in series.data
             * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
             * @param {Boolean} shift If shift is true, a point is shifted off the start
             *    of the series as one is appended to the end.
             * @param {Boolean|AnimationOptions} animation Whether to apply animation, and optionally animation
             *    configuration
             */
            addPoint: function(options, redraw, shift, animation) {
                var series = this,
                    seriesOptions = series.options,
                    data = series.data,
                    chart = series.chart,
                    xAxis = series.xAxis,
                    names = xAxis && xAxis.hasNames && xAxis.names,
                    dataOptions = seriesOptions.data,
                    point,
                    isInTheMiddle,
                    xData = series.xData,
                    i,
                    x;

                // Optional redraw, defaults to true
                redraw = pick(redraw, true);

                // Get options and push the point to xData, yData and series.options. In series.generatePoints
                // the Point instance will be created on demand and pushed to the series.data array.
                point = {
                    series: series
                };
                series.pointClass.prototype.applyOptions.apply(point, [options]);
                x = point.x;

                // Get the insertion point
                i = xData.length;
                if (series.requireSorting && x < xData[i - 1]) {
                    isInTheMiddle = true;
                    while (i && xData[i - 1] > x) {
                        i--;
                    }
                }

                series.updateParallelArrays(point, 'splice', i, 0, 0); // insert undefined item
                series.updateParallelArrays(point, i); // update it

                if (names && point.name) {
                    names[x] = point.name;
                }
                dataOptions.splice(i, 0, options);

                if (isInTheMiddle) {
                    series.data.splice(i, 0, null);
                    series.processData();
                }

                // Generate points to be added to the legend (#1329)
                if (seriesOptions.legendType === 'point') {
                    series.generatePoints();
                }

                // Shift the first point off the parallel arrays
                if (shift) {
                    if (data[0] && data[0].remove) {
                        data[0].remove(false);
                    } else {
                        data.shift();
                        series.updateParallelArrays(point, 'shift');

                        dataOptions.shift();
                    }
                }

                // redraw
                series.isDirty = true;
                series.isDirtyData = true;

                if (redraw) {
                    chart.redraw(animation); // Animation is set anyway on redraw, #5665
                }
            },

            /**
             * Remove a point (rendered or not), by index
             */
            removePoint: function(i, redraw, animation) {

                var series = this,
                    data = series.data,
                    point = data[i],
                    points = series.points,
                    chart = series.chart,
                    remove = function() {

                        if (points && points.length === data.length) { // #4935
                            points.splice(i, 1);
                        }
                        data.splice(i, 1);
                        series.options.data.splice(i, 1);
                        series.updateParallelArrays(point || {
                            series: series
                        }, 'splice', i, 1);

                        if (point) {
                            point.destroy();
                        }

                        // redraw
                        series.isDirty = true;
                        series.isDirtyData = true;
                        if (redraw) {
                            chart.redraw();
                        }
                    };

                setAnimation(animation, chart);
                redraw = pick(redraw, true);

                // Fire the event with a default handler of removing the point
                if (point) {
                    point.firePointEvent('remove', null, remove);
                } else {
                    remove();
                }
            },

            /**
             * Remove a series and optionally redraw the chart
             *
             * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
             * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
             *    configuration
             */
            remove: function(redraw, animation, withEvent) {
                var series = this,
                    chart = series.chart;

                function remove() {

                    // Destroy elements
                    series.destroy();

                    // Redraw
                    chart.isDirtyLegend = chart.isDirtyBox = true;
                    chart.linkSeries();

                    if (pick(redraw, true)) {
                        chart.redraw(animation);
                    }
                }

                // Fire the event with a default handler of removing the point
                if (withEvent !== false) {
                    fireEvent(series, 'remove', null, remove);
                } else {
                    remove();
                }
            },

            /**
             * Series.update with a new set of options
             */
            update: function(newOptions, redraw) {
                var series = this,
                    chart = this.chart,
                    // must use user options when changing type because this.options is merged
                    // in with type specific plotOptions
                    oldOptions = this.userOptions,
                    oldType = this.type,
                    newType = newOptions.type || oldOptions.type || chart.options.chart.type,
                    proto = seriesTypes[oldType].prototype,
                    preserve = ['group', 'markerGroup', 'dataLabelsGroup'],
                    n;

                // If we're changing type or zIndex, create new groups (#3380, #3404)
                if ((newType && newType !== oldType) || newOptions.zIndex !== undefined) {
                    preserve.length = 0;
                }

                // Make sure groups are not destroyed (#3094)
                each(preserve, function(prop) {
                    preserve[prop] = series[prop];
                    delete series[prop];
                });

                // Do the merge, with some forced options
                newOptions = merge(oldOptions, {
                    animation: false,
                    index: this.index,
                    pointStart: this.xData[0] // when updating after addPoint
                }, {
                    data: this.options.data
                }, newOptions);

                // Destroy the series and delete all properties. Reinsert all methods
                // and properties from the new type prototype (#2270, #3719)
                this.remove(false, null, false);
                for (n in proto) {
                    this[n] = undefined;
                }
                extend(this, seriesTypes[newType || oldType].prototype);

                // Re-register groups (#3094)
                each(preserve, function(prop) {
                    series[prop] = preserve[prop];
                });

                this.init(chart, newOptions);
                chart.linkSeries(); // Links are lost in this.remove (#3028)
                if (pick(redraw, true)) {
                    chart.redraw(false);
                }
            }
        });

        // Extend the Axis.prototype for dynamic methods
        extend(Axis.prototype, /** @lends Axis.prototype */ {

            /**
             * Axis.update with a new options structure
             */
            update: function(newOptions, redraw) {
                var chart = this.chart;

                newOptions = chart.options[this.coll][this.options.index] = merge(this.userOptions, newOptions);

                this.destroy(true);

                this.init(chart, extend(newOptions, {
                    events: undefined
                }));

                chart.isDirtyBox = true;
                if (pick(redraw, true)) {
                    chart.redraw();
                }
            },

            /**
             * Remove the axis from the chart
             */
            remove: function(redraw) {
                var chart = this.chart,
                    key = this.coll, // xAxis or yAxis
                    axisSeries = this.series,
                    i = axisSeries.length;

                // Remove associated series (#2687)
                while (i--) {
                    if (axisSeries[i]) {
                        axisSeries[i].remove(false);
                    }
                }

                // Remove the axis
                erase(chart.axes, this);
                erase(chart[key], this);
                chart.options[key].splice(this.options.index, 1);
                each(chart[key], function(axis, i) { // Re-index, #1706
                    axis.options.index = i;
                });
                this.destroy();
                chart.isDirtyBox = true;

                if (pick(redraw, true)) {
                    chart.redraw();
                }
            },

            /**
             * Update the axis title by options
             */
            setTitle: function(newTitleOptions, redraw) {
                this.update({
                    title: newTitleOptions
                }, redraw);
            },

            /**
             * Set new axis categories and optionally redraw
             * @param {Array} categories
             * @param {Boolean} redraw
             */
            setCategories: function(categories, redraw) {
                this.update({
                    categories: categories
                }, redraw);
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
        var color = H.color,
            each = H.each,
            LegendSymbolMixin = H.LegendSymbolMixin,
            map = H.map,
            pick = H.pick,
            Series = H.Series,
            seriesType = H.seriesType;

        /**
         * Area series type.
         * @constructor seriesTypes.area
         * @extends {Series}
         */
        seriesType('area', 'line', {
            softThreshold: false,
            threshold: 0
                // trackByArea: false,
                // lineColor: null, // overrides color, but lets fillColor be unaltered
                // fillOpacity: 0.75,
                // fillColor: null
        }, /** @lends seriesTypes.area.prototype */ {
            singleStacks: false,
            /** 
             * Return an array of stacked points, where null and missing points are replaced by 
             * dummy points in order for gaps to be drawn correctly in stacks.
             */
            getStackPoints: function() {
                var series = this,
                    segment = [],
                    keys = [],
                    xAxis = this.xAxis,
                    yAxis = this.yAxis,
                    stack = yAxis.stacks[this.stackKey],
                    pointMap = {},
                    points = this.points,
                    seriesIndex = series.index,
                    yAxisSeries = yAxis.series,
                    seriesLength = yAxisSeries.length,
                    visibleSeries,
                    upOrDown = pick(yAxis.options.reversedStacks, true) ? 1 : -1,
                    i,
                    x;

                if (this.options.stacking) {
                    // Create a map where we can quickly look up the points by their X value.
                    for (i = 0; i < points.length; i++) {
                        pointMap[points[i].x] = points[i];
                    }

                    // Sort the keys (#1651)
                    for (x in stack) {
                        if (stack[x].total !== null) { // nulled after switching between grouping and not (#1651, #2336)
                            keys.push(x);
                        }
                    }
                    keys.sort(function(a, b) {
                        return a - b;
                    });

                    visibleSeries = map(yAxisSeries, function() {
                        return this.visible;
                    });

                    each(keys, function(x, idx) {
                        var y = 0,
                            stackPoint,
                            stackedValues;

                        if (pointMap[x] && !pointMap[x].isNull) {
                            segment.push(pointMap[x]);

                            // Find left and right cliff. -1 goes left, 1 goes right.
                            each([-1, 1], function(direction) {
                                var nullName = direction === 1 ? 'rightNull' : 'leftNull',
                                    cliffName = direction === 1 ? 'rightCliff' : 'leftCliff',
                                    cliff = 0,
                                    otherStack = stack[keys[idx + direction]];

                                // If there is a stack next to this one, to the left or to the right...
                                if (otherStack) {
                                    i = seriesIndex;
                                    while (i >= 0 && i < seriesLength) { // Can go either up or down, depending on reversedStacks
                                        stackPoint = otherStack.points[i];
                                        if (!stackPoint) {
                                            // If the next point in this series is missing, mark the point
                                            // with point.leftNull or point.rightNull = true.
                                            if (i === seriesIndex) {
                                                pointMap[x][nullName] = true;

                                                // If there are missing points in the next stack in any of the 
                                                // series below this one, we need to substract the missing values
                                                // and add a hiatus to the left or right.
                                            } else if (visibleSeries[i]) {
                                                stackedValues = stack[x].points[i];
                                                if (stackedValues) {
                                                    cliff -= stackedValues[1] - stackedValues[0];
                                                }
                                            }
                                        }
                                        // When reversedStacks is true, loop up, else loop down
                                        i += upOrDown;
                                    }
                                }
                                pointMap[x][cliffName] = cliff;
                            });


                            // There is no point for this X value in this series, so we 
                            // insert a dummy point in order for the areas to be drawn
                            // correctly.
                        } else {

                            // Loop down the stack to find the series below this one that has
                            // a value (#1991)
                            i = seriesIndex;
                            while (i >= 0 && i < seriesLength) {
                                stackPoint = stack[x].points[i];
                                if (stackPoint) {
                                    y = stackPoint[1];
                                    break;
                                }
                                // When reversedStacks is true, loop up, else loop down
                                i += upOrDown;
                            }

                            y = yAxis.toPixels(y, true);
                            segment.push({
                                isNull: true,
                                plotX: xAxis.toPixels(x, true),
                                plotY: y,
                                yBottom: y
                            });
                        }
                    });

                }

                return segment;
            },

            getGraphPath: function(points) {
                var getGraphPath = Series.prototype.getGraphPath,
                    graphPath,
                    options = this.options,
                    stacking = options.stacking,
                    yAxis = this.yAxis,
                    topPath,
                    //topPoints = [],
                    bottomPath,
                    bottomPoints = [],
                    graphPoints = [],
                    seriesIndex = this.index,
                    i,
                    areaPath,
                    plotX,
                    stacks = yAxis.stacks[this.stackKey],
                    threshold = options.threshold,
                    translatedThreshold = yAxis.getThreshold(options.threshold),
                    isNull,
                    yBottom,
                    connectNulls = options.connectNulls || stacking === 'percent',
                    /**
                     * To display null points in underlying stacked series, this series graph must be 
                     * broken, and the area also fall down to fill the gap left by the null point. #2069
                     */
                    addDummyPoints = function(i, otherI, side) {
                        var point = points[i],
                            stackedValues = stacking && stacks[point.x].points[seriesIndex],
                            nullVal = point[side + 'Null'] || 0,
                            cliffVal = point[side + 'Cliff'] || 0,
                            top,
                            bottom,
                            isNull = true;

                        if (cliffVal || nullVal) {

                            top = (nullVal ? stackedValues[0] : stackedValues[1]) + cliffVal;
                            bottom = stackedValues[0] + cliffVal;
                            isNull = !!nullVal;

                        } else if (!stacking && points[otherI] && points[otherI].isNull) {
                            top = bottom = threshold;
                        }

                        // Add to the top and bottom line of the area
                        if (top !== undefined) {
                            graphPoints.push({
                                plotX: plotX,
                                plotY: top === null ? translatedThreshold : yAxis.getThreshold(top),
                                isNull: isNull
                            });
                            bottomPoints.push({
                                plotX: plotX,
                                plotY: bottom === null ? translatedThreshold : yAxis.getThreshold(bottom),
                                doCurve: false // #1041, gaps in areaspline areas
                            });
                        }
                    };

                // Find what points to use
                points = points || this.points;

                // Fill in missing points
                if (stacking) {
                    points = this.getStackPoints();
                }

                for (i = 0; i < points.length; i++) {
                    isNull = points[i].isNull;
                    plotX = pick(points[i].rectPlotX, points[i].plotX);
                    yBottom = pick(points[i].yBottom, translatedThreshold);

                    if (!isNull || connectNulls) {

                        if (!connectNulls) {
                            addDummyPoints(i, i - 1, 'left');
                        }

                        if (!(isNull && !stacking && connectNulls)) { // Skip null point when stacking is false and connectNulls true
                            graphPoints.push(points[i]);
                            bottomPoints.push({
                                x: i,
                                plotX: plotX,
                                plotY: yBottom
                            });
                        }

                        if (!connectNulls) {
                            addDummyPoints(i, i + 1, 'right');
                        }
                    }
                }

                topPath = getGraphPath.call(this, graphPoints, true, true);

                bottomPoints.reversed = true;
                bottomPath = getGraphPath.call(this, bottomPoints, true, true);
                if (bottomPath.length) {
                    bottomPath[0] = 'L';
                }

                areaPath = topPath.concat(bottomPath);
                graphPath = getGraphPath.call(this, graphPoints, false, connectNulls); // TODO: don't set leftCliff and rightCliff when connectNulls?

                areaPath.xMap = topPath.xMap;
                this.areaPath = areaPath;
                return graphPath;
            },

            /**
             * Draw the graph and the underlying area. This method calls the Series base
             * function and adds the area. The areaPath is calculated in the getSegmentPath
             * method called from Series.prototype.drawGraph.
             */
            drawGraph: function() {

                // Define or reset areaPath
                this.areaPath = [];

                // Call the base method
                Series.prototype.drawGraph.apply(this);

                // Define local variables
                var series = this,
                    areaPath = this.areaPath,
                    options = this.options,
                    zones = this.zones,
                    props = [
                        [
                            'area',
                            'highcharts-area',

                            this.color,
                            options.fillColor

                        ]
                    ]; // area name, main color, fill color

                each(zones, function(zone, i) {
                    props.push([
                        'zone-area-' + i,
                        'highcharts-area highcharts-zone-area-' + i + ' ' + zone.className,

                        zone.color || series.color,
                        zone.fillColor || options.fillColor

                    ]);
                });

                each(props, function(prop) {
                    var areaKey = prop[0],
                        area = series[areaKey];

                    // Create or update the area
                    if (area) { // update
                        area.endX = areaPath.xMap;
                        area.animate({
                            d: areaPath
                        });

                    } else { // create
                        area = series[areaKey] = series.chart.renderer.path(areaPath)
                            .addClass(prop[1])
                            .attr({

                                fill: pick(
                                    prop[3],
                                    color(prop[2]).setOpacity(pick(options.fillOpacity, 0.75)).get()
                                ),

                                zIndex: 0 // #1069
                            }).add(series.group);
                        area.isArea = true;
                    }
                    area.startX = areaPath.xMap;
                    area.shiftUnit = options.step ? 2 : 1;
                });
            },

            drawLegendSymbol: LegendSymbolMixin.drawRectangle
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var pick = H.pick,
            seriesType = H.seriesType;

        /**
         * Spline series type.
         * @constructor seriesTypes.spline
         * @extends {Series}
         */
        seriesType('spline', 'line', {}, /** @lends seriesTypes.spline.prototype */ {
            /**
             * Get the spline segment from a given point's previous neighbour to the given point
             */
            getPointSpline: function(points, point, i) {
                var smoothing = 1.5, // 1 means control points midway between points, 2 means 1/3 from the point, 3 is 1/4 etc
                    denom = smoothing + 1,
                    plotX = point.plotX,
                    plotY = point.plotY,
                    lastPoint = points[i - 1],
                    nextPoint = points[i + 1],
                    leftContX,
                    leftContY,
                    rightContX,
                    rightContY,
                    ret;

                function doCurve(otherPoint) {
                    return otherPoint && !otherPoint.isNull && otherPoint.doCurve !== false;
                }

                // Find control points
                if (doCurve(lastPoint) && doCurve(nextPoint)) {
                    var lastX = lastPoint.plotX,
                        lastY = lastPoint.plotY,
                        nextX = nextPoint.plotX,
                        nextY = nextPoint.plotY,
                        correction = 0;

                    leftContX = (smoothing * plotX + lastX) / denom;
                    leftContY = (smoothing * plotY + lastY) / denom;
                    rightContX = (smoothing * plotX + nextX) / denom;
                    rightContY = (smoothing * plotY + nextY) / denom;

                    // Have the two control points make a straight line through main point
                    if (rightContX !== leftContX) { // #5016, division by zero
                        correction = ((rightContY - leftContY) * (rightContX - plotX)) /
                            (rightContX - leftContX) + plotY - rightContY;
                    }

                    leftContY += correction;
                    rightContY += correction;

                    // to prevent false extremes, check that control points are between
                    // neighbouring points' y values
                    if (leftContY > lastY && leftContY > plotY) {
                        leftContY = Math.max(lastY, plotY);
                        rightContY = 2 * plotY - leftContY; // mirror of left control point
                    } else if (leftContY < lastY && leftContY < plotY) {
                        leftContY = Math.min(lastY, plotY);
                        rightContY = 2 * plotY - leftContY;
                    }
                    if (rightContY > nextY && rightContY > plotY) {
                        rightContY = Math.max(nextY, plotY);
                        leftContY = 2 * plotY - rightContY;
                    } else if (rightContY < nextY && rightContY < plotY) {
                        rightContY = Math.min(nextY, plotY);
                        leftContY = 2 * plotY - rightContY;
                    }

                    // record for drawing in next point
                    point.rightContX = rightContX;
                    point.rightContY = rightContY;


                }

                // Visualize control points for debugging
                /*
                if (leftContX) {
                	this.chart.renderer.circle(leftContX + this.chart.plotLeft, leftContY + this.chart.plotTop, 2)
                		.attr({
                			stroke: 'red',
                			'stroke-width': 2,
                			fill: 'none',
                			zIndex: 9
                		})
                		.add();
                	this.chart.renderer.path(['M', leftContX + this.chart.plotLeft, leftContY + this.chart.plotTop,
                		'L', plotX + this.chart.plotLeft, plotY + this.chart.plotTop])
                		.attr({
                			stroke: 'red',
                			'stroke-width': 2,
                			zIndex: 9
                		})
                		.add();
                }
                if (rightContX) {
                	this.chart.renderer.circle(rightContX + this.chart.plotLeft, rightContY + this.chart.plotTop, 2)
                		.attr({
                			stroke: 'green',
                			'stroke-width': 2,
                			fill: 'none',
                			zIndex: 9
                		})
                		.add();
                	this.chart.renderer.path(['M', rightContX + this.chart.plotLeft, rightContY + this.chart.plotTop,
                		'L', plotX + this.chart.plotLeft, plotY + this.chart.plotTop])
                		.attr({
                			stroke: 'green',
                			'stroke-width': 2,
                			zIndex: 9
                		})
                		.add();
                }
                // */
                ret = [
                    'C',
                    pick(lastPoint.rightContX, lastPoint.plotX),
                    pick(lastPoint.rightContY, lastPoint.plotY),
                    pick(leftContX, plotX),
                    pick(leftContY, plotY),
                    plotX,
                    plotY
                ];
                lastPoint.rightContX = lastPoint.rightContY = null; // reset for updating series later
                return ret;
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
        var areaProto = H.seriesTypes.area.prototype,
            defaultPlotOptions = H.defaultPlotOptions,
            LegendSymbolMixin = H.LegendSymbolMixin,
            seriesType = H.seriesType;
        /**
         * AreaSplineSeries object
         */
        seriesType('areaspline', 'spline', defaultPlotOptions.area, {
            getStackPoints: areaProto.getStackPoints,
            getGraphPath: areaProto.getGraphPath,
            setStackCliffs: areaProto.setStackCliffs,
            drawGraph: areaProto.drawGraph,
            drawLegendSymbol: LegendSymbolMixin.drawRectangle
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var animObject = H.animObject,
            color = H.color,
            each = H.each,
            extend = H.extend,
            isNumber = H.isNumber,
            LegendSymbolMixin = H.LegendSymbolMixin,
            merge = H.merge,
            noop = H.noop,
            pick = H.pick,
            Series = H.Series,
            seriesType = H.seriesType,
            svg = H.svg;
        /**
         * The column series type.
         *
         * @constructor seriesTypes.column
         * @augments Series
         */
        seriesType('column', 'line', {
            borderRadius: 0,
            //colorByPoint: undefined,
            groupPadding: 0.2,
            //grouping: true,
            marker: null, // point options are specified in the base options
            pointPadding: 0.1,
            //pointWidth: null,
            minPointLength: 0,
            cropThreshold: 50, // when there are more points, they will not animate out of the chart on xAxis.setExtremes
            pointRange: null, // null means auto, meaning 1 in a categorized axis and least distance between points if not categories
            states: {
                hover: {
                    halo: false,

                    brightness: 0.1,
                    shadow: false

                },

                select: {
                    color: '#cccccc',
                    borderColor: '#000000',
                    shadow: false
                }

            },
            dataLabels: {
                align: null, // auto
                verticalAlign: null, // auto
                y: null
            },
            softThreshold: false,
            startFromThreshold: true, // false doesn't work well: http://jsfiddle.net/highcharts/hz8fopan/14/
            stickyTracking: false,
            tooltip: {
                distance: 6
            },
            threshold: 0,

            borderColor: '#ffffff'
                // borderWidth: 1


        }, /** @lends seriesTypes.column.prototype */ {
            cropShoulder: 0,
            directTouch: true, // When tooltip is not shared, this series (and derivatives) requires direct touch/hover. KD-tree does not apply.
            trackerGroups: ['group', 'dataLabelsGroup'],
            negStacks: true, // use separate negative stacks, unlike area stacks where a negative
            // point is substracted from previous (#1910)

            /**
             * Initialize the series. Extends the basic Series.init method by
             * marking other series of the same type as dirty.
             *
             * @function #init
             * @memberOf seriesTypes.column
             * @returns {void}
             */
            init: function() {
                Series.prototype.init.apply(this, arguments);

                var series = this,
                    chart = series.chart;

                // if the series is added dynamically, force redraw of other
                // series affected by a new column
                if (chart.hasRendered) {
                    each(chart.series, function(otherSeries) {
                        if (otherSeries.type === series.type) {
                            otherSeries.isDirty = true;
                        }
                    });
                }
            },

            /**
             * Return the width and x offset of the columns adjusted for grouping, groupPadding, pointPadding,
             * pointWidth etc.
             */
            getColumnMetrics: function() {

                var series = this,
                    options = series.options,
                    xAxis = series.xAxis,
                    yAxis = series.yAxis,
                    reversedXAxis = xAxis.reversed,
                    stackKey,
                    stackGroups = {},
                    columnCount = 0;

                // Get the total number of column type series.
                // This is called on every series. Consider moving this logic to a
                // chart.orderStacks() function and call it on init, addSeries and removeSeries
                if (options.grouping === false) {
                    columnCount = 1;
                } else {
                    each(series.chart.series, function(otherSeries) {
                        var otherOptions = otherSeries.options,
                            otherYAxis = otherSeries.yAxis,
                            columnIndex;
                        if (otherSeries.type === series.type && otherSeries.visible &&
                            yAxis.len === otherYAxis.len && yAxis.pos === otherYAxis.pos) { // #642, #2086
                            if (otherOptions.stacking) {
                                stackKey = otherSeries.stackKey;
                                if (stackGroups[stackKey] === undefined) {
                                    stackGroups[stackKey] = columnCount++;
                                }
                                columnIndex = stackGroups[stackKey];
                            } else if (otherOptions.grouping !== false) { // #1162
                                columnIndex = columnCount++;
                            }
                            otherSeries.columnIndex = columnIndex;
                        }
                    });
                }

                var categoryWidth = Math.min(
                        Math.abs(xAxis.transA) * (xAxis.ordinalSlope || options.pointRange || xAxis.closestPointRange || xAxis.tickInterval || 1), // #2610
                        xAxis.len // #1535
                    ),
                    groupPadding = categoryWidth * options.groupPadding,
                    groupWidth = categoryWidth - 2 * groupPadding,
                    pointOffsetWidth = groupWidth / (columnCount || 1),
                    pointWidth = Math.min(
                        options.maxPointWidth || xAxis.len,
                        pick(options.pointWidth, pointOffsetWidth * (1 - 2 * options.pointPadding))
                    ),
                    pointPadding = (pointOffsetWidth - pointWidth) / 2,
                    colIndex = (series.columnIndex || 0) + (reversedXAxis ? 1 : 0), // #1251, #3737
                    pointXOffset = pointPadding + (groupPadding + colIndex *
                        pointOffsetWidth - (categoryWidth / 2)) *
                    (reversedXAxis ? -1 : 1);

                // Save it for reading in linked series (Error bars particularly)
                series.columnMetrics = {
                    width: pointWidth,
                    offset: pointXOffset
                };
                return series.columnMetrics;

            },

            /**
             * Make the columns crisp. The edges are rounded to the nearest full pixel.
             */
            crispCol: function(x, y, w, h) {
                var chart = this.chart,
                    borderWidth = this.borderWidth,
                    xCrisp = -(borderWidth % 2 ? 0.5 : 0),
                    yCrisp = borderWidth % 2 ? 0.5 : 1,
                    right,
                    bottom,
                    fromTop;

                if (chart.inverted && chart.renderer.isVML) {
                    yCrisp += 1;
                }

                // Horizontal. We need to first compute the exact right edge, then round it
                // and compute the width from there.
                right = Math.round(x + w) + xCrisp;
                x = Math.round(x) + xCrisp;
                w = right - x;

                // Vertical
                bottom = Math.round(y + h) + yCrisp;
                fromTop = Math.abs(y) <= 0.5 && bottom > 0.5; // #4504, #4656
                y = Math.round(y) + yCrisp;
                h = bottom - y;

                // Top edges are exceptions
                if (fromTop && h) { // #5146
                    y -= 1;
                    h += 1;
                }

                return {
                    x: x,
                    y: y,
                    width: w,
                    height: h
                };
            },

            /**
             * Translate each point to the plot area coordinate system and find shape positions
             */
            translate: function() {
                var series = this,
                    chart = series.chart,
                    options = series.options,
                    dense = series.dense = series.closestPointRange * series.xAxis.transA < 2,
                    borderWidth = series.borderWidth = pick(
                        options.borderWidth,
                        dense ? 0 : 1 // #3635
                    ),
                    yAxis = series.yAxis,
                    threshold = options.threshold,
                    translatedThreshold = series.translatedThreshold = yAxis.getThreshold(threshold),
                    minPointLength = pick(options.minPointLength, 5),
                    metrics = series.getColumnMetrics(),
                    pointWidth = metrics.width,
                    seriesBarW = series.barW = Math.max(pointWidth, 1 + 2 * borderWidth), // postprocessed for border width
                    pointXOffset = series.pointXOffset = metrics.offset;

                if (chart.inverted) {
                    translatedThreshold -= 0.5; // #3355
                }

                // When the pointPadding is 0, we want the columns to be packed tightly, so we allow individual
                // columns to have individual sizes. When pointPadding is greater, we strive for equal-width
                // columns (#2694).
                if (options.pointPadding) {
                    seriesBarW = Math.ceil(seriesBarW);
                }

                Series.prototype.translate.apply(series);

                // Record the new values
                each(series.points, function(point) {
                    var yBottom = pick(point.yBottom, translatedThreshold),
                        safeDistance = 999 + Math.abs(yBottom),
                        plotY = Math.min(Math.max(-safeDistance, point.plotY), yAxis.len + safeDistance), // Don't draw too far outside plot area (#1303, #2241, #4264)
                        barX = point.plotX + pointXOffset,
                        barW = seriesBarW,
                        barY = Math.min(plotY, yBottom),
                        up,
                        barH = Math.max(plotY, yBottom) - barY;

                    // Handle options.minPointLength
                    if (Math.abs(barH) < minPointLength) {
                        if (minPointLength) {
                            barH = minPointLength;
                            up = (!yAxis.reversed && !point.negative) || (yAxis.reversed && point.negative);
                            barY = Math.abs(barY - translatedThreshold) > minPointLength ? // stacked
                                yBottom - minPointLength : // keep position
                                translatedThreshold - (up ? minPointLength : 0); // #1485, #4051
                        }
                    }

                    // Cache for access in polar
                    point.barX = barX;
                    point.pointWidth = pointWidth;

                    // Fix the tooltip on center of grouped columns (#1216, #424, #3648)
                    point.tooltipPos = chart.inverted ? [yAxis.len + yAxis.pos - chart.plotLeft - plotY, series.xAxis.len - barX - barW / 2, barH] : [barX + barW / 2, plotY + yAxis.pos - chart.plotTop, barH];

                    // Register shape type and arguments to be used in drawPoints
                    point.shapeType = 'rect';
                    point.shapeArgs = series.crispCol.apply(
                        series,
                        point.isNull ? [point.plotX, yAxis.len / 2, 0, 0] : // #3169, drilldown from null must have a position to work from
                        [barX, barY, barW, barH]
                    );
                });

            },

            getSymbol: noop,

            /**
             * Use a solid rectangle like the area series types
             */
            drawLegendSymbol: LegendSymbolMixin.drawRectangle,


            /**
             * Columns have no graph
             */
            drawGraph: function() {
                this.group[this.dense ? 'addClass' : 'removeClass']('highcharts-dense-data');
            },


            /**
             * Get presentational attributes
             */
            pointAttribs: function(point, state) {
                var options = this.options,
                    stateOptions,
                    ret,
                    p2o = this.pointAttrToOptions || {},
                    strokeOption = p2o.stroke || 'borderColor',
                    strokeWidthOption = p2o['stroke-width'] || 'borderWidth',
                    fill = (point && point.color) || this.color,
                    stroke = point[strokeOption] || options[strokeOption] ||
                    this.color || fill, // set to fill when borderColor null
                    strokeWidth = point[strokeWidthOption] ||
                    options[strokeWidthOption] || this[strokeWidthOption] || 0,
                    dashstyle = options.dashStyle,
                    zone,
                    brightness;

                // Handle zone colors
                if (point && this.zones.length) {
                    zone = point.getZone();
                    fill = (zone && zone.color) || point.options.color || this.color; // When zones are present, don't use point.color (#4267)
                }

                // Select or hover states
                if (state) {
                    stateOptions = options.states[state];
                    brightness = stateOptions.brightness;
                    fill = stateOptions.color ||
                        (brightness !== undefined && color(fill).brighten(stateOptions.brightness).get()) ||
                        fill;
                    stroke = stateOptions[strokeOption] || stroke;
                    strokeWidth = stateOptions[strokeWidthOption] || strokeWidth;
                    dashstyle = stateOptions.dashStyle || dashstyle;
                }

                ret = {
                    'fill': fill,
                    'stroke': stroke,
                    'stroke-width': strokeWidth
                };
                if (options.borderRadius) {
                    ret.r = options.borderRadius;
                }

                if (dashstyle) {
                    ret.dashstyle = dashstyle;
                }

                return ret;
            },


            /**
             * Draw the columns. For bars, the series.group is rotated, so the same coordinates
             * apply for columns and bars. This method is inherited by scatter series.
             *
             */
            drawPoints: function() {
                var series = this,
                    chart = this.chart,
                    options = series.options,
                    renderer = chart.renderer,
                    animationLimit = options.animationLimit || 250,
                    shapeArgs;

                // draw the columns
                each(series.points, function(point) {
                    var plotY = point.plotY,
                        graphic = point.graphic;

                    if (isNumber(plotY) && point.y !== null) {
                        shapeArgs = point.shapeArgs;

                        if (graphic) { // update
                            graphic[chart.pointCount < animationLimit ? 'animate' : 'attr'](
                                merge(shapeArgs)
                            );

                        } else {
                            point.graphic = graphic = renderer[point.shapeType](shapeArgs)
                                .attr({
                                    'class': point.getClassName()
                                })
                                .add(point.group || series.group);
                        }


                        // Presentational
                        graphic
                            .attr(series.pointAttribs(point, point.selected && 'select'))
                            .shadow(options.shadow, null, options.stacking && !options.borderRadius);


                    } else if (graphic) {
                        point.graphic = graphic.destroy(); // #1269
                    }
                });
            },

            /**
             * Animate the column heights one by one from zero
             * @param {Boolean} init Whether to initialize the animation or run it
             */
            animate: function(init) {
                var series = this,
                    yAxis = this.yAxis,
                    options = series.options,
                    inverted = this.chart.inverted,
                    attr = {},
                    translatedThreshold;

                if (svg) { // VML is too slow anyway
                    if (init) {
                        attr.scaleY = 0.001;
                        translatedThreshold = Math.min(yAxis.pos + yAxis.len, Math.max(yAxis.pos, yAxis.toPixels(options.threshold)));
                        if (inverted) {
                            attr.translateX = translatedThreshold - yAxis.len;
                        } else {
                            attr.translateY = translatedThreshold;
                        }
                        series.group.attr(attr);

                    } else { // run the animation

                        attr[inverted ? 'translateX' : 'translateY'] = yAxis.pos;
                        series.group.animate(attr, extend(animObject(series.options.animation), {
                            // Do the scale synchronously to ensure smooth updating (#5030)
                            step: function(val, fx) {
                                series.group.attr({
                                    scaleY: Math.max(0.001, fx.pos) // #5250
                                });
                            }
                        }));

                        // delete this function to allow it only once
                        series.animate = null;
                    }
                }
            },

            /**
             * Remove this series from the chart
             */
            remove: function() {
                var series = this,
                    chart = series.chart;

                // column and bar series affects other series of the same type
                // as they are either stacked or grouped
                if (chart.hasRendered) {
                    each(chart.series, function(otherSeries) {
                        if (otherSeries.type === series.type) {
                            otherSeries.isDirty = true;
                        }
                    });
                }

                Series.prototype.remove.apply(series, arguments);
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

        var seriesType = H.seriesType;

        /**
         * The Bar series class
         */
        seriesType('bar', 'column', null, {
            inverted: true
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Series = H.Series,
            seriesType = H.seriesType;
        /**
         * The scatter series type
         */
        seriesType('scatter', 'line', {
            lineWidth: 0,
            marker: {
                enabled: true // Overrides auto-enabling in line series (#3647)
            },
            tooltip: {

                headerFormat: '<span style="color:{point.color}">\u25CF</span> ' +
                    '<span style="font-size: 0.85em"> {series.name}</span><br/>',

                pointFormat: 'x: <b>{point.x}</b><br/>y: <b>{point.y}</b><br/>'
            }

            // Prototype members
        }, {
            sorted: false,
            requireSorting: false,
            noSharedTooltip: true,
            trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
            takeOrdinalPosition: false, // #2342
            kdDimensions: 2,
            drawGraph: function() {
                if (this.options.lineWidth) {
                    Series.prototype.drawGraph.call(this);
                }
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
        var pick = H.pick,
            relativeLength = H.relativeLength;

        H.CenteredSeriesMixin = {
            /**
             * Get the center of the pie based on the size and center options relative to the
             * plot area. Borrowed by the polar and gauge series types.
             */
            getCenter: function() {

                var options = this.options,
                    chart = this.chart,
                    slicingRoom = 2 * (options.slicedOffset || 0),
                    handleSlicingRoom,
                    plotWidth = chart.plotWidth - 2 * slicingRoom,
                    plotHeight = chart.plotHeight - 2 * slicingRoom,
                    centerOption = options.center,
                    positions = [pick(centerOption[0], '50%'), pick(centerOption[1], '50%'), options.size || '100%', options.innerSize || 0],
                    smallestSize = Math.min(plotWidth, plotHeight),
                    i,
                    value;

                for (i = 0; i < 4; ++i) {
                    value = positions[i];
                    handleSlicingRoom = i < 2 || (i === 2 && /%$/.test(value));

                    // i == 0: centerX, relative to width
                    // i == 1: centerY, relative to height
                    // i == 2: size, relative to smallestSize
                    // i == 3: innerSize, relative to size
                    positions[i] = relativeLength(value, [plotWidth, plotHeight, smallestSize, positions[2]][i]) +
                        (handleSlicingRoom ? slicingRoom : 0);

                }
                // innerSize cannot be larger than size (#3632)
                if (positions[3] > positions[2]) {
                    positions[3] = positions[2];
                }
                return positions;
            }
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            CenteredSeriesMixin = H.CenteredSeriesMixin,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            inArray = H.inArray,
            LegendSymbolMixin = H.LegendSymbolMixin,
            noop = H.noop,
            pick = H.pick,
            Point = H.Point,
            Series = H.Series,
            seriesType = H.seriesType,
            seriesTypes = H.seriesTypes,
            setAnimation = H.setAnimation;

        /**
         * The pie series type.
         *
         * @constructor seriesTypes.pie
         * @augments Series
         */
        seriesType('pie', 'line', {
            center: [null, null],
            clip: false,
            colorByPoint: true, // always true for pies
            dataLabels: {
                // align: null,
                // connectorWidth: 1,
                // connectorColor: point.color,
                // connectorPadding: 5,
                distance: 30,
                enabled: true,
                formatter: function() { // #2945
                    return this.y === null ? undefined : this.point.name;
                },
                // softConnector: true,
                x: 0
                    // y: 0
            },
            ignoreHiddenPoint: true,
            //innerSize: 0,
            legendType: 'point',
            marker: null, // point options are specified in the base options
            size: null,
            showInLegend: false,
            slicedOffset: 10,
            stickyTracking: false,
            tooltip: {
                followPointer: true
            },

            borderColor: '#ffffff',
            borderWidth: 1,
            states: {
                hover: {
                    brightness: 0.1,
                    shadow: false
                }
            }


        }, /** @lends seriesTypes.pie.prototype */ {
            isCartesian: false,
            requireSorting: false,
            directTouch: true,
            noSharedTooltip: true,
            trackerGroups: ['group', 'dataLabelsGroup'],
            axisTypes: [],
            pointAttribs: seriesTypes.column.prototype.pointAttribs,
            /**
             * Animate the pies in
             */
            animate: function(init) {
                var series = this,
                    points = series.points,
                    startAngleRad = series.startAngleRad;

                if (!init) {
                    each(points, function(point) {
                        var graphic = point.graphic,
                            args = point.shapeArgs;

                        if (graphic) {
                            // start values
                            graphic.attr({
                                r: point.startR || (series.center[3] / 2), // animate from inner radius (#779)
                                start: startAngleRad,
                                end: startAngleRad
                            });

                            // animate
                            graphic.animate({
                                r: args.r,
                                start: args.start,
                                end: args.end
                            }, series.options.animation);
                        }
                    });

                    // delete this function to allow it only once
                    series.animate = null;
                }
            },

            /**
             * Recompute total chart sum and update percentages of points.
             */
            updateTotals: function() {
                var i,
                    total = 0,
                    points = this.points,
                    len = points.length,
                    point,
                    ignoreHiddenPoint = this.options.ignoreHiddenPoint;

                // Get the total sum
                for (i = 0; i < len; i++) {
                    point = points[i];
                    // Disallow negative values (#1530, #3623, #5322)
                    if (point.y < 0) {
                        point.y = null;
                    }
                    total += (ignoreHiddenPoint && !point.visible) ? 0 : point.y;
                }
                this.total = total;

                // Set each point's properties
                for (i = 0; i < len; i++) {
                    point = points[i];
                    point.percentage = (total > 0 && (point.visible || !ignoreHiddenPoint)) ? point.y / total * 100 : 0;
                    point.total = total;
                }
            },

            /**
             * Extend the generatePoints method by adding total and percentage properties to each point
             */
            generatePoints: function() {
                Series.prototype.generatePoints.call(this);
                this.updateTotals();
            },

            /**
             * Do translation for pie slices
             */
            translate: function(positions) {
                this.generatePoints();

                var series = this,
                    cumulative = 0,
                    precision = 1000, // issue #172
                    options = series.options,
                    slicedOffset = options.slicedOffset,
                    connectorOffset = slicedOffset + (options.borderWidth || 0),
                    start,
                    end,
                    angle,
                    startAngle = options.startAngle || 0,
                    startAngleRad = series.startAngleRad = Math.PI / 180 * (startAngle - 90),
                    endAngleRad = series.endAngleRad = Math.PI / 180 * ((pick(options.endAngle, startAngle + 360)) - 90),
                    circ = endAngleRad - startAngleRad, //2 * Math.PI,
                    points = series.points,
                    radiusX, // the x component of the radius vector for a given point
                    radiusY,
                    labelDistance = options.dataLabels.distance,
                    ignoreHiddenPoint = options.ignoreHiddenPoint,
                    i,
                    len = points.length,
                    point;

                // Get positions - either an integer or a percentage string must be given.
                // If positions are passed as a parameter, we're in a recursive loop for adjusting
                // space for data labels.
                if (!positions) {
                    series.center = positions = series.getCenter();
                }

                // utility for getting the x value from a given y, used for anticollision logic in data labels
                series.getX = function(y, left) {

                    angle = Math.asin(Math.min((y - positions[1]) / (positions[2] / 2 + labelDistance), 1));

                    return positions[0] +
                        (left ? -1 : 1) *
                        (Math.cos(angle) * (positions[2] / 2 + labelDistance));
                };

                // Calculate the geometry for each point
                for (i = 0; i < len; i++) {

                    point = points[i];

                    // set start and end angle
                    start = startAngleRad + (cumulative * circ);
                    if (!ignoreHiddenPoint || point.visible) {
                        cumulative += point.percentage / 100;
                    }
                    end = startAngleRad + (cumulative * circ);

                    // set the shape
                    point.shapeType = 'arc';
                    point.shapeArgs = {
                        x: positions[0],
                        y: positions[1],
                        r: positions[2] / 2,
                        innerR: positions[3] / 2,
                        start: Math.round(start * precision) / precision,
                        end: Math.round(end * precision) / precision
                    };

                    // The angle must stay within -90 and 270 (#2645)
                    angle = (end + start) / 2;
                    if (angle > 1.5 * Math.PI) {
                        angle -= 2 * Math.PI;
                    } else if (angle < -Math.PI / 2) {
                        angle += 2 * Math.PI;
                    }

                    // Center for the sliced out slice
                    point.slicedTranslation = {
                        translateX: Math.round(Math.cos(angle) * slicedOffset),
                        translateY: Math.round(Math.sin(angle) * slicedOffset)
                    };

                    // set the anchor point for tooltips
                    radiusX = Math.cos(angle) * positions[2] / 2;
                    radiusY = Math.sin(angle) * positions[2] / 2;
                    point.tooltipPos = [
                        positions[0] + radiusX * 0.7,
                        positions[1] + radiusY * 0.7
                    ];

                    point.half = angle < -Math.PI / 2 || angle > Math.PI / 2 ? 1 : 0;
                    point.angle = angle;

                    // set the anchor point for data labels
                    connectorOffset = Math.min(connectorOffset, labelDistance / 5); // #1678
                    point.labelPos = [
                        positions[0] + radiusX + Math.cos(angle) * labelDistance, // first break of connector
                        positions[1] + radiusY + Math.sin(angle) * labelDistance, // a/a
                        positions[0] + radiusX + Math.cos(angle) * connectorOffset, // second break, right outside pie
                        positions[1] + radiusY + Math.sin(angle) * connectorOffset, // a/a
                        positions[0] + radiusX, // landing point for connector
                        positions[1] + radiusY, // a/a
                        labelDistance < 0 ? // alignment
                        'center' :
                        point.half ? 'right' : 'left', // alignment
                        angle // center angle
                    ];

                }
            },

            drawGraph: null,

            /**
             * Draw the data points
             */
            drawPoints: function() {
                var series = this,
                    chart = series.chart,
                    renderer = chart.renderer,
                    groupTranslation,
                    //center,
                    graphic,
                    //group,
                    pointAttr,
                    shapeArgs;


                var shadow = series.options.shadow;
                if (shadow && !series.shadowGroup) {
                    series.shadowGroup = renderer.g('shadow')
                        .add(series.group);
                }


                // draw the slices
                each(series.points, function(point) {
                    if (point.y !== null) {
                        graphic = point.graphic;
                        shapeArgs = point.shapeArgs;


                        // if the point is sliced, use special translation, else use plot area traslation
                        groupTranslation = point.sliced ? point.slicedTranslation : {};


                        // Put the shadow behind all points
                        var shadowGroup = point.shadowGroup;
                        if (shadow && !shadowGroup) {
                            shadowGroup = point.shadowGroup = renderer.g('shadow')
                                .add(series.shadowGroup);
                        }

                        if (shadowGroup) {
                            shadowGroup.attr(groupTranslation);
                        }
                        pointAttr = series.pointAttribs(point, point.selected && 'select');


                        // Draw the slice
                        if (graphic) {
                            graphic
                                .setRadialReference(series.center)

                            .attr(pointAttr)

                            .animate(extend(shapeArgs, groupTranslation));
                        } else {

                            point.graphic = graphic = renderer[point.shapeType](shapeArgs)
                                .addClass(point.getClassName())
                                .setRadialReference(series.center)
                                .attr(groupTranslation)
                                .add(series.group);

                            if (!point.visible) {
                                graphic.attr({
                                    visibility: 'hidden'
                                });
                            }


                            graphic
                                .attr(pointAttr)
                                .attr({
                                    'stroke-linejoin': 'round'
                                })
                                .shadow(shadow, shadowGroup);

                        }
                    }
                });

            },


            searchPoint: noop,

            /**
             * Utility for sorting data labels
             */
            sortByAngle: function(points, sign) {
                points.sort(function(a, b) {
                    return a.angle !== undefined && (b.angle - a.angle) * sign;
                });
            },

            /**
             * Use a simple symbol from LegendSymbolMixin
             */
            drawLegendSymbol: LegendSymbolMixin.drawRectangle,

            /**
             * Use the getCenter method from drawLegendSymbol
             */
            getCenter: CenteredSeriesMixin.getCenter,

            /**
             * Pies don't have point marker symbols
             */
            getSymbol: noop


            /**
             * @constructor seriesTypes.pie.prototype.pointClass
             * @extends {Point}
             */
        }, /** @lends seriesTypes.pie.prototype.pointClass.prototype */ {
            /**
             * Initiate the pie slice
             */
            init: function() {

                Point.prototype.init.apply(this, arguments);

                var point = this,
                    toggleSlice;

                point.name = pick(point.name, 'Slice');

                // add event listener for select
                toggleSlice = function(e) {
                    point.slice(e.type === 'select');
                };
                addEvent(point, 'select', toggleSlice);
                addEvent(point, 'unselect', toggleSlice);

                return point;
            },

            /**
             * Toggle the visibility of the pie slice
             * @param {Boolean} vis Whether to show the slice or not. If undefined, the
             *    visibility is toggled
             */
            setVisible: function(vis, redraw) {
                var point = this,
                    series = point.series,
                    chart = series.chart,
                    ignoreHiddenPoint = series.options.ignoreHiddenPoint;

                redraw = pick(redraw, ignoreHiddenPoint);

                if (vis !== point.visible) {

                    // If called without an argument, toggle visibility
                    point.visible = point.options.visible = vis = vis === undefined ? !point.visible : vis;
                    series.options.data[inArray(point, series.data)] = point.options; // update userOptions.data

                    // Show and hide associated elements. This is performed regardless of redraw or not,
                    // because chart.redraw only handles full series.
                    each(['graphic', 'dataLabel', 'connector', 'shadowGroup'], function(key) {
                        if (point[key]) {
                            point[key][vis ? 'show' : 'hide'](true);
                        }
                    });

                    if (point.legendItem) {
                        chart.legend.colorizeItem(point, vis);
                    }

                    // #4170, hide halo after hiding point
                    if (!vis && point.state === 'hover') {
                        point.setState('');
                    }

                    // Handle ignore hidden slices
                    if (ignoreHiddenPoint) {
                        series.isDirty = true;
                    }

                    if (redraw) {
                        chart.redraw();
                    }
                }
            },

            /**
             * Set or toggle whether the slice is cut out from the pie
             * @param {Boolean} sliced When undefined, the slice state is toggled
             * @param {Boolean} redraw Whether to redraw the chart. True by default.
             */
            slice: function(sliced, redraw, animation) {
                var point = this,
                    series = point.series,
                    chart = series.chart,
                    translation;

                setAnimation(animation, chart);

                // redraw is true by default
                redraw = pick(redraw, true);

                // if called without an argument, toggle
                point.sliced = point.options.sliced = sliced = defined(sliced) ? sliced : !point.sliced;
                series.options.data[inArray(point, series.data)] = point.options; // update userOptions.data

                translation = sliced ? point.slicedTranslation : {
                    translateX: 0,
                    translateY: 0
                };

                point.graphic.animate(translation);


                if (point.shadowGroup) {
                    point.shadowGroup.animate(translation);
                }

            },

            haloPath: function(size) {
                var shapeArgs = this.shapeArgs;

                return this.sliced || !this.visible ? [] :
                    this.series.chart.renderer.symbols.arc(
                        shapeArgs.x,
                        shapeArgs.y,
                        shapeArgs.r + size,
                        shapeArgs.r + size, {
                            innerR: this.shapeArgs.r,
                            start: shapeArgs.start,
                            end: shapeArgs.end
                        }
                    );
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
        var addEvent = H.addEvent,
            arrayMax = H.arrayMax,
            defined = H.defined,
            each = H.each,
            extend = H.extend,
            format = H.format,
            map = H.map,
            merge = H.merge,
            noop = H.noop,
            pick = H.pick,
            relativeLength = H.relativeLength,
            Series = H.Series,
            seriesTypes = H.seriesTypes,
            stableSort = H.stableSort;


        /**
         * Generatl distribution algorithm for distributing labels of differing size along a
         * confined length in two dimensions. The algorithm takes an array of objects containing
         * a size, a target and a rank. It will place the labels as close as possible to their 
         * targets, skipping the lowest ranked labels if necessary.
         */
        H.distribute = function(boxes, len) {

            var i,
                overlapping = true,
                origBoxes = boxes, // Original array will be altered with added .pos
                restBoxes = [], // The outranked overshoot
                box,
                target,
                total = 0;

            function sortByTarget(a, b) {
                return a.target - b.target;
            }

            // If the total size exceeds the len, remove those boxes with the lowest rank
            i = boxes.length;
            while (i--) {
                total += boxes[i].size;
            }

            // Sort by rank, then slice away overshoot
            if (total > len) {
                stableSort(boxes, function(a, b) {
                    return (b.rank || 0) - (a.rank || 0);
                });
                i = 0;
                total = 0;
                while (total <= len) {
                    total += boxes[i].size;
                    i++;
                }
                restBoxes = boxes.splice(i - 1, boxes.length);
            }

            // Order by target
            stableSort(boxes, sortByTarget);


            // So far we have been mutating the original array. Now
            // create a copy with target arrays
            boxes = map(boxes, function(box) {
                return {
                    size: box.size,
                    targets: [box.target]
                };
            });

            while (overlapping) {
                // Initial positions: target centered in box
                i = boxes.length;
                while (i--) {
                    box = boxes[i];
                    // Composite box, average of targets
                    target = (Math.min.apply(0, box.targets) + Math.max.apply(0, box.targets)) / 2;
                    box.pos = Math.min(Math.max(0, target - box.size / 2), len - box.size);
                }

                // Detect overlap and join boxes
                i = boxes.length;
                overlapping = false;
                while (i--) {
                    if (i > 0 && boxes[i - 1].pos + boxes[i - 1].size > boxes[i].pos) { // Overlap
                        boxes[i - 1].size += boxes[i].size; // Add this size to the previous box
                        boxes[i - 1].targets = boxes[i - 1].targets.concat(boxes[i].targets);

                        // Overlapping right, push left
                        if (boxes[i - 1].pos + boxes[i - 1].size > len) {
                            boxes[i - 1].pos = len - boxes[i - 1].size;
                        }
                        boxes.splice(i, 1); // Remove this item
                        overlapping = true;
                    }
                }
            }

            // Now the composite boxes are placed, we need to put the original boxes within them
            i = 0;
            each(boxes, function(box) {
                var posInCompositeBox = 0;
                each(box.targets, function() {
                    origBoxes[i].pos = box.pos + posInCompositeBox;
                    posInCompositeBox += origBoxes[i].size;
                    i++;
                });
            });

            // Add the rest (hidden) boxes and sort by target
            origBoxes.push.apply(origBoxes, restBoxes);
            stableSort(origBoxes, sortByTarget);
        };


        /**
         * Draw the data labels
         */
        Series.prototype.drawDataLabels = function() {
            var series = this,
                seriesOptions = series.options,
                options = seriesOptions.dataLabels,
                points = series.points,
                pointOptions,
                generalOptions,
                hasRendered = series.hasRendered || 0,
                str,
                dataLabelsGroup,
                defer = pick(options.defer, true),
                renderer = series.chart.renderer;

            if (options.enabled || series._hasPointLabels) {

                // Process default alignment of data labels for columns
                if (series.dlProcessOptions) {
                    series.dlProcessOptions(options);
                }

                // Create a separate group for the data labels to avoid rotation
                dataLabelsGroup = series.plotGroup(
                    'dataLabelsGroup',
                    'data-labels',
                    defer && !hasRendered ? 'hidden' : 'visible', // #5133
                    options.zIndex || 6
                );

                if (defer) {
                    dataLabelsGroup.attr({
                        opacity: +hasRendered
                    }); // #3300
                    if (!hasRendered) {
                        addEvent(series, 'afterAnimate', function() {
                            if (series.visible) { // #2597, #3023, #3024
                                dataLabelsGroup.show(true);
                            }
                            dataLabelsGroup[seriesOptions.animation ? 'animate' : 'attr']({
                                opacity: 1
                            }, {
                                duration: 200
                            });
                        });
                    }
                }

                // Make the labels for each point
                generalOptions = options;
                each(points, function(point) {
                    var enabled,
                        dataLabel = point.dataLabel,
                        labelConfig,
                        attr,
                        name,
                        rotation,
                        connector = point.connector,
                        isNew = !dataLabel,
                        style;
                    // Determine if each data label is enabled
                    // @note dataLabelAttribs (like pointAttribs) would eradicate
                    // the need for dlOptions, and simplify the section below.
                    pointOptions = point.dlOptions || (point.options && point.options.dataLabels); // dlOptions is used in treemaps
                    enabled = pick(pointOptions && pointOptions.enabled, generalOptions.enabled) && point.y !== null; // #2282, #4641
                    if (enabled) {
                        // Create individual options structure that can be extended without
                        // affecting others
                        options = merge(generalOptions, pointOptions);
                        labelConfig = point.getLabelConfig();
                        str = options.format ?
                            format(options.format, labelConfig) :
                            options.formatter.call(labelConfig, options);
                        style = options.style;
                        rotation = options.rotation;

                        // Determine the color
                        style.color = pick(options.color, style.color, series.color, '#000000');
                        // Get automated contrast color
                        if (style.color === 'contrast') {
                            style.color = options.inside || options.distance < 0 || !!seriesOptions.stacking ?
                                renderer.getContrast(point.color || series.color) :
                                '#000000';
                        }
                        if (seriesOptions.cursor) {
                            style.cursor = seriesOptions.cursor;
                        }


                        attr = {
                            //align: align,

                            fill: options.backgroundColor,
                            stroke: options.borderColor,
                            'stroke-width': options.borderWidth,

                            r: options.borderRadius || 0,
                            rotation: rotation,
                            padding: options.padding,
                            zIndex: 1
                        };

                        // Remove unused attributes (#947)
                        for (name in attr) {
                            if (attr[name] === undefined) {
                                delete attr[name];
                            }
                        }
                    }
                    // If the point is outside the plot area, destroy it. #678, #820
                    if (dataLabel && (!enabled || !defined(str))) {
                        point.dataLabel = dataLabel = dataLabel.destroy();
                        if (connector) {
                            point.connector = connector.destroy();
                        }
                        // Individual labels are disabled if the are explicitly disabled
                        // in the point options, or if they fall outside the plot area.
                    } else if (enabled && defined(str)) {
                        // create new label
                        if (!dataLabel) {
                            dataLabel = point.dataLabel = renderer[rotation ? 'text' : 'label']( // labels don't support rotation
                                str,
                                0, -9999,
                                options.shape,
                                null,
                                null,
                                options.useHTML,
                                null,
                                'data-label'
                            );
                            dataLabel.addClass(
                                'highcharts-data-label-color-' + point.colorIndex +
                                ' ' + (options.className || '') +
                                (options.useHTML ? 'highcharts-tracker' : '') // #3398
                            );
                        } else {
                            attr.text = str;
                        }
                        dataLabel.attr(attr);

                        // Styles must be applied before add in order to read text bounding box
                        dataLabel.css(style).shadow(options.shadow);


                        if (!dataLabel.added) {
                            dataLabel.add(dataLabelsGroup);
                        }
                        // Now the data label is created and placed at 0,0, so we need to align it
                        series.alignDataLabel(point, dataLabel, options, null, isNew);
                    }
                });
            }
        };

        /**
         * Align each individual data label
         */
        Series.prototype.alignDataLabel = function(point, dataLabel, options, alignTo, isNew) {
            var chart = this.chart,
                inverted = chart.inverted,
                plotX = pick(point.plotX, -9999),
                plotY = pick(point.plotY, -9999),
                bBox = dataLabel.getBBox(),
                fontSize,
                baseline,
                rotation = options.rotation,
                normRotation,
                negRotation,
                align = options.align,
                rotCorr, // rotation correction
                // Math.round for rounding errors (#2683), alignTo to allow column labels (#2700)
                visible =
                this.visible &&
                (
                    point.series.forceDL ||
                    chart.isInsidePlot(plotX, Math.round(plotY), inverted) ||
                    (
                        alignTo && chart.isInsidePlot(
                            plotX,
                            inverted ? alignTo.x + 1 : alignTo.y + alignTo.height - 1,
                            inverted
                        )
                    )
                ),
                alignAttr, // the final position;
                justify = pick(options.overflow, 'justify') === 'justify';

            if (visible) {


                fontSize = options.style.fontSize;


                baseline = chart.renderer.fontMetrics(fontSize, dataLabel).b;

                // The alignment box is a singular point
                alignTo = extend({
                    x: inverted ? chart.plotWidth - plotY : plotX,
                    y: Math.round(inverted ? chart.plotHeight - plotX : plotY),
                    width: 0,
                    height: 0
                }, alignTo);

                // Add the text size for alignment calculation
                extend(options, {
                    width: bBox.width,
                    height: bBox.height
                });

                // Allow a hook for changing alignment in the last moment, then do the alignment
                if (rotation) {
                    justify = false; // Not supported for rotated text
                    rotCorr = chart.renderer.rotCorr(baseline, rotation); // #3723
                    alignAttr = {
                        x: alignTo.x + options.x + alignTo.width / 2 + rotCorr.x,
                        y: alignTo.y + options.y + {
                            top: 0,
                            middle: 0.5,
                            bottom: 1
                        }[options.verticalAlign] * alignTo.height
                    };
                    dataLabel[isNew ? 'attr' : 'animate'](alignAttr)
                        .attr({ // #3003
                            align: align
                        });

                    // Compensate for the rotated label sticking out on the sides
                    normRotation = (rotation + 720) % 360;
                    negRotation = normRotation > 180 && normRotation < 360;

                    if (align === 'left') {
                        alignAttr.y -= negRotation ? bBox.height : 0;
                    } else if (align === 'center') {
                        alignAttr.x -= bBox.width / 2;
                        alignAttr.y -= bBox.height / 2;
                    } else if (align === 'right') {
                        alignAttr.x -= bBox.width;
                        alignAttr.y -= negRotation ? 0 : bBox.height;
                    }


                } else {
                    dataLabel.align(options, null, alignTo);
                    alignAttr = dataLabel.alignAttr;
                }

                // Handle justify or crop
                if (justify) {
                    this.justifyDataLabel(dataLabel, options, alignAttr, bBox, alignTo, isNew);

                    // Now check that the data label is within the plot area
                } else if (pick(options.crop, true)) {
                    visible = chart.isInsidePlot(alignAttr.x, alignAttr.y) && chart.isInsidePlot(alignAttr.x + bBox.width, alignAttr.y + bBox.height);
                }

                // When we're using a shape, make it possible with a connector or an arrow pointing to thie point
                if (options.shape && !rotation) {
                    dataLabel.attr({
                        anchorX: point.plotX,
                        anchorY: point.plotY
                    });
                }
            }

            // Show or hide based on the final aligned position
            if (!visible) {
                dataLabel.attr({
                    y: -9999
                });
                dataLabel.placed = false; // don't animate back in
            }

        };

        /**
         * If data labels fall partly outside the plot area, align them back in, in a way that
         * doesn't hide the point.
         */
        Series.prototype.justifyDataLabel = function(dataLabel, options, alignAttr, bBox, alignTo, isNew) {
            var chart = this.chart,
                align = options.align,
                verticalAlign = options.verticalAlign,
                off,
                justified,
                padding = dataLabel.box ? 0 : (dataLabel.padding || 0);

            // Off left
            off = alignAttr.x + padding;
            if (off < 0) {
                if (align === 'right') {
                    options.align = 'left';
                } else {
                    options.x = -off;
                }
                justified = true;
            }

            // Off right
            off = alignAttr.x + bBox.width - padding;
            if (off > chart.plotWidth) {
                if (align === 'left') {
                    options.align = 'right';
                } else {
                    options.x = chart.plotWidth - off;
                }
                justified = true;
            }

            // Off top
            off = alignAttr.y + padding;
            if (off < 0) {
                if (verticalAlign === 'bottom') {
                    options.verticalAlign = 'top';
                } else {
                    options.y = -off;
                }
                justified = true;
            }

            // Off bottom
            off = alignAttr.y + bBox.height - padding;
            if (off > chart.plotHeight) {
                if (verticalAlign === 'top') {
                    options.verticalAlign = 'bottom';
                } else {
                    options.y = chart.plotHeight - off;
                }
                justified = true;
            }

            if (justified) {
                dataLabel.placed = !isNew;
                dataLabel.align(options, null, alignTo);
            }
        };

        /**
         * Override the base drawDataLabels method by pie specific functionality
         */
        if (seriesTypes.pie) {
            seriesTypes.pie.prototype.drawDataLabels = function() {
                var series = this,
                    data = series.data,
                    point,
                    chart = series.chart,
                    options = series.options.dataLabels,
                    connectorPadding = pick(options.connectorPadding, 10),
                    connectorWidth = pick(options.connectorWidth, 1),
                    plotWidth = chart.plotWidth,
                    plotHeight = chart.plotHeight,
                    connector,
                    distanceOption = options.distance,
                    seriesCenter = series.center,
                    radius = seriesCenter[2] / 2,
                    centerY = seriesCenter[1],
                    outside = distanceOption > 0,
                    dataLabel,
                    dataLabelWidth,
                    labelPos,
                    labelHeight,
                    halves = [ // divide the points into right and left halves for anti collision
                        [], // right
                        [] // left
                    ],
                    x,
                    y,
                    visibility,
                    j,
                    overflow = [0, 0, 0, 0]; // top, right, bottom, left

                // get out if not enabled
                if (!series.visible || (!options.enabled && !series._hasPointLabels)) {
                    return;
                }

                // run parent method
                Series.prototype.drawDataLabels.apply(series);

                each(data, function(point) {
                    if (point.dataLabel && point.visible) { // #407, #2510

                        // Arrange points for detection collision
                        halves[point.half].push(point);

                        // Reset positions (#4905)
                        point.dataLabel._pos = null;
                    }
                });

                /* Loop over the points in each half, starting from the top and bottom
                 * of the pie to detect overlapping labels.
                 */
                each(halves, function(points, i) {

                    var top,
                        bottom,
                        length = points.length,
                        positions,
                        naturalY,
                        size;

                    if (!length) {
                        return;
                    }

                    // Sort by angle
                    series.sortByAngle(points, i - 0.5);

                    // Only do anti-collision when we are outside the pie and have connectors (#856)
                    if (distanceOption > 0) {
                        top = Math.max(0, centerY - radius - distanceOption);
                        bottom = Math.min(centerY + radius + distanceOption, chart.plotHeight);
                        positions = map(points, function(point) {
                            if (point.dataLabel) {
                                size = point.dataLabel.getBBox().height || 21;
                                return {
                                    target: point.labelPos[1] - top + size / 2,
                                    size: size,
                                    rank: point.y
                                };
                            }
                        });
                        H.distribute(positions, bottom + size - top);
                    }

                    // now the used slots are sorted, fill them up sequentially
                    for (j = 0; j < length; j++) {

                        point = points[j];
                        labelPos = point.labelPos;
                        dataLabel = point.dataLabel;
                        visibility = point.visible === false ? 'hidden' : 'inherit';
                        naturalY = labelPos[1];

                        if (positions) {
                            if (positions[j].pos === undefined) {
                                visibility = 'hidden';
                            } else {
                                labelHeight = positions[j].size;
                                y = top + positions[j].pos;
                            }

                        } else {
                            y = naturalY;
                        }

                        // get the x - use the natural x position for labels near the top and bottom, to prevent the top
                        // and botton slice connectors from touching each other on either side
                        if (options.justify) {
                            x = seriesCenter[0] + (i ? -1 : 1) * (radius + distanceOption);
                        } else {
                            x = series.getX(y < top + 2 || y > bottom - 2 ? naturalY : y, i);
                        }


                        // Record the placement and visibility
                        dataLabel._attr = {
                            visibility: visibility,
                            align: labelPos[6]
                        };
                        dataLabel._pos = {
                            x: x + options.x +
                                ({
                                    left: connectorPadding,
                                    right: -connectorPadding
                                }[labelPos[6]] || 0),
                            y: y + options.y - 10 // 10 is for the baseline (label vs text)
                        };
                        labelPos.x = x;
                        labelPos.y = y;


                        // Detect overflowing data labels
                        if (series.options.size === null) {
                            dataLabelWidth = dataLabel.width;
                            // Overflow left
                            if (x - dataLabelWidth < connectorPadding) {
                                overflow[3] = Math.max(Math.round(dataLabelWidth - x + connectorPadding), overflow[3]);

                                // Overflow right
                            } else if (x + dataLabelWidth > plotWidth - connectorPadding) {
                                overflow[1] = Math.max(Math.round(x + dataLabelWidth - plotWidth + connectorPadding), overflow[1]);
                            }

                            // Overflow top
                            if (y - labelHeight / 2 < 0) {
                                overflow[0] = Math.max(Math.round(-y + labelHeight / 2), overflow[0]);

                                // Overflow left
                            } else if (y + labelHeight / 2 > plotHeight) {
                                overflow[2] = Math.max(Math.round(y + labelHeight / 2 - plotHeight), overflow[2]);
                            }
                        }
                    } // for each point
                }); // for each half

                // Do not apply the final placement and draw the connectors until we have verified
                // that labels are not spilling over.
                if (arrayMax(overflow) === 0 || this.verifyDataLabelOverflow(overflow)) {

                    // Place the labels in the final position
                    this.placeDataLabels();

                    // Draw the connectors
                    if (outside && connectorWidth) {
                        each(this.points, function(point) {
                            var isNew;

                            connector = point.connector;
                            dataLabel = point.dataLabel;

                            if (dataLabel && dataLabel._pos && point.visible) {
                                visibility = dataLabel._attr.visibility;

                                isNew = !connector;

                                if (isNew) {
                                    point.connector = connector = chart.renderer.path()
                                        .addClass('highcharts-data-label-connector highcharts-color-' + point.colorIndex)
                                        .add(series.dataLabelsGroup);


                                    connector.attr({
                                        'stroke-width': connectorWidth,
                                        'stroke': options.connectorColor || point.color || '#666666'
                                    });

                                }
                                connector[isNew ? 'attr' : 'animate']({
                                    d: series.connectorPath(point.labelPos)
                                });
                                connector.attr('visibility', visibility);

                            } else if (connector) {
                                point.connector = connector.destroy();
                            }
                        });
                    }
                }
            };

            /**
             * Extendable method for getting the path of the connector between the data label
             * and the pie slice.
             */
            seriesTypes.pie.prototype.connectorPath = function(labelPos) {
                var x = labelPos.x,
                    y = labelPos.y;
                return pick(this.options.dataLabels.softConnector, true) ? [
                    'M',
                    x + (labelPos[6] === 'left' ? 5 : -5), y, // end of the string at the label
                    'C',
                    x, y, // first break, next to the label
                    2 * labelPos[2] - labelPos[4], 2 * labelPos[3] - labelPos[5],
                    labelPos[2], labelPos[3], // second break
                    'L',
                    labelPos[4], labelPos[5] // base
                ] : [
                    'M',
                    x + (labelPos[6] === 'left' ? 5 : -5), y, // end of the string at the label
                    'L',
                    labelPos[2], labelPos[3], // second break
                    'L',
                    labelPos[4], labelPos[5] // base
                ];
            };

            /**
             * Perform the final placement of the data labels after we have verified that they
             * fall within the plot area.
             */
            seriesTypes.pie.prototype.placeDataLabels = function() {
                each(this.points, function(point) {
                    var dataLabel = point.dataLabel,
                        _pos;

                    if (dataLabel && point.visible) {
                        _pos = dataLabel._pos;
                        if (_pos) {
                            dataLabel.attr(dataLabel._attr);
                            dataLabel[dataLabel.moved ? 'animate' : 'attr'](_pos);
                            dataLabel.moved = true;
                        } else if (dataLabel) {
                            dataLabel.attr({
                                y: -9999
                            });
                        }
                    }
                });
            };

            seriesTypes.pie.prototype.alignDataLabel = noop;

            /**
             * Verify whether the data labels are allowed to draw, or we should run more translation and data
             * label positioning to keep them inside the plot area. Returns true when data labels are ready
             * to draw.
             */
            seriesTypes.pie.prototype.verifyDataLabelOverflow = function(overflow) {

                var center = this.center,
                    options = this.options,
                    centerOption = options.center,
                    minSize = options.minSize || 80,
                    newSize = minSize,
                    ret;

                // Handle horizontal size and center
                if (centerOption[0] !== null) { // Fixed center
                    newSize = Math.max(center[2] - Math.max(overflow[1], overflow[3]), minSize);

                } else { // Auto center
                    newSize = Math.max(
                        center[2] - overflow[1] - overflow[3], // horizontal overflow
                        minSize
                    );
                    center[0] += (overflow[3] - overflow[1]) / 2; // horizontal center
                }

                // Handle vertical size and center
                if (centerOption[1] !== null) { // Fixed center
                    newSize = Math.max(Math.min(newSize, center[2] - Math.max(overflow[0], overflow[2])), minSize);

                } else { // Auto center
                    newSize = Math.max(
                        Math.min(
                            newSize,
                            center[2] - overflow[0] - overflow[2] // vertical overflow
                        ),
                        minSize
                    );
                    center[1] += (overflow[0] - overflow[2]) / 2; // vertical center
                }

                // If the size must be decreased, we need to run translate and drawDataLabels again
                if (newSize < center[2]) {
                    center[2] = newSize;
                    center[3] = Math.min(relativeLength(options.innerSize || 0, newSize), newSize); // #3632
                    this.translate(center);

                    if (this.drawDataLabels) {
                        this.drawDataLabels();
                    }
                    // Else, return true to indicate that the pie and its labels is within the plot area
                } else {
                    ret = true;
                }
                return ret;
            };
        }

        if (seriesTypes.column) {

            /**
             * Override the basic data label alignment by adjusting for the position of the column
             */
            seriesTypes.column.prototype.alignDataLabel = function(point, dataLabel, options, alignTo, isNew) {
                var inverted = this.chart.inverted,
                    series = point.series,
                    dlBox = point.dlBox || point.shapeArgs, // data label box for alignment
                    below = pick(point.below, point.plotY > pick(this.translatedThreshold, series.yAxis.len)), // point.below is used in range series
                    inside = pick(options.inside, !!this.options.stacking), // draw it inside the box?
                    overshoot;

                // Align to the column itself, or the top of it
                if (dlBox) { // Area range uses this method but not alignTo
                    alignTo = merge(dlBox);

                    if (alignTo.y < 0) {
                        alignTo.height += alignTo.y;
                        alignTo.y = 0;
                    }
                    overshoot = alignTo.y + alignTo.height - series.yAxis.len;
                    if (overshoot > 0) {
                        alignTo.height -= overshoot;
                    }

                    if (inverted) {
                        alignTo = {
                            x: series.yAxis.len - alignTo.y - alignTo.height,
                            y: series.xAxis.len - alignTo.x - alignTo.width,
                            width: alignTo.height,
                            height: alignTo.width
                        };
                    }

                    // Compute the alignment box
                    if (!inside) {
                        if (inverted) {
                            alignTo.x += below ? 0 : alignTo.width;
                            alignTo.width = 0;
                        } else {
                            alignTo.y += below ? alignTo.height : 0;
                            alignTo.height = 0;
                        }
                    }
                }


                // When alignment is undefined (typically columns and bars), display the individual
                // point below or above the point depending on the threshold
                options.align = pick(
                    options.align, !inverted || inside ? 'center' : below ? 'right' : 'left'
                );
                options.verticalAlign = pick(
                    options.verticalAlign,
                    inverted || inside ? 'middle' : below ? 'top' : 'bottom'
                );

                // Call the parent method
                Series.prototype.alignDataLabel.call(this, point, dataLabel, options, alignTo, isNew);
            };
        }

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2009-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        /**
         * Highcharts module to hide overlapping data labels. This module is included in Highcharts.
         */
        var Chart = H.Chart,
            each = H.each,
            pick = H.pick,
            addEvent = H.addEvent;

        // Collect potensial overlapping data labels. Stack labels probably don't need to be 
        // considered because they are usually accompanied by data labels that lie inside the columns.
        Chart.prototype.callbacks.push(function(chart) {
            function collectAndHide() {
                var labels = [];

                each(chart.series, function(series) {
                    var dlOptions = series.options.dataLabels,
                        collections = series.dataLabelCollections || ['dataLabel']; // Range series have two collections
                    if ((dlOptions.enabled || series._hasPointLabels) && !dlOptions.allowOverlap && series.visible) { // #3866
                        each(collections, function(coll) {
                            each(series.points, function(point) {
                                if (point[coll]) {
                                    point[coll].labelrank = pick(point.labelrank, point.shapeArgs && point.shapeArgs.height); // #4118
                                    labels.push(point[coll]);
                                }
                            });
                        });
                    }
                });
                chart.hideOverlappingLabels(labels);
            }

            // Do it now ...
            collectAndHide();

            // ... and after each chart redraw
            addEvent(chart, 'redraw', collectAndHide);

        });

        /**
         * Hide overlapping labels. Labels are moved and faded in and out on zoom to provide a smooth 
         * visual imression.
         */
        Chart.prototype.hideOverlappingLabels = function(labels) {

            var len = labels.length,
                label,
                i,
                j,
                label1,
                label2,
                isIntersecting,
                pos1,
                pos2,
                parent1,
                parent2,
                padding,
                intersectRect = function(x1, y1, w1, h1, x2, y2, w2, h2) {
                    return !(
                        x2 > x1 + w1 ||
                        x2 + w2 < x1 ||
                        y2 > y1 + h1 ||
                        y2 + h2 < y1
                    );
                };

            // Mark with initial opacity
            for (i = 0; i < len; i++) {
                label = labels[i];
                if (label) {
                    label.oldOpacity = label.opacity;
                    label.newOpacity = 1;
                }
            }

            // Prevent a situation in a gradually rising slope, that each label
            // will hide the previous one because the previous one always has
            // lower rank.
            labels.sort(function(a, b) {
                return (b.labelrank || 0) - (a.labelrank || 0);
            });

            // Detect overlapping labels
            for (i = 0; i < len; i++) {
                label1 = labels[i];

                for (j = i + 1; j < len; ++j) {
                    label2 = labels[j];
                    if (label1 && label2 && label1.placed && label2.placed && label1.newOpacity !== 0 && label2.newOpacity !== 0) {
                        pos1 = label1.alignAttr;
                        pos2 = label2.alignAttr;
                        parent1 = label1.parentGroup; // Different panes have different positions
                        parent2 = label2.parentGroup;
                        padding = 2 * (label1.box ? 0 : label1.padding); // Substract the padding if no background or border (#4333)
                        isIntersecting = intersectRect(
                            pos1.x + parent1.translateX,
                            pos1.y + parent1.translateY,
                            label1.width - padding,
                            label1.height - padding,
                            pos2.x + parent2.translateX,
                            pos2.y + parent2.translateY,
                            label2.width - padding,
                            label2.height - padding
                        );

                        if (isIntersecting) {
                            (label1.labelrank < label2.labelrank ? label1 : label2).newOpacity = 0;
                        }
                    }
                }
            }

            // Hide or show
            each(labels, function(label) {
                var complete,
                    newOpacity;

                if (label) {
                    newOpacity = label.newOpacity;

                    if (label.oldOpacity !== newOpacity && label.placed) {

                        // Make sure the label is completely hidden to avoid catching clicks (#4362)
                        if (newOpacity) {
                            label.show(true);
                        } else {
                            complete = function() {
                                label.hide();
                            };
                        }

                        // Animate or set the opacity					
                        label.alignAttr.opacity = newOpacity;
                        label[label.isOld ? 'animate' : 'attr'](label.alignAttr, null, complete);

                    }
                    label.isOld = true;
                }
            });
        };

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var addEvent = H.addEvent,
            Chart = H.Chart,
            createElement = H.createElement,
            css = H.css,
            defaultOptions = H.defaultOptions,
            defaultPlotOptions = H.defaultPlotOptions,
            each = H.each,
            extend = H.extend,
            fireEvent = H.fireEvent,
            hasTouch = H.hasTouch,
            inArray = H.inArray,
            isObject = H.isObject,
            Legend = H.Legend,
            merge = H.merge,
            pick = H.pick,
            Point = H.Point,
            Series = H.Series,
            seriesTypes = H.seriesTypes,
            svg = H.svg,
            TrackerMixin;

        /**
         * TrackerMixin for points and graphs.
         *
         * @mixin
         */
        TrackerMixin = H.TrackerMixin = {

            /**
             * Draw the tracker for a point.
             */
            drawTrackerPoint: function() {
                var series = this,
                    chart = series.chart,
                    pointer = chart.pointer,
                    onMouseOver = function(e) {
                        var target = e.target,
                            point;

                        while (target && !point) {
                            point = target.point;
                            target = target.parentNode;
                        }

                        if (point !== undefined && point !== chart.hoverPoint) { // undefined on graph in scatterchart
                            point.onMouseOver(e);
                        }
                    };

                // Add reference to the point
                each(series.points, function(point) {
                    if (point.graphic) {
                        point.graphic.element.point = point;
                    }
                    if (point.dataLabel) {
                        if (point.dataLabel.div) {
                            point.dataLabel.div.point = point;
                        } else {
                            point.dataLabel.element.point = point;
                        }
                    }
                });

                // Add the event listeners, we need to do this only once
                if (!series._hasTracking) {
                    each(series.trackerGroups, function(key) {
                        if (series[key]) { // we don't always have dataLabelsGroup
                            series[key]
                                .addClass('highcharts-tracker')
                                .on('mouseover', onMouseOver)
                                .on('mouseout', function(e) {
                                    pointer.onTrackerMouseOut(e);
                                });
                            if (hasTouch) {
                                series[key].on('touchstart', onMouseOver);
                            }


                            if (series.options.cursor) {
                                series[key]
                                    .css(css)
                                    .css({
                                        cursor: series.options.cursor
                                    });
                            }

                        }
                    });
                    series._hasTracking = true;
                }
            },

            /**
             * Draw the tracker object that sits above all data labels and markers to
             * track mouse events on the graph or points. For the line type charts
             * the tracker uses the same graphPath, but with a greater stroke width
             * for better control.
             */
            drawTrackerGraph: function() {
                var series = this,
                    options = series.options,
                    trackByArea = options.trackByArea,
                    trackerPath = [].concat(trackByArea ? series.areaPath : series.graphPath),
                    trackerPathLength = trackerPath.length,
                    chart = series.chart,
                    pointer = chart.pointer,
                    renderer = chart.renderer,
                    snap = chart.options.tooltip.snap,
                    tracker = series.tracker,
                    i,
                    onMouseOver = function() {
                        if (chart.hoverSeries !== series) {
                            series.onMouseOver();
                        }
                    },
                    /*
                     * Empirical lowest possible opacities for TRACKER_FILL for an element to stay invisible but clickable
                     * IE6: 0.002
                     * IE7: 0.002
                     * IE8: 0.002
                     * IE9: 0.00000000001 (unlimited)
                     * IE10: 0.0001 (exporting only)
                     * FF: 0.00000000001 (unlimited)
                     * Chrome: 0.000001
                     * Safari: 0.000001
                     * Opera: 0.00000000001 (unlimited)
                     */
                    TRACKER_FILL = 'rgba(192,192,192,' + (svg ? 0.0001 : 0.002) + ')';

                // Extend end points. A better way would be to use round linecaps,
                // but those are not clickable in VML.
                if (trackerPathLength && !trackByArea) {
                    i = trackerPathLength + 1;
                    while (i--) {
                        if (trackerPath[i] === 'M') { // extend left side
                            trackerPath.splice(i + 1, 0, trackerPath[i + 1] - snap, trackerPath[i + 2], 'L');
                        }
                        if ((i && trackerPath[i] === 'M') || i === trackerPathLength) { // extend right side
                            trackerPath.splice(i, 0, 'L', trackerPath[i - 2] + snap, trackerPath[i - 1]);
                        }
                    }
                }

                // handle single points
                /*for (i = 0; i < singlePoints.length; i++) {
                	singlePoint = singlePoints[i];
                	trackerPath.push(M, singlePoint.plotX - snap, singlePoint.plotY,
                	L, singlePoint.plotX + snap, singlePoint.plotY);
                }*/

                // draw the tracker
                if (tracker) {
                    tracker.attr({
                        d: trackerPath
                    });
                } else if (series.graph) { // create

                    series.tracker = renderer.path(trackerPath)
                        .attr({
                            'stroke-linejoin': 'round', // #1225
                            visibility: series.visible ? 'visible' : 'hidden',
                            stroke: TRACKER_FILL,
                            fill: trackByArea ? TRACKER_FILL : 'none',
                            'stroke-width': series.graph.strokeWidth() + (trackByArea ? 0 : 2 * snap),
                            zIndex: 2
                        })
                        .add(series.group);

                    // The tracker is added to the series group, which is clipped, but is covered
                    // by the marker group. So the marker group also needs to capture events.
                    each([series.tracker, series.markerGroup], function(tracker) {
                        tracker.addClass('highcharts-tracker')
                            .on('mouseover', onMouseOver)
                            .on('mouseout', function(e) {
                                pointer.onTrackerMouseOut(e);
                            });


                        if (options.cursor) {
                            tracker.css({
                                cursor: options.cursor
                            });
                        }


                        if (hasTouch) {
                            tracker.on('touchstart', onMouseOver);
                        }
                    });
                }
            }
        };
        /* End TrackerMixin */


        /**
         * Add tracking event listener to the series group, so the point graphics
         * themselves act as trackers
         */

        if (seriesTypes.column) {
            seriesTypes.column.prototype.drawTracker = TrackerMixin.drawTrackerPoint;
        }

        if (seriesTypes.pie) {
            seriesTypes.pie.prototype.drawTracker = TrackerMixin.drawTrackerPoint;
        }

        if (seriesTypes.scatter) {
            seriesTypes.scatter.prototype.drawTracker = TrackerMixin.drawTrackerPoint;
        }

        /*
         * Extend Legend for item events
         */
        extend(Legend.prototype, {

            setItemEvents: function(item, legendItem, useHTML) {
                var legend = this,
                    chart = legend.chart,
                    activeClass = 'highcharts-legend-' + (item.series ? 'point' : 'series') + '-active';

                // Set the events on the item group, or in case of useHTML, the item itself (#1249)
                (useHTML ? legendItem : item.legendGroup).on('mouseover', function() {
                        item.setState('hover');

                        // A CSS class to dim or hide other than the hovered series
                        chart.seriesGroup.addClass(activeClass);


                        legendItem.css(legend.options.itemHoverStyle);

                    })
                    .on('mouseout', function() {

                        legendItem.css(item.visible ? legend.itemStyle : legend.itemHiddenStyle);


                        // A CSS class to dim or hide other than the hovered series
                        chart.seriesGroup.removeClass(activeClass);

                        item.setState();
                    })
                    .on('click', function(event) {
                        var strLegendItemClick = 'legendItemClick',
                            fnLegendItemClick = function() {
                                if (item.setVisible) {
                                    item.setVisible();
                                }
                            };

                        // Pass over the click/touch event. #4.
                        event = {
                            browserEvent: event
                        };

                        // click the name or symbol
                        if (item.firePointEvent) { // point
                            item.firePointEvent(strLegendItemClick, event, fnLegendItemClick);
                        } else {
                            fireEvent(item, strLegendItemClick, event, fnLegendItemClick);
                        }
                    });
            },

            createCheckboxForItem: function(item) {
                var legend = this;

                item.checkbox = createElement('input', {
                    type: 'checkbox',
                    checked: item.selected,
                    defaultChecked: item.selected // required by IE7
                }, legend.options.itemCheckboxStyle, legend.chart.container);

                addEvent(item.checkbox, 'click', function(event) {
                    var target = event.target;
                    fireEvent(
                        item.series || item,
                        'checkboxClick', { // #3712
                            checked: target.checked,
                            item: item
                        },
                        function() {
                            item.select();
                        }
                    );
                });
            }
        });



        // Add pointer cursor to legend itemstyle in defaultOptions
        defaultOptions.legend.itemStyle.cursor = 'pointer';



        /*
         * Extend the Chart object with interaction
         */

        extend(Chart.prototype, /** @lends Chart.prototype */ {
            /**
             * Display the zoom button
             */
            showResetZoom: function() {
                var chart = this,
                    lang = defaultOptions.lang,
                    btnOptions = chart.options.chart.resetZoomButton,
                    theme = btnOptions.theme,
                    states = theme.states,
                    alignTo = btnOptions.relativeTo === 'chart' ? null : 'plotBox';

                function zoomOut() {
                    chart.zoomOut();
                }

                this.resetZoomButton = chart.renderer.button(lang.resetZoom, null, null, zoomOut, theme, states && states.hover)
                    .attr({
                        align: btnOptions.position.align,
                        title: lang.resetZoomTitle
                    })
                    .addClass('highcharts-reset-zoom')
                    .add()
                    .align(btnOptions.position, false, alignTo);

            },

            /**
             * Zoom out to 1:1
             */
            zoomOut: function() {
                var chart = this;
                fireEvent(chart, 'selection', {
                    resetSelection: true
                }, function() {
                    chart.zoom();
                });
            },

            /**
             * Zoom into a given portion of the chart given by axis coordinates
             * @param {Object} event
             */
            zoom: function(event) {
                var chart = this,
                    hasZoomed,
                    pointer = chart.pointer,
                    displayButton = false,
                    resetZoomButton;

                // If zoom is called with no arguments, reset the axes
                if (!event || event.resetSelection) {
                    each(chart.axes, function(axis) {
                        hasZoomed = axis.zoom();
                    });
                } else { // else, zoom in on all axes
                    each(event.xAxis.concat(event.yAxis), function(axisData) {
                        var axis = axisData.axis,
                            isXAxis = axis.isXAxis;

                        // don't zoom more than minRange
                        if (pointer[isXAxis ? 'zoomX' : 'zoomY']) {
                            hasZoomed = axis.zoom(axisData.min, axisData.max);
                            if (axis.displayBtn) {
                                displayButton = true;
                            }
                        }
                    });
                }

                // Show or hide the Reset zoom button
                resetZoomButton = chart.resetZoomButton;
                if (displayButton && !resetZoomButton) {
                    chart.showResetZoom();
                } else if (!displayButton && isObject(resetZoomButton)) {
                    chart.resetZoomButton = resetZoomButton.destroy();
                }


                // Redraw
                if (hasZoomed) {
                    chart.redraw(
                        pick(chart.options.chart.animation, event && event.animation, chart.pointCount < 100) // animation
                    );
                }
            },

            /**
             * Pan the chart by dragging the mouse across the pane. This function is called
             * on mouse move, and the distance to pan is computed from chartX compared to
             * the first chartX position in the dragging operation.
             */
            pan: function(e, panning) {

                var chart = this,
                    hoverPoints = chart.hoverPoints,
                    doRedraw;

                // remove active points for shared tooltip
                if (hoverPoints) {
                    each(hoverPoints, function(point) {
                        point.setState();
                    });
                }

                each(panning === 'xy' ? [1, 0] : [1], function(isX) { // xy is used in maps
                    var axis = chart[isX ? 'xAxis' : 'yAxis'][0],
                        horiz = axis.horiz,
                        mousePos = e[horiz ? 'chartX' : 'chartY'],
                        mouseDown = horiz ? 'mouseDownX' : 'mouseDownY',
                        startPos = chart[mouseDown],
                        halfPointRange = (axis.pointRange || 0) / 2,
                        extremes = axis.getExtremes(),
                        panMin = axis.toValue(startPos - mousePos, true) +
                        halfPointRange,
                        panMax = axis.toValue(startPos + axis.len - mousePos, true) -
                        halfPointRange,
                        flipped = panMax < panMin,
                        newMin = flipped ? panMax : panMin,
                        newMax = flipped ? panMin : panMax,
                        distMin = Math.min(extremes.dataMin, extremes.min) - newMin,
                        distMax = newMax - Math.max(extremes.dataMax, extremes.max);

                    // Negative distMin and distMax means that we're still inside the
                    // data range.
                    if (axis.series.length && distMin < 0 && distMax < 0) {
                        axis.setExtremes(
                            newMin,
                            newMax,
                            false,
                            false, {
                                trigger: 'pan'
                            }
                        );
                        doRedraw = true;
                    }

                    chart[mouseDown] = mousePos; // set new reference for next run
                });

                if (doRedraw) {
                    chart.redraw(false);
                }
                css(chart.container, {
                    cursor: 'move'
                });
            }
        });

        /*
         * Extend the Point object with interaction
         */
        extend(Point.prototype, /** @lends Point.prototype */ {
            /**
             * Toggle the selection status of a point
             * @param {Boolean} selected Whether to select or unselect the point.
             * @param {Boolean} accumulate Whether to add to the previous selection. By default,
             *		 this happens if the control key (Cmd on Mac) was pressed during clicking.
             */
            select: function(selected, accumulate) {
                var point = this,
                    series = point.series,
                    chart = series.chart;

                selected = pick(selected, !point.selected);

                // fire the event with the default handler
                point.firePointEvent(selected ? 'select' : 'unselect', {
                    accumulate: accumulate
                }, function() {
                    point.selected = point.options.selected = selected;
                    series.options.data[inArray(point, series.data)] = point.options;

                    point.setState(selected && 'select');

                    // unselect all other points unless Ctrl or Cmd + click
                    if (!accumulate) {
                        each(chart.getSelectedPoints(), function(loopPoint) {
                            if (loopPoint.selected && loopPoint !== point) {
                                loopPoint.selected = loopPoint.options.selected = false;
                                series.options.data[inArray(loopPoint, series.data)] = loopPoint.options;
                                loopPoint.setState('');
                                loopPoint.firePointEvent('unselect');
                            }
                        });
                    }
                });
            },

            /**
             * Runs on mouse over the point
             *
             * @param {Object} e The event arguments
             * @param {Boolean} byProximity Falsy for kd points that are closest to the mouse, or to
             *        actually hovered points. True for other points in shared tooltip.
             */
            onMouseOver: function(e, byProximity) {
                var point = this,
                    series = point.series,
                    chart = series.chart,
                    tooltip = chart.tooltip,
                    hoverPoint = chart.hoverPoint;

                if (point.series) { // It may have been destroyed, #4130
                    // In shared tooltip, call mouse over when point/series is actually hovered: (#5766)
                    if (!byProximity) {
                        // set normal state to previous series
                        if (hoverPoint && hoverPoint !== point) {
                            hoverPoint.onMouseOut();
                        }
                        if (chart.hoverSeries !== series) {
                            series.onMouseOver();
                        }
                        chart.hoverPoint = point;
                    }

                    // update the tooltip
                    if (tooltip && (!tooltip.shared || series.noSharedTooltip)) {
                        // hover point only for non shared points: (#5766)
                        point.setState('hover');
                        tooltip.refresh(point, e);
                    } else if (!tooltip) {
                        point.setState('hover');
                    }

                    // trigger the event
                    point.firePointEvent('mouseOver');
                }
            },

            /**
             * Runs on mouse out from the point
             */
            onMouseOut: function() {
                var chart = this.series.chart,
                    hoverPoints = chart.hoverPoints;

                this.firePointEvent('mouseOut');

                if (!hoverPoints || inArray(this, hoverPoints) === -1) { // #887, #2240
                    this.setState();
                    chart.hoverPoint = null;
                }
            },

            /**
             * Import events from the series' and point's options. Only do it on
             * demand, to save processing time on hovering.
             */
            importEvents: function() {
                if (!this.hasImportedEvents) {
                    var point = this,
                        options = merge(point.series.options.point, point.options),
                        events = options.events,
                        eventType;

                    point.events = events;

                    for (eventType in events) {
                        addEvent(point, eventType, events[eventType]);
                    }
                    this.hasImportedEvents = true;

                }
            },

            /**
             * Set the point's state
             * @param {String} state
             */
            setState: function(state, move) {
                var point = this,
                    plotX = Math.floor(point.plotX), // #4586
                    plotY = point.plotY,
                    series = point.series,
                    stateOptions = series.options.states[state] || {},
                    markerOptions = defaultPlotOptions[series.type].marker &&
                    series.options.marker,
                    normalDisabled = markerOptions && markerOptions.enabled === false,
                    markerStateOptions = (markerOptions && markerOptions.states &&
                        markerOptions.states[state]) || {},
                    stateDisabled = markerStateOptions.enabled === false,
                    stateMarkerGraphic = series.stateMarkerGraphic,
                    pointMarker = point.marker || {},
                    chart = series.chart,
                    halo = series.halo,
                    haloOptions,
                    markerAttribs,
                    hasMarkers = markerOptions && series.markerAttribs,
                    newSymbol;

                state = state || ''; // empty string

                if (
                    // already has this state
                    (state === point.state && !move) ||
                    // selected points don't respond to hover
                    (point.selected && state !== 'select') ||
                    // series' state options is disabled
                    (stateOptions.enabled === false) ||
                    // general point marker's state options is disabled
                    (state && (stateDisabled || (normalDisabled && markerStateOptions.enabled === false))) ||
                    // individual point marker's state options is disabled
                    (state && pointMarker.states && pointMarker.states[state] && pointMarker.states[state].enabled === false) // #1610

                ) {
                    return;
                }

                if (hasMarkers) {
                    markerAttribs = series.markerAttribs(point, state);
                }

                // Apply hover styles to the existing point
                if (point.graphic) {

                    if (point.state) {
                        point.graphic.removeClass('highcharts-point-' + point.state);
                    }
                    if (state) {
                        point.graphic.addClass('highcharts-point-' + state);
                    }

                    /*attribs = radius ? { // new symbol attributes (#507, #612)
                    	x: plotX - radius,
                    	y: plotY - radius,
                    	width: 2 * radius,
                    	height: 2 * radius
                    } : {};*/


                    //attribs = merge(series.pointAttribs(point, state), attribs);
                    point.graphic.attr(series.pointAttribs(point, state));


                    if (markerAttribs) {
                        point.graphic.animate(
                            markerAttribs,
                            pick(
                                chart.options.chart.animation, // Turn off globally
                                markerStateOptions.animation,
                                markerOptions.animation
                            )
                        );
                    }

                    // Zooming in from a range with no markers to a range with markers
                    if (stateMarkerGraphic) {
                        stateMarkerGraphic.hide();
                    }
                } else {
                    // if a graphic is not applied to each point in the normal state, create a shared
                    // graphic for the hover state
                    if (state && markerStateOptions) {
                        newSymbol = pointMarker.symbol || series.symbol;

                        // If the point has another symbol than the previous one, throw away the
                        // state marker graphic and force a new one (#1459)
                        if (stateMarkerGraphic && stateMarkerGraphic.currentSymbol !== newSymbol) {
                            stateMarkerGraphic = stateMarkerGraphic.destroy();
                        }

                        // Add a new state marker graphic
                        if (!stateMarkerGraphic) {
                            if (newSymbol) {
                                series.stateMarkerGraphic = stateMarkerGraphic = chart.renderer.symbol(
                                        newSymbol,
                                        markerAttribs.x,
                                        markerAttribs.y,
                                        markerAttribs.width,
                                        markerAttribs.height
                                    )
                                    .add(series.markerGroup);
                                stateMarkerGraphic.currentSymbol = newSymbol;
                            }

                            // Move the existing graphic
                        } else {
                            stateMarkerGraphic[move ? 'animate' : 'attr']({ // #1054
                                x: markerAttribs.x,
                                y: markerAttribs.y
                            });
                        }

                        if (stateMarkerGraphic) {
                            stateMarkerGraphic.attr(series.pointAttribs(point, state));
                        }

                    }

                    if (stateMarkerGraphic) {
                        stateMarkerGraphic[state && chart.isInsidePlot(plotX, plotY, chart.inverted) ? 'show' : 'hide'](); // #2450
                        stateMarkerGraphic.element.point = point; // #4310
                    }
                }

                // Show me your halo
                haloOptions = stateOptions.halo;
                if (haloOptions && haloOptions.size) {
                    if (!halo) {
                        series.halo = halo = chart.renderer.path()
                            // #5818, #5903
                            .add(hasMarkers ? series.markerGroup : series.group);
                    }
                    halo[move ? 'animate' : 'attr']({
                        d: point.haloPath(haloOptions.size)
                    });
                    halo.attr({
                        'class': 'highcharts-halo highcharts-color-' +
                            pick(point.colorIndex, series.colorIndex)
                    });
                    halo.point = point; // #6055


                    halo.attr(extend({
                        'fill': point.color || series.color,
                        'fill-opacity': haloOptions.opacity,
                        'zIndex': -1 // #4929, IE8 added halo above everything
                    }, haloOptions.attributes));


                } else if (halo && halo.point && halo.point.haloPath) {
                    // Animate back to 0 on the current halo point (#6055)
                    halo.animate({
                        d: halo.point.haloPath(0)
                    });
                }

                point.state = state;
            },

            /**
             * Get the circular path definition for the halo
             * @param  {Number} size The radius of the circular halo.
             * @returns {Array} The path definition
             */
            haloPath: function(size) {
                var series = this.series,
                    chart = series.chart;

                return chart.renderer.symbols.circle(
                    Math.floor(this.plotX) - size,
                    this.plotY - size,
                    size * 2,
                    size * 2
                );
            }
        });

        /*
         * Extend the Series object with interaction
         */

        extend(Series.prototype, /** @lends Series.prototype */ {
            /**
             * Series mouse over handler
             */
            onMouseOver: function() {
                var series = this,
                    chart = series.chart,
                    hoverSeries = chart.hoverSeries;

                // set normal state to previous series
                if (hoverSeries && hoverSeries !== series) {
                    hoverSeries.onMouseOut();
                }

                // trigger the event, but to save processing time,
                // only if defined
                if (series.options.events.mouseOver) {
                    fireEvent(series, 'mouseOver');
                }

                // hover this
                series.setState('hover');
                chart.hoverSeries = series;
            },

            /**
             * Series mouse out handler
             */
            onMouseOut: function() {
                // trigger the event only if listeners exist
                var series = this,
                    options = series.options,
                    chart = series.chart,
                    tooltip = chart.tooltip,
                    hoverPoint = chart.hoverPoint;

                chart.hoverSeries = null; // #182, set to null before the mouseOut event fires

                // trigger mouse out on the point, which must be in this series
                if (hoverPoint) {
                    hoverPoint.onMouseOut();
                }

                // fire the mouse out event
                if (series && options.events.mouseOut) {
                    fireEvent(series, 'mouseOut');
                }


                // hide the tooltip
                if (tooltip && !options.stickyTracking && (!tooltip.shared || series.noSharedTooltip)) {
                    tooltip.hide();
                }

                // set normal state
                series.setState();
            },

            /**
             * Set the state of the graph
             */
            setState: function(state) {
                var series = this,
                    options = series.options,
                    graph = series.graph,
                    stateOptions = options.states,
                    lineWidth = options.lineWidth,
                    attribs,
                    i = 0;

                state = state || '';

                if (series.state !== state) {

                    // Toggle class names
                    each([series.group, series.markerGroup], function(group) {
                        if (group) {
                            // Old state
                            if (series.state) {
                                group.removeClass('highcharts-series-' + series.state);
                            }
                            // New state
                            if (state) {
                                group.addClass('highcharts-series-' + state);
                            }
                        }
                    });

                    series.state = state;



                    if (stateOptions[state] && stateOptions[state].enabled === false) {
                        return;
                    }

                    if (state) {
                        lineWidth = stateOptions[state].lineWidth || lineWidth + (stateOptions[state].lineWidthPlus || 0); // #4035
                    }

                    if (graph && !graph.dashstyle) { // hover is turned off for dashed lines in VML
                        attribs = {
                            'stroke-width': lineWidth
                        };
                        // use attr because animate will cause any other animation on the graph to stop
                        graph.attr(attribs);
                        while (series['zone-graph-' + i]) {
                            series['zone-graph-' + i].attr(attribs);
                            i = i + 1;
                        }
                    }

                }
            },

            /**
             * Set the visibility of the graph
             *
             * @param vis {Boolean} True to show the series, false to hide. If undefined,
             *				the visibility is toggled.
             */
            setVisible: function(vis, redraw) {
                var series = this,
                    chart = series.chart,
                    legendItem = series.legendItem,
                    showOrHide,
                    ignoreHiddenSeries = chart.options.chart.ignoreHiddenSeries,
                    oldVisibility = series.visible;

                // if called without an argument, toggle visibility
                series.visible = vis = series.options.visible = series.userOptions.visible = vis === undefined ? !oldVisibility : vis; // #5618
                showOrHide = vis ? 'show' : 'hide';

                // show or hide elements
                each(['group', 'dataLabelsGroup', 'markerGroup', 'tracker', 'tt'], function(key) {
                    if (series[key]) {
                        series[key][showOrHide]();
                    }
                });


                // hide tooltip (#1361)
                if (chart.hoverSeries === series || (chart.hoverPoint && chart.hoverPoint.series) === series) {
                    series.onMouseOut();
                }


                if (legendItem) {
                    chart.legend.colorizeItem(series, vis);
                }


                // rescale or adapt to resized chart
                series.isDirty = true;
                // in a stack, all other series are affected
                if (series.options.stacking) {
                    each(chart.series, function(otherSeries) {
                        if (otherSeries.options.stacking && otherSeries.visible) {
                            otherSeries.isDirty = true;
                        }
                    });
                }

                // show or hide linked series
                each(series.linkedSeries, function(otherSeries) {
                    otherSeries.setVisible(vis, false);
                });

                if (ignoreHiddenSeries) {
                    chart.isDirtyBox = true;
                }
                if (redraw !== false) {
                    chart.redraw();
                }

                fireEvent(series, showOrHide);
            },

            /**
             * Show the graph
             */
            show: function() {
                this.setVisible(true);
            },

            /**
             * Hide the graph
             */
            hide: function() {
                this.setVisible(false);
            },


            /**
             * Set the selected state of the graph
             *
             * @param selected {Boolean} True to select the series, false to unselect. If
             *				undefined, the selection state is toggled.
             */
            select: function(selected) {
                var series = this;
                // if called without an argument, toggle
                series.selected = selected = (selected === undefined) ? !series.selected : selected;

                if (series.checkbox) {
                    series.checkbox.checked = selected;
                }

                fireEvent(series, selected ? 'select' : 'unselect');
            },

            drawTracker: TrackerMixin.drawTrackerGraph
        });

    }(Highcharts));
    (function(H) {
        /**
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        'use strict';
        var Chart = H.Chart,
            each = H.each,
            inArray = H.inArray,
            isObject = H.isObject,
            pick = H.pick,
            splat = H.splat;

        /**
         * Update the chart based on the current chart/document size and options for responsiveness
         */
        Chart.prototype.setResponsive = function(redraw) {
            var options = this.options.responsive;

            if (options && options.rules) {
                each(options.rules, function(rule) {
                    this.matchResponsiveRule(rule, redraw);
                }, this);
            }
        };

        /**
         * Handle a single responsiveness rule
         */
        Chart.prototype.matchResponsiveRule = function(rule, redraw) {
            var respRules = this.respRules,
                condition = rule.condition,
                matches,
                fn = condition.callback || function() {
                    return this.chartWidth <= pick(condition.maxWidth, Number.MAX_VALUE) &&
                        this.chartHeight <= pick(condition.maxHeight, Number.MAX_VALUE) &&
                        this.chartWidth >= pick(condition.minWidth, 0) &&
                        this.chartHeight >= pick(condition.minHeight, 0);
                };


            if (rule._id === undefined) {
                rule._id = H.uniqueKey();
            }
            matches = fn.call(this);

            // Apply a rule
            if (!respRules[rule._id] && matches) {

                // Store the current state of the options
                if (rule.chartOptions) {
                    respRules[rule._id] = this.currentOptions(rule.chartOptions);
                    this.update(rule.chartOptions, redraw);
                }

                // Unapply a rule based on the previous options before the rule
                // was applied
            } else if (respRules[rule._id] && !matches) {
                this.update(respRules[rule._id], redraw);
                delete respRules[rule._id];
            }
        };

        /**
         * Get the current values for a given set of options. Used before we update
         * the chart with a new responsiveness rule.
         * TODO: Restore axis options (by id?)
         */
        Chart.prototype.currentOptions = function(options) {

            var ret = {};

            /**
             * Recurse over a set of options and its current values,
             * and store the current values in the ret object.
             */
            function getCurrent(options, curr, ret, depth) {
                var key, i;
                for (key in options) {
                    if (!depth && inArray(key, ['series', 'xAxis', 'yAxis']) > -1) {
                        options[key] = splat(options[key]);

                        ret[key] = [];
                        for (i = 0; i < options[key].length; i++) {
                            ret[key][i] = {};
                            getCurrent(
                                options[key][i],
                                curr[key][i],
                                ret[key][i],
                                depth + 1
                            );
                        }
                    } else if (isObject(options[key])) {
                        ret[key] = {};
                        getCurrent(
                            options[key],
                            curr[key] || {},
                            ret[key],
                            depth + 1
                        );
                    } else {
                        ret[key] = curr[key] || null;
                    }
                }
            }

            getCurrent(options, this.options, ret, 0);
            return ret;
        };

    }(Highcharts));
    return Highcharts
}));
