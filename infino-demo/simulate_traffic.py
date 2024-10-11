from opentelemetry import trace

tracer = trace.get_tracer(__name__)

import requests
import random
import argparse
import os

# Set up the base URL from the environment or use a default value
BASE_URL = os.getenv('BASE_URL', 'http://localhost:4444')

# Function to simulate job searches
def search_jobs(token, num_searches, search_options):
    job_ids = []
    for _ in range(num_searches):
        # Construct search query using available filters
        query_params = []
        if search_options.get("query"):
            query_params.append(f"q={search_options['query']}")
        if search_options.get("salaryMin"):
            query_params.append(f"salaryMin={search_options['salaryMin']}")
        if search_options.get("salaryMax"):
            query_params.append(f"salaryMax={search_options['salaryMax']}")

        query_string = "&".join(query_params)
        url = f"{BASE_URL}/api/jobs?{query_string}"
        
        with tracer.start_as_current_span("job_search"):
            trace.get_current_span().set_attribute("url", url)
            trace.get_current_span().set_attribute("token", token)
        
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 200:
            jobs = response.json()
            job_ids_batch = [job["_id"] for job in jobs]
            job_ids.extend(job_ids_batch)
            with tracer.start_as_current_span("search_success"):
                trace.get_current_span().set_attribute("found_jobs_count", len(job_ids_batch))
                trace.get_current_span().set_attribute("job_ids_batch", job_ids_batch)
        else:
            with tracer.start_as_current_span("search_error"):
                trace.get_current_span().set_attribute("status_code", response.status_code)
                trace.get_current_span().set_attribute("response_text", response.text)

    return job_ids

# Function to simulate job views
def view_jobs(token, job_ids, num_views):
    with tracer.start_as_current_span("view_jobs"):
        trace.get_current_span().set_attribute("num_views", num_views)
        trace.get_current_span().set_attribute("job_ids", job_ids)
    
    for _ in range(min(num_views, len(job_ids))):
        job_id = random.choice(job_ids)
        with tracer.start_as_current_span("view_job"):
            trace.get_current_span().set_attribute("job_id", job_id)
        
        response = requests.get(f"{BASE_URL}/api/jobs/{job_id}", headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 200:
            with tracer.start_as_current_span("view_success"):
                trace.get_current_span().set_attribute("job_id", job_id)
        else:
            with tracer.start_as_current_span("view_error"):
                trace.get_current_span().set_attribute("job_id", job_id)
                trace.get_current_span().set_attribute("status_code", response.status_code)
                trace.get_current_span().set_attribute("response_text", response.text)

# Function to simulate job applications
def apply_to_jobs(token, job_ids, num_applies):
    with tracer.start_as_current_span("apply_jobs"):
        trace.get_current_span().set_attribute("num_applies", num_applies)
        trace.get_current_span().set_attribute("job_ids", job_ids)
    
    for _ in range(min(num_applies, len(job_ids))):
        job_id = random.choice(job_ids)
        payload = {"sop": "This is a sample SOP."}
        with tracer.start_as_current_span("apply_job"):
            trace.get_current_span().set_attribute("job_id", job_id)
        
        response = requests.post(f"{BASE_URL}/api/jobs/{job_id}/applications", json=payload, headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 200:
            with tracer.start_as_current_span("apply_success"):
                trace.get_current_span().set_attribute("job_id", job_id)
        else:
            with tracer.start_as_current_span("apply_error"):
                trace.get_current_span().set_attribute("job_id", job_id)
                trace.get_current_span().set_attribute("status_code", response.status_code)
                trace.get_current_span().set_attribute("response_text", response.text)

# Function to load applicant users from file
def load_applicants(file):
    applicants = []
    with open(file, "r") as f:
        for line in f:
            email, password = line.strip().split(",")
            applicants.append({"email": email, "password": password})
    with tracer.start_as_current_span("load_applicants"):
        trace.get_current_span().set_attribute("applicant_count", len(applicants))
        trace.get_current_span().set_attribute("file", file)
    return applicants

# Function to log in applicant users and return tokens
def login_applicant(email, password):
    payload = {"email": email, "password": password}
    with tracer.start_as_current_span("login_applicant"):
        trace.get_current_span().set_attribute("email", email)
    
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    if response.status_code == 200:
        token = response.json()["token"]
        with tracer.start_as_current_span("login_success"):
            trace.get_current_span().set_attribute("email", email)
        return token
    else:
        with tracer.start_as_current_span("login_error"):
            trace.get_current_span().set_attribute("email", email)
            trace.get_current_span().set_attribute("status_code", response.status_code)
            trace.get_current_span().set_attribute("response_text", response.text)
        return None

# Main function to simulate traffic
def simulate_traffic(num_searches, num_views, num_applies, applicant_file, search_options):
    with tracer.start_as_current_span("simulate_traffic"):
        trace.get_current_span().set_attribute("num_searches", num_searches)
        trace.get_current_span().set_attribute("num_views", num_views)
        trace.get_current_span().set_attribute("num_applies", num_applies)
        trace.get_current_span().set_attribute("applicant_file", applicant_file)
        trace.get_current_span().set_attribute("search_options", search_options)
    
    applicants = load_applicants(applicant_file)
    
    for applicant in applicants:
        token = login_applicant(applicant["email"], applicant["password"])
        if token:
            job_ids = search_jobs(token, num_searches, search_options)
            if job_ids:
                with tracer.start_as_current_span("proceed_to_view_apply"):
                    trace.get_current_span().set_attribute("job_ids_count", len(job_ids))
                view_jobs(token, job_ids, num_views)
                apply_to_jobs(token, job_ids, num_applies)
            else:
                with tracer.start_as_current_span("no_jobs_found"):
                    trace.get_current_span().set_attribute("message", "No jobs found in the search.")
        with tracer.start_as_current_span("applicant_separator"):
            trace.get_current_span().set_attribute("separator", "=" * 40)

# Command-line argument parser
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate traffic for job portal.")
    parser.add_argument('--num_searches', type=int, required=True, help='Number of searches per applicant.')
    parser.add_argument('--num_views', type=int, required=True, help='Number of job views per applicant.')
    parser.add_argument('--num_applies', type=int, required=True, help='Number of job applications per applicant.')
    parser.add_argument('--applicant_file', type=str, default='applicant_users.txt', help='File with applicant users and passwords.')
    parser.add_argument('--search_query', type=str, default=' ', help='Search query for job search.')
    parser.add_argument('--salary_min', type=int, default=20000, help='Minimum salary for job search.')
    parser.add_argument('--salary_max', type=int, default=80000, help='Maximum salary for job search.')

    args = parser.parse_args()

    search_options = {
        "query": args.search_query,
        "salaryMin": args.salary_min,
        "salaryMax": args.salary_max
    }

    simulate_traffic(args.num_searches, args.num_views, args.num_applies, args.applicant_file, search_options)
