class Magazine < ActiveRecord::Base
  attr_accessible :name

  # A magazine should not be valid without a name
  validates :name, :presence => true

  # A magazine can have many issues
  # If a magazine is destroyed, related issues should also be destroyed
  has_many :magissues, :dependent => :destroy



end
