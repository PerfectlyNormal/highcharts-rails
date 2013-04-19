# Highcharts-Rails

This gem just includes [Highcharts](http://highcharts.com/) as an asset in the Rails 3.1 (or newer) asset pipeline.
Highcharts is not free for commercial use, so make sure you have a [valid license](http://highcharts.com/license) to use Highcharts.

## Installation

Add the gem to the Gemfile

    gem "highcharts-rails", "~> 3.0.0"
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

    //= require highcharts/adapters/mootools
    //= require highcharts/adapters/prototype

Or the modules

    //= require highcharts/modules/canvas-tools
    //= require highcharts/modules/data
    //= require highcharts/modules/exporting
    //= require highcharts/modules/funnel

Or one of the themes

    //= require highcharts/themes/dark-blue
    //= require highcharts/themes/dark-green
    //= require highcharts/themes/gray
    //= require highcharts/themes/grid
    //= require highcharts/themes/skies

Other than that, refer to the [Highcharts documentation](http://highcharts.com/documentation/how-to-use)

## Export endpoint

This gem contains a Rack endpoint for converting the chart to a downloadable file.
It is not required by default, so to use it, `require
'highcharts/export_endpoint'`

The endpoint is basically a port of the [PHP version made available](https://github.com/highslide-software/highcharts.com/blob/master/exporting-server/php/php-batik/index.php).
It currently needs a lot of cleanup, but it is working fine for me. Your milage
may vary.

It uses [Apache Batik](http://xmlgraphics.apache.org/batik/) for the conversion, which must be
installed separately, as well as a Java Runtime Environment.

It expects to find a JRE in `/usr/bin/java`, and Batik in
`/usr/share/java/batik-rasterizer.jar`, but both paths are configurable.

Example usage in Rails:

    # config/routes.rb
    require 'highcharts/export_endpoint'

    MyRailsApp::Application.routes.draw do
      ...
      mount Highcharts::ExportEndpoint.new({
        java_path: "/usr/bin/java",
        batik: "/usr/share/java/batik-rasterizer.jar"
      }), at: "highcharts-export"
      ...
    end

    # When rendering the chart
    new Highcharts.Chart({
      ...
      exporting: {
        url: "/highcharts-export",
        ...
      }
    })

### Cocaine

The exporting endpoint uses [Cocaine](https://github.com/thoughtbot/cocaine) for
handling the command lines and arguments and so on.

I don't know a way to get optional dependencies in the gemspec, so for now
that gets added whether you want it or not. I'd like to get this fixed,
but would also like to avoid `begin; require 'cocaine'; rescue LoadError; ...; end` and similar hacks.

## Licensing

Highcharts, which makes up the majority of this gem, has [its own, separate licensing](http://highcharts.com/license).

The gem itself is released under the MIT license

## Signing

Release tags and all released gems (from 3.0.0 onwards) is signed using [rubygems-openpgp](https://www.rubygems-openpgp-ca.org/) using [my personal key](https://eastblue.org/blag/contact/), and the fingerprint is also included below.

    pub   4096R/CCFBB9EF 2013-02-01 [expires: 2017-02-01]
          Key fingerprint = 6077 34FC 32B6 6041 BF06  43F2 205D 9784 CCFB B9EF
    uid                  Per Christian Bechström Viken <perchr@northblue.org>
    uid                  [jpeg image of size 6240]
    sub   4096R/13C6EED7 2013-02-01 [expires: 2017-02-01]
