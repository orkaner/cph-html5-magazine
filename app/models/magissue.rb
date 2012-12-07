class Magissue < ActiveRecord::Base
  attr_accessible :date, :number, :status, :volume, :magtemplate_id, :magazine_id

  # A magazine issue should not be crated if its date is not specified
  validates :date, :presence => true

  # A magazine issue uses one template
  belongs_to :magtemplate

  # A magazine issue can have many articles.
  # When a 'magissue' is destroyed, articles will refer to non existent magazine issues, this is fixed by making these
  # articles referring to 'nil'
  has_many :articles, :dependent => :nullify

  # A magazine issue belongs to a magazine
  belongs_to :magazine
end
