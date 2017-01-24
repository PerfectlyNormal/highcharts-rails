require 'bundler/gem_tasks'
require 'open-uri'
require 'zip'

desc 'Update to the latest version of Highcharts'
task :update, :version do |_, args|
  # After highcharts 5.0.0, chart code was was seperated into to files: code/
  # containing classic mode with styling in the code, and code/js containing
  # styled mode, where presentational code is removed. Prior to 5.0.0 this code
  # was contiained in the js/ folder
  MODULE_MAPPING = %w(
    accessibility
    annotations
    boost
    broken-axis
    canvas-tools
    data
    drilldown
    exporting
    funnel
    gant
    grid-axis
    heatmap
    no-data-to-display
    offline-exporting
    overlapping-datalabels
    series-label
    solid-gauge
    stock
    treemap
    xrange-series
  ).map do |name|
    ["modules/#{name}.src.js", "highcharts/modules/#{name}.js"]
  end.to_h
  MAPPINGS = {
    'highcharts.src.js'           => 'highcharts.js',
    'highcharts-more.src.js'      => 'highcharts/highcharts-more.js',
    'highcharts-3d.src.js'        => 'highcharts/highcharts-3d.js'
  }.merge(MODULE_MAPPING).map { |src, dst| ["code/#{src}", dst] }.to_h.freeze
  version = args[:version]
  url = "Http://code.highcharts.com/zips/Highcharts-#{version}.zip"
  puts "Fetching #{url}"
  open(url) do |f|
    Zip::File.open_buffer(f) do |file|
      file.each do |entry|
        dest_rel_path = MAPPINGS[entry.name]
        next unless dest_rel_path
        dest_path = "app/assets/javascripts/#{dest_rel_path}"
        FileUtils.remove(dest_path, force: true)
        entry.extract(dest_path)
        puts dest_rel_path + ' extracted'
      end
    end
  end
end
