class Videolink < ActiveRecord::Base
  attr_accessible :article_id, :embed_code, :embedded, :title

  # A video link belongs to an article
  belongs_to :article

  # Compute the ratio of a the video embedded in the YouTube HTML code
  def ratio
    doc = Nokogiri::HTML(embed_code)
    width = doc.at_css("iframe")[:width].to_f
    height = doc.at_css("iframe")[:height].to_f

    (width/height)
  end

  # Extract the link to the video from the YouTube HTML code
  def video_src
    Nokogiri::HTML(embed_code).at_css("iframe")[:src]
  end

  # Returns a formatted code for a video link as it is required by Treesaver
  def videolink_html_code(video_container, current_magazine)
    video_width = video_container.width.sizes.find {
        |s| s.magtemplate.id == current_magazine.magtemplate.id }.value

    videolink_html_code = "<figure>\n" +
        "<iframe data-sizes='#{video_container.data_sizes.sub 'title', ''}'\n" +
        " width='#{video_width}'\n" +
        " height='#{(video_width / ratio).ceil}'\n" +
        " src='#{video_src}' frameborder='0' allowfullscreen >\n" +
        "</iframe>\n" +
        "</figure>"
    videolink_html_code.html_safe

  end
end
