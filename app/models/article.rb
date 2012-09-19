class Article < ActiveRecord::Base
  attr_accessible :author, :date, :headline, :status, :text, :title, :version, :magazine_id, :grid_id
  
  # Every article may be published in a magazine
  belongs_to :magazine

  # Every article uses one grid
  belongs_to :grid
end
