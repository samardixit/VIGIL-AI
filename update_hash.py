import pymysql

try:
    conn = pymysql.connect(host='localhost', port=3306, user='root', password='samar1011', database='vigil_ai')
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE faculty 
    SET password_hash = '$2b$12$.gEJErpqiwe3T94l8am3feTPrFpGBowfEE3tJIBzzV0iJHVDjAxDu'
    WHERE faculty_id = 'FAC001';
    """)
    conn.commit()
    cursor.close()
    conn.close()
    print("Faculty password hash updated.")
except Exception as e:
    print(f"Error: {e}")
