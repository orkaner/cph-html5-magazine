require "spec_helper"

describe Videolink do

  it "has a valid factory" do
    FactoryGirl.create(:videolink).should be_valid
  end

  it "is invalid without a title" do
    FactoryGirl.build(:videolink, title: nil).should_not be_valid
  end

  it "is invalid without a code to embed" do
    FactoryGirl.build(:videolink, embed_code: nil).should_not be_valid
  end

  it "is invalid without a valid YouTube code to embed" do
    FactoryGirl.build(:videolink,
                      embed_code: '<iframe width="420" height="315" src="htt://www.youtube.com/embed/pHte24GGHD4?rel=0" frameborder="0" allowfullscreen></iframe>').should_not be_valid
  end
  #it "should creates a valid Treesaver HTML code for embedding YouTube videos" do


  #end


end