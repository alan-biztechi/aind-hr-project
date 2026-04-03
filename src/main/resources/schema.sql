SET NAMES utf8mb4;

-- aind_sample_db 스키마 생성
CREATE DATABASE IF NOT EXISTS aind_sample_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE aind_sample_db;

-- 기존 테이블 삭제 (역순)
DROP TABLE IF EXISTS leave_request;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS department;

-- 부서
CREATE TABLE department (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL,
    description VARCHAR(200),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 직원
CREATE TABLE employee (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    department_id INT          NOT NULL,
    position      VARCHAR(30)  NOT NULL COMMENT '사원/대리/과장/차장/부장',
    hire_date     DATE         NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE / RESIGNED',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES department(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 출퇴근
CREATE TABLE attendance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT         NOT NULL,
    work_date   DATE        NOT NULL,
    check_in    TIME,
    check_out   TIME,
    status      VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT 'NORMAL / LATE / EARLY_LEAVE / ABSENT',
    note        VARCHAR(200),
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employee(id),
    UNIQUE KEY uk_attendance (employee_id, work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 휴가 신청
CREATE TABLE leave_request (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT          NOT NULL,
    leave_type  VARCHAR(20)  NOT NULL COMMENT 'ANNUAL / HALF_DAY / SICK / FAMILY_EVENT',
    start_date  DATE         NOT NULL,
    end_date    DATE         NOT NULL,
    reason      VARCHAR(500),
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / APPROVED / REJECTED',
    approver_id INT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_employee  FOREIGN KEY (employee_id) REFERENCES employee(id),
    CONSTRAINT fk_leave_approver  FOREIGN KEY (approver_id) REFERENCES employee(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
