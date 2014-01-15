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
