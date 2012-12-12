require 'spec_helper'

feature 'Reading a magazine issue' do
  # Put here variables you would use on the different scenarios.
  before :all do
    @issue = FactoryGirl.create(:magissue, :status => 'Not Published')
  end

  before do

    visit '/'
    page.should have_content('Alice') # The default magazine name is "Alice"

  end

  scenario 'choose a magazine' do

    click_link 'Alice'
    # Be sure we are not showing the admin magazine page
    page.current_path.should == welcome_path(1)
    # As this magazine has no published issues, no issues should be shown
    page.should have_content('No published issues')
    # It shouldn't be possible to edit a magazine issue from this page
    page.should_not have_content('Edit')
  end

  scenario 'read a magazine issue' do

    @issue.status = "Published"
    @issue.save
    click_link 'Alice'
    # Be sure we are not showing the admin magazine page
    page.current_path.should == welcome_path(1)
    # The magazine issue is created using today's date
    page.should have_content(Date.today)
    # It shouldn't be possible to edit a magazine issue from this page
    page.should_not have_content('Edit')

    click_link Date.today.to_s
    # By clicking on the magazine issue date we should be able to start reading the it.
    page.current_path.should == cover_magissue_path(@issue)
  end

end