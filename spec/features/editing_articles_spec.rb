require 'spec_helper'

feature 'Editing Articles' do
  # Put here variables you would use on the different scenarios.

  before do
    # Here goes common steps that has to be done before each scenario.
    FactoryGirl.create(:article, :headline => "Old headline")
    visit '/'
    click_link 'Admin'
    page.current_path.should == magazines_path + "/"
    click_link 'Show Articles'
    page.should have_content('Listing articles')
    page.should have_content('Old headline')
    click_link "Edit"
  end

  scenario 'updating an article' do
    fill_in "Headline", :with => "New headline"
    click_button "Update Article"
    page.should have_content('Article was successfully updated.')
  end

  scenario 'can not update an article without a headline' do
    fill_in "Headline", :with => ""
    click_button 'Update Article'
    page.should have_content('prohibited this article from being saved:')
    page.should have_content("Headline can't be blank")
  end
end