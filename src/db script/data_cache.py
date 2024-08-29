import pandas as pd
import pymysql

# Global cache dictionary
df = {}

def fetch_data_from_mysql(query):
    if query not in data_cache:
        connection = pymysql.connect(host='localhost', user='root', password='root', database='sakila')
        try:
            data_cache[query] = pd.read_sql(query, connection)
        finally:
            connection.close()
    return data_cache[query]
