#defining the imageable module
lib/imageable.rb
module Imageable
  def self.included(base)
    base.class_eval do
      has_many :articles, :as => imageable
    end
  end
end
