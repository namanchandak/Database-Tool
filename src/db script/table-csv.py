import pymysql
import pandas as pd

# Database connection details
host = 'localhost'
user = 'root'
password = 'root'
database = 'sakila'

# Establish a database connection
connection = pymysql.connect(
    host=host,
    user=user,
    password=password,
    database=database
)

try:
    # Create a cursor object
    cursor = connection.cursor()

    # Retrieve all table names
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]

    # Print table names for debugging
    print("Tables in the database:", tables)

    # Loop through each table and save its data to a CSV file
    for table in tables:
        print(f"Processing table: {table}")
        query = f"SELECT * FROM `{table}`"  # Use backticks to handle table names with spaces
        try:
            df = pd.read_sql(query, connection)
            df.to_csv(f"D:\code\Dice\database csv form python\\{table}.csv", index=False)
            print(f"Table {table} saved to {table}.csv")
        except Exception as e:
            print(f"Error processing table {table}: {e}")  

finally:
    # Close the database connection
    connection.close()
