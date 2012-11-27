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

  it "should creates a valid Treesaver HTML code for embedding YouTube videos" do

    youtube_code = '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4"'+
        ' frameborder="0" allowfullscreen></iframe>'

    @videolink = FactoryGirl.create(:videolink, :embed_code => youtube_code)


    html_code = @videolink.videolink_html_code(280, 'single')
    treesaver_code = "<div data-sizes='single'\n" +
        " data-minWidth='280'\n" +
        " data-minHeight='210'>\n" +
        "<iframe" +
        " width='280'\n" +
        " height='210'\n" +
        " src='http://www.youtube.com/embed/pHte24GGHD4' frameborder='0' allowfullscreen >\n" +
        "</iframe>\n" +
        "</div>\n"
    html_code.should eql(treesaver_code)
  end


end