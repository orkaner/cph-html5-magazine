@ignore
Feature: Welcome control

	Scenario: Control the welcome page if magazine list and admin button exist
	 Given I have a Welcome page
	  And I should see magazine list
	  And I follow Magazines page
	 Then I should see Magazines page


	 
