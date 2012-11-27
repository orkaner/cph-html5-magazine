class Grid < ActiveRecord::Base
  attr_accessible :name, :path, :containers_attributes

  # The name is mandatory
  validates :name, :presence => true

  # A grid is used by many articles.
  # TODO: When an article is destroyed, grids will refer to "nil", this has to be fixed properly!
  has_many :articles

  # A grid can have many containers. When a grid is destroyed, all the containers
  # belonging to it should be destroyed.
  has_many :containers, :dependent => :destroy

  # Enable nested attributes to be able to nest 'container''s form with 'grid''s form.
  # In addition:
  #   - blank field for the attribute 'data_sizes' will not be allowed, resulting
  #   in rejecting the corresponding entry.
  #   - It is allowed to destroy a 'container' from the nested form
  accepts_nested_attributes_for :containers, :reject_if => lambda {|a| a[:data_sizes].blank?}, :allow_destroy => true
end
