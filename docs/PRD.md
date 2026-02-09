# Shared Notepad Application - Product Requirements Document (PRD)

## Overview
A simple shared notepad application where registered users can post messages visible to all logged-in users.

## Priority
High - This is the first project for the C&A team to demonstrate workflow

## Functional Requirements

### User Accounts
1. **User Registration**
   - Users must provide: username, email, password, secret question, secret answer
   - Email validation required (must be valid email format)
   - Username must be unique (case-insensitive)
   - Password requirements: minimum 8 characters, at least one letter and one number
   - Upon registration: Send welcome email (mock functionality for now)
   - Passwords must be hashed before storage (use bcrypt or similar)

2. **User Login/Logout**
   - Login with username and password
   - Secure session management (HTTP-only cookies or JWT)
   - Automatic session timeout after 24 hours of inactivity
   - Logout should invalidate session immediately
   - Failed login attempts lock account after 5 attempts for 15 minutes

3. **Password Reset**
   - User can reset password by providing secret question answer
   - Reset flow:
     - User enters username
     - System displays their secret question
     - User provides secret answer
     - If correct, user can set new password
   - After reset, user must login with new password
   - Send confirmation email after successful reset (mock functionality)

### Posts (Messages)
1. **Create Post**
   - authenticated users can create posts
   - Post content: plain text, up to 1000 characters
   - Post includes: content, timestamp, author
   - Posts are immediately visible to all logged-in users

2. **View Posts**
   - Logged-in users see all posts from all users
   - Posts displayed in reverse chronological order (newest first)
   - Each post shows: author, content, timestamp
   - Pagination: 20 posts per page, with "load more" button
   - Real-time updates: new posts appear without page refresh (WebSocket or polling)

3. **Delete Post**
   - Users can only delete their own posts
   - Delete requires confirmation (modal dialog)
   - Deletion is permanent (no undo)
   - Post author clearly displayed to enable self-service deletion

### Rate Limiting
1. **Limits**
   - 5 posts per minute (rolling window)
   - 10 posts per hour (rolling window)
   - 20 posts per day (calendar day, user's timezone)

2. **Behavior**
   - When limit exceeded: Clear error message explaining which limit was hit and when user can post again
   - Show user's current usage: "You have posted 3/5 posts this minute"
   - Rate limits reset according to windows as described

## Non-Functional Requirements

### Security
1. **Authentication & Authorization**
   - All password storage must use strong hashing (bcrypt with salt)
   - SQL injection prevention on all database queries
   - CSRF protection for all state-changing operations
   - Session security: HTTP-only cookies, secure flag in production
   - Input validation on all user inputs

2. **Data Protection**
   - User passwords never logged or transmitted in clear text
   - Secret answers hashed like passwords
   - HTTPS required in production (enforce via HSTS)
   - Email addresses used only for account operations

### Performance
1. **Response Times**
   - Page load: < 1 second for initial load
   - Post creation: < 200ms response time
   - Real-time updates: New posts appear within 2 seconds

2. **Scalability**
   - Support up to 1,000 concurrent users (initial target)
   - Database queries optimized with appropriate indexes
   - Consider caching for read-heavy operations

### Reliability
1. **Uptime**: 99.5% target availability
2. **Error Handling**: Graceful degradation if any feature fails
3. **Database**: Transactions for data consistency
4. **Logs**: Comprehensive logging for debugging

### Maintainability
1. Code follows consistent style guidelines
2. Documented API endpoints
3. Database schema documented
4. Deployment procedures documented

## User Interface Requirements

### Mobile-First Design (Hard Requirement)
- Design must be created for mobile devices first
- Test on mobile viewport (375px width) before expanding to desktop
- All interactive elements touch-friendly (minimum 44x44px tap targets)
- No horizontal scrolling on mobile
- Text readable without zooming (minimum 16px font size)
- Consider mobile data constraints (efficient page loads)

### Pages
1. **Login Page**
   - Fields: Username, Password
   - Link: "Forgot password?" (links to password reset)
   - Link: "Register" (links to registration)
   - Mobile: Full-screen card layout

2. **Registration Page**
   - Fields: Username, Email, Password, Confirm Password, Secret Question, Secret Answer
   - Client-side validation before submission
   - Clear error messages for invalid inputs
   - Link: "Already have an account? Login"
   - Mobile: Single-column form with clear labels

3. **Password Reset Page**
   - Step 1: Enter username
   - Step 2: Display secret question, enter answer
   - Step 3: Enter new password, confirm new password
   - Clear progress indication (Step 1 of 3)
   - Mobile: Single-screen per step with clear navigation

4. **Main View (Posts Feed)**
   - Header: App title, logout button
   - Post creation area at top: text area (auto-expanding), "Post" button with character count
   - Posts feed below: cards for each post
   - Post card: Author name, timestamp, content, delete button (if own post)
   - "Load more" button at bottom
   - Mobile: Full-width cards, sticky post creation area at top

5. **Error Pages**
   - 404: Clear, friendly message, link to home
   - 500: Apology, try again button, link to home

### Accessibility
- Semantic HTML throughout
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratio > 4.5:1
- Screen reader friendly

## Technical Architecture

### Technology Stack
- **Frontend Framework**: Next.js 14+ (App Router)
- **Backend Framework**: Next.js API Routes
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js (or custom JWT implementation)
- **Styling**: Tailwind CSS
- **Real-time Updates**: Server-Sent Events (SSE) or WebSockets
- **Email**: Mock functionality initially (console logging)

### Database Schema

#### users table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  secret_question VARCHAR(255) NOT NULL,
  secret_answer_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### posts table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

#### rate_limits table
```sql
CREATE TABLE rate_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minute_start TIMESTAMP NOT NULL,
  posts_in_minute INTEGER DEFAULT 0,
  hour_start TIMESTAMP NOT NULL,
  posts_in_hour INTEGER DEFAULT 0,
  date_recorded DATE NOT NULL,
  posts_in_day INTEGER DEFAULT 0,
  UNIQUE (user_id, date_recorded)
);

CREATE INDEX idx_rate_limits_user_date ON rate_limits(user_id, date_recorded);
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `POST /api/auth/reset-password` - Initiate password reset
- `POST /api/auth/confirm-reset` - Complete password reset

#### Posts
- `GET /api/posts` - List posts (paginated)
- `POST /api/posts` - Create new post
- `DELETE /api/posts/:id` - Delete post (user's own posts only)
- `GET /api/posts/events` - SSE endpoint for real-time updates

#### Rate Limiting
- `GET /api/rate-limit/usage` - Get current usage for user

### Business Logic

#### Registration Flow
1. Validate all inputs
2. Check username/email uniqueness
3. Hash password with bcrypt (cost factor 12)
4. Hash secret answer with bcrypt
5. Insert new user record
6. Auto-login user (create session)
7. Redirect to main view

#### Login Flow
1. Validate username and password
2. Check if account is locked
3. Verify password hash
4. Create secure session
5. Update last_login_at timestamp
6. Reset failed_login_attempts counter
7. Redirect to main view
8. On failure: increment failed_login_attempts, lock if 5 failed

#### Rate Limiting Implementation
- Check rate_limits table before allowing post
- If no record for current window, create one
- If within limits, increment counter
- If limits exceeded, return error with reset time
- Clean up old rate limit records periodically

## Operations Requirements

For Jan (Infrastructure Janitor):

### Deployment
1. Docker containerization (image built and pushed)
2. Environment configuration via environment variables
3. Database migrations managed via Prisma
4. Health check endpoint
5. Graceful shutdown handling

### Monitoring
1. Application logs (structured JSON format)
2. Error tracking (rollbar or similar)
3. Performance metrics (response times, error rates)
4. Database query monitoring

### Backup
1. Daily database backups
2. Automated retention (30 days)
3. Restore procedures documented

### Security
1. HTTPS enforced in production
2. Regular dependency updates
3. Security scanning schedule
4. Database credentials in secrets management

## Testing Requirements

For Qan (QA Engineer):

### Test Coverage Goals
- Unit tests: 80% code coverage minimum
- Integration tests: All API endpoints covered
- E2E tests: Critical user journeys covered

### Critical Test Scenarios
1. User registration with valid data
2. User registration with duplicate username/email
3. User login with correct credentials
4. User login with wrong password (5 times → lock)
5. Password reset with correct secret answer
6. Password reset with incorrect secret answer
7. Create post successfully
8. Rate limiting enforcement (minute, hour, day)
9. Delete own post
10. Attempt to delete other's post (should fail)
11. Real-time post visibility
12. Mobile responsiveness (375px viewport)
13. Logout functionality
14. Browser back button after logout

### Acceptance Criteria
A feature is complete when:
- All acceptance criteria from above are met
- All critical test scenarios pass
- Mobile-first design verified
- Security peer review completed
- Documentation provided for ops

## Definition of Done
A feature is done when:
- Code committed to main branch
- All tests passing
- Code reviewed by Cito
- Deployed to staging environment
- Sign-off from Qan
- Operations documentation completed

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Real-time updates not performant at scale | Medium | High | Start with polling, optimize to SSE if needed |
| Rate limiting edge cases | Low | Medium | Comprehensive testing of rate windows |
| Security vulnerability in auth | Low | Critical | Security audit before launch |
| Mobile UX issues | Medium | High | Mobile-first design, extensive mobile testing |

## Phase 1 MVP Scope
For initial delivery:
- Registration, login, logout
- Password reset via secret question
- Post creation and viewing
- Delete own posts
- Basic rate limiting
- Mobile-first design
- Real-time updates (SSE implementation)

**Explicitly Out of Phase 1:**
- Email notifications (mock only)
- Edit posts (delete-only in V1)
- User profiles (minimal only)
- Advanced security (2FA, etc.)

## Success Metrics
- Users can register and login successfully
- Users can post and see posts from others
- Rate limiting prevents abuse
- All functionality works on mobile
- Zero critical security vulnerabilities
- 100% test pass rate for critical scenarios

---

**Document Owner:** Archie (Software Architect)
**Reviewed by:** Cito (Team Leader & CTO)
**Last Updated:** 2026-02-09

**Notes:**
This PRD serves as the foundation for the C&A shared notepad application. All development, QA, and ops work should reference this document.