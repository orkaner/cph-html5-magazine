class Grid < ActiveRecord::Base
  attr_accessible :name, :path

  # A grid is used by many articles.
  # TODO: When a grid is destroyed, articles will refer to "nil", this has to be fixed properly!
  has_many :articles

  # A grid can have many containers. When a grid is destroyed, all the containers
  # belonging to it should be destroyed.
  has_many :containers, :dependent => :destroy
end
