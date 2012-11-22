# spec/models/magazine_spec.rb
require "spec_helper"

describe Magazine do

  it "has a valid factory" do
    FactoryGirl.create(:magazine).should be_valid
  end
  it "is invalid without a name" do
    FactoryGirl.build(:magazine, name: nil).should_not be_valid
  end
end