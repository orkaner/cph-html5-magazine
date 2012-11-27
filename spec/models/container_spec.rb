require "spec_helper"


describe Container do

  it "has a valid factory" do
    FactoryGirl.create(:container).should be_valid
  end
  it "is invalid without data_sizes" do
    FactoryGirl.build(:container, data_sizes: nil).should_not be_valid
  end
end