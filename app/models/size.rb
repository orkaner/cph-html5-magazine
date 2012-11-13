class Size < ActiveRecord::Base
  attr_accessible :magtemplate_id, :value, :width_id

  # A width (size) is defined in one or many templates
  belongs_to :magtemplate
  belongs_to :width
end
