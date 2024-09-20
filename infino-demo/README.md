# job-portal Traffic Simulator

A collection of scripts that a) generates synthetic data for recruiters, job postings and applicant user and b) simulates live traffic by logging as applicants, then views jobs and applies to them.

## Usage

To run the simulator:

0. Start the job-portal backend 
- npm start


1. [Optional] Start w/ a clean database
- One way to achieve that is by dropping the db from the mongo shell:

> mongosh
use jobPortal
db.dropDatabase()


2. Generate synthetic data

- Examples:
> python generate_data.py --num_jobs 100 --num_recruiters 10 --num_applicants 100

Above will create 100 jobs across 10 recruiter users, and also create 100 applicant users

NOTE:  Above command will output the applicant credentials in plaintext in a file called applicant_users.txt

3. Simulate traffic

- Example:
python simulate_traffic.py --num_searches 1 --num_applies 1 --num_views 10 --applicant_file applicant_users.txt

For each user in 'applicant_users.txt', above command will do a wildcard search for all jobs, select random jobs to view 10 times, and pick any 1 job at random to apply

> python simulate_traffic.py --num_searches 1 --num_applies 1 --num_views 10 --search_query 'Company'

Above will do the same as before but with a keyword search constraint

NOTE that at times, job applications will not go through if the same job is picked by the same applicant more than once at random.   This is done consciously to simulate real life error scenarios.




