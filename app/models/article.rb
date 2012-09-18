class Article < ActiveRecord::Base
  attr_accessible :author, :date, :headline, :status, :text, :title, :version
  
  # Every article may be published in a magazine
  belongs_to :magazine
  
end
