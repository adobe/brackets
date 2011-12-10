module Jasmine
  module Core
    class << self
      def path
        File.join(File.dirname(__FILE__), "jasmine-core")
      end

      def js_files
        (["jasmine.js"] + Dir.glob(File.join(path, "*.js"))).map { |f| File.basename(f) }.uniq
      end

      SPEC_TYPES = ["core", "html", "node"]

      def core_spec_files
        spec_files("core")
      end

      def html_spec_files
        spec_files("html")
      end

      def node_spec_files
        spec_files("node")
      end

      def spec_files(type)
        raise ArgumentError.new("Unrecognized spec type") unless SPEC_TYPES.include?(type)
        (Dir.glob(File.join(path, "spec", type, "*.js"))).map { |f| File.join("spec", type, File.basename(f)) }.uniq
      end

      def css_files
        Dir.glob(File.join(path, "*.css")).map { |f| File.basename(f) }
      end
    end
  end
end
