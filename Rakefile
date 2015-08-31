require 'bundler/gem_tasks'

desc "Update to the latest version of Highcharts"
task :update, :version do |t, args|
  version = args[:version]
  url = "http://code.highcharts.com/zips/Highcharts-#{version}.zip"
  puts "Fetching #{url}"
  `curl -# #{url} -o tmp/#{version}.zip`
  `unzip tmp/#{version}.zip -d tmp/#{version}`

  mappings = {
    "highcharts.src.js"           => "highcharts.js",
    "highcharts-more.src.js"      => "highcharts/highcharts-more.js",
    "highcharts-3d.src.js"        => "highcharts/highcharts-3d.js",
    "standalone-framework.src.js" => "highcharts/adapters/standalone-framework.js",
    "annotations.src.js"          => "highcharts/modules/annotations.js",
    "canvas-tools.src.js"         => "highcharts/modules/canvas-tools.js",
    "data.src.js"                 => "highcharts/modules/data.js",
    "drilldown.src.js"            => "highcharts/modules/drilldown.js",
    "exporting.src.js"            => "highcharts/modules/exporting.js",
    "funnel.src.js"               => "highcharts/modules/funnel.js",
    "heatmap.src.js"              => "highcharts/modules/heatmap.js",
    "no-data-to-display.src.js"   => "highcharts/modules/no-data-to-display.js",
    "solid-gauge.src.js"          => "highcharts/modules/solid-gauge.js",
    "treemap.src.js"              => "highcharts/modules/treemap.js",
    "broken-axis.src.js"          => "highcharts/modules/broken-axis.js",
    "boost.src.js"                => "highcharts/modules/boost.js",
    "offline-exporting.src.js"    => "highcharts/modules/offline-exporting.js",
  }
  dest = "app/assets/javascripts/"
  Dir.glob("tmp/#{version}/js/**/*.src.js").each do |file|
    name = File.basename(file)
    FileUtils.cp file, "#{dest}#{mappings[name]}", verbose: true
  end
  FileUtils.cp Dir.glob("tmp/#{version}/js/themes/*.js"), "#{dest}highcharts/themes/", verbose: true
  FileUtils.cp Dir.glob("tmp/#{version}/graphics/*.png"), "app/assets/images/highcharts", verbose: true
end
