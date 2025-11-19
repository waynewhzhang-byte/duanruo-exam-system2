Feature: Exam and Position management
  As an admin
  I want to create and view exams and positions
  So that recruitment can proceed

  Background:
    Given I am signed in as admin and selected a tenant

  Scenario: Create a new exam with minimal required fields
    When I create an exam with unique code and valid date time range formatted as "yyyy-MM-dd HH:mm:ss"
    Then the exam should be created and visible in the exam list

  Scenario: Reject duplicate exam code creation
    Given an exam exists with code "EXAM-2025-DUP"
    When I attempt to create another exam with the same code
    Then I should see an error that the code already exists

  Scenario: Create positions for an exam
    Given an exam exists with id "<examId>"
    When I create positions via API endpoint POST "/api/v1/positions" with body containing examId and fields code/title/description/quota
    Then the positions should be visible in the admin UI under that exam

