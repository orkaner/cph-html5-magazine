require 'spec_helper'

feature 'Editing Articles' do
  # Put here variables you would use on the different scenarios.
  describe 'Without video links' do
    before do
      # Here goes common steps that has to be done before each scenario.
      FactoryGirl.create(:article, :headline => "Old headline")
      visit '/'
      click_link 'Admin'
      page.current_path.should == magissues_path
      #click_button 'Articles'
      click_link 'Articles'
      page.should have_content('Listing articles')
      page.should have_content('Old headline')
      click_link "Edit"
    end

    scenario 'updating an article', js:true do
      fill_in "Headline", :with => "New headline"
      click_button "Update Article"
      page.should have_content('Article was successfully updated.')
    end

    scenario 'can not update an article without a headline', js:true do
      fill_in "Headline", :with => ""
      click_button 'Update Article'
      page.should have_content('prohibited this article from being saved:')
      page.should have_content("Headline can't be blank")
    end

    scenario 'can edit an article to add a video link to it', %q{ As a administrator:
                                                                  I can embed videos links
                                                                  In order to add media content to articles.
                                                                  }, js:true do

      click_link 'Add a video link'
      fill_in 'Video title', :with => 'Video title example'
      fill_in 'Video embed code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4"'+
          ' frameborder="0" allowfullscreen></iframe>'

      click_button 'Update Article'
      page.should have_content('Article was successfully updated.')
    end

    scenario 'can not add video links without title', js:true do
      click_link 'Add a video link'
      fill_in 'Video title', :with => ''
      fill_in 'Video embed code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4"'+
          ' frameborder="0" allowfullscreen></iframe>'
      click_button 'Update Article'

      page.should have_content('prohibited this article from being saved')
      page.should have_content("Videolinks title can't be blank")
    end

    scenario 'can not add video links without embed code', js:true do
      click_link 'Add a video link'
      fill_in 'Video title', :with => 'Video title example'
      fill_in 'Video embed code', :with => ''
      click_button 'Update Article'

      page.should have_content('prohibited this article from being saved')
      page.should have_content("Videolinks embed code can't be blank")
    end

    scenario 'ignore video links without both title and embed code', js:true do
      click_link 'Add a video link'
      fill_in 'Video title', :with => ''
      fill_in 'Video embed code', :with => ''
      click_button 'Update Article'

      page.should have_content('Article was successfully updated.')
    end

    scenario 'can not add video links if the embed code is not a valid YouTube embed code', js:true do

      click_link 'Add a video link'
      fill_in 'Video title', :with => 'Video title example'
      fill_in 'Video embed code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4?rel=0" frameborder="0" allowfullscreen></iframe'
      click_button 'Update Article'

      page.should have_content('prohibited this article from being saved')
      page.should have_content("is an invalid YouTube embed code")
    end
  end

  describe "With video links" do
    before do
      # Here goes common steps that has to be done before each scenario.
      FactoryGirl.create(:article, :headline => "Old headline")
      FactoryGirl.create(:videolink, :article_id => '1')
      visit '/'
      click_link 'Admin'
      page.current_path.should == magissues_path
      #click_button 'Articles'
      click_link 'Articles'
      page.should have_content('Listing articles')
      page.should have_content('Old headline')
      click_link "Edit"
    end
    scenario 'can not update video links if the embed code is not a valid YouTube embed code', js:true do

      fill_in 'Video title', :with => 'New Video title example'
      fill_in 'Video embed code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4?rel=0" frameborder="0" allowfullscreen></iframe'
      click_button 'Update Article'

      page.should have_content('prohibited this article from being saved')
      page.should have_content("is an invalid YouTube embed code")
    end

    scenario 'can not update video links without title', js:true do

      fill_in 'Video title', :with => ''
      click_button 'Update Article'

      page.should have_content('prohibited this article from being saved')
      page.should have_content("Videolinks title can't be blank")
    end

    scenario 'can not update video links without embed code', js:true do
      fill_in 'Video embed code', :with => ''
      click_button 'Update Article'

      page.should have_content('prohibited this article from being saved')
      page.should have_content("Videolinks embed code can't be blank")
    end

    scenario 'ignore updating video links without both title and embed code', js:true do
      fill_in 'Video title', :with => ''
      fill_in 'Video embed code', :with => ''
      click_button 'Update Article'
      # save_and_open_page # This method is from Launchy gem used here to allow debugging
      # The video link shouldn't be updated. This happens silently without informing the user with the issue.
      page.should have_content('Article was successfully updated.') # The update is successful and empty fields are ignored without further notice!
      page.should have_content("Example video title") # The video link preserves its attributes ( here title)
    end
  end

end