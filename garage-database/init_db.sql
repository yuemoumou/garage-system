CREATE DATABASE IF NOT EXISTS parking_db CHARACTER SET utf8mb4;
USE parking_db;

CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    owner_name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS parking_space (
    id INT AUTO_INCREMENT PRIMARY KEY,
    space_no VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('available','occupied') DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS parking_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    space_id INT NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    fee DECIMAL(8,2) DEFAULT 0,
    status ENUM('parked','completed') DEFAULT 'parked',
    FOREIGN KEY (vehicle_id) REFERENCES vehicle(id),
    FOREIGN KEY (space_id) REFERENCES parking_space(id)
);

-- 初始数据
INSERT IGNORE INTO admin (username, password) VALUES ('admin', 'admin123');

INSERT IGNORE INTO parking_space (space_no) VALUES
('A-01'),('A-02'),('A-03'),('A-04'),('A-05'),
('B-01'),('B-02'),('B-03'),('B-04'),('B-05');
