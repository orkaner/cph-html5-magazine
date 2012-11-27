require "spec_helper"

describe Size do

  it "has a valid factory" do
    FactoryGirl.create(:size).should be_valid
  end
  it "is invalid without a value" do
    FactoryGirl.build(:size, value: nil).should_not be_valid
  end
end