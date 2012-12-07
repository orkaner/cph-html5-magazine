# spec/models/magissue_spec.rb
require "spec_helper"

describe Magissue do

  it "has a valid factory" do
    FactoryGirl.create(:magissue).should be_valid
  end
  it "is invalid without a name" do
    FactoryGirl.build(:magissue, date: nil).should_not be_valid
  end
end