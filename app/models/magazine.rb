class Magazine < ActiveRecord::Base
  attr_accessible :name, :magtemplate_id

  # A magazine should not be valid without a name
  validates :name, :presence => true

  # TODO: Check the uniqueness of the name of the magazine

  # A magazine can have many issues
  # If a magazine is destroyed, related issues should also be destroyed
  has_many :magissues, :dependent => :destroy

  # Returns a list of published issues of the magazine
  def published_issues
    pis = []
    unless magissues.blank?
      magissues.each do |issue|
        if issue.status == "Published"
          pis << issue
        end
      end
    end
    pis
  end

  # A magazine can only have one template
  belongs_to :magtemplate
end
