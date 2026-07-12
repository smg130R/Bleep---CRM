-- =====================================================
-- HR Module - Complete Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing HR tables in dependency order
DROP TABLE IF EXISTS hr_audit_log CASCADE;
DROP TABLE IF EXISTS hr_survey_responses CASCADE;
DROP TABLE IF EXISTS hr_surveys CASCADE;
DROP TABLE IF EXISTS hr_policy_acknowledgements CASCADE;
DROP TABLE IF EXISTS hr_policies CASCADE;
DROP TABLE IF EXISTS hr_announcement_reads CASCADE;
DROP TABLE IF EXISTS hr_announcements CASCADE;
DROP TABLE IF EXISTS hr_recognition CASCADE;
DROP TABLE IF EXISTS hr_complaint_attachments CASCADE;
DROP TABLE IF EXISTS hr_asset_history CASCADE;
DROP TABLE IF EXISTS hr_assets CASCADE;
DROP TABLE IF EXISTS hr_skill_matrix CASCADE;
DROP TABLE IF EXISTS hr_training CASCADE;
DROP TABLE IF EXISTS hr_goals CASCADE;
DROP TABLE IF EXISTS hr_performance_reviews CASCADE;
DROP TABLE IF EXISTS hr_onboarding_tasks CASCADE;
DROP TABLE IF EXISTS hr_onboarding CASCADE;
DROP TABLE IF EXISTS hr_recruitment_interviews CASCADE;
DROP TABLE IF EXISTS hr_recruitment_candidates CASCADE;
DROP TABLE IF EXISTS hr_recruitment_jobs CASCADE;
DROP TABLE IF EXISTS hr_planner_participants CASCADE;
DROP TABLE IF EXISTS hr_planner CASCADE;
DROP TABLE IF EXISTS hr_documents CASCADE;
DROP TABLE IF EXISTS hr_promotions CASCADE;
DROP TABLE IF EXISTS hr_exit CASCADE;
DROP TABLE IF EXISTS hr_disciplinary CASCADE;
DROP TABLE IF EXISTS hr_probation CASCADE;
DROP TABLE IF EXISTS hr_attendance CASCADE;
DROP TABLE IF EXISTS hr_employee_ext CASCADE;

-- =====================================================
-- 1. EMPLOYEE EXTENDED PROFILE
-- =====================================================
CREATE TABLE hr_employee_ext (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT DEFAULT '',
  designation TEXT DEFAULT '',
  "reportingManagerId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "employmentType" TEXT DEFAULT 'Full-time' CHECK ("employmentType" IN ('Full-time','Part-time','Contract','Intern','Temporary')),
  "confirmationDate" TEXT,
  "probationEndDate" TEXT,
  "noticePeriodDays" INTEGER DEFAULT 30,
  "workLocation" TEXT DEFAULT '',
  "emergencyContactName" TEXT DEFAULT '',
  "emergencyContactPhone" TEXT DEFAULT '',
  "emergencyContactRelation" TEXT DEFAULT '',
  "bankName" TEXT DEFAULT '',
  "bankAccountNumber" TEXT DEFAULT '',
  "bankIfscCode" TEXT DEFAULT '',
  "panNumber" TEXT DEFAULT '',
  "uanNumber" TEXT DEFAULT '',
  "skills" TEXT DEFAULT '',
  "certifications" TEXT DEFAULT '',
  "notes" TEXT DEFAULT '',
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 2. EMPLOYEE DOCUMENTS
-- =====================================================
CREATE TABLE hr_documents (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL,
  "documentName" TEXT NOT NULL,
  fileUrl TEXT DEFAULT '',
  "issueDate" TEXT,
  "expiryDate" TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','expired')),
  "verificationStatus" TEXT DEFAULT 'unverified' CHECK ("verificationStatus" IN ('unverified','verified','rejected')),
  "verifiedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "verifiedAt" TEXT,
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 3. HR PLANNER (Meetings, Events, Reminders)
-- =====================================================
CREATE TABLE hr_planner (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  "eventType" TEXT NOT NULL CHECK ("eventType" IN (
    'meeting','one_on_one','performance_review','interview','induction',
    'training','team_meeting','disciplinary','exit_interview',
    'recruitment','onboarding','joining','probation_review',
    'appraisal','document_submission','company_event','reminder','other'
  )),
  description TEXT DEFAULT '',
  "startDate" TEXT NOT NULL,
  "endDate" TEXT,
  "startTime" TEXT DEFAULT '09:00',
  "endTime" TEXT DEFAULT '10:00',
  "allDay" BOOLEAN DEFAULT FALSE,
  "recurring" TEXT DEFAULT 'none' CHECK ("recurring" IN ('none','daily','weekly','biweekly','monthly','yearly')),
  "recurringEndDate" TEXT,
  location TEXT DEFAULT '',
  "meetingLink" TEXT DEFAULT '',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled','rescheduled')),
  "createdBy" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_planner_participants (
  id SERIAL PRIMARY KEY,
  "eventId" INTEGER NOT NULL REFERENCES hr_planner(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','tentative')),
  notes TEXT DEFAULT '',
  "taskCompleted" BOOLEAN DEFAULT FALSE,
  UNIQUE("eventId", "userId")
);

-- =====================================================
-- 4. RECRUITMENT
-- =====================================================
CREATE TABLE hr_recruitment_jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  "employmentType" TEXT DEFAULT 'Full-time',
  "minExperience" INTEGER DEFAULT 0,
  "maxExperience" INTEGER DEFAULT 0,
  "minSalary" NUMERIC DEFAULT 0,
  "maxSalary" NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','closed','on_hold')),
  "openings" INTEGER DEFAULT 1,
  "filledCount" INTEGER DEFAULT 0,
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_recruitment_candidates (
  id SERIAL PRIMARY KEY,
  "jobId" INTEGER REFERENCES hr_recruitment_jobs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  resumeUrl TEXT DEFAULT '',
  "currentCompany" TEXT DEFAULT '',
  "currentDesignation" TEXT DEFAULT '',
  "experienceYears" INTEGER DEFAULT 0,
  "highestQualification" TEXT DEFAULT '',
  "skillSet" TEXT DEFAULT '',
  "expectedSalary" NUMERIC DEFAULT 0,
  "currentSalary" NUMERIC DEFAULT 0,
  "noticePeriod" INTEGER DEFAULT 0,
  source TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new','screened','shortlisted','interview_scheduled','interviewed',
    'selected','offered','offer_accepted','offer_declined','joined','rejected','on_hold'
  )),
  notes TEXT DEFAULT '',
  "appliedDate" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD'),
  rating INTEGER DEFAULT 0,
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_recruitment_interviews (
  id SERIAL PRIMARY KEY,
  "candidateId" INTEGER NOT NULL REFERENCES hr_recruitment_candidates(id) ON DELETE CASCADE,
  "jobId" INTEGER REFERENCES hr_recruitment_jobs(id) ON DELETE SET NULL,
  "interviewType" TEXT DEFAULT 'Technical' CHECK ("interviewType" IN ('Telephonic','Technical','HR','Managerial','Final','Group','Other')),
  "interviewDate" TEXT NOT NULL,
  "interviewTime" TEXT DEFAULT '10:00',
  "interviewerId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "interviewerName" TEXT DEFAULT '',
  mode TEXT DEFAULT 'in_person' CHECK (mode IN ('in_person','video_call','telephonic')),
  link TEXT DEFAULT '',
  feedback TEXT DEFAULT '',
  rating INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','rescheduled')),
  "result" TEXT CHECK (result IN ('pass','fail','on_hold')),
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 5. ONBOARDING TRACKER
-- =====================================================
CREATE TABLE hr_onboarding (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "jobId" INTEGER REFERENCES hr_recruitment_jobs(id) ON DELETE SET NULL,
  "joiningDate" TEXT,
  "reportingManagerId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "teamId" TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started','in_progress','completed','on_hold')),
  progress NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_onboarding_tasks (
  id SERIAL PRIMARY KEY,
  "onboardingId" INTEGER NOT NULL REFERENCES hr_onboarding(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'documentation','accounts','assets','induction','training','it_setup','compliance','other'
  )),
  "assignedTo" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "dueDate" TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  "completedAt" TEXT,
  "completedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  "sortOrder" INTEGER DEFAULT 0
);

-- =====================================================
-- 6. PERFORMANCE MANAGEMENT
-- =====================================================
CREATE TABLE hr_performance_reviews (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "reviewPeriod" TEXT NOT NULL CHECK ("reviewPeriod" IN ('quarterly','half_yearly','yearly','monthly','probation')),
  "reviewTitle" TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT,
  "managerId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "selfRating" INTEGER DEFAULT 0,
  "managerRating" INTEGER DEFAULT 0,
  "hrRating" INTEGER DEFAULT 0,
  "finalRating" REAL DEFAULT 0,
  "selfFeedback" TEXT DEFAULT '',
  "managerFeedback" TEXT DEFAULT '',
  "hrFeedback" TEXT DEFAULT '',
  goals TEXT DEFAULT '',
  achievements TEXT DEFAULT '',
  "improvementAreas" TEXT DEFAULT '',
  "trainingNeeds" TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','self_review','manager_review','hr_review','completed','cancelled')),
  "overallRating" TEXT CHECK ("overallRating" IN ('excellent','good','average','below_average','poor')),
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 7. GOALS & OKRs
-- =====================================================
CREATE TABLE hr_goals (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "goalType" TEXT NOT NULL CHECK ("goalType" IN ('goal','okr','kpi','project','development')),
  description TEXT DEFAULT '',
  "startDate" TEXT,
  "endDate" TEXT,
  progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  "managerComments" TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','on_hold')),
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 8. TRAINING
-- =====================================================
CREATE TABLE hr_training (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "trainingName" TEXT NOT NULL,
  "trainingType" TEXT DEFAULT 'internal' CHECK ("trainingType" IN ('internal','external','online','certification')),
  provider TEXT DEFAULT '',
  "startDate" TEXT,
  "endDate" TEXT,
  duration TEXT DEFAULT '',
  skill TEXT DEFAULT '',
  progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  score NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed','expired','cancelled')),
  "expiryDate" TEXT,
  certificateUrl TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 9. SKILL MATRIX
-- =====================================================
CREATE TABLE hr_skill_matrix (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  "skillType" TEXT NOT NULL CHECK ("skillType" IN ('technical','soft','domain','language','certification')),
  "proficiencyLevel" INTEGER NOT NULL DEFAULT 1 CHECK ("proficiencyLevel" >= 1 AND "proficiencyLevel" <= 5),
  "yearsExperience" REAL DEFAULT 0,
  "lastUsed" TEXT,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  UNIQUE("userId", skill)
);

-- =====================================================
-- 10. EMPLOYEE ASSETS
-- =====================================================
CREATE TABLE hr_assets (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "assetType" TEXT NOT NULL CHECK ("assetType" IN (
    'laptop','desktop','monitor','mobile','sim_card','id_card','access_card',
    'peripheral','software_license','other'
  )),
  "assetName" TEXT NOT NULL,
  "assetTag" TEXT DEFAULT '',
  serialNumber TEXT DEFAULT '',
  model TEXT DEFAULT '',
  "allocatedDate" TEXT NOT NULL,
  "returnDate" TEXT,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new','good','fair','damaged','lost')),
  status TEXT DEFAULT 'allocated' CHECK (status IN ('allocated','returned','lost','damaged','maintenance')),
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_asset_history (
  id SERIAL PRIMARY KEY,
  "assetId" INTEGER NOT NULL REFERENCES hr_assets(id) ON DELETE CASCADE,
  "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  "previousValue" TEXT DEFAULT '',
  "newValue" TEXT DEFAULT '',
  "changedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "changedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 11. DISCIPLINARY ACTIONS
-- =====================================================
CREATE TABLE hr_disciplinary (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "actionType" TEXT NOT NULL CHECK ("actionType" IN (
    'verbal_warning','written_warning','final_warning','show_cause',
    'suspension','investigation','improvement_plan','termination','other'
  )),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "issuedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "issuedDate" TEXT NOT NULL,
  "effectiveDate" TEXT,
  "endDate" TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','resolved','expired','appealed')),
  resolution TEXT DEFAULT '',
  "resolvedAt" TEXT,
  "resolvedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 12. EXIT MANAGEMENT
-- =====================================================
CREATE TABLE hr_exit (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "resignationDate" TEXT NOT NULL,
  "lastWorkingDay" TEXT,
  "noticePeriodDays" INTEGER DEFAULT 30,
  "noticePeriodServed" BOOLEAN DEFAULT FALSE,
  "exitInterviewDate" TEXT,
  "exitInterviewStatus" TEXT DEFAULT 'pending' CHECK ("exitInterviewStatus" IN ('pending','scheduled','completed','not_required')),
  "exitInterviewNotes" TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  rehireEligible BOOLEAN DEFAULT TRUE,
  clearanceStatus TEXT DEFAULT 'pending' CHECK (clearanceStatus IN ('pending','in_progress','completed')),
  "assetRecovered" BOOLEAN DEFAULT FALSE,
  "finalSettlementAmount" NUMERIC DEFAULT 0,
  "settlementDate" TEXT,
  "experienceLetterIssued" BOOLEAN DEFAULT FALSE,
  "relievingLetterIssued" BOOLEAN DEFAULT FALSE,
  "accessRevoked" BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 13. PROMOTIONS & TRANSFERS
-- =====================================================
CREATE TABLE hr_promotions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "promotionType" TEXT NOT NULL CHECK ("promotionType" IN ('promotion','transfer','designation_change','salary_revision')),
  "previousDesignation" TEXT DEFAULT '',
  "newDesignation" TEXT DEFAULT '',
  "previousDepartment" TEXT DEFAULT '',
  "newDepartment" TEXT DEFAULT '',
  "previousSalary" NUMERIC DEFAULT 0,
  "newSalary" NUMERIC DEFAULT 0,
  "previousTeamId" TEXT DEFAULT '',
  "newTeamId" TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  "approvedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "effectiveDate" TEXT NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected','cancelled')),
  notes TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 14. PROBATION MANAGEMENT
-- =====================================================
CREATE TABLE hr_probation (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "probationPeriod" INTEGER DEFAULT 6,
  "extensionMonths" INTEGER DEFAULT 0,
  "extensionReason" TEXT DEFAULT '',
  "reviewStatus" TEXT DEFAULT 'ongoing' CHECK ("reviewStatus" IN ('ongoing','extended','confirmed','terminated')),
  "managerRecommendation" TEXT CHECK ("managerRecommendation" IN ('confirm','extend','terminate')),
  "managerComments" TEXT DEFAULT '',
  "hrComments" TEXT DEFAULT '',
  "confirmedDate" TEXT,
  "confirmedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 15. ATTENDANCE
-- =====================================================
CREATE TABLE hr_attendance (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  "clockIn" TEXT,
  "clockOut" TEXT,
  status TEXT DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','wfh','holiday','leave')),
  "lateMinutes" INTEGER DEFAULT 0,
  "overtimeMinutes" INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  UNIQUE("userId", date)
);

-- =====================================================
-- 16. ANNOUNCEMENTS
-- =====================================================
CREATE TABLE hr_announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general','hr_update','policy','event','celebration','achievement','training','urgent','other'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  "targetRoles" TEXT DEFAULT 'all',
  "targetDepartments" TEXT DEFAULT 'all',
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "pinnedUntil" TEXT,
  "expiryDate" TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_announcement_reads (
  id SERIAL PRIMARY KEY,
  "announcementId" INTEGER NOT NULL REFERENCES hr_announcements(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "readAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  UNIQUE("announcementId", "userId")
);

-- =====================================================
-- 17. EMPLOYEE RECOGNITION
-- =====================================================
CREATE TABLE hr_recognition (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "recognitionType" TEXT NOT NULL CHECK ("recognitionType" IN (
    'employee_of_month','employee_of_quarter','employee_of_year','appreciation',
    'achievement','award','certificate','milestone','spot_bonus','other'
  )),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "awardedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "awardedDate" TEXT NOT NULL,
  "certificateUrl" TEXT DEFAULT '',
  incentiveAmount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- 18. SURVEYS & FEEDBACK
-- =====================================================
CREATE TABLE hr_surveys (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "surveyType" TEXT DEFAULT 'engagement' CHECK ("surveyType" IN ('engagement','pulse','feedback','satisfaction','exit','training','other')),
  questions TEXT DEFAULT '[]',
  "targetRoles" TEXT DEFAULT 'all',
  "startDate" TEXT,
  "endDate" TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','closed','cancelled')),
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_survey_responses (
  id SERIAL PRIMARY KEY,
  "surveyId" INTEGER NOT NULL REFERENCES hr_surveys(id) ON DELETE CASCADE,
  "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  responses TEXT DEFAULT '[]',
  submittedAt TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  UNIQUE("surveyId", "userId")
);

-- =====================================================
-- 19. POLICIES & COMPLIANCE
-- =====================================================
CREATE TABLE hr_policies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'hr' CHECK (category IN ('hr','finance','it','admin','compliance','code_of_conduct','other')),
  content TEXT DEFAULT '',
  fileUrl TEXT DEFAULT '',
  version TEXT DEFAULT '1.0',
  "effectiveDate" TEXT,
  "requiresAcknowledgment" BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  "createdBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  "updatedAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

CREATE TABLE hr_policy_acknowledgements (
  id SERIAL PRIMARY KEY,
  "policyId" INTEGER NOT NULL REFERENCES hr_policies(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged BOOLEAN DEFAULT FALSE,
  "acknowledgedAt" TEXT,
  UNIQUE("policyId", "userId")
);

-- =====================================================
-- 20. AUDIT LOG
-- =====================================================
CREATE TABLE hr_audit_log (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" INTEGER,
  details TEXT DEFAULT '',
  ipAddress TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_hr_employee_user ON hr_employee_ext("userId");
CREATE INDEX idx_hr_documents_user ON hr_documents("userId");
CREATE INDEX idx_hr_documents_expiry ON hr_documents("expiryDate");
CREATE INDEX idx_hr_planner_date ON hr_planner("startDate");
CREATE INDEX idx_hr_planner_creator ON hr_planner("createdBy");
CREATE INDEX idx_hr_planner_type ON hr_planner("eventType");
CREATE INDEX idx_hr_planner_participant ON hr_planner_participants("userId");
CREATE INDEX idx_hr_recruitment_jobs_status ON hr_recruitment_jobs(status);
CREATE INDEX idx_hr_candidates_job ON hr_recruitment_candidates("jobId");
CREATE INDEX idx_hr_candidates_status ON hr_recruitment_candidates(status);
CREATE INDEX idx_hr_interviews_candidate ON hr_recruitment_interviews("candidateId");
CREATE INDEX idx_hr_interviews_date ON hr_recruitment_interviews("interviewDate");
CREATE INDEX idx_hr_onboarding_user ON hr_onboarding("userId");
CREATE INDEX idx_hr_onboarding_tasks_status ON hr_onboarding_tasks(status);
CREATE INDEX idx_hr_performance_user ON hr_performance_reviews("userId");
CREATE INDEX idx_hr_goals_user ON hr_goals("userId");
CREATE INDEX idx_hr_training_user ON hr_training("userId");
CREATE INDEX idx_hr_skills_user ON hr_skill_matrix("userId");
CREATE INDEX idx_hr_assets_user ON hr_assets("userId");
CREATE INDEX idx_hr_disciplinary_user ON hr_disciplinary("userId");
CREATE INDEX idx_hr_exit_user ON hr_exit("userId");
CREATE INDEX idx_hr_promotions_user ON hr_promotions("userId");
CREATE INDEX idx_hr_probation_user ON hr_probation("userId");
CREATE INDEX idx_hr_attendance_user_date ON hr_attendance("userId", date);
CREATE INDEX idx_hr_announcements_pin ON hr_announcements(status, "pinnedUntil");
CREATE INDEX idx_hr_recognition_user ON hr_recognition("userId");
CREATE INDEX idx_hr_audit_entity ON hr_audit_log(entity, "entityId");
CREATE INDEX idx_hr_audit_user ON hr_audit_log("userId");
CREATE INDEX idx_hr_announcement_reads_user ON hr_announcement_reads("userId");
CREATE INDEX idx_hr_policies_status ON hr_policies(status);
