require "spec_helper"

describe Grid do

  it "has a valid factory" do
    FactoryGirl.create(:grid).should be_valid
  end
  it "is invalid without a name" do
    FactoryGirl.build(:grid, name: nil).should_not be_valid
  end
end