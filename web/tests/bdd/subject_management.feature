Feature: Subject management for positions
  As an admin
  I want to create subjects for a position
  So that candidates can be evaluated properly

  Background:
    Given I am signed in as admin and an exam with positions exists

  Scenario: Create three subjects for Software Developer position
    When I open the Create Subject dialog and fill the form for types "笔试", "面试", and "机试" with valid fields
    Then I should see a success notification and the subject list should contain 3 new subjects

  Scenario: Form validations prevent invalid submissions
    When I submit the form with missing required fields
    Then the form should display validation messages and prevent submission

