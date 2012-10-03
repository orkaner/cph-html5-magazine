Given /^I click Admin button Welcome page$/ do

visit '/'

click_on ('Admin')


 
end

Given /^I click new magazine$/ do 

visit '/magazines/'

click_on ('New Magazine')


 
end


When /^I fill the New Magazine form$/ do


visit '/magazines/new'

find(:css, "input[id$='name']").set("Capybara Test")
find(:css, "input[id$='volume']").set("1.1")
find(:css, "input[id$='number']").set("1")
page.select("Not Published", :from => "Status")
  
 click_button 'Create Magazine'

end




Then /^I should direct to success page$/ do

end


