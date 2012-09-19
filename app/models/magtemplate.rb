class Magtemplate < ActiveRecord::Base
  attr_accessible :name, :path

  # A magtemplate is used by many magazines
  has_many :magazines
end
