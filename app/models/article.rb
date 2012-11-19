class Article < ActiveRecord::Base
  attr_accessible :author, :date, :headline, :status, :text, :title, :version, :magazine_id, :grid_id, :assets_attributes, :assets

  include ActionView::Helpers::SanitizeHelper

  # Every article may be published in a magazine
  belongs_to :magazine

  # Every article uses one grid
  belongs_to :grid

  has_many :assets, :as => :imageable
  accepts_nested_attributes_for :assets , :allow_destroy => true
  # Every article might have attached asset

  #has_attached_file :asset



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
