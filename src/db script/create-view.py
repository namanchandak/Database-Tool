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
    'project_id': os.getenv("PROJECT_ID"),
    'dataset_id': os.getenv("DATASET_ID"),
}

key_path = os.getenv("KEY_PATH")

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

def create_view():
    """
    Create a view in BigQuery.
    """
    # Create a BigQuery client with the service account key
    client = bigquery.Client.from_service_account_json(key_path)

    # Adjust SQL to match actual table schema
    create_view_sql = f"""
    CREATE OR REPLACE VIEW `{bigquery_config['project_id']}.{bigquery_config['dataset_id']}.my_view` AS
    SELECT actor.actor_id, actor.first_name, actor.last_name, actor_info.film_info
    FROM `{bigquery_config['project_id']}.{bigquery_config['dataset_id']}.actor` AS actor
    JOIN `{bigquery_config['project_id']}.{bigquery_config['dataset_id']}.actor_info` AS actor_info
    ON actor.actor_id = actor_info.actor_id
    """

    # Run the SQL statement to create the view
    query_job = client.query(create_view_sql)
    
    # Wait for the query to finish
    try:
        query_job.result()  # Wait for the job to complete
        print(f"View `my_view` created successfully in dataset `{bigquery_config['dataset_id']}`.")
    except Exception as e:
        print(f"Failed to create view: {e}")

if __name__ == "__main__":
    create_view()
