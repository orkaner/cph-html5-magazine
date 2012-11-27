class Width < ActiveRecord::Base
  attr_accessible :name

  # The name is mandatory
  validates :name, :presence => true

  # A "width" can have many sizes. When a "width" is deleted all the
  # related sizes should be deleted.
  has_many :sizes, :dependent => :destroy

  # A "width" can be defined in many "magtemplates" through "sizes"
  has_many :magtemplates, :through => :sizes

  # A "width" can be used to set the size of many containers. To keep the database
  # consistent, containers have to be destroyed when a "width" is destroyed. This
  # might not be convenient!
  has_many :containers, :dependent => :destroy
end
