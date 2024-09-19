import os
import requests
import openai
import random
import argparse
from opentelemetry import trace
from opentelemetry.metrics import get_meter_provider, set_meter_provider
from opentelemetry.sdk.metrics import MeterProvider

# Initialize tracer
tracer = trace.get_tracer(__name__)

# Initialize meter provider
meter_provider = MeterProvider()
set_meter_provider(meter_provider)
meter = get_meter_provider().get_meter(__name__)

# Define counters and error rate meters
generate_data_counter = meter.create_counter("generate_data_requests")
generate_data_error_rate = meter.create_counter("generate_data_errors")

sign_up_recruiter_counter = meter.create_counter("sign_up_recruiter_requests")
sign_up_recruiter_error_rate = meter.create_counter("sign_up_recruiter_errors")

post_job_counter = meter.create_counter("post_job_requests")
post_job_error_rate = meter.create_counter("post_job_errors")

sign_up_applicant_counter = meter.create_counter("sign_up_applicant_requests")
sign_up_applicant_error_rate = meter.create_counter("sign_up_applicant_errors")

clear_database_counter = meter.create_counter("clear_database_requests")
clear_database_error_rate = meter.create_counter("clear_database_errors")

# Load environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
BASE_URL = os.getenv('BASE_URL', 'http://localhost:4444')

# Set OpenAI API key
openai.api_key = OPENAI_API_KEY

# Function to generate synthetic data using OpenAI API
def generate_data(prompt):
    with tracer.start_as_current_span("generate_data"):
        generate_data_counter.add(1)
        trace.get_current_span().set_attribute("prompt", prompt)
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}]
            )
            generated_text = response.choices[0].message.content.strip()
            trace.get_current_span().set_attribute("generated_text", generated_text)
            return generated_text
        except Exception as e:
            generate_data_error_rate.add(1)
            trace.get_current_span().set_attribute("error", str(e))
            raise e

# Sign up recruiter
def sign_up_recruiter(email, password, name, contact_number, bio):
    with tracer.start_as_current_span("sign_up_recruiter"):
        sign_up_recruiter_counter.add(1)
        payload = {
            "email": email,
            "password": password,
            "type": "recruiter",
            "name": name,
            "contactNumber": contact_number,
            "bio": bio
        }
        trace.get_current_span().set_attribute("payload", payload)
        response = requests.post(f'{BASE_URL}/auth/signup', json=payload)
        trace.get_current_span().set_attribute("response_status_code", response.status_code)
        trace.get_current_span().set_attribute("response_text", response.text)
        if response.status_code != 200:
            sign_up_recruiter_error_rate.add(1)
            trace.get_current_span().set_attribute("error", "Failed to sign up recruiter")
        return response.status_code, response.json()

# Post job
def post_job(recruiter_token, title, skillsets, salary):
    with tracer.start_as_current_span("post_job"):
        post_job_counter.add(1)
        headers = {"Authorization": f"Bearer {recruiter_token}"}
        payload = {
            "title": title,
            "maxApplicants": 5,
            "maxPositions": 1,
            "deadline": "2026-02-22T18:17:24.519Z",
            "skillsets": [skillsets, "C++", "Javascript"],
            "jobType": "Full Time",
            "duration":2,
            "salary":salary
        }
        trace.get_current_span().set_attribute("payload", payload)
        response = requests.post(f'{BASE_URL}/api/jobs', headers=headers, json=payload)
        trace.get_current_span().set_attribute("response_status_code", response.status_code)
        trace.get_current_span().set_attribute("response_text", response.text)
        if response.status_code != 200:
            post_job_error_rate.add(1)
            trace.get_current_span().set_attribute("error", "Failed to post job")
        return response.status_code, response.json()

# Sign up applicant
def sign_up_applicant(email, password, name, contact_number):
    with tracer.start_as_current_span("sign_up_applicant"):
        sign_up_applicant_counter.add(1)
        payload = {
            "email": email,
            "password": password,
            "type": "applicant",
            "name": name,
            "contactNumber": contact_number
        }
        trace.get_current_span().set_attribute("payload", payload)
        response = requests.post(f'{BASE_URL}/auth/signup', json=payload)
        trace.get_current_span().set_attribute("response_status_code", response.status_code)
        trace.get_current_span().set_attribute("response_text", response.text)
        if response.status_code != 200:
            sign_up_applicant_error_rate.add(1)
            trace.get_current_span().set_attribute("error", "Failed to sign up applicant")
        return response.status_code, response.json()

# Option to clear database
def clear_database():
    with tracer.start_as_current_span("clear_database"):
        clear_database_counter.add(1)
        response = requests.post(f'{BASE_URL}/admin/clear-database')
        trace.get_current_span().set_attribute("response_status_code", response.status_code)
        if response.status_code != 200:
            clear_database_error_rate.add(1)
            trace.get_current_span().set_attribute("error", "Failed to clear database")
        if response.status_code == 200:
            try:
                return response.status_code, response.json()
            except ValueError as e:
                trace.get_current_span().set_attribute("error", str(e))
                return response.status_code, "No JSON response"
        else:
            return response.status_code, response.text

# Main script
def create_synthetic_data(num_recruiters, num_jobs, num_applicants, clear_db=False):
    with tracer.start_as_current_span("create_synthetic_data"):
        trace.get_current_span().set_attribute("num_recruiters", num_recruiters)
        trace.get_current_span().set_attribute("num_jobs", num_jobs)
        trace.get_current_span().set_attribute("num_applicants", num_applicants)
        trace.get_current_span().set_attribute("clear_db", clear_db)

        if clear_db:
            clear_database()

        # Create recruiters and jobs
        recruiter_tokens = []
        for i in range(num_recruiters):
            email = f"recruiter{i}@example.com"
            password = "password123"
            name = f"Recruiter {i}"
            contact_number = f"+91{random.randint(1000000000, 9999999999)}"
            bio = generate_data(f"Write a short bio for recruiter {name}")

            # Sign up recruiter
            status_code, response = sign_up_recruiter(email, password, name, contact_number, bio)
            if status_code == 200:
                recruiter_tokens.append(response['token'])
            else:
                trace.get_current_span().set_attribute("failed_recruiter_signup", response)

        # Post jobs for each recruiter
        for token in recruiter_tokens:
            for _ in range(num_jobs // num_recruiters):
                title = generate_data("Give me a title for a job posting.")
                skillsets = generate_data("List one unique skill for a job in 3 or less words")
                salary = random.randint(1,100000)
                
                # Post job
                status_code, response = post_job(token, title, skillsets, salary)
                if status_code != 200:
                    trace.get_current_span().set_attribute("failed_job_posting", response)

        # Create applicants
        for i in range(num_applicants):
            email = f"applicant{i}@example.com"
            password = "password123"
            name = f"Applicant {i}"
            contact_number = f"+91{random.randint(1000000000, 9999999999)}"
            
            # Sign up applicant
            status_code, response = sign_up_applicant(email, password, name, contact_number)
            if status_code != 200:
                trace.get_current_span().set_attribute("failed_applicant_signup", response)

# Command-line argument parser
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic data for the job portal.")
    parser.add_argument('--num_recruiters', type=int, required=True, help='Number of recruiters to create.')
    parser.add_argument('--num_jobs', type=int, required=True, help='Number of job postings to create.')
    parser.add_argument('--num_applicants', type=int, required=True, help='Number of applicants to create.')
    parser.add_argument('--clear_db', action='store_true', default=False, help='Optionally clear the database before adding data.')

    args = parser.parse_args()

    create_synthetic_data(
        num_recruiters=args.num_recruiters,
        num_jobs=args.num_jobs,
        num_applicants=args.num_applicants,
        clear_db=args.clear_db
    )
