require 'bundler/gem_tasks'
require 'open-uri'
require 'zip'

module Bundler
  class GemHelper
    def tag_version
      sh "git tag -s -m \"Version #{version}\" #{version_tag}"
      Bundler.ui.confirm "Tagged #{version_tag}."
      yield if block_given?
    rescue
      Bundler.ui.error "Untagging #{version_tag} due to error."
      sh_with_code "git tag -d #{version_tag}"
      raise
    end
  end
end

desc 'Update to the latest version of Highcharts'
task :update, :version do |_, args|
  # After highcharts 5.0.0, chart code was was seperated into to files: code/
  # containing classic mode with styling in the code, and code/js containing
  # styled mode, where presentational code is removed. Prior to 5.0.0 this code
  # was contained in the js/ folder
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
  url = "http://code.highcharts.com/zips/Highcharts-#{version}.zip"

  puts "Fetching #{url}"
  open(url) do |stream|
    Zip::File.open_buffer(stream) do |file|
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

desc 'Update and release new version of Highcharts'
task :dist, :version do |_, args|
  version = args[:version]
  Rake::Task['update'].invoke(version)

  # Put template in CHANGELOG
  template = "# #{version} / #{Time.now.strftime("%Y-%m-%d")}\n\n* Updated Highcharts to #{version} ()\n  * ...\n\n"
  system "echo '#{template}' | cat - CHANGELOG.markdown > tmp/changelog && mv tmp/changelog CHANGELOG.markdown"
  system "open CHANGELOG.markdown -a $EDITOR"
  puts "CHANGELOG template added. Press Enter to continue when done editing"
  STDIN.gets

  # Update version
  system "sed -i '' -e 's/VERSION = \".*\"/VERSION = \"#{version}\"/' lib/highcharts/version.rb"

  # Commit changes
  print "Enter commit message: [Release v#{version}]"
  message = STDIN.gets.strip
  message = "Release v#{version}" if message == ""

  system "git add CHANGELOG.markdown lib/highcharts/version.rb app/assets"
  system "git commit -m '#{message}'"

  # Tag, build and release
  system "rake release"
end