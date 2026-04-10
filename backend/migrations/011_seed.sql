-- 011_seed.sql
-- Initial data: admin user, trainers, courses

-- Admin user (password: admin123)
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Trainer users (password: trainer123)
INSERT INTO users (username, password_hash, role) VALUES
('sundar',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('aadil',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('nizam',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('sathya',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('karthik',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('shifreen', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('britto',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('ganesh',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('yuvaraj',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer'),
('jalal',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer');

-- Trainer profiles
INSERT INTO trainers (user_id, name, phone) VALUES
((SELECT id FROM users WHERE username='sundar'),   'Sundar',   NULL),
((SELECT id FROM users WHERE username='aadil'),    'Aadil',    NULL),
((SELECT id FROM users WHERE username='nizam'),    'Nizam',    NULL),
((SELECT id FROM users WHERE username='sathya'),   'Sathya',   NULL),
((SELECT id FROM users WHERE username='karthik'),  'Karthik',  NULL),
((SELECT id FROM users WHERE username='shifreen'), 'Shifreen', NULL),
((SELECT id FROM users WHERE username='britto'),   'Britto',   NULL),
((SELECT id FROM users WHERE username='ganesh'),   'Ganesh',   NULL),
((SELECT id FROM users WHERE username='yuvaraj'),  'Yuvaraj',  NULL),
((SELECT id FROM users WHERE username='jalal'),    'Jalal',    NULL);

-- Courses
INSERT INTO courses (course_name, fee, duration, mode) VALUES
('Fullstack QA Automation Testing', 35000, '6 months', 'offline'),
('Java Fullstack Web Development',  30000, '5 months', 'offline'),
('Python',                          18000, '3 months', 'offline'),
('Salesforce',                      28000, '6 months', 'online'),
('Playwright Testing',              20000, '3 months', 'offline'),
('MERN/Java Fullstack Development', 32000, '6 months', 'offline'),
('Frontend Development',            22000, '4 months', 'offline'),
('UI/UX',                           20000, '4 months', 'offline'),
('AIML',                            35000, '6 months', 'online'),
('Data Analytics',                  30000, '5 months', 'online'),
('DevOps',                          28000, '4 months', 'online'),
('Digital Marketing',               15000, '3 months', 'online');