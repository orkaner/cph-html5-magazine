class Article < ActiveRecord::Base
  attr_accessible :author, :date, :headline, :status, :text, :title, :version
end
