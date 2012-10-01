Feature: Create Article

	Scenario:
	 Given I click Admin button Welcome page
	 Given I click new article
	 When I fill the New Article form
     Then I should direct to success page  
