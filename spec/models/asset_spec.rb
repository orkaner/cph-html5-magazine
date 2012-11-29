require "spec_helper"

describe Asset do

  it "has a valid factory" do
    FactoryGirl.create(:asset).should be_valid
  end

end