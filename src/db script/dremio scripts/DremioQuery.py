import json
import requests
import time

# Configuration
username = 'namanchandak'
password = 'Dice@123'
dremioServer = 'http://localhost:9047'
headers = {'Content-Type': 'application/json'}

# Authenticate and get token
def get_token(username, password):
    loginData = {'userName': username, 'password': password}
    response = requests.post(f'{dremioServer}/apiv2/login', headers=headers, data=json.dumps(loginData))
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        if token:
            return token
        else:
            raise Exception("Token not found in response.")
    else:
        raise Exception(f"Failed to authenticate. Status code: {response.status_code}")

# Define API functions
def apiPost(endpoint, body=None, headers=None):
    response = requests.post(f'{dremioServer}/api/v3/{endpoint}', headers=headers, data=json.dumps(body))
    if response.text:
        return response.json()
    return None

def apiGet(endpoint, headers=None):
    response = requests.get(f'{dremioServer}/api/v3/{endpoint}', headers=headers)
    if response.text:
        return response.json()
    return None

# Submit SQL query
def querySQL(query, token):
    headers_with_token = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    queryResponse = apiPost('sql', body={'sql': query}, headers=headers_with_token)
    if 'id' in queryResponse:
        return queryResponse['id']
    else:
        raise Exception(f"Error executing query: {queryResponse}")

# Check job status
def getJobStatus(jobid, token):
    headers_with_token = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    endpoint = f'job/{jobid}'
    jobStatus = apiGet(endpoint, headers=headers_with_token)
    print("Job Status Response:", jobStatus)  # Print response to inspect its structure
    return jobStatus

# Poll for job completion
def waitForJobCompletion(jobid, token, timeout=600, interval=5):
    start_time = time.time()
    while True:
        jobStatus = getJobStatus(jobid, token)
        if 'jobState' in jobStatus:
            state = jobStatus['jobState']
            if state == 'COMPLETED':
                print('Job completed successfully.')
                return
            elif state in ['FAILED', 'CANCELED']:
                raise Exception(f'Job failed with state: {state}')
        else:
            print('Unexpected job status response format:', jobStatus)
        
        if time.time() - start_time > timeout:
            raise TimeoutError('Job did not complete in the expected time.')
        print('Job is still running. Waiting...')
        time.sleep(interval)

# Retrieve query results
def getQueryResults(jobid, token, offset=0, limit=100):
    headers_with_token = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    endpoint = f'job/{jobid}/results?offset={offset}&limit={limit}'
    results = apiGet(endpoint, headers=headers_with_token)
    return results

# Main execution
try:
    # Generate token
    token = get_token(username, password)
    
    # Define SQL query
    query = "SELECT * FROM mongodb.test.dice,  mysql.sakila.actor"
    
    # Get job ID
    jobid = querySQL(query, token)
    
    # Wait for the job to complete
    waitForJobCompletion(jobid, token)
    
    # Fetch results
    results = getQueryResults(jobid, token)
    print(json.dumps(results, indent=2))
    
except Exception as e:
    print(f"An error occurred: {e}")
