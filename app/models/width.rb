class Width < ActiveRecord::Base
  attr_accessible :name

  # A "width" can have many sizes
  has_many :sizes

  # A "width" can be defined in many "magtemplates" through "sizes"
  has_many :magtemplates, :through => :sizes
end
