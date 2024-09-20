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
        
        print(f"Performing job search: {url}")
        print(f"Token: {token}")
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 200:
            jobs = response.json()
            job_ids_batch = [job["_id"] for job in jobs]
            job_ids.extend(job_ids_batch)
            print(f"Search successful. Found {len(job_ids_batch)} jobs: {job_ids_batch}")
        else:
            print(f"Error during job search (status: {response.status_code}): {response.text}")

    return job_ids

# Function to simulate job views
def view_jobs(token, job_ids, num_views):
    print(f"Viewing {num_views} jobs.")
    for _ in range(min(num_views, len(job_ids))):
        job_id = random.choice(job_ids)
        print(f"Viewing job with ID: {job_id}")
        response = requests.get(f"{BASE_URL}/api/jobs/{job_id}", headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 200:
            print(f"Successfully viewed job: {job_id}")
        else:
            print(f"Failed to view job {job_id} (status: {response.status_code}): {response.text}")

# Function to simulate job applications
def apply_to_jobs(token, job_ids, num_applies):
    print(f"Applying to {num_applies} jobs.")
    for _ in range(min(num_applies, len(job_ids))):
        job_id = random.choice(job_ids)
        payload = {"sop": "This is a sample SOP."}
        print(f"Applying to job with ID: {job_id}")
        response = requests.post(f"{BASE_URL}/api/jobs/{job_id}/applications", json=payload, headers={"Authorization": f"Bearer {token}"})
        
        if response.status_code == 200:
            print(f"Successfully applied to job: {job_id}")
        else:
            print(f"Failed to apply to job {job_id} (status: {response.status_code}): {response.text}")

# Function to load applicant users from file
def load_applicants(file):
    applicants = []
    with open(file, "r") as f:
        for line in f:
            email, password = line.strip().split(",")
            applicants.append({"email": email, "password": password})
    print(f"Loaded {len(applicants)} applicants from {file}")
    return applicants

# Function to log in applicant users and return tokens
def login_applicant(email, password):
    payload = {"email": email, "password": password}
    print(f"Logging in user: {email}")
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    if response.status_code == 200:
        token = response.json()["token"]
        print(f"Login successful for {email}")
        return token
    else:
        print(f"Failed to log in {email} (status: {response.status_code}): {response.text}")
        return None

# Main function to simulate traffic
def simulate_traffic(num_searches, num_views, num_applies, applicant_file, search_options):
    print(f"Starting traffic simulation with {num_searches} searches, {num_views} views, {num_applies} applications per applicant.")
    applicants = load_applicants(applicant_file)
    
    for applicant in applicants:
        token = login_applicant(applicant["email"], applicant["password"])
        if token:
            job_ids = search_jobs(token, num_searches, search_options)
            if job_ids:
                print(f"Proceeding to view and apply to jobs. {len(job_ids)} jobs available.")
                view_jobs(token, job_ids, num_views)
                apply_to_jobs(token, job_ids, num_applies)
            else:
                print("No jobs found in the search.")
        print("=" * 40)  # Separator between applicants for clarity

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

