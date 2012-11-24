class Article < ActiveRecord::Base
  attr_accessible :author, :date, :headline, :status, :text, :title, :version, :magazine_id, :grid_id, :assets_attributes, :assets, :videolinks_attributes

  include ActionView::Helpers::SanitizeHelper

  # An article has to have a headline to be valid.
  validates :headline, :presence => true

  # Every article may be published in a magazine
  belongs_to :magazine

  # Every article uses one grid
  belongs_to :grid

  has_many :assets, :as => :imageable
  accepts_nested_attributes_for :assets , :allow_destroy => true
  # Every article might have attached asset

  #has_attached_file :asset



  # An article can have many video links. If an article is destroyed, all its video
  # links has to be destroyed.
  has_many :videolinks, :dependent => :destroy

  # Enable nested attributes to be able to nest 'videolink''s form with 'article''s form.
  # In addition:
  #   - blank field for the attribute 'title' and 'embed_code' will not be allowed, resulting
  #   in ignoring the corresponding entry.
  #   - It is allowed to destroy a 'videolink' from the nested form
  accepts_nested_attributes_for :videolinks, :reject_if => lambda {|a| a[:embed_code].blank? and a[:title].blank?}, :allow_destroy => true


  before_save :strip_html
  def strip_html # Automatically strips any tags from any string to text typed column

    Article.content_columns.each do |column|
      if column.name == 'text'
        if !self[column.name].nil? # strip html from string if it's not empty
          #self[column.name] = sanitize(self[column.name]) # was strip_tags(self[column.name])
        end
      end
    end

  end
end
