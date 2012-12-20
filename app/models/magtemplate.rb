class Magtemplate < ActiveRecord::Base

  # Naoufal: This classe is added to setup a validator for the existance of the associated stylesheet
  #@path_to_template = "app/assets/stylesheets/templates/#{:name.downcase}/"
  extend ActiveModel::Callbacks
  include ActiveModel::Validations
  include ActiveModel::Validations::Callbacks
  
  
  
  before_validation :extned_path
  after_validation :redo_path
  
  class ExistenceValidator < ActiveModel::EachValidator
    def validate_each(record, attribute, value)
      record.errors.add attribute, "has to refer to an existing file" unless
          File.exist?("#{value}")
          #File.exist?("app/assets/stylesheets/#{value}.css.scss")
    end
  end
  # ==========================================================
  attr_accessible :name, :path
  
  # A variable to store the path before it changes.
  @temp_path = ""
  
  # Extends the path with the full path for validation. This method is called before validation.
  def extned_path
    @temp_path = path
    unless name == nil
      self.path = "app/assets/stylesheets/templates/#{name.downcase}/#{path}.css.scss"
    end    
  end
  
  # Restore the path to the value entered by the user. This method is called after validation.
  def redo_path
    self.path = @temp_path
  end
  
  # Name and path are mandatory!
  validates :name, :presence => true
  validates :path, :presence => true, :existence => true
  

  # A magtemplate is used by many Magissues.
  # TODO: When a "magtemplate" is destroyed, the magissues
  # will refer to an un-existing template, this issue has to be fixed!
  has_many :magissues, :dependent => :nullify

  # A magtemplate defines many grid sizes. Sizes should be destroyed when
  # the associated magtemplate is destroyed.
  has_many :sizes, :dependent => :destroy

  # A magtemplate defines many "widths" through sizes
  has_many :widths, :through => :sizes
  
  # A magtemplate can be a default template for many magazines
  has_many :magazines, :dependent => :nullify
end
