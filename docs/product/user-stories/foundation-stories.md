# Foundation User Stories (Phase 1)

Epic references: E-101 through E-106

---

## E-101: Authentication & Identity

### US-101-01: Operator Registration
**As an** operator
**I want to** create an account with my email and a strong password
**So that** I can securely access my LifeOS Enterprise instance

**Acceptance Criteria:**
- [ ] I can submit an email address and password via a registration form
- [ ] The system validates my email format and password strength before submission
- [ ] Password requirements are shown inline: min 12 chars, 1 uppercase, 1 number, 1 symbol
- [ ] On success, I receive a verification email and am directed to verify before logging in
- [ ] On failure, I receive a specific, actionable error message

---

### US-101-02: Operator Login
**As an** operator
**I want to** log in with my email and password
**So that** I can access my workspace

**Acceptance Criteria:**
- [ ] Login form accepts email and password
- [ ] On success, I receive a JWT access token (15 min) and refresh token (30 days) and am redirected to my dashboard
- [ ] On failure, I see a generic "invalid credentials" message (no enumeration)
- [ ] After 5 failed attempts in 15 minutes, further attempts are rate-limited with a clear message
- [ ] My session persists across page refreshes via refresh token

---

### US-101-03: Password Reset
**As an** operator who has forgotten their password
**I want to** reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] I can request a password reset by entering my email address
- [ ] I receive an email with a single-use reset link within 2 minutes
- [ ] The reset link expires after 1 hour
- [ ] After resetting, all other active sessions are invalidated
- [ ] If the email does not exist in the system, I still see a success message (no enumeration)

---

### US-101-04: Logout
**As an** operator
**I want to** log out and end my session
**So that** my account is not accessible from this device

**Acceptance Criteria:**
- [ ] Logout button is accessible from any page
- [ ] On logout, both access and refresh tokens are invalidated server-side
- [ ] I am redirected to the login page after logout
- [ ] Attempting to use an invalidated token returns a 401 response

---

## E-102: Business Units

### US-102-01: Create Business Unit
**As an** operator
**I want to** create a new business unit
**So that** I can organize my work by company or venture

**Acceptance Criteria:**
- [ ] I can create a business unit by providing: name (required), type (optional: company, project, personal), description (optional)
- [ ] Business unit names must be unique within my account
- [ ] The new business unit appears immediately in my business unit switcher
- [ ] I am navigated into the new business unit after creation

---

### US-102-02: Switch Business Units
**As an** operator
**I want to** switch between business units quickly
**So that** I can work across my different ventures without losing context

**Acceptance Criteria:**
- [ ] A business unit switcher is accessible from the top navigation at all times
- [ ] Switching takes < 500ms and loads the selected business unit's dashboard
- [ ] My last-viewed business unit is remembered across sessions

---

## E-103: Projects

### US-103-01: Create Project
**As an** operator
**I want to** create a project within a business unit
**So that** I can track a goal or initiative

**Acceptance Criteria:**
- [ ] I can create a project with: name, goal statement, status (Active by default), and optional next action
- [ ] Projects are immediately visible in the project list after creation
- [ ] If I do not define a next action, the project is flagged with a visual indicator

---

### US-103-02: Define Next Action
**As an** operator
**I want to** define the next action for every project
**So that** I always know what to do when I open a project

**Acceptance Criteria:**
- [ ] Every project has a "Next Action" field that is prominently displayed
- [ ] Projects with no next action display a visual warning (amber highlight or indicator)
- [ ] The next action field is pre-filled when completing a task if that was the next action
- [ ] I can update the next action from the project list view without opening the project

---

## E-104: Tasks

### US-104-01: Create Task
**As an** operator
**I want to** create a task within a project
**So that** I can track the work needed to complete it

**Acceptance Criteria:**
- [ ] I can create a task with: title (required), description, due date, priority (Low/Medium/High/Urgent), status (Open by default)
- [ ] Tasks are immediately visible in the project's task list and my global inbox

---

### US-104-02: View Task Inbox
**As an** operator
**I want to** see all my open tasks in one place, across all projects
**So that** I can prioritize my work for the day

**Acceptance Criteria:**
- [ ] The inbox shows all open tasks across all projects in the current business unit
- [ ] Tasks are sorted: Overdue (red) → Due today (amber) → Upcoming (default)
- [ ] I can filter the inbox by: project, priority, due date range
- [ ] I can complete a task directly from the inbox

---

## E-105: Contacts

### US-105-01: Create Contact
**As an** operator
**I want to** add a contact (person or company) to my system
**So that** I can track my relationships and link them to projects

**Acceptance Criteria:**
- [ ] I can create a person contact with: name, email, phone, company, notes
- [ ] I can create a company contact with: name, website, industry, notes
- [ ] Contacts are scoped to the current business unit by default

---

### US-105-02: Link Contact to Project
**As an** operator
**I want to** link a contact to a project
**So that** I can see who is involved in each initiative

**Acceptance Criteria:**
- [ ] I can link one or more contacts to a project from the project detail view
- [ ] Linked contacts appear in the project's "People" section
- [ ] From a contact view, I can see all projects they are linked to
