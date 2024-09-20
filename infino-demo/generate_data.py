import os
import requests
import openai
import random
import argparse

# Load environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
BASE_URL = os.getenv('BASE_URL', 'http://localhost:4444')

# Set OpenAI API key
openai.api_key = OPENAI_API_KEY

# Function to generate synthetic data using OpenAI API
def generate_data(prompt):
    print(f"Generating data with prompt: {prompt}")
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    generated_text = response.choices[0].message.content.strip()
    print(f"Generated text: {generated_text}")
    return generated_text

# Sign up recruiter
def sign_up_recruiter(email, password, name, contact_number, bio):
    payload = {
        "email": email,
        "password": password,
        "type": "recruiter",
        "name": name,
        "contactNumber": contact_number,
        "bio": bio
    }
    print(f"Signing up recruiter with payload: {payload}")
    response = requests.post(f'{BASE_URL}/auth/signup', json=payload)
    print(f"Response from recruiter signup: {response.status_code} - {response.text}")
    return response.status_code, response.json()

# Post job
def post_job(recruiter_token, title, skillsets, salary):
    headers = {"Authorization": f"Bearer {recruiter_token}"}
    payload = {
        "title": title,
        "maxApplicants": 5000,
        "maxPositions": 10000,
        "deadline": "2026-02-22T18:17:24.519Z",
        "skillsets": [skillsets, "C++", "Javascript"],
        "jobType": "Full Time",
        "duration":2,
        "salary":salary
    }
    print(f"Posting job with payload: {payload}")
    response = requests.post(f'{BASE_URL}/api/jobs', headers=headers, json=payload)
    print(f"Response from job posting: {response.status_code} - {response.text}")
    return response.status_code, response.json()

# Sign up applicant
def sign_up_applicant(email, password, name, contact_number):
    payload = {
        "email": email,
        "password": password,
        "type": "applicant",
        "name": name,
        "contactNumber": contact_number
    }
    print(f"Signing up applicant with payload: {payload}")
    response = requests.post(f'{BASE_URL}/auth/signup', json=payload)
    print(f"Response from applicant signup: {response.status_code} - {response.text}")
    return response.status_code, response.json()

# Option to clear database
def clear_database():
    response = requests.post(f'{BASE_URL}/admin/clear-database')
    if response.status_code == 200:
        try:
            return response.status_code, response.json()
        except ValueError:
            return response.status_code, "No JSON response"
    else:
        return response.status_code, response.text

# Write applicant credentials to a file
def write_applicant_to_file(email, password):
    with open("applicant_users.txt", "a") as file:
        file.write(f"{email},{password}\n")


# Main script
def create_synthetic_data(num_recruiters, num_jobs, num_applicants, clear_db=False):
    if clear_db:
        print("Clearing database...")
        clear_database()

    # Create recruiters and jobs
    recruiter_tokens = []
    for i in range(num_recruiters):
        email = f"recruiter{i}@example.com"
        password = "password123"
        name = generate_data(f"Just return a first and last name")
        contact_number = f"+91{random.randint(1000000000, 9999999999)}"
        bio = generate_data(f"Write a short bio for recruiter {name}")

        # Sign up recruiter
        status_code, response = sign_up_recruiter(email, password, name, contact_number, bio)
        if status_code == 200:
            recruiter_tokens.append(response['token'])
        else:
            print(f"Failed to sign up recruiter {name}: {response}")

    # Post jobs for each recruiter
    for token in recruiter_tokens:
        for _ in range(num_jobs // num_recruiters):
            title = generate_data("Give me a title for a job posting.")
            skillsets = generate_data("List one unique skill for a job in 3 or less words")
            salary = random.randint(1,100000)
            
            # Post job
            status_code, response = post_job(token, title, skillsets, salary)
            if status_code != 200:
                print(f"Failed to post job: {response}")

    # Create applicants
    for i in range(num_applicants):
        email = f"applicant{i}@example.com"
        password = "password123"
        name = generate_data(f"Just return a first and last name")
        contact_number = f"+91{random.randint(1000000000, 9999999999)}"
        
        # Sign up applicant
        status_code, response = sign_up_applicant(email, password, name, contact_number)
        if status_code != 200:
            print(f"Failed to sign up applicant {name}: {response}")
        else:
            write_applicant_to_file(email, password) # Save to file

# Command-line argument parser
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic data for the job portal.")
    parser.add_argument('--num_recruiters', type=int, required=True, help='Number of recruiters to create.')
    parser.add_argument('--num_jobs', type=int, required=True, help='Number of job postings to create.')
    parser.add_argument('--num_applicants', type=int, required=True, help='Number of applicants to create.')

    args = parser.parse_args()

    if os.path.exists("applicant_users.txt"):
        os.remove("applicant_users.txt")

    create_synthetic_data(
        num_recruiters=args.num_recruiters,
        num_jobs=args.num_jobs,
        num_applicants=args.num_applicants
    )

