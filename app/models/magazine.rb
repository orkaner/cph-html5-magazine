class Magazine < ActiveRecord::Base
  attr_accessible :date, :name, :number, :status, :volume, :magtemplate_id

  # A magazine uses one template
  belongs_to :magtemplate

  # A magazine can have many articles
  has_many :articles
  
end
