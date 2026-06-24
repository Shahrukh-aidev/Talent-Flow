-- ============================================================
--  SMART RECRUITMENT SYSTEM — MySQL Schema
--  Subject: Advanced Database Management System
-- ============================================================

CREATE DATABASE IF NOT EXISTS recruitment_db;



USE recruitment_db;



-- ----------------------------
-- 1. USERS TABLE
-- ----------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    role          ENUM('seeker', 'recruiter') DEFAULT 'seeker',
    phone         VARCHAR(20),
    location      VARCHAR(100),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- 2. COMPANIES TABLE
-- ----------------------------
CREATE TABLE IF NOT EXISTS companies (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    recruiter_id  INT NOT NULL,
    name          VARCHAR(150) NOT NULL,
    industry      VARCHAR(100),
    website       VARCHAR(200),
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- 3. JOBS TABLE
-- ----------------------------
CREATE TABLE IF NOT EXISTS jobs (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    recruiter_id     INT NOT NULL,
    company_id       INT,
    title            VARCHAR(150) NOT NULL,
    description      TEXT,
    location         VARCHAR(100),
    job_type         ENUM('full-time','part-time','contract','internship') DEFAULT 'full-time',
    salary_min       DECIMAL(10,2),
    salary_max       DECIMAL(10,2),
    skills_required  TEXT,
    experience_years INT DEFAULT 0,
    status           ENUM('open','closed','paused') DEFAULT 'open',
    posted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline         DATE,
    FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id)   REFERENCES companies(id) ON DELETE SET NULL
);

-- ----------------------------
-- 4. APPLICATIONS TABLE
-- ----------------------------
CREATE TABLE IF NOT EXISTS applications (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    job_id       INT NOT NULL,
    seeker_id    INT NOT NULL,
    cover_letter TEXT,
    status       ENUM('pending','reviewed','shortlisted','accepted','rejected') DEFAULT 'pending',
    match_score  DECIMAL(5,2) DEFAULT 0.00,
    applied_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id)    REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, seeker_id)
);

-- ----------------------------
-- 5. SKILLS TABLE (Normalized)
-- ----------------------------
CREATE TABLE IF NOT EXISTS skills (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) UNIQUE NOT NULL
);

-- ----------------------------
-- 6. USER_SKILLS TABLE
-- ----------------------------
CREATE TABLE IF NOT EXISTS user_skills (
    user_id   INT NOT NULL,
    skill_id  INT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ----------------------------
-- SEED: Sample Skills
-- ----------------------------
INSERT IGNORE INTO skills (name) VALUES
('JavaScript'),('Python'),('Java'),('C++'),('React'),
('Node.js'),('Express.js'),('MongoDB'),('MySQL'),('PostgreSQL'),
('HTML'),('CSS'),('TypeScript'),('Django'),('Spring Boot'),
('Machine Learning'),('Data Analysis'),('Git'),('Docker'),('AWS');

-- ----------------------------
-- SEED: Sample Users
-- ----------------------------
INSERT IGNORE INTO users (name, email, password, role, location) VALUES
('Admin Recruiter', 'recruiter@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'recruiter', 'Karachi'),
('Ali Hassan',      'seeker@demo.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seeker',    'Lahore');
-- Default password for both: "password"

-- ----------------------------
-- SEED: Sample Company
-- ----------------------------
INSERT IGNORE INTO companies (recruiter_id, name, industry, website) VALUES
(1, 'TechPak Solutions', 'Information Technology', 'https://techpak.com');

-- ----------------------------
-- SEED: Sample Jobs
-- ----------------------------
INSERT IGNORE INTO jobs (recruiter_id, company_id, title, description, location, job_type, salary_min, salary_max, skills_required, experience_years, status) VALUES
(1, 1, 'Full Stack Developer',   'Build and maintain web applications using React and Node.js.',       'Karachi',   'full-time',  80000,  150000, 'React,Node.js,MySQL,MongoDB', 2, 'open'),
(1, 1, 'Python Backend Engineer','Develop REST APIs and data pipelines using Python and Django.',      'Lahore',    'full-time',  70000,  130000, 'Python,Django,PostgreSQL',    1, 'open'),
(1, 1, 'Junior React Developer', 'Frontend development using React.js for our SaaS platform.',        'Remote',    'contract',   40000,   70000, 'React,JavaScript,HTML,CSS',   0, 'open'),
(1, 1, 'Data Analyst Intern',    'Analyze data using Python and create dashboards.',                  'Islamabad', 'internship', 25000,   40000, 'Python,Data Analysis,MySQL',  0, 'open');
