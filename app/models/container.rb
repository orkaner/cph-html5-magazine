class Container < ActiveRecord::Base
  attr_accessible :data_sizes, :pictures, :text, :video, :width_id, :grid_id

  # A container can only have one width
  belongs_to :width
  validates_existence_of :width

  # A container belongs to a grid
  belongs_to :grid
  validates_existence_of :grid
end
