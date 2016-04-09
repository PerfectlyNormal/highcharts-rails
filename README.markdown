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
    //= require highcharts/highcharts-more # to get the new features in 2.3.0

To include one of the other adapters

    //= require highcharts/adapters/standalone-framework

Or the modules

    //= require highcharts/modules/annotations
    //= require highcharts/modules/canvas-tools
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

Other than that, refer to the [Highcharts documentation](http://www.highcharts.com/docs)

## Licensing

Highcharts, which makes up the majority of this gem, has [its own, separate licensing](http://shop.highsoft.com/highcharts.html).

The gem itself is released under the MIT license

## Signing

Release tags and all released gems (from 3.0.0 onwards) is signed using [rubygems-openpgp](https://www.rubygems-openpgp-ca.org/) using [my personal key](https://eastblue.org/blag/contact/), and the fingerprint is also included below.

    pub   4096R/CCFBB9EF 2013-02-01 [expires: 2017-02-01]
          Key fingerprint = 6077 34FC 32B6 6041 BF06  43F2 205D 9784 CCFB B9EF
    uid                  Per Christian Bechström Viken <perchr@northblue.org>
    uid                  [jpeg image of size 6240]
    sub   4096R/13C6EED7 2013-02-01 [expires: 2017-02-01]
