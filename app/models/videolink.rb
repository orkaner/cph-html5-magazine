class Videolink < ActiveRecord::Base
  attr_accessible :article_id, :embed_code, :embedded, :title

  # An video link has to have a title and an embed_code to be valid.
  validates :title, :presence => true
  validates :embed_code, :presence => true,
            :format => {
                :with => /\A<iframe width="[0-9]+" height="[0-9]+" src="http[s]?:\/\/www\.youtube(-nocookie)?\.com\/embed\/.[^\/\s"]+" frameborder="0" allowfullscreen><\/iframe>\z/,
            :message => "is an invalid YouTube embed code"}

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
  def videolink_html_code(video_width, data_sizes)

    videolink_html_code = "<div data-sizes='#{data_sizes}'\n" +
        " data-minWidth='#{video_width}'\n" +
        " data-minHeight='#{(video_width / ratio).ceil}'>\n" +
        "<iframe" +
        " width='#{video_width}'\n" +
        " height='#{(video_width / ratio).ceil}'\n" +
        " src='#{video_src}' frameborder='0' allowfullscreen >\n" +
        "</iframe>\n" +
        "</div>\n"
    videolink_html_code.html_safe

  end
end
