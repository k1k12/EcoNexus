# Stress Testing

This project includes a load test using Locust to simulate concurrent user activity across all roles and endpoints in our backend API. The stress test ensures performance, stability, and security of critical features under pressure.

Reference: For full methodology and rationale, see Section 8 - Testing of the Technical Design Document.

## How to Run

From the backend dir, run:

`make stress`

This runs:
`make clear && make populate && locust -f tests/locust/locustfile.py --headless -u 50 -r 10 --host http://localhost:8000 --run-time 10s --html tests/locust/locust_report.html && open tests/locust/locust_report.html`

`-u 50`: Simulates 50 concurrent users

`-r 10`: Ramp-up rate of 10 users per second

`--run-time 30s`: Test duration is 30 seconds

`--html locust_report.html`: Generates a detailed HTML report

If the html report doesn't open automatically, manually navigate to the file in tests/locust/ and open.

## What It Does

The test simulates realistic user flows across different user roles, each targeting specific endpoints:


User Type         |	    Actions Simulated
----------------------------------------------------------------------------
Guest	          |    Product lookups and public recycling point queries
User	          |    Accesses, updates own account, checks point availability
Council	          |    Creates new recycling points, queries council data
Admin	          |    Deletes/updates other accounts, logs out, approves users
UnapprovedCouncil |	   Attempts to create data without approval (should fail)
SuspendedUser	  |    Attempts to login (should fail)
Registration	  |    Registers and logs in new users


## Results (30s)

Metric	            |   Value
--------------------------------
Total Requests	    |   1,356
Total Failures	    |   817
Avg Response Time   |	88.73 ms
Max Response Time   |	737 ms
Requests/sec (RPS)  |	45.59
Notable Successful  | **Endpoints**:

'''bash
GET /product/*: Consistently under 500ms

GET /recycling-points: Across all query modes

POST /register: ~370ms avg, no failures

POST /recycling-points: Used by council users, 100% pass rate
'''

**Expected Failures:**

bash'''
POST /login: 399/498 failed -> Invalid or blocked users

PATCH /account: 401/404 -> Unauthorized or missing users

GET /user-info: 401 -> Simulated guest/suspended access
'''

## What It Tests
This suite validates:

### Auth flows and role restrictions

### All endpoint combinations and query modes

### Security: login rejection, forbidden access, invalid state

### System performance under concurrent load

## Output

A full HTML report is saved as locust_report.html, showing:

- Per-endpoint latency
- Failure rates and causes
- Class-by-class usage ratios
- Time-based request charts

## Testing Info
You can tweak test duration and user count to simulate different environments:

# e.g. 5 min test with 200 users
`locust -f locustfile.py --headless -u 200 -r 20 --run-time 5m`
