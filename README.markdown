# Highcharts-Rails

This gem just includes [Highcharts](http://highcharts.com/) as an asset in the Rails 3.1 asset pipeline.
Highcharts is not free for commercial use, so make sure you have a [valid license](http://highcharts.com/license) to use Highcharts.

## Installation

Add the gem to the Gemfile

    gem "highcharts-rails", "~> 2.2.1"
    # The gem version mirrors the included version of Highcharts

## Changes

We have a tiny changelog for this gem, but since it's just a tiny wrapper gem, 
refer to the [Highcharts changelog](http://www.highcharts.com/documentation/changelog#highcharts)
for the important things.

## Usage

In your JavaScript manifest (e.g. `application.js`)

    //= require highcharts

To include one of the other adapters

    //= require highcharts/adapters/mootools
    //= require highcharts/adapters/prototype

Or the Exporting module

    //= require highcharts/modules/exporting

Or one of the themes

    //= require highcharts/themes/dark-blue
    //= require highcharts/themes/dark-green
    //= require highcharts/themes/gray
    //= require highcharts/themes/grid
    //= require highcharts/themes/skies

Other than that, refer to the [Highcharts documentation](http://highcharts.com/documentation/how-to-use)

## Licensing

Highcharts, which makes up the majority of this gem, has [its own, separate licensing](http://highcharts.com/license).

The gem itself is released under the MIT license