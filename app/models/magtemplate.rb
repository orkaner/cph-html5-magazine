class Magtemplate < ActiveRecord::Base
  attr_accessible :name, :path

  # A magtemplate is used by many magazines.
  # TODO: When a "magtemplate" is destroyed, the magazine
  # will refer to an un-existing template, this issue has to be fixed!
  has_many :magazines

  # A magtemplate defines many grid sizes. Sizes should be destroyed when
  # the associated magtemplate is destroyed.
  has_many :sizes, :dependent => :destroy

  # A magtemplate defines many "widths" through sizes
  has_many :widths, :through => :sizes
end
