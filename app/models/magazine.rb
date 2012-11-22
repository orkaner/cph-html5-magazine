class Magazine < ActiveRecord::Base
  attr_accessible :date, :name, :number, :status, :volume, :magtemplate_id

  # A magazine uses one template
  belongs_to :magtemplate

  # A magazine can have many articles.
  # TODO: When a magazine is destroyed, articles will refer to "nil", this has to be fixed properly!
  has_many :articles

  # A magazine should not be crated if it doesn't has a name
  validates :name, :presence => true
end
