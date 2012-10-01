
Given /^I click home$/ do
  visit '/magazines/'
  click_on ('Home')
end

Then /^I should direct to home$/ do
  visit '/'
end
