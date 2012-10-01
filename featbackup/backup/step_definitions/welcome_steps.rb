

Given /^I have a Welcome (page)$/ do |page|
 @welcome = page
end

Given /^I should see magazine list$/ do
 @magazine
end


Given /^I follow Magazines (page)$/ do |page|
@magazine = page
  
end




Then /^I should see Magazines page$/ do
  @magazine
end








