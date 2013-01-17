require 'spec_helper'

def fill_in_ckeditor(locator, opts)
  browser = page.driver.browser
  content = opts.fetch(:with).to_json
  browser.execute_script <<-SCRIPT
    CKEDITOR.instances['#{locator}'].setData(#{content});
    $('textarea##{locator}').text(#{content});
  SCRIPT
end

feature 'Previewing Articles' do
  # Put here variables you would use on the different scenarios.
  dummy_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In a fringilla nunc.'+
      'Cras venenatis auctor massa vitae porttitor. Maecenas ac odio aliquam ipsum sodales auctor'+
      ' at vel sapien. Sed convallis suscipit viverra. Suspendisse risus enim, porta et suscipit'+
      ' eget, viverra at orci. Sed egestas lacus vel tellus sodales auctor. Proin nec tellus lacus.'+
      ' Sed lorem urna, feugiat a congue sit amet, euismod vel lacus. Suspendisse vestibulum quam id'+
      ' neque pharetra vel dapibus magna adipiscing. Nam eros leo, auctor non lacinia sed, condimentum'+
      ' quis felis. Aliquam condimentum lacinia faucibus. Class aptent taciti sociosqu ad litora torquent'+
      ' per conubia nostra, per inceptos himenaeos. Fusce ullamcorper lobortis lorem sed mollis. Integer volutpat'+
      ' convallis neque, eget dapibus lectus posuere at.'
  describe 'With text only' do

    before do
      FactoryGirl.create(:grid)
      visit '/'
      click_link 'Admin'
      page.current_path.should == magissues_path
      #click_link 'Articles'
      click_link 'New Article'
    end

    scenario 'can preview an article that has only text after it is created' do
      fill_in 'Title', :with => 'Title example'
      fill_in 'Author', :with => 'Author example'
      fill_in 'Headline', :with => 'Headline example'

      #find(:xpath, "//input[@id='article_text']").set dummy_text
      #browser = page.driver.browser
      #browser.execute_script("CKEDITOR.instances['#{article_text}'].setData('#{dummy_text}');")
      fill_in 'article_text', :with => dummy_text # For some reason Selenium cannot see this field!
      #fill_in_ckeditor 'article_text', :with => dummy_text
      click_link 'Choose a Grid'
      choose 'article_grid_id_1'
      click_button 'Create Article'
      page.should have_content('Article was successfully created.')
      click_link 'Preview'
      page.should have_content('Headline example')
      page.should have_content('Lorem ipsum dolor sit amet')
    end
  end


  describe 'With text and pictures' do
    before do
      FactoryGirl.create(:container)
      #FactoryGirl.create(:grid)
      FactoryGirl.create(:size)
      visit '/'
      click_link 'Admin'
      page.current_path.should == magissues_path
      #click_button 'Articles'
      click_link 'New Article'
    end

    scenario 'can preview an article that has text and one picture after it is created', js:true do


      fill_in 'Title', :with => 'Title example'
      fill_in 'Author', :with => 'Author example'
      fill_in 'Headline', :with => 'Headline example'

      #find(:xpath, "//input[@id='article_text']").set dummy_text
      #browser = page.driver.browser
      #browser.execute_script("CKEDITOR.instances['#{article_text}'].setData('#{dummy_text}');")
      #fill_in 'article_text', :with => dummy_text # For some reason Selenium cannot see this field!
      fill_in_ckeditor 'article_text', :with => dummy_text
      click_link 'Upload Pictures'
      click_link 'Add Picture'
      attach_file 'Asset', 'spec/fixtures/alice.jpg'
      #save_and_open_page # This method is from Launchy gem used here to allow debugging
      # click_link 'Choose a Grid'
      #       choose('col_1_2_3_b') 
      click_button 'Create Article'

      page.should have_content('Article was successfully created.')
      click_link 'Preview'
      page.should have_content('Headline example')
      page.should have_content('Lorem ipsum dolor sit amet')
    end
  end

  describe 'With text and video links' do
    before do
      FactoryGirl.create(:container)
      #FactoryGirl.create(:grid)
      FactoryGirl.create(:size)
      visit '/'
      click_link 'Admin'
      page.current_path.should == magissues_path
      #click_button 'Articles'
      click_link 'New Article'
    end

    scenario 'can preview an article that has text and one video link after it is created', js:true do


      fill_in 'Title', :with => 'Title example'
      fill_in 'Author', :with => 'Author example'
      fill_in 'Headline', :with => 'Headline example'

      #find(:xpath, "//input[@id='article_text']").set dummy_text
      #browser = page.driver.browser
      #browser.execute_script("CKEDITOR.instances['#{article_text}'].setData('#{dummy_text}');")
      #fill_in 'article_text', :with => dummy_text # For some reason Selenium cannot see this field!
      fill_in_ckeditor 'article_text', :with => dummy_text

      click_link 'Upload YouTube Videos'
      click_link 'Add a video link'

      fill_in 'Video Title', :with => 'Video title example'
      fill_in 'Video Embed Code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4"'+
          ' frameborder="0" allowfullscreen></iframe>'

      click_button 'Create Article'
      #save_and_open_page # This method is from Launchy gem used here to allow debugging
      page.should have_content('Article was successfully created.')
      click_link 'Preview'
      page.should have_content('Headline example')
      page.should have_content('Lorem ipsum dolor sit amet')
    end
  end

end