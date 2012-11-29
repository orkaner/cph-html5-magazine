require 'uri'

class Asset < ActiveRecord::Base
  attr_accessible :article_id, :asset_content_type, :asset_file_name, :asset_file_size, :asset_updated_at, :asset, :imageable_id, :imageable_type
  #polymorphic relation where a picture can belong to articles and other models
  belongs_to :imageable, :polymorphic => true
  :article
  has_attached_file :asset,
                    :storage => :fog,
                    :fog_credentials => {
                        :provider                         => 'Google',
                        :google_storage_access_key_id     => 'GOOGMCZOXQDTCBVWZOHT',
                        :google_storage_secret_access_key => 'CG+UO42HAurabFdd1T1HKf5k2AZgSK9Da1e7WaY0'
                    },
                    :fog_directory => 'ezine',
                    :fog_public => true ,
                    :persistent => false,
                 #   :url => "/attachments/:basename_:style.:extension",
                  #  :path => ":rails_root/public/attachments/:basename_:style.:extension"

                #  :fog_credentials => "#{Rails.root}/config/initializers/fog.rb",
                    :styles => Proc.new {|asset| asset.instance.styles}

  # Dynamic resizing code is based on the tutorial found at: http://www.ryanalynporter.com/2012/06/07/resizing-thumbnails-on-demand-with-paperclip-and-rails/

  def dynamic_style_format_symbol
    URI.escape(@dynamic_style_format).to_sym
  end

  def styles
    unless @dynamic_style_format.blank?
      { dynamic_style_format_symbol => @dynamic_style_format }
    else
      {}
    end
  end

  def dynamic_asset_url(format)
    @dynamic_style_format = format
    asset.reprocess!(dynamic_style_format_symbol) unless asset.exists?(dynamic_style_format_symbol)
    asset.url(dynamic_style_format_symbol)
  end

  # Returns a formatted code for an image link as it is required by Treesaver
  def picture_html_code(picture_width, data_sizes)
    #picture_width = picture_container.width.sizes.find {
    #    |s| s.magtemplate.id == current_magazine.magtemplate.id }.value

    picture_html_code = "<div data-sizes='#{data_sizes}'\n" +
        " data-minWidth='#{picture_width}'>\n" +
        "<img" +
        " src='#{dynamic_asset_url("#{picture_width}x#{picture_width}>")}'\n" +
        "/img>\n" +
        "</div>\n"
    picture_html_code.html_safe

  end



end