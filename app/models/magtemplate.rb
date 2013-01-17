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
      self.path = "app/assets/templates/#{name.downcase}/#{path}.css.scss"
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
  
  # Naoufal: Experimental:======================================================================
  # Improt Magazine template from JSON file
  
  # File.join is a cross-platform way of joining directories;
  # we could have written "#{Rails.root}/public/json"
  TEMPLATE_STORE = File.join Rails.root, 'app', 'assets', 'templates'

  
  # where to write the file to
  def self.template_filename(file)
    File.join TEMPLATE_STORE, file.original_filename
  end
  
  # Where the JSON file is located given a compressed template bundle name
  def self.json_path(file)
    file_name = file.original_filename.split('.').first.downcase
    File.join TEMPLATE_STORE, file_name, "template.json"
  end
  
  
  # TODO: template, grid and width names should be unique!
  def self.import(file)
    @file_data = file
    
    # Extract the compressed template bundle
    self.unzip_file(file.tempfile.to_path.to_s, TEMPLATE_STORE)
    
    #self.store_template
    json_data = JSON.parse(IO.read(self.json_path file))
    # Create the magazine template if it doesn't exist yet.
    unless Magtemplate.find_by_name(json_data["magtemplate"]["name"])
      Magtemplate.create! json_data["magtemplate"]
    end
            
            
    # Create the widths
    json_data["widths"].each do |w|
      unless Width.find_by_name(w["name"])
        Width.create! w
      end      
    end
            
    # Create the grids
    json_data["grids"].each do |g|
      unless Grid.find_by_name(g["name"])
        Grid.create! g
      end      
    end
            
    # Create sizes
    json_data["sizes"].each do |s|
      Size.create!(:value => s["value"], :magtemplate_id => Magtemplate.find_by_name(s["magtemplate_name"]).id, 
                    :width_id => Width.find_by_name(s["width_name"]).id)
    end
            
    # Create containers
    json_data["containers"].each do |c|
      Container.create!(:grid_id => Grid.find_by_name(c["grid_name"]).id,
                        :width_id => Width.find_by_name(c["width_name"]).id,
                        :data_sizes => c["data_sizes"],
                        :pictures => c["pictures"],
                        :text => c["text"],
                        :video => c["video"])
    end
    
  end
  
  private

  # Called after saving, to writethe uploaded image to the filesystem
  def self.store_template
    if @file_data
      # make the photo_store directory if it doesn't exist already
      FileUtils.mkdir_p TEMPLATE_STORE
      # write out the image data to the file
      File.open(template_filename(@file_data), 'wb') do |f|
        f.write(@file_data.read)
      end
      # ensure file saved only when it newly arrives at model being saved
      @file_data = nil
    end
  end
  
  
  # Unzip compressed template bundle  
  def self.unzip_file (file, destination)
        Zip::ZipFile.open(file) do |zip_file|
         zip_file.each do |f|
           unless f.name =~ /\.DS_Store|__MACOSX|(^|\/)\._/
             f_path=File.join(destination, f.name)
             FileUtils.mkdir_p(File.dirname(f_path))
             zip_file.extract(f, f_path) unless File.exist?(f_path)
           end
           
         end
       end
  end

  
end
