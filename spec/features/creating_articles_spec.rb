require 'spec_helper'

feature 'Creating Articles' do
  dummy_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In a fringilla nunc.'+
      'Cras venenatis auctor massa vitae porttitor. Maecenas ac odio aliquam ipsum sodales auctor'+
      ' at vel sapien. Sed convallis suscipit viverra. Suspendisse risus enim, porta et suscipit'+
      ' eget, viverra at orci. Sed egestas lacus vel tellus sodales auctor. Proin nec tellus lacus.'+
      ' Sed lorem urna, feugiat a congue sit amet, euismod vel lacus. Suspendisse vestibulum quam id'+
      ' neque pharetra vel dapibus magna adipiscing. Nam eros leo, auctor non lacinia sed, condimentum'+
      ' quis felis. Aliquam condimentum lacinia faucibus. Class aptent taciti sociosqu ad litora torquent'+
      ' per conubia nostra, per inceptos himenaeos. Fusce ullamcorper lobortis lorem sed mollis. Integer volutpat'+
      ' convallis neque, eget dapibus lectus posuere at.'

  before do
    visit '/'
    click_link 'Admin'
    page.current_path.should == magissues_path
    click_button 'Articles'
    click_link 'New Article'
  end
  scenario 'can create an article', js:true do

    fill_in 'Title', :with => 'Title example'
    fill_in 'Author', :with => 'Author example'
    fill_in 'Headline', :with => 'Headline example'
    #fill_in 'Text', :with => dummy_text # For some reason Selenium cannot see this field!
    click_button 'Create Article'
    page.should have_content('Article was successfully created.')
  end

  scenario 'can not create an article without a headline', js:true do
    click_button 'Create Article'
    page.should have_content('prohibited this article from being saved')
    page.should have_content("Headline can't be blank")
  end

  scenario 'can create an article and add a video link to it', %q{ As a administrator:
                                                                  I can embed videos links
                                                                  In order to add media content to articles.
                                                                  }, js:true do
    fill_in 'Title', :with => 'Title example'
    fill_in 'Author', :with => 'Author example'
    fill_in 'Headline', :with => 'Headline example'
    #fill_in 'Text', :with => dummy_text # For some reason Selenium cannot see this field!
    click_link 'Add a video link'

    fill_in 'Video title', :with => 'Video title example'
    fill_in 'Video embed code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4"'+
       ' frameborder="0" allowfullscreen></iframe>'

    click_button 'Create Article'
    page.should have_content('Article was successfully created.')
  end

  scenario 'can not add video links without title to articles ', js:true do
    fill_in 'Title', :with => 'Title example'
    fill_in 'Author', :with => 'Author example'
    fill_in 'Headline', :with => 'Headline example'
    #fill_in 'Text', :with => dummy_text # For some reason Selenium cannot see this field!
    click_link 'Add a video link'


    fill_in 'Video embed code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4"'+
        ' frameborder="0" allowfullscreen></iframe>'

    click_button 'Create Article'

    page.should have_content('prohibited this article from being saved')
    page.should have_content("Videolinks title can't be blank")
  end

  scenario 'can not add video links without embed code to articles ', js:true do
    fill_in 'Title', :with => 'Title example'
    fill_in 'Author', :with => 'Author example'
    fill_in 'Headline', :with => 'Headline example'
    #fill_in 'Text', :with => dummy_text # For some reason Selenium cannot see this field!
    click_link 'Add a video link'
    fill_in 'Video title', :with => 'Video title example'

    fill_in 'Video embed code', :with => ''

    click_button 'Create Article'

    page.should have_content('prohibited this article from being saved')
    page.should have_content("Videolinks embed code can't be blank")
  end

  scenario 'ignore video links without both title and embed code', js:true do
    fill_in 'Title', :with => 'Title example'
    fill_in 'Author', :with => 'Author example'
    fill_in 'Headline', :with => 'Headline example'
    #fill_in 'Text', :with => dummy_text # For some reason Selenium cannot see this field!
    click_link 'Add a video link'
    fill_in 'Video title', :with => ''

    fill_in 'Video embed code', :with => ''

    click_button 'Create Article'

    page.should have_content('Article was successfully created.')
  end

  scenario 'can not add video links to articles if the embed code is not a valid YouTube embed code', js:true do
    fill_in 'Title', :with => 'Title example'
    fill_in 'Author', :with => 'Author example'
    fill_in 'Headline', :with => 'Headline example'
    #fill_in 'Text', :with => dummy_text # For some reason Selenium cannot see this field!
    click_link 'Add a video link'
    fill_in 'Video title', :with => 'Video title example'

    fill_in 'Video embed code', :with => '<iframe width="420" height="315" src="http://www.youtube.com/embed/pHte24GGHD4?rel=0" frameborder="0" allowfullscreen></iframe'

    click_button 'Create Article'

    page.should have_content('prohibited this article from being saved')
    page.should have_content("is an invalid YouTube embed code")
  end
end