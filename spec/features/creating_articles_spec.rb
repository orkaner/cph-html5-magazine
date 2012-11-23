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
    page.current_path.should == magazines_path + "/"
    click_link 'New Article'
  end
  scenario 'can create an article' do

    fill_in 'Title', :with => 'Title example'
    fill_in 'Author', :with => 'Author example'
    fill_in 'Headline', :with => 'Headline example'
    fill_in 'Text', :with => dummy_text
    click_button 'Create Article'
    page.should have_content('Article was successfully created.')
  end

  scenario 'can not create an article without a headline' do
    click_button 'Create Article'
    page.should have_content('prohibited this article from being saved:')
    page.should have_content("Headline can't be blank")
  end
end