class Magazine < ActiveRecord::Base
  attr_accessible :date, :name, :number, :status, :volume
  
  # A magazine can have many articles
  has_many :articles
  
end
