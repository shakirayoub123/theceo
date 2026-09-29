-- Complete dummy data for September 2025 (current month)

-- Step 1: Ensure we have a sales user (ID 1)
INSERT INTO accounts_user (
    id, password, last_login, is_superuser, username, first_name, last_name, 
    email, is_staff, is_active, date_joined, role, is_approved, is_suspended, 
    email_verified, otp_code, otp_expires_at, sales_influencer_assigned
) VALUES (
    1, 
    'pbkdf2_sha256$260000$dummyhash', 
    NULL, 
    true, 
    'sales_user', 
    'Sales', 
    'User', 
    'sales@company.com', 
    true, 
    true, 
    NOW(), 
    'sales', 
    false, 
    false, 
    true, 
    NULL, 
    NULL, 
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Ensure we have a client user (ID 2)
INSERT INTO accounts_user (
    id, password, last_login, is_superuser, username, first_name, last_name, 
    email, is_staff, is_active, date_joined, role, is_approved, is_suspended, 
    email_verified, otp_code, otp_expires_at, sales_influencer_assigned
) VALUES (
    2, 
    'pbkdf2_sha256$260000$dummyhash', 
    NULL, 
    false, 
    'mr_smith', 
    'Mr', 
    'Smith', 
    'mr.smith@client.com', 
    false, 
    true, 
    NOW(), 
    'client', 
    false, 
    false, 
    true, 
    NULL, 
    NULL, 
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Ensure we have a trainer user (ID 3)
INSERT INTO accounts_user (
    id, password, last_login, is_superuser, username, first_name, last_name, 
    email, is_staff, is_active, date_joined, role, is_approved, is_suspended, 
    email_verified, otp_code, otp_expires_at, sales_influencer_assigned
) VALUES (
    3, 
    'pbkdf2_sha256$260000$dummyhash', 
    NULL, 
    false, 
    'dr_claire', 
    'Dr', 
    'Claire', 
    'dr.claire@company.com', 
    false, 
    true, 
    NOW(), 
    'trainer', 
    true, 
    false, 
    true, 
    NULL, 
    NULL, 
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Ensure we have meeting types
INSERT INTO scheduling_meetingtype (
    id, name, description, requires_trainers, allows_multiple_trainers
) VALUES 
(1, 'Initial Meeting', 'First meeting with client', true, true),
(2, 'Program Review Meeting', 'Review client progress in program', true, true)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create the client profile
INSERT INTO people_client (
    id, user_id, first_name, last_name, email, phone, meeting_status, 
    program_status, contract_status, assigned_sales_id, created_at, updated_at
) VALUES (
    1, 2, 'Mr', 'Smith', 'mr.smith@client.com', '+1234567890', 
    'scheduled', 'paid', 'signed', 1, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 6: Create services/programs
INSERT INTO lms_service (
    id, title, short_description, description, status, trainer_id, 
    created_at, updated_at, is_published
) VALUES 
(1, 'Leadership Program', 'Executive leadership development', 
 'Comprehensive leadership training program', 'active', 3, 
 NOW(), NOW(), true),
(2, 'Live Leadership Coaching', 'One-on-one coaching sessions', 
 'Personalized leadership coaching', 'active', 3, 
 NOW(), NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Enroll the client in programs
INSERT INTO lms_enrollment (
    id, user_id, service_id, enrolled_at, completed
) VALUES 
(1, 2, 1, NOW(), false),
(2, 2, 2, NOW(), false)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Create meetings for SEPTEMBER 2025 (current month)
INSERT INTO scheduling_meeting (
    id, title, meeting_type_id, scheduled_by_id, scheduled_at, 
    duration, status, notes, location, created_at, updated_at
) VALUES 
(1, 'Meeting No. 1', 1, 1, '2025-09-25 10:00:00+00', '01:00:00', 'scheduled', 
 'Initial consultation with client', 'Conference Room A', NOW(), NOW()),
(2, 'Meeting No. 2', 2, 1, '2025-09-26 15:00:00+00', '01:30:00', 'confirmed', 
 'Program review meeting', 'Virtual', NOW(), NOW()),
(3, 'Follow-up Session', 2, 1, '2025-09-30 11:00:00+00', '00:45:00', 'scheduled', 
 'Follow-up on previous meeting', 'Office', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 9: Create meeting attendees
INSERT INTO scheduling_meetingattendee (
    id, meeting_id, user_id, role, is_confirmed, joined_at
) VALUES 
-- Meeting 1 attendees
(1, 1, 1, 'organizer', true, NOW()),  -- Sales user as organizer
(2, 1, 2, 'client', false, NULL),     -- Client
(3, 1, 3, 'trainer', true, NOW()),    -- Trainer

-- Meeting 2 attendees  
(4, 2, 1, 'organizer', true, NOW()),  -- Sales user as organizer
(5, 2, 2, 'client', true, NOW()),     -- Client

-- Meeting 3 attendees
(6, 3, 1, 'organizer', true, NOW()),  -- Sales user as organizer
(7, 3, 2, 'client', false, NULL)      -- Client
ON CONFLICT (id) DO NOTHING;
