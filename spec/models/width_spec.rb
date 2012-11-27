require "spec_helper"

describe Width do

  it "has a valid factory" do
    FactoryGirl.create(:width).should be_valid
  end
  it "is invalid without a name" do
    FactoryGirl.build(:width, name: nil).should_not be_valid
  end
end