class Magazine < ActiveRecord::Base
  attr_accessible :date, :name, :number, :status, :volume
end
