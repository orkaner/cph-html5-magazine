class Magtemplate < ActiveRecord::Base
  attr_accessible :name, :path

  # A magtemplate is used by many magazines
  has_many :magazines

  # A magtemplate defines many grid sizes
  has_many :sizes

  # A magtemplate defines many "widths" through sizes
  has_many :widths, :through => :sizes
end
