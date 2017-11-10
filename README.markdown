# Highcharts-Rails

This gem just includes [Highcharts](http://highcharts.com/) as an asset in the Rails 3.1 (or newer) asset pipeline.
Highcharts is not free for commercial use, so make sure you have a [valid license](http://highcharts.com/license) to use Highcharts.

If you are looking to include Highstock, Justin Kuepper has made [highstock-rails](https://github.com/justinkuepper/highstock-rails), so check it out.

## Installation

Add the gem to the Gemfile

    gem "highcharts-rails"
    # The gem version mirrors the included version of Highcharts

## Changes

We have a tiny changelog for this gem, but since it's just a tiny wrapper gem,
refer to the [Highcharts changelog](http://www.highcharts.com/documentation/changelog#highcharts)
for the important things.

## Usage

In your JavaScript manifest (e.g. `application.js`)

    //= require highcharts
    // to get the new features in 2.3.0:
    //= require highcharts/highcharts-more

Including the modules you want and need

    //= require highcharts/modules/annotations
    //= require highcharts/modules/data
    //= require highcharts/modules/drilldown
    //= require highcharts/modules/exporting
    //= require highcharts/modules/funnel
    //= require highcharts/modules/heatmap
    //= require highcharts/modules/no-data-to-display
    //= require highcharts/modules/offline-exporting

Or one of the themes

    //= require highcharts/themes/dark-blue
    //= require highcharts/themes/dark-green
    //= require highcharts/themes/gray
    //= require highcharts/themes/grid
    //= require highcharts/themes/skies

Some of the modules are meant to be loaded by Highcharts on-demand, such as `canvas-tools` (https://github.com/highcharts/highcharts/issues/2311#issuecomment-25685317), so don't require them on your own.

Other than that, refer to the [Highcharts documentation](http://www.highcharts.com/docs)

## Licensing

Highcharts, which makes up the majority of this gem, has [its own, separate licensing](http://shop.highsoft.com/highcharts.html).

The gem itself is released under the MIT license

## Signing

Release tags and all released gems (from 3.0.0 onwards) is signed using [rubygems-openpgp](https://www.rubygems-openpgp-ca.org/) using [my personal key](https://eastblue.org/blag/2013/gpg.html), and the fingerprint is also included below.

    pub   4096R/C9A283C9 2017-11-10 [expires: 2021-11-10]
          Key fingerprint = 18C6 2780 9B69 5EAC 0183  69B1 DD27 0F98 C9A2 83C9
    uid       Per Christian Bechström Viken <perchr@northblue.org>
    uid       [jpeg image of size 9212]
    sub   4096R/AFA535FE 2017-11-10 [expires: 2021-11-10]
