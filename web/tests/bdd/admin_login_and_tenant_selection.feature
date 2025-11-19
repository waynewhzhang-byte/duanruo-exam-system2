Feature: Admin login and tenant selection
  As a system administrator
  I want to sign in and choose a tenant/exam context
  So that I can manage exams, positions and subjects

  Background:
    Given an admin user exists with username "admin" and password "admin123@Abc"

  Scenario: Successful admin login shows tenant selection
    When I open "/login?role=admin" and sign in with valid credentials
    Then I should be redirected to "/tenants" or management home
    And I should see a heading containing "选择考试" or a tenant item like "默认租户"

  Scenario: Invalid credentials show an error message
    When I open "/login?role=admin" and sign in with username "admin" and password "wrong_password"
    Then I should remain on "/login"
    And I should see an error alert containing "用户名或密码错误" or "登录失败"

  Scenario: Select default tenant and reach admin panel
    Given I am signed in as admin and I am on "/tenants"
    When I choose the tenant named "默认租户"
    Then I should see admin navigation with entries like "科目管理" or be redirected to "/admin"

