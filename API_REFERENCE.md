
# API Reference Guide

Complete reference for all API endpoints in the Homework Assignment System.

## 🔗 Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

Most endpoints require authentication via session cookies. After successful login, the session token is automatically included in subsequent requests.

**Session Cookie:**
```
Cookie: session-token=JWT_TOKEN
```

## 📋 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create teacher account | No |
| POST | `/auth/login` | Teacher login | No |
| POST | `/auth/logout` | End session | Yes |
| GET | `/assignments` | List assignments | Yes |
| POST | `/assignments` | Create assignment | Yes |
| PATCH | `/assignments/{id}` | Update assignment | Yes |
| DELETE | `/assignments/{id}` | Delete assignment | Yes |
| GET | `/assignments/{id}/download` | Download submissions | Yes |
| POST | `/student/access` | Access assignment | No |
| POST | `/student/save` | Save draft | No |
| POST | `/student/submit` | Submit final | No |

---

## 🔑 Authentication Endpoints

### POST /auth/register

Create a new teacher account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "teacher_username",
  "password": "secure_password"
}
```

**Validation Rules:**
- `username`: 3-50 characters, alphanumeric + underscore only
- `password`: 8+ characters minimum

**Success Response (201):**
```json
{
  "success": true,
  "message": "Teacher account created successfully",
  "teacher": {
    "id": "clh7x8y9z0123456789",
    "username": "teacher_username"
  }
}
```

**Error Responses:**
```json
// Username already exists (409)
{
  "error": "Username already exists"
}

// Invalid input (400)
{
  "error": "Username must be between 3-50 characters"
}

// Server error (500)
{
  "error": "Internal server error"
}
```

---

### POST /auth/login

Authenticate teacher and create session.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "teacher_username",
  "password": "secure_password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "teacher": {
    "id": "clh7x8y9z0123456789",
    "username": "teacher_username",
    "active_sessions_count": 2
  }
}
```

**Response Headers:**
```http
Set-Cookie: session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Max-Age=7200
```

**Error Responses:**
```json
// Invalid credentials (401)
{
  "error": "Invalid credentials or account is locked"
}

// Account locked (401)
{
  "error": "Account temporarily locked due to too many failed attempts"
}
```

---

### POST /auth/logout

End current session.

**Request:**
```http
POST /api/auth/logout
Cookie: session-token=JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true
}
```

---

## 📚 Assignment Management Endpoints

### GET /assignments

Retrieve all assignments for authenticated teacher.

**Request:**
```http
GET /api/assignments
Cookie: session-token=JWT_TOKEN
```

**Success Response (200):**
```json
{
  "assignments": [
    {
      "id": "assignment_id_123",
      "title": "Essay Assignment",
      "assignment_code": "ABC123",
      "status": "active",
      "created_at": "2024-09-16T10:00:00.000Z",
      "activated_at": "2024-09-16T10:05:00.000Z",
      "closed_at": null,
      "student_count": 15,
      "max_students": 30,
      "student_work": [
        {
          "id": "work_id_456",
          "student_name": "John Doe",
          "status": "submitted",
          "last_saved_at": "2024-09-16T11:30:00.000Z",
          "submitted_at": "2024-09-16T11:35:00.000Z",
          "word_count": 487
        }
      ]
    }
  ]
}
```

**Assignment Status Values:**
- `draft` - Not yet activated
- `active` - Currently accepting students
- `closed` - No longer accepting new work

---

### POST /assignments

Create a new assignment.

**Request:**
```http
POST /api/assignments
Content-Type: application/json
Cookie: session-token=JWT_TOKEN

{
  "title": "Essay on Climate Change",
  "content": "Write a 500-word essay discussing the impacts of climate change on modern society...",
  "instructions": "Please ensure your essay is well-structured with clear arguments.",
  "deadline": "2024-09-20T23:59:59.000Z"
}
```

**Field Requirements:**
- `title`: 5-100 characters (required)
- `content`: 10-50,000 characters (required)  
- `instructions`: Optional, up to 10,000 characters
- `deadline`: Optional ISO datetime string

**Success Response (200):**
```json
{
  "success": true,
  "assignment": {
    "id": "new_assignment_id",
    "title": "Essay on Climate Change",
    "assignment_code": "XYZ789",
    "status": "active"
  }
}
```

**Error Responses:**
```json
// Session limit reached (409)
{
  "error": "You have reached the maximum of 3 active assignments. Please close an existing assignment first."
}

// Invalid input (400)
{
  "error": "Title and content are required"
}
```

---

### PATCH /assignments/{id}

Update assignment status (close/reopen).

**Request:**
```http
PATCH /api/assignments/assignment_id_123
Content-Type: application/json
Cookie: session-token=JWT_TOKEN

{
  "action": "close"
}
```

**Actions:**
- `close` - Close active assignment
- `reopen` - Reactivate closed assignment

**Success Response (200):**
```json
{
  "success": true,
  "message": "Assignment closed"
}
```

**Error Responses:**
```json
// Cannot reopen due to limit (409)
{
  "error": "Cannot reopen: Maximum of 3 active assignments reached"
}

// Assignment not found (404)
{
  "error": "Assignment not found"
}
```

---

### DELETE /assignments/{id}

Permanently delete assignment and all student work.

**Request:**
```http
DELETE /api/assignments/assignment_id_123
Cookie: session-token=JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Assignment deleted"
}
```

**⚠️ Warning:** This action is irreversible and deletes all associated student work.

---

### GET /assignments/{id}/download

Download student submissions.

**Request:**
```http
GET /api/assignments/assignment_id_123/download?type=bulk
Cookie: session-token=JWT_TOKEN
```

**Query Parameters:**
- `type`: Download type
  - `all` - All submissions (default)
  - `drafts` - Draft submissions only
  - `submitted` - Final submissions only  
  - `bulk` - Force ZIP download
- `student` - Specific student name for individual download

**Response Types:**

**Single File (text/plain):**
```http
Content-Type: text/plain
Content-Disposition: attachment; filename="John_Doe_2024-09-16_SUBMITTED.txt"

HOMEWORK ASSIGNMENT SUBMISSION
==================================================
Assignment: Essay on Climate Change
Student: John Doe
Status: SUBMITTED
Word Count: 487
...
```

**ZIP Archive (application/zip):**
```http
Content-Type: application/zip
Content-Disposition: attachment; filename="Essay_on_Climate_Change_submissions_2024-09-16.zip"

[Binary ZIP data containing multiple submission files]
```

---

## 🎓 Student Endpoints

### POST /student/access

Access assignment using code and student name.

**Request:**
```http
POST /api/student/access
Content-Type: application/json

{
  "studentName": "Jane Smith",
  "assignmentCode": "ABC123"
}
```

**Validation Rules:**
- `studentName`: 2-50 characters, letters and spaces only
- `assignmentCode`: 6 characters, case-insensitive

**Success Response (200):**
```json
{
  "assignment": {
    "id": "assignment_id_123",
    "title": "Essay on Climate Change", 
    "content": "Write a 500-word essay discussing...",
    "instructions": "Please ensure your essay is well-structured..."
  },
  "studentWork": {
    "id": "student_work_id_789",
    "content": "Previously saved draft content...",
    "status": "draft",
    "word_count": 123
  },
  "isReturning": true,
  "isSubmitted": false
}
```

**Error Responses:**
```json
// Assignment not found (404)
{
  "error": "Assignment not found. Please check the assignment code."
}

// Assignment closed (403)  
{
  "error": "This assignment is not currently available."
}

// Capacity reached (403)
{
  "error": "This assignment has reached its maximum capacity of 30 students."
}

// Invalid student name (400)
{
  "error": "Student name can only contain letters and spaces"
}
```

---

### POST /student/save

Save draft work (auto-save or manual save).

**Request:**
```http
POST /api/student/save
Content-Type: application/json

{
  "studentWorkId": "student_work_id_789",
  "content": "This is my essay draft content. It covers the topic of climate change..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "studentWork": {
    "id": "student_work_id_789",
    "content": "This is my essay draft content...",
    "word_count": 156,
    "last_saved_at": "2024-09-16T14:30:00.000Z",
    "status": "draft"
  },
  "message": "Draft saved successfully"
}
```

**Error Responses:**
```json
// Assignment closed (403)
{
  "error": "Assignment is no longer active"
}

// Already submitted (403)
{
  "error": "Work has already been submitted and cannot be modified"
}

// Student work not found (404)
{
  "error": "Student work not found"
}
```

---

### POST /student/submit

Submit final answer (one-time only).

**Request:**
```http
POST /api/student/submit  
Content-Type: application/json

{
  "studentWorkId": "student_work_id_789",
  "content": "This is my final essay submission about climate change and its impacts..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "studentWork": {
    "id": "student_work_id_789",
    "content": "This is my final essay submission...",
    "word_count": 523,
    "status": "submitted",
    "submitted_at": "2024-09-16T15:45:00.000Z"
  },
  "message": "Assignment submitted successfully!"
}
```

**Error Responses:**
```json
// Already submitted (403)
{
  "error": "Work has already been submitted"
}

// Assignment closed (403)
{
  "error": "Assignment is no longer active"
}
```

---

## 📊 Response Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Authentication required/failed |
| 403 | Forbidden | Access denied or capacity reached |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource exists or limit reached |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## 🔒 Security Considerations

### Rate Limiting
- **Login attempts**: 5 per 15 minutes per IP
- **API calls**: 100 per minute per session
- **File uploads**: 10 per hour per teacher

### Data Validation
- All inputs are validated server-side
- SQL injection prevention via parameterized queries
- XSS prevention through input sanitization
- File upload restrictions (type, size)

### Session Management
- JWT tokens expire after 2 hours
- HTTP-only cookies for security
- Secure flag in production
- SameSite protection against CSRF

## 🧪 Testing Examples

### Test Authentication Flow
```bash
# Register new teacher
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testteacher","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testteacher","password":"password123"}' \
  -c cookies.txt

# Create assignment (using saved cookies)
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Test Assignment","content":"Write about your favorite topic"}'
```

### Test Student Flow
```bash
# Access assignment
curl -X POST http://localhost:3000/api/student/access \
  -H "Content-Type: application/json" \
  -d '{"studentName":"John Doe","assignmentCode":"ABC123"}'

# Save draft
curl -X POST http://localhost:3000/api/student/save \
  -H "Content-Type: application/json" \
  -d '{"studentWorkId":"work_id","content":"My draft content"}'

# Submit final
curl -X POST http://localhost:3000/api/student/submit \
  -H "Content-Type: application/json" \
  -d '{"studentWorkId":"work_id","content":"My final submission"}'
```

---

For additional technical details, see the [Technical Specification](TECH_SPEC.md) document.
