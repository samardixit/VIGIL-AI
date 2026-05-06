import pymysql

try:
    conn = pymysql.connect(host='localhost', port=3306, user='root', password='samar1011')
    cursor = conn.cursor()
    cursor.execute('CREATE DATABASE IF NOT EXISTS vigil_ai')
    conn.commit()
    cursor.close()
    conn.close()
    print("Database 'vigil_ai' created/verified successfully")
except Exception as e:
    print(f"Error: {e}")
