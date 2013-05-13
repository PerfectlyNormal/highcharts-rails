# encoding: utf-8
require 'cocaine'

module Highcharts
  class ExportEndpoint
    class InsecureSVGError      < ArgumentError; end
    class MissingLibrary        < RuntimeError; end
    class FailedToGenerateChart < RuntimeError; end
    class InvalidType           < ArgumentError; end

    attr_reader :output, :options

    def initialize(options = {})
      @options = default_options.merge(options)
    end

    def default_options
      {
        java_path: "/usr/bin/java",
        batik: "/usr/share/java/batik-rasterizer.jar",
      }
    end

    def call(env)
      dup._call(env)
    end

    def _call(env)
      with_rescues do
        raise MissingLibrary.new("Could not find batik-rasterizer.jar in #{options[:batik].inspect}") unless File.exists?(options[:batik].to_s)

        request = Rack::Request.new(env)

        filename = request.params["filename"].to_s
        filename  = "chart" if filename.blank? || filename !~ /\A[A-Za-z0-9\-_ ]+\Z/

        type     = request.params["type"].to_s
        width    = request.params["width"].to_i
        svg      = request.params["svg"].to_s

        raise InsecureSVGError.new if svg.index("<!ENTITY") || svg.index("<!DOCTYPE")

        if type == "image/svg+xml"
          # We were sent SVG from the client, so can just render that back
          return [200, {
            'Content-Disposition' => "attachment; filename=\"#{filename}.svg\"",
            'Content-Type'        => 'image/svg+xml'
          }, [svg]]
        end

        width     = width > 0 ? width.to_s : "600"
        extension = case type
                    when "image/png"       then "png"
                    when "image/jpeg"      then "jpg"
                    when "application/pdf" then "pdf"
                    when "image/svg+xml"   then "svg"
                    else raise InvalidType.new("#{type} is not a valid type.")
                    end

        input     = write_svg_to_file(svg)
        @output   = create_output_file(extension)

        command.run(batik: options[:batik], outfile: output.path, type: type, width: width, infile: input.path)
        input.close
        content_length = output.size
        output.rewind

        raise FailedToGenerateChart.new("Nothing written to file") if !File.exists?(output.path) || content_length < 10

        Rack::Response.new(self, 200, {
          'Content-Disposition' => "attachment; filename=\"#{filename}.#{extension}\"",
          'Content-Type'        => type
        }).finish
      end
    end

    # Pass the block along to the output file, and
    # make sure to close the file afterwards
    def each(&block)
      output.each(&block)
    ensure
      output.close
    end

    def command
      Cocaine::CommandLine.new(options[:java_path], "-jar :batik -m :type -d :outfile -w :width :infile")
    end

    def write_svg_to_file(contents)
      # Create the file with the same encoding as the contents.
      # Trying to transcode it to UTF-8 has just caused tons of trouble, and
      # Batik seems to manage it just fine on its own when given the file
      # and whatever encoding it seems to contain.
      file = ::Tempfile.new(["highcharts-input", ".svg"], Dir.tmpdir, encoding: contents.encoding)
      file.puts contents
      file.flush
      file
    end

    def create_output_file(extension)
      file = ::Tempfile.new(["highcharts-chart", ".#{extension}"])
      file.binmode
      file
    end

    def with_rescues
      yield
    rescue Highcharts::ExportEndpoint::InsecureSVGError => e
      [400, {'Content-Type' => 'text/plain'}, ["The posted SVG could contain code for a malicious attack"]]
    rescue Highcharts::ExportEndpoint::InvalidType => e
      [400, {'Content-Type' => 'text/plain'}, [e]]
    rescue Cocaine::CommandNotFoundError => e
      [503, {'Content-Type' => 'text/plain'}, ["Unable to find required binary. #{e}"]]
    rescue Highcharts::ExportEndpoint::MissingLibrary => e
      [503, {'Content-Type' => 'text/plain'}, ["Unable to find required library. #{e}"]]
    rescue Highcharts::ExportEndpoint::FailedToGenerateChart => e
      [500, {'Content-Type' => 'text/plain'}, ["Failed to generate chart. More details may be available in the server logs."]]
    rescue => e
      [500, {'Content-Type' => 'text/plain'}, ["Something went wrong. More details may be available in the server logs."]]
    end

    def error(code, message)
      [code, {}, [message].flatten]
    end
  end
end
