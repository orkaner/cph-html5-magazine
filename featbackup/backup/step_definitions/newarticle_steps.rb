Given /^I click Admin button Welcome page$/ do

visit '/'

click_on ('Admin')


 
end

Given /^I click new article$/ do 

visit '/articles/'

click_on ('New Article')


 
end


When /^I fill the New Article form$/ do


visit '/articles/new'

find(:css, "input[id$='title']").set("Capybara Article Test")
find(:css, "input[id$='author']").set("Capybara")
find(:css, "input[id$='headline']").set("Capybara Test")
find(:css, "input[id$='version']").set("1")
page.select("Draft", :from => "Status")
fill_in 'Text', :with=> 'Test Data'
click_button 'Create Article'
page.should have_content('Article was successfully created.')

end




Then /^I should direct to success page$/ do

end


