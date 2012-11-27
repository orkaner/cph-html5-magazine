require "spec_helper"

describe Magtemplate do

  it "has a valid factory" do
    FactoryGirl.create(:magtemplate).should be_valid
  end

  it "is invalid without a name" do
    FactoryGirl.build(:magtemplate, name: nil).should_not be_valid
  end

  it "is invalid without a path" do
    FactoryGirl.build(:magtemplate, path: nil).should_not be_valid
  end

  it "is invalid if the associated stylesheet does not exist" do
    #a_magtemplate = FactoryGirl.create(:magtemplate)
    #File.exist?("app/assets/stylesheets/#{a_magtemplate.path}.css.scss").should be_true
    FactoryGirl.build(:magtemplate, path: "non-existent file").should_not be_valid
  end

end