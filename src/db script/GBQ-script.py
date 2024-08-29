import time
import pandas as pd
from google.cloud import bigquery
import pymysql
import io
import os
from google.oauth2 import service_account
from dotenv import load_dotenv

load_dotenv()

# Configuration for MySQL and BigQuery
mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'sakila'
}
bigquery_config = {
    'project_id': os.getenv("project_id"),
    'dataset_id': os.getenv("dataset_id"),  
}

key_path = os.getenv("key_path") 

def fetch_data_from_mysql(query):
    """
    Fetch data from MySQL using a SQL query and return a DataFrame.
    """
    connection = pymysql.connect(**mysql_config)
    try:
        df = pd.read_sql(query, connection)
    finally:
        connection.close()
    return df

def upload_to_bigquery(df, table_name):
    """
    Upload a DataFrame to a BigQuery table.
    """
    # Create a BigQuery client with the service account key
    client = bigquery.Client.from_service_account_json(key_path)

    table_id = f"{bigquery_config['project_id']}.{bigquery_config['dataset_id']}.{table_name}"

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.CSV,
        skip_leading_rows=1,
        autodetect=True,
        write_disposition="WRITE_TRUNCATE"  # Overwrite table data
    )

    # Save DataFrame to a temporary CSV file
    csv_file_path = f"temp_{table_name}.csv"
    df.to_csv(csv_file_path, index=False)
    
    # Retry mechanism
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Load CSV file into BigQuery
            with open(csv_file_path, "rb") as csv_file:
                job = client.load_table_from_file(csv_file, table_id, job_config=job_config)

            # Wait for the job to complete
            while job.state != 'DONE':
                time.sleep(2)
                job.reload()
                print(f"Job status: {job.state}")

            # Print job result
            print(job.result())

            # Get table details
            table = client.get_table(table_id)
            print(
                f"Loaded {table.num_rows} rows and {len(table.schema)} columns to {table_id}."
            )
            break  # Break out of the retry loop if successful
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print("Retrying...")
            else:
                print("Max retries reached. Exiting.")
    
    # Clean up temporary file
    os.remove(csv_file_path)

def get_mysql_table_names():
    """
    Get all table names from the MySQL database.
    """
    connection = pymysql.connect(**mysql_config)
    try:
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
    finally:
        connection.close()
    return tables

def bulk_upload_mysql_to_bigquery():
    """
    Fetch data from MySQL and upload it to BigQuery.
    """
    tables = get_mysql_table_names()
    
    for table in tables:
        print(f"Processing table: {table}")
        query = f"SELECT * FROM `{table}`"
        
        # Fetch data from MySQL
        df = fetch_data_from_mysql(query)
        
        # Upload data to BigQuery
        upload_to_bigquery(df, table)

# Run the bulk upload
bulk_upload_mysql_to_bigquery()
