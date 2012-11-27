class Size < ActiveRecord::Base
  attr_accessible :magtemplate_id, :value, :width_id

  # value is mandatory
  validates :value, :presence => true

  # A width (size) is defined in one or many templates
  belongs_to :magtemplate
  validates_existence_of :magtemplate

  belongs_to :width
  validates_existence_of :width
end
