class Grid < ActiveRecord::Base
  attr_accessible :name, :path

  # A grid is used by many articles
  has_many :articles
end
