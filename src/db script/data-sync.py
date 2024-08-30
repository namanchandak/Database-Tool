import os
import pandas as pd
import pymysql
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()

mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'sakila'
}

bigquery_config = {
    'project_id': os.getenv('PROJECT_ID'),
    'dataset_id': os.getenv('DATASET_ID'),
}
key_path = os.getenv('KEY_PATH')

bigquery_client = bigquery.Client.from_service_account_json(key_path)

def fetch_data_from_mysql(table_name):
    """
    Fetch all data from a MySQL table and return it as a DataFrame.
    """
    query = f"SELECT * FROM {table_name}"
    connection = pymysql.connect(**mysql_config)
    try:
        df = pd.read_sql(query, connection)
    finally:
        connection.close()
    return df

def upload_to_bigquery(df, table_id):
    """
    Upload a DataFrame to a BigQuery table.
    """
    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_TRUNCATE", 
        autodetect=True,  
    )
    
    job = bigquery_client.load_table_from_dataframe(df, table_id, job_config=job_config)
    
    job.result()  
    
    print(f"Loaded {job.output_rows} rows into {table_id}.")

def sync_data():
    """
    Sync data from MySQL to BigQuery.
    """
    table_name = "actor" 
    df = fetch_data_from_mysql(table_name)
    
    table_id = f"{bigquery_config['project_id']}.{bigquery_config['dataset_id']}.{table_name}"
    
    upload_to_bigquery(df, table_id)

if __name__ == "__main__":
    sync_data()
