-- VIGIL-AI Database Schema
-- MySQL 8+

CREATE DATABASE IF NOT EXISTS vigil_ai;
USE vigil_ai;

-- Students table (Bio-data)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    semester INT,
    face_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Sessions (active classroom with GPS)
CREATE TABLE IF NOT EXISTS faculty_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    subject_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    geofence_radius_meters INT DEFAULT 20,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id)
);

-- Attendance Log
CREATE TABLE IF NOT EXISTS attendance_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    confidence FLOAT,
    is_live BOOLEAN DEFAULT TRUE,
    marked_by ENUM('biometric', 'manual') DEFAULT 'biometric',
    marked_by_faculty_id INT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (session_id) REFERENCES faculty_sessions(id),
    FOREIGN KEY (marked_by_faculty_id) REFERENCES faculty(id),
    UNIQUE KEY unique_attendance (student_id, session_id)
);

-- Seed demo data
INSERT INTO faculty (faculty_id, first_name, last_name, email, department, password_hash)
VALUES ('FAC001', 'Dr. Arjun', 'Mehta', 'arjun.mehta@vigil.edu', 'Computer Science',
        '$2b$12$LJ3m4ys3hz.gRsTZBNwCGe0Q1J3MXv9tDPOuWeJl1R7fLCrx1mfvy')  -- password: teacher123
ON DUPLICATE KEY UPDATE faculty_id=faculty_id;

INSERT INTO students (student_id, first_name, last_name, email, phone, department, semester, face_image_path)
VALUES
    ('STU001', 'Aanya', 'Dixit', 'aanya.dixit@vigil.edu', '9876543210', 'Computer Science', 4, 'student_db/STU001'),
    ('STU002', 'Rohan', 'Patel', 'rohan.patel@vigil.edu', '9876543211', 'Computer Science', 4, 'student_db/STU002'),
    ('STU003', 'Priya', 'Gupta', 'priya.gupta@vigil.edu', '9876543212', 'Computer Science', 4, 'student_db/STU003'),
    ('STU004', 'Vikram', 'Singh', 'vikram.singh@vigil.edu', '9876543213', 'Electronics', 3, 'student_db/STU004'),
    ('STU005', 'Neha', 'Reddy', 'neha.reddy@vigil.edu', '9876543214', 'Electronics', 3, 'student_db/STU005')
ON DUPLICATE KEY UPDATE student_id=student_id;
