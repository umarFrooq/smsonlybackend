import json
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the login page to set up local storage
    page.goto("http://localhost:5173/login")

    # Mock user data
    auth_data = {
        "state": {
            "token": "mock_token",
            "user": {
                "id": "mock_teacher_id",
                "fullname": "Teacher User",
                "email": "teacher@example.com"
            },
            "roles": ["teacher"],
            "permissions": ["manageResults"],
            "isAuthenticated": True
        },
        "version": 0
    }

    # Set the auth data in local storage
    page.evaluate(f"localStorage.setItem('auth-storage', '{json.dumps(auth_data)}')")

    # Navigate to the result management page
    page.goto("http://localhost:5173/teacher/results/entry")

    # Wait for the page to load
    page.wait_for_selector("h1:has-text('Enter Results')")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
