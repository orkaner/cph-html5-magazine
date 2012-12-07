

Given /^I have a Welcome (page)$/ do |page|
 @welcome = page
end

Given /^I should see magazine list$/ do
 @magissues
end


Given /^I follow Magazines (page)$/ do |page|
@magissues = page
  
end




Then /^I should see Magazines page$/ do
  @magissues
end








