require "spec_helper"

describe Article do

  it "has a valid factory" do
    FactoryGirl.create(:article).should be_valid
  end
  it "is invalid without a headline" do
    FactoryGirl.build(:article, headline: nil).should_not be_valid
  end
end