/*
 Highcharts JS v6.0.2 (2017-10-20)
 Boost module

 (c) 2010-2017 Highsoft AS
 Author: Torstein Honsi

 License: www.highcharts.com/license
*/
(function(w){"object"===typeof module&&module.exports?module.exports=w:w(Highcharts)})(function(w){(function(l){function w(){var a=Array.prototype.slice.call(arguments),c=-Number.MAX_VALUE;B(a,function(a){if("undefined"!==typeof a&&null!==a&&"undefined"!==typeof a.length&&0<a.length)return c=a.length,!0});return c}function O(a){var c=0,e=0,f=!0,b;if("undefined"!==typeof a.boostForceChartBoost)return a.boostForceChartBoost;f=a.options.boost?"undefined"!==typeof a.options.boost.allowForce?a.options.boost.allowForce:
f:f;if(1<a.series.length)for(var m=0;m<a.series.length;m++)b=a.series[m],P[b.type]&&++e,w(b.processedXData,b.options.data,b.points)>=(b.options.boostThreshold||Number.MAX_VALUE)&&++c;a.boostForceChartBoost=f&&e===a.series.length&&0<c||5<c;return a.boostForceChartBoost}function ha(a){function c(b,d){d=a.createShader("vertex"===d?a.VERTEX_SHADER:a.FRAGMENT_SHADER);a.shaderSource(d,b);a.compileShader(d);return a.getShaderParameter(d,a.COMPILE_STATUS)?d:!1}function e(){function b(b){return a.getUniformLocation(m,
b)}var e=c("#version 100\nprecision highp float;\nattribute vec4 aVertexPosition;\nattribute vec4 aColor;\nvarying highp vec2 position;\nvarying highp vec4 vColor;\nuniform mat4 uPMatrix;\nuniform float pSize;\nuniform float translatedThreshold;\nuniform bool hasThreshold;\nuniform bool skipTranslation;\nuniform float plotHeight;\nuniform float xAxisTrans;\nuniform float xAxisMin;\nuniform float xAxisMinPad;\nuniform float xAxisPointRange;\nuniform float xAxisLen;\nuniform bool  xAxisPostTranslate;\nuniform float xAxisOrdinalSlope;\nuniform float xAxisOrdinalOffset;\nuniform float xAxisPos;\nuniform bool  xAxisCVSCoord;\nuniform float yAxisTrans;\nuniform float yAxisMin;\nuniform float yAxisMinPad;\nuniform float yAxisPointRange;\nuniform float yAxisLen;\nuniform bool  yAxisPostTranslate;\nuniform float yAxisOrdinalSlope;\nuniform float yAxisOrdinalOffset;\nuniform float yAxisPos;\nuniform bool  yAxisCVSCoord;\nuniform bool  isBubble;\nuniform bool  bubbleSizeByArea;\nuniform float bubbleZMin;\nuniform float bubbleZMax;\nuniform float bubbleZThreshold;\nuniform float bubbleMinSize;\nuniform float bubbleMaxSize;\nuniform bool  bubbleSizeAbs;\nuniform bool  isInverted;\nfloat bubbleRadius(){\nfloat value \x3d aVertexPosition.w;\nfloat zMax \x3d bubbleZMax;\nfloat zMin \x3d bubbleZMin;\nfloat radius \x3d 0.0;\nfloat pos \x3d 0.0;\nfloat zRange \x3d zMax - zMin;\nif (bubbleSizeAbs){\nvalue \x3d value - bubbleZThreshold;\nzMax \x3d max(zMax - bubbleZThreshold, zMin - bubbleZThreshold);\nzMin \x3d 0.0;\n}\nif (value \x3c zMin){\nradius \x3d bubbleZMin / 2.0 - 1.0;\n} else {\npos \x3d zRange \x3e 0.0 ? (value - zMin) / zRange : 0.5;\nif (bubbleSizeByArea \x26\x26 pos \x3e 0.0){\npos \x3d sqrt(pos);\n}\nradius \x3d ceil(bubbleMinSize + pos * (bubbleMaxSize - bubbleMinSize)) / 2.0;\n}\nreturn radius * 2.0;\n}\nfloat translate(float val,\nfloat pointPlacement,\nfloat localA,\nfloat localMin,\nfloat minPixelPadding,\nfloat pointRange,\nfloat len,\nbool  cvsCoord\n){\nfloat sign \x3d 1.0;\nfloat cvsOffset \x3d 0.0;\nif (cvsCoord) {\nsign *\x3d -1.0;\ncvsOffset \x3d len;\n}\nreturn sign * (val - localMin) * localA + cvsOffset + \n(sign * minPixelPadding);\n}\nfloat xToPixels(float value){\nif (skipTranslation){\nreturn value;// + xAxisPos;\n}\nreturn translate(value, 0.0, xAxisTrans, xAxisMin, xAxisMinPad, xAxisPointRange, xAxisLen, xAxisCVSCoord);// + xAxisPos;\n}\nfloat yToPixels(float value, float checkTreshold){\nfloat v;\nif (skipTranslation){\nv \x3d value;// + yAxisPos;\n} else {\nv \x3d translate(value, 0.0, yAxisTrans, yAxisMin, yAxisMinPad, yAxisPointRange, yAxisLen, yAxisCVSCoord);// + yAxisPos;\nif (v \x3e plotHeight) {\nv \x3d plotHeight;\n}\n}\nif (checkTreshold \x3e 0.0 \x26\x26 hasThreshold) {\nv \x3d min(v, translatedThreshold);\n}\nreturn v;\n}\nvoid main(void) {\nif (isBubble){\ngl_PointSize \x3d bubbleRadius();\n} else {\ngl_PointSize \x3d pSize;\n}\nvColor \x3d aColor;\nif (isInverted) {\ngl_Position \x3d uPMatrix * vec4(xToPixels(aVertexPosition.y) + yAxisPos, yToPixels(aVertexPosition.x, aVertexPosition.z) + xAxisPos, 0.0, 1.0);\n} else {\ngl_Position \x3d uPMatrix * vec4(xToPixels(aVertexPosition.x) + xAxisPos, yToPixels(aVertexPosition.y, aVertexPosition.z) + yAxisPos, 0.0, 1.0);\n}\n}",
"vertex"),f=c("precision highp float;\nuniform vec4 fillColor;\nvarying highp vec2 position;\nvarying highp vec4 vColor;\nuniform sampler2D uSampler;\nuniform bool isCircle;\nuniform bool hasColor;\nvoid main(void) {\nvec4 col \x3d fillColor;\nvec4 tcol;\nif (hasColor) {\ncol \x3d vColor;\n}\nif (isCircle) {\ntcol \x3d texture2D(uSampler, gl_PointCoord.st);\ncol *\x3d tcol;\nif (tcol.r \x3c 0.0) {\ndiscard;\n} else {\ngl_FragColor \x3d col;\n}\n} else {\ngl_FragColor \x3d col;\n}\n}","fragment");
if(!e||!f)return m=!1;m=a.createProgram();a.attachShader(m,e);a.attachShader(m,f);a.linkProgram(m);a.useProgram(m);a.bindAttribLocation(m,0,"aVertexPosition");l=b("uPMatrix");n=b("pSize");g=b("fillColor");S=b("isBubble");h=b("bubbleSizeAbs");z=b("bubbleSizeByArea");q=b("uSampler");d=b("skipTranslation");r=b("isCircle");k=b("isInverted");E=b("plotHeight");return!0}function f(d,c){d=b[d]=b[d]||a.getUniformLocation(m,d);a.uniform1f(d,c)}var b={},m,l,n,g,S,h,z,d,r,k,E,q;a&&e();return{psUniform:function(){return n},
pUniform:function(){return l},fillColorUniform:function(){return g},setPlotHeight:function(b){a.uniform1f(E,b)},setBubbleUniforms:function(b,d,c){var e=b.options,m=Number.MAX_VALUE,l=-Number.MAX_VALUE;"bubble"===b.type&&(m=M(e.zMin,Math.min(m,Math.max(d,!1===e.displayNegative?e.zThreshold:-Number.MAX_VALUE))),l=M(e.zMax,Math.max(l,c)),a.uniform1i(S,1),a.uniform1i(r,1),a.uniform1i(z,"width"!==b.options.sizeBy),a.uniform1i(h,b.options.sizeByAbsoluteValue),f("bubbleZMin",m),f("bubbleZMax",l),f("bubbleZThreshold",
b.options.zThreshold),f("bubbleMinSize",b.minPxSize),f("bubbleMaxSize",b.maxPxSize))},bind:function(){a.useProgram(m)},program:function(){return m},create:e,setUniform:f,setPMatrix:function(b){a.uniformMatrix4fv(l,!1,b)},setColor:function(b){a.uniform4f(g,b[0]/255,b[1]/255,b[2]/255,b[3])},setPointSize:function(b){a.uniform1f(n,b)},setSkipTranslation:function(b){a.uniform1i(d,!0===b?1:0)},setTexture:function(){a.uniform1i(q,0)},setDrawAsCircle:function(b){a.uniform1i(r,b?1:0)},reset:function(){a.uniform1i(S,
0);a.uniform1i(r,0)},setInverted:function(b){a.uniform1i(k,b)},destroy:function(){a&&m&&(a.deleteProgram(m),m=!1)}}}function Z(a,c,e){function f(){b&&(a.deleteBuffer(b),m=b=!1);g=0;l=e||2;k=[]}var b=!1,m=!1,l=e||2,n=!1,g=0,k;return{destroy:f,bind:function(){if(!b)return!1;a.vertexAttribPointer(m,l,a.FLOAT,!1,0,0)},data:k,build:function(e,g,d){var h;k=e||[];if(!(k&&0!==k.length||n))return f(),!1;l=d||l;b&&a.deleteBuffer(b);n||(h=new Float32Array(k));b=a.createBuffer();a.bindBuffer(a.ARRAY_BUFFER,b);
a.bufferData(a.ARRAY_BUFFER,n||h,a.STATIC_DRAW);m=a.getAttribLocation(c.program(),g);a.enableVertexAttribArray(m);return!0},render:function(c,e,d){var f=n?n.length:k.length;if(!b||!f)return!1;if(!c||c>f||0>c)c=0;if(!e||e>f)e=f;a.drawArrays(a[(d||"points").toUpperCase()],c/l,(e-c)/l);return!0},allocate:function(a){g=-1;n=new Float32Array(4*a)},push:function(a,b,d,c){n&&(n[++g]=a,n[++g]=b,n[++g]=d,n[++g]=c)}}}function ia(a){function c(a){var b,d;return a.isSeriesBoosting?(b=!!a.options.stacking,d=a.xData||
a.options.xData||a.processedXData,b=(b?a.data:d||a.options.data).length,"treemap"===a.type?b*=12:"heatmap"===a.type?b*=6:N[a.type]&&(b*=2),b):0}function e(){d.clear(d.COLOR_BUFFER_BIT|d.DEPTH_BUFFER_BIT)}function f(a,b){function d(a){a&&(b.colorData.push(a[0]),b.colorData.push(a[1]),b.colorData.push(a[2]),b.colorData.push(a[3]))}function c(a,b,c,e,f){d(f);p.usePreallocated?z.push(a,b,c?1:0,e||1):(E.push(a),E.push(b),E.push(c?1:0),E.push(e||1))}function e(a,b,e,f,t){d(t);c(a+e,b);d(t);c(a,b);d(t);
c(a,b+f);d(t);c(a,b+f);d(t);c(a+e,b+f);d(t);c(a+e,b)}function f(a){p.useGPUTranslations||(b.skipTranslation=!0,a.x=G.toPixels(a.x,!0),a.y=D.toPixels(a.y,!0));c(a.x,a.y,0,2)}var ja=a.pointArrayMap&&"low,high"===a.pointArrayMap.join(","),h=a.chart,t=a.options,m=!!t.stacking,g=t.data,n=a.xAxis.getExtremes(),k=n.min,n=n.max,q=a.yAxis.getExtremes(),x=q.min,q=q.max,r=a.xData||t.xData||a.processedXData,C=a.yData||t.yData||a.processedYData,w=a.zData||t.zData||a.processedZData,D=a.yAxis,G=a.xAxis,Y=a.chart.plotHeight,
T=!r||0===r.length,u=a.points||!1,F=!1,I=!1,y,Q,R,g=m?a.data:r||g,r={x:Number.MIN_VALUE,y:0},J={x:Number.MIN_VALUE,y:0},S=0,v,K,A=-1,H=!1,U=!1,M="undefined"===typeof h.index,W=!1,L=!1,V=N[a.type],O=!1,P=!0;if(!(t.boostData&&0<t.boostData.length))if(a.closestPointRangePx=Number.MAX_VALUE,u&&0<u.length)b.skipTranslation=!0,b.drawMode="triangles",u[0].node&&u[0].node.levelDynamic&&u.sort(function(a,b){if(a.node){if(a.node.levelDynamic>b.node.levelDynamic)return 1;if(a.node.levelDynamic<b.node.levelDynamic)return-1}return 0}),
B(u,function(b){var d=b.plotY,c;"undefined"===typeof d||isNaN(d)||null===b.y||(d=b.shapeArgs,c=b.series.pointAttribs(b),b=c["stroke-width"]||0,Q=l.color(c.fill).rgba,Q[0]/=255,Q[1]/=255,Q[2]/=255,"treemap"===a.type&&(b=b||1,R=l.color(c.stroke).rgba,R[0]/=255,R[1]/=255,R[2]/=255,e(d.x,d.y,d.width,d.height,R),b/=2),"heatmap"===a.type&&h.inverted&&(d.x=G.len-d.x,d.y=D.len-d.y,d.width=-d.width,d.height=-d.height),e(d.x+b,d.y+b,d.width-2*b,d.height-2*b,Q))});else{for(;A<g.length-1;){y=g[++A];if(M)break;
T?(u=y[0],v=y[1],g[A+1]&&(U=g[A+1][0]),g[A-1]&&(H=g[A-1][0]),3<=y.length&&(K=y[2],y[2]>b.zMax&&(b.zMax=y[2]),y[2]<b.zMin&&(b.zMin=y[2]))):(u=y,v=C[A],g[A+1]&&(U=g[A+1]),g[A-1]&&(H=g[A-1]),w&&w.length&&(K=w[A],w[A]>b.zMax&&(b.zMax=w[A]),w[A]<b.zMin&&(b.zMin=w[A])));U&&U>=k&&U<=n&&(W=!0);H&&H>=k&&H<=n&&(L=!0);ja?(T&&(v=y.slice(1,3)),v=v[1]):m&&(u=y.x,v=y.stackY);a.requireSorting||(P=v>=x&&v<=q);u>n&&J.x<n&&(J.x=u,J.y=v);u<k&&r.x<k&&(r.x=u,r.y=v);if(0===v||v&&P)if(u>=k&&u<=n&&(O=!0),O||W||L)p.useGPUTranslations||
(b.skipTranslation=!0,u=G.toPixels(u,!0),v=D.toPixels(v,!0),v>Y&&(v=Y)),V&&(y=0,0>v&&(y=v,v=0),p.useGPUTranslations||(y=D.toPixels(y,!0)),c(u,y,0,0,!1)),b.hasMarkers&&!1!==F&&(a.closestPointRangePx=Math.min(a.closestPointRangePx,Math.abs(u-F))),!p.useGPUTranslations&&!p.usePreallocated&&F&&1>u-F&&I&&1>Math.abs(v-I)?p.debug.showSkipSummary&&++S:(t.step&&c(u,I,0,2,!1),c(u,v,0,"bubble"===a.type?K||1:2,!1),F=u,I=v)}p.debug.showSkipSummary&&console.log("skipped points:",S);F||(f(r),f(J))}}function b(){x=
[];I.data=E=[];T=[];z&&z.destroy()}function m(a){h&&(h.setUniform("xAxisTrans",a.transA),h.setUniform("xAxisMin",a.min),h.setUniform("xAxisMinPad",a.minPixelPadding),h.setUniform("xAxisPointRange",a.pointRange),h.setUniform("xAxisLen",a.len),h.setUniform("xAxisPos",a.pos),h.setUniform("xAxisCVSCoord",!a.horiz))}function g(a){h&&(h.setUniform("yAxisTrans",a.transA),h.setUniform("yAxisMin",a.min),h.setUniform("yAxisMinPad",a.minPixelPadding),h.setUniform("yAxisPointRange",a.pointRange),h.setUniform("yAxisLen",
a.len),h.setUniform("yAxisPos",a.pos),h.setUniform("yAxisCVSCoord",!a.horiz))}function n(a,b){h.setUniform("hasThreshold",a);h.setUniform("translatedThreshold",b)}function k(c){if(c)r=c.chartWidth||800,D=c.chartHeight||400;else return!1;if(!d||!r||!D)return!1;p.debug.timeRendering&&console.time("gl rendering");d.canvas.width=r;d.canvas.height=D;h.bind();d.viewport(0,0,r,D);h.setPMatrix([2/r,0,0,0,0,-(2/D),0,0,0,0,-2,0,-1,1,-1,1]);h.setPlotHeight(c.plotHeight);1<p.lineWidth&&!l.isMS&&d.lineWidth(p.lineWidth);
z.build(I.data,"aVertexPosition",4);z.bind();w&&(d.bindTexture(d.TEXTURE_2D,G),h.setTexture(G));h.setInverted(c.inverted);B(x,function(a,b){var c=a.series.options,e=c.threshold,f=K(e),e=a.series.yAxis.getThreshold(e),t=M(c.marker?c.marker.enabled:null,a.series.xAxis.isRadial?!0:null,a.series.closestPointRangePx>2*((c.marker?c.marker.radius:10)||10)),k=a.series.pointAttribs&&a.series.pointAttribs().fill||a.series.color;a.series.fillOpacity&&c.fillOpacity&&(k=(new aa(k)).setOpacity(M(c.fillOpacity,
1)).get());c.colorByPoint&&(k=a.series.chart.options.colors[b]);k=l.color(k).rgba;p.useAlpha||(k[3]=1);"lines"===a.drawMode&&p.useAlpha&&1>k[3]&&(k[3]/=10);"add"===c.boostBlending?(d.blendFunc(d.SRC_ALPHA,d.ONE),d.blendEquation(d.FUNC_ADD)):"mult"===c.boostBlending?d.blendFunc(d.DST_COLOR,d.ZERO):"darken"===c.boostBlending?(d.blendFunc(d.ONE,d.ONE),d.blendEquation(d.FUNC_MIN)):d.blendFuncSeparate(d.SRC_ALPHA,d.ONE_MINUS_SRC_ALPHA,d.ONE,d.ONE_MINUS_SRC_ALPHA);h.reset();0<a.colorData.length&&(h.setUniform("hasColor",
1),b=Z(d,h),b.build(a.colorData,"aColor",4),b.bind());h.setColor(k);m(a.series.xAxis);g(a.series.yAxis);n(f,e);"points"===a.drawMode&&(c.marker&&c.marker.radius?h.setPointSize(2*c.marker.radius):h.setPointSize(1));h.setSkipTranslation(a.skipTranslation);"bubble"===a.series.type&&h.setBubbleUniforms(a.series,a.zMin,a.zMax);h.setDrawAsCircle(W[a.series.type]&&w||!1);z.render(a.from,a.to,a.drawMode);a.hasMarkers&&t&&(c.marker&&c.marker.radius?h.setPointSize(2*c.marker.radius):h.setPointSize(10),h.setDrawAsCircle(!0),
z.render(a.from,a.to,"POINTS"))});p.debug.timeRendering&&console.timeEnd("gl rendering");a&&a();b()}function q(a){e();if(a.renderer.forExport)return k(a);J?k(a):setTimeout(function(){q(a)},1)}var h=!1,z=!1,d=!1,r=0,D=0,E=!1,T=!1,w=!1,I={},J=!1,x=[],F=H.createElement("canvas"),C=F.getContext("2d"),G,N={column:!0,bar:!0,area:!0},W={scatter:!0,bubble:!0},p={pointSize:1,lineWidth:1,fillColor:"#AA00AA",useAlpha:!0,usePreallocated:!1,useGPUTranslations:!1,debug:{timeRendering:!1,timeSeriesProcessing:!1,
timeSetup:!1,timeBufferCopy:!1,timeKDTree:!1,showSkipSummary:!1}};return I={allocateBufferForSingleSeries:function(a){var b=0;p.usePreallocated&&(a.isSeriesBoosting&&(b=c(a)),z.allocate(b))},pushSeries:function(a){0<x.length&&(x[x.length-1].to=E.length,x[x.length-1].hasMarkers&&(x[x.length-1].markerTo=T.length));p.debug.timeSeriesProcessing&&console.time("building "+a.type+" series");x.push({from:E.length,markerFrom:T.length,colorData:[],series:a,zMin:Number.MAX_VALUE,zMax:-Number.MAX_VALUE,hasMarkers:a.options.marker?
!1!==a.options.marker.enabled:!1,showMarksers:!0,drawMode:{area:"lines",arearange:"lines",areaspline:"line_strip",column:"lines",bar:"lines",line:"line_strip",scatter:"points",heatmap:"triangles",treemap:"triangles",bubble:"points"}[a.type]||"line_strip"});f(a,x[x.length-1]);p.debug.timeSeriesProcessing&&console.timeEnd("building "+a.type+" series")},setSize:function(a,b){if(r!==a||b!==b)r=a,D=b,h.bind(),h.setPMatrix([2/r,0,0,0,0,-(2/D),0,0,0,0,-2,0,-1,1,-1,1])},inited:function(){return J},setThreshold:n,
init:function(a,c){var e=0,f=["webgl","experimental-webgl","moz-webgl","webkit-3d"];J=!1;if(!a)return!1;for(p.debug.timeSetup&&console.time("gl setup");e<f.length&&!(d=a.getContext(f[e],{}));e++);if(d)c||b();else return!1;d.enable(d.BLEND);d.blendFunc(d.SRC_ALPHA,d.ONE_MINUS_SRC_ALPHA);d.disable(d.DEPTH_TEST);d.depthFunc(d.LESS);h=ha(d);z=Z(d,h);w=!1;G=d.createTexture();F.width=512;F.height=512;C.mozImageSmoothingEnabled=!1;C.webkitImageSmoothingEnabled=!1;C.msImageSmoothingEnabled=!1;C.imageSmoothingEnabled=
!1;C.strokeStyle="rgba(255, 255, 255, 0)";C.fillStyle="#FFF";C.beginPath();C.arc(256,256,256,0,2*Math.PI);C.stroke();C.fill();try{d.bindTexture(d.TEXTURE_2D,G),d.texImage2D(d.TEXTURE_2D,0,d.RGBA,d.RGBA,d.UNSIGNED_BYTE,F),d.texParameteri(d.TEXTURE_2D,d.TEXTURE_WRAP_S,d.CLAMP_TO_EDGE),d.texParameteri(d.TEXTURE_2D,d.TEXTURE_WRAP_T,d.CLAMP_TO_EDGE),d.texParameteri(d.TEXTURE_2D,d.TEXTURE_MAG_FILTER,d.LINEAR),d.texParameteri(d.TEXTURE_2D,d.TEXTURE_MIN_FILTER,d.LINEAR),d.bindTexture(d.TEXTURE_2D,null),w=
!0}catch(ra){}J=!0;p.debug.timeSetup&&console.timeEnd("gl setup");return!0},render:q,settings:p,valid:function(){return!1!==d},clear:e,flush:b,setXAxis:m,setYAxis:g,data:E,gl:function(){return d},allocateBuffer:function(a){var b=0;p.usePreallocated&&(B(a.series,function(a){a.isSeriesBoosting&&(b+=c(a))}),z.allocate(b))},destroy:function(){b();z.destroy();h.destroy();d&&(G&&d.deleteTexture(G),d.canvas.width=1,d.canvas.height=1)},setOptions:function(a){ka(!0,p,a)}}}function ba(a,c){var e=a.chartWidth,
f=a.chartHeight,b=a,m=a.seriesGroup||c.group,g=H.implementation.hasFeature("www.http://w3.org/TR/SVG11/feature#Extensibility","1.1"),b=a.isChartSeriesBoosting()?a:c,g=!1;b.renderTarget||(b.canvas=la,a.renderer.forExport||!g?(b.renderTarget=a.renderer.image("",0,0,e,f).add(m),b.boostClear=function(){b.renderTarget.attr({href:""})},b.boostCopy=function(){b.boostResizeTarget();b.renderTarget.attr({href:b.canvas.toDataURL("image/png")})}):(b.renderTargetFo=a.renderer.createElement("foreignObject").add(m),
b.renderTarget=H.createElement("canvas"),b.renderTargetCtx=b.renderTarget.getContext("2d"),b.renderTargetFo.element.appendChild(b.renderTarget),b.boostClear=function(){b.renderTarget.width=b.canvas.width;b.renderTarget.height=b.canvas.height},b.boostCopy=function(){b.renderTarget.width=b.canvas.width;b.renderTarget.height=b.canvas.height;b.renderTargetCtx.drawImage(b.canvas,0,0)}),b.boostResizeTarget=function(){e=a.chartWidth;f=a.chartHeight;(b.renderTargetFo||b.renderTarget).attr({x:0,y:0,width:e,
height:f,style:"pointer-events: none; mix-blend-mode: normal; opacity:1"});b instanceof l.Chart&&b.markerGroup.translate(c.xAxis.pos,c.yAxis.pos)},b.boostClipRect=a.renderer.clipRect(a.plotLeft,a.plotTop,a.plotWidth,a.chartHeight),(b.renderTargetFo||b.renderTarget).clip(b.boostClipRect),b instanceof l.Chart&&(b.markerGroup=b.renderer.g().add(m),b.markerGroup.translate(c.xAxis.pos,c.yAxis.pos)));b.canvas.width=e;b.canvas.height=f;b.boostClipRect.attr({x:a.plotLeft,y:a.plotTop,width:a.plotWidth,height:a.chartHeight});
b.boostResizeTarget();b.boostClear();b.ogl||(b.ogl=ia(function(){b.ogl.settings.debug.timeBufferCopy&&console.time("buffer copy");b.boostCopy();b.ogl.settings.debug.timeBufferCopy&&console.timeEnd("buffer copy")}),b.ogl.init(b.canvas),b.ogl.setOptions(a.options.boost||{}),b instanceof l.Chart&&b.ogl.allocateBuffer(a));b.ogl.setSize(e,f);return b.ogl}function ca(a,c,e){a&&c.renderTarget&&c.canvas&&!(e||c.chart).isChartSeriesBoosting()&&a.render(e||c.chart)}function da(a,c){a&&c.renderTarget&&c.canvas&&
!c.chart.isChartSeriesBoosting()&&a.allocateBufferForSingleSeries(c)}function ma(a){var c=!0;this.chart.options&&this.chart.options.boost&&(c="undefined"===typeof this.chart.options.boost.enabled?!0:this.chart.options.boost.enabled);if(!c||!this.isSeriesBoosting)return a.call(this);this.chart.isBoosting=!0;if(a=ba(this.chart,this))da(a,this),a.pushSeries(this);ca(a,this)}var N=l.win,H=N.document,na=function(){},oa=l.Chart,aa=l.Color,q=l.Series,g=l.seriesTypes,B=l.each,ea=l.extend,fa=l.addEvent,pa=
l.fireEvent,qa=l.grep,K=l.isNumber,ka=l.merge,M=l.pick,k=l.wrap,L=l.getOptions().plotOptions,la=H.createElement("canvas"),V,ga="area arearange column bar line scatter heatmap bubble treemap".split(" "),P={};B(ga,function(a){P[a]=1});aa.prototype.names={aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",
chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",
deepskyblue:"#00bfff",dimgray:"#696969",dodgerblue:"#1e90ff",feldspar:"#d19275",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gray:"#808080",green:"#008000",greenyellow:"#adff2f",honeydew:"#f0fff0",hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavender:"#e6e6fa",lavenderblush:"#fff0f5",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",
lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgrey:"#d3d3d3",lightgreen:"#90ee90",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslateblue:"#8470ff",lightslategray:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370d8",mediumseagreen:"#3cb371",
mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#d87093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",
powderblue:"#b0e0e6",purple:"#800080",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",violetred:"#d02090",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",
yellow:"#ffff00",yellowgreen:"#9acd32"};oa.prototype.isChartSeriesBoosting=function(){return(this.options.boost&&"undefined"!==typeof this.options.boost.seriesThreshold?this.options.boost.seriesThreshold:50)<=this.series.length||O(this)};l.eachAsync=function(a,c,e,f,b,g){b=b||0;f=f||3E4;for(var m=b+f,k=!0;k&&b<m&&b<a.length;)k=c(a[b],b),++b;k&&(b<a.length?g?l.eachAsync(a,c,e,f,b,g):N.requestAnimationFrame?N.requestAnimationFrame(function(){l.eachAsync(a,c,e,f,b)}):setTimeout(function(){l.eachAsync(a,
c,e,f,b)}):e&&e())};q.prototype.getPoint=function(a){var c=a,e=this.xData||this.options.xData||this.processedXData||!1;!a||a instanceof this.pointClass||(c=(new this.pointClass).init(this,this.options.data[a.i],e?e[a.i]:void 0),c.category=c.x,c.dist=a.dist,c.distX=a.distX,c.plotX=a.plotX,c.plotY=a.plotY,c.index=a.i);return c};k(q.prototype,"searchPoint",function(a){return this.getPoint(a.apply(this,[].slice.call(arguments,1)))});k(q.prototype,"destroy",function(a){var c=this,e=c.chart;e.markerGroup===
c.markerGroup&&(c.markerGroup=null);e.hoverPoints&&(e.hoverPoints=qa(e.hoverPoints,function(a){return a.series===c}));e.hoverPoint&&e.hoverPoint.series===c&&(e.hoverPoint=null);a.call(this)});k(q.prototype,"getExtremes",function(a){if(!this.isSeriesBoosting||!this.hasExtremes||!this.hasExtremes())return a.apply(this,Array.prototype.slice.call(arguments,1))});B(ga,function(a){L[a]&&(L[a].boostThreshold=5E3,L[a].boostData=[],g[a].prototype.fillOpacity=!0)});B(["translate","generatePoints","drawTracker",
"drawPoints","render"],function(a){function c(c){var e=this.options.stacking&&("translate"===a||"generatePoints"===a),b=!0;this.chart&&this.chart.options&&this.chart.options.boost&&(b="undefined"===typeof this.chart.options.boost.enabled?!0:this.chart.options.boost.enabled);if(!this.isSeriesBoosting||e||!b||"heatmap"===this.type||"treemap"===this.type)c.call(this);else if(this[a+"Canvas"])this[a+"Canvas"]()}k(q.prototype,a,c);"translate"===a&&(g.column&&k(g.column.prototype,a,c),g.bar&&k(g.bar.prototype,
a,c),g.arearange&&k(g.arearange.prototype,a,c),g.treemap&&k(g.treemap.prototype,a,c),g.heatmap&&k(g.heatmap.prototype,a,c))});k(q.prototype,"processData",function(a){function c(a){return e.chart.isChartSeriesBoosting()||(a?a.length:0)>=(e.options.boostThreshold||Number.MAX_VALUE)}var e=this,f=this.options.data;c(f)&&"heatmap"!==this.type&&"treemap"!==this.type&&this.hasExtremes&&this.hasExtremes(!0)||(a.apply(this,Array.prototype.slice.call(arguments,1)),f=this.processedXData);(this.isSeriesBoosting=
c(f))?this.enterBoost():this.exitBoost&&this.exitBoost()});k(q.prototype,"setVisible",function(a,c,e){a.call(this,c,e);!1===this.visible&&this.canvas&&this.renderTarget&&(this.ogl&&this.ogl.clear(),this.boostClear())});q.prototype.enterBoost=function(){this.alteredByBoost=[];B(["allowDG","directTouch","stickyTracking"],function(a){this.alteredByBoost.push({prop:a,val:this[a],own:this.hasOwnProperty(a)})},this);this.directTouch=this.allowDG=!1;this.stickyTracking=!0;this.animate=null;this.labelBySeries&&
(this.labelBySeries=this.labelBySeries.destroy())};q.prototype.exitBoost=function(){B(this.alteredByBoost||[],function(a){a.own?this[a.prop]=a.val:delete this[a.prop]},this);this.boostClear&&this.boostClear()};q.prototype.hasExtremes=function(a){var c=this.options,e=this.xAxis&&this.xAxis.options,f=this.yAxis&&this.yAxis.options;return c.data.length>(c.boostThreshold||Number.MAX_VALUE)&&K(f.min)&&K(f.max)&&(!a||K(e.min)&&K(e.max))};q.prototype.destroyGraphics=function(){var a=this,c=this.points,e,
f;if(c)for(f=0;f<c.length;f+=1)(e=c[f])&&e.graphic&&(e.graphic=e.graphic.destroy());B(["graph","area","tracker"],function(b){a[b]&&(a[b]=a[b].destroy())})};(function(){var a=0,c,e=["webgl","experimental-webgl","moz-webgl","webkit-3d"],f=!1;if("undefined"!==typeof N.WebGLRenderingContext)for(c=H.createElement("canvas");a<e.length;a++)try{if(f=c.getContext(e[a]),"undefined"!==typeof f&&null!==f)return!0}catch(b){}return!1})()?(l.extend(q.prototype,{renderCanvas:function(){function a(a,b){var c,e,f,
h="undefined"===typeof g.index,l=!0;if(!h&&(N?(c=a[0],e=a[1]):(c=a,e=w[b]),F?(N&&(e=a.slice(1,3)),f=e[0],e=e[1]):C&&(c=a.x,e=a.stackY,f=e-a.y),K||(l=e>=r&&e<=D),null!==e&&c>=z&&c<=d&&l))if(a=Math.ceil(k.toPixels(c,!0)),H){if(void 0===t||a===B){F||(f=e);if(void 0===L||e>M)M=e,L=b;if(void 0===t||f<p)p=f,t=b}a!==B&&(void 0!==t&&(e=n.toPixels(M,!0),x=n.toPixels(p,!0),X(a,e,L),x!==e&&X(a,x,t)),t=L=void 0,B=a)}else e=Math.ceil(n.toPixels(e,!0)),X(a,e,b);return!h}function c(){pa(e,"renderedCanvas");delete e.buildKDTree;
e.buildKDTree();O.debug.timeKDTree&&console.timeEnd("kd tree building")}var e=this,f=e.options||{},b=!1,g=e.chart,k=this.xAxis,n=this.yAxis,q=f.xData||e.processedXData,w=f.yData||e.processedYData,h=f.data,b=k.getExtremes(),z=b.min,d=b.max,b=n.getExtremes(),r=b.min,D=b.max,E={},B,H=!!e.sampling,I,J=!1!==f.enableMouseTracking,x=n.getThreshold(f.threshold),F=e.pointArrayMap&&"low,high"===e.pointArrayMap.join(","),C=!!f.stacking,G=e.cropStart||0,K=e.requireSorting,N=!q,p,M,t,L,O,P=this.xData||this.options.xData||
this.processedXData||!1,X=function(a,b,c){V=a+","+b;J&&!E[V]&&(E[V]=!0,g.inverted&&(a=k.len-a,b=n.len-b),I.push({x:P?P[G+c]:!1,clientX:a,plotX:a,plotY:b,i:G+c}))},b=ba(g,e);g.isBoosting=!0;O=b.settings;if(this.visible){if(this.points||this.graph)this.animate=null,this.destroyGraphics();g.isChartSeriesBoosting()?this.markerGroup=g.markerGroup:this.markerGroup=e.plotGroup("markerGroup","markers",!0,1,g.seriesGroup);I=this.points=[];e.buildKDTree=na;b&&(da(b,this),b.pushSeries(e),ca(b,this,g));g.renderer.forExport||
(O.debug.timeKDTree&&console.time("kd tree building"),l.eachAsync(C?e.data:q||h,a,c))}}}),B(["heatmap","treemap"],function(a){g[a]&&k(g[a].prototype,"drawPoints",ma)}),g.bubble&&(delete g.bubble.prototype.buildKDTree,k(g.bubble.prototype,"markerAttribs",function(a){return this.isSeriesBoosting?!1:a.apply(this,[].slice.call(arguments,1))})),g.scatter.prototype.fill=!0,ea(g.area.prototype,{fill:!0,fillOpacity:!0,sampling:!0}),ea(g.column.prototype,{fill:!0,sampling:!0}),l.Chart.prototype.callbacks.push(function(a){fa(a,
"predraw",function(){a.boostForceChartBoost=void 0;a.boostForceChartBoost=O(a);a.isBoosting=!1;!a.isChartSeriesBoosting()&&a.didBoost&&(a.didBoost=!1);a.boostClear&&a.boostClear();a.canvas&&a.ogl&&a.isChartSeriesBoosting()&&(a.didBoost=!0,a.ogl.allocateBuffer(a));a.markerGroup&&a.xAxis&&0<a.xAxis.length&&a.yAxis&&0<a.yAxis.length&&a.markerGroup.translate(a.xAxis[0].pos,a.yAxis[0].pos)});fa(a,"render",function(){a.ogl&&a.isChartSeriesBoosting()&&a.ogl.render(a)})})):"undefined"!==typeof l.initCanvasBoost?
l.initCanvasBoost():l.error(26)})(w)});
