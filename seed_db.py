import pymysql

try:
    conn = pymysql.connect(host='localhost', port=3306, user='root', password='samar1011', database='vigil_ai')
    cursor = conn.cursor()
    
    # Insert Faculty
    cursor.execute("""
    INSERT INTO faculty (faculty_id, first_name, last_name, email, department, password_hash)
    VALUES ('FAC001', 'Dr. Arjun', 'Mehta', 'arjun.mehta@vigil.edu', 'Computer Science',
            '$2b$12$LJ3m4ys3hz.gRsTZBNwCGe0Q1J3MXv9tDPOuWeJl1R7fLCrx1mfvy')
    ON DUPLICATE KEY UPDATE faculty_id=faculty_id;
    """)
    
    # Insert Students
    cursor.execute("""
    INSERT INTO students (student_id, first_name, last_name, email, phone, department, semester, face_image_path)
    VALUES
        ('STU001', 'Aanya', 'Sharma', 'aanya.sharma@vigil.edu', '9876543210', 'Computer Science', 4, 'student_db/STU001'),
        ('STU002', 'Rohan', 'Patel', 'rohan.patel@vigil.edu', '9876543211', 'Computer Science', 4, 'student_db/STU002'),
        ('STU003', 'Priya', 'Gupta', 'priya.gupta@vigil.edu', '9876543212', 'Computer Science', 4, 'student_db/STU003'),
        ('STU004', 'Vikram', 'Singh', 'vikram.singh@vigil.edu', '9876543213', 'Electronics', 3, 'student_db/STU004'),
        ('STU005', 'Neha', 'Reddy', 'neha.reddy@vigil.edu', '9876543214', 'Electronics', 3, 'student_db/STU005')
    ON DUPLICATE KEY UPDATE student_id=student_id;
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Example teacher and students successfully inserted into the database!")
except Exception as e:
    print(f"Error: {e}")
