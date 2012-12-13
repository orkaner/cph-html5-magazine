require 'uri'

class Asset < ActiveRecord::Base
  attr_accessible :article_id, :asset_content_type, :asset_file_name, :asset_file_size, :asset_updated_at, :asset,
                  :imageable_id, :imageable_type
  #polymorphic relation where a picture can belong to articles and other models
  belongs_to :imageable, :polymorphic => true
  :article
  has_attached_file :asset,
                    :storage => :s3,
                    :bucket => 'jaywebmag',
                    :s3_credentials => {
                          :access_key_id => 'AKIAJOU2AAGCAL3OD7JQ',
                          :secret_access_key => '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'
                        },
                    :url => ':s3_domain_url', # This is necessary if the bucket is stored in Amazon European servers
                    :path => '/:class/:attachment/:id_partition/:style/:filename',
                    # :storage => :fog,
                    #                     :fog_credentials => {
                    #                         :provider                         => 'Google',
                    #                         :google_storage_access_key_id     => 'GOOGKV463XQGPGSXBL77',#'GOOGMCZOXQDTCBVWZOHT',
                    #                         :google_storage_secret_access_key => 'h4IweGfPzhsMJCWip3xzZItUvrAZ9kykk9vKW/3+',#'CG+UO42HAurabFdd1T1HKf5k2AZgSK9Da1e7WaY0'
                    #                     },
                    #                     #:fog_directory => 'ezine',
                    #                     :fog_directory => 'naoufal',
                    #                     :fog_public => true ,
                    #                     :persistent => false,
                 #   :url => "/attachments/:basename_:style.:extension",
                  #  :path => ":rails_root/public/attachments/:basename_:style.:extension"

                #  :fog_credentials => "#{Rails.root}/config/initializers/fog.rb",
                    :styles => Proc.new {|asset| asset.instance.styles}

  # Dynamic resizing code is based on the tutorial found at:
  # http://www.ryanalynporter.com/2012/06/07/resizing-thumbnails-on-demand-with-paperclip-and-rails/

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

  # Returns the ratio of the given picture
  def ratio
    geo = Paperclip::Geometry.from_file(asset.url)
    ratio = geo.width / geo.height
    
  end

  # Returns a formatted code for an image link as it is required by Treesaver
  def picture_html_code(picture_width, data_sizes)
    #picture_width = picture_container.width.sizes.find {
    #    |s| s.magtemplate.id == current_magazine.magtemplate.id }.value
    picture_height =  (picture_width / ratio).ceil
    picture_html_code = "<div data-sizes='#{data_sizes}'\n" +
        " data-minWidth='#{picture_width}' "+
        "data-minHeight='#{picture_height}' >\n" +
        "<img width='#{picture_width}' height='#{picture_height}'" +
        " src='#{dynamic_asset_url("#{picture_width}x#{picture_width}>")}' >" +
        "</div>\n"
    picture_html_code.html_safe

  end



end