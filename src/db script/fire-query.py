import time
import pandas as pd
from google.cloud import bigquery
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration for BigQuery
bigquery_config = {
    'project_id': os.getenv("PROJECT_ID"),
    'dataset_id': os.getenv("DATASET_ID"),
}

key_path = os.getenv("KEY_PATH")

def fire_query():
    """
    Execute a query on BigQuery and print the results.
    """
    # Create a BigQuery client with the service account key
    client = bigquery.Client.from_service_account_json(key_path)

    # SQL to query data from the BigQuery table
    query_sql = f"""
    SELECT * FROM `{bigquery_config['project_id']}.{bigquery_config['dataset_id']}.actor`
    LIMIT 1000
    """

    # Run the SQL statement
    query_job = client.query(query_sql)

    try:
        # Wait for the query to complete
        query_result = query_job.result()

        # Convert the query result to a DataFrame
        df = query_result.to_dataframe()

        # Print the DataFrame
        print(df)
        
    except Exception as e:
        print(f"Failed to execute query: {e}")

if __name__ == "__main__":
    fire_query()
