
# Homework Assignment System

A comprehensive web-based platform for secure homework distribution and collection with advanced copy protection and academic integrity features.

## 🎯 Overview

The Homework Assignment System enables teachers to create, distribute, and collect homework assignments while maintaining academic integrity through robust copy-protection mechanisms. Students can access assignments using simple codes, save their work as drafts, and submit final answers - all without requiring individual accounts.

## ✨ Key Features

### 🔐 Academic Integrity
- **Advanced Copy Protection**: Prevents copying, pasting, and text selection on assignment content
- **Keyboard Shortcut Blocking**: Disables Ctrl+C, Ctrl+V, Ctrl+A, and developer tools access
- **Secure Content Delivery**: Protected question display with selection prevention

### 👩‍🏫 Teacher Features
- **Simple Authentication**: Username/password login with account lockout protection
- **Assignment Creation**: Support for text input and file uploads (.txt, .doc, .docx, .pdf)
- **Capacity Management**: Maximum 3 active assignments per teacher, 30 students per assignment
- **Real-time Monitoring**: Track student progress, draft vs. final submissions
- **Bulk Downloads**: Individual or batch download of submissions in organized formats

### 👨‍🎓 Student Features  
- **Code-based Access**: No individual accounts required - access via assignment codes
- **Save & Continue**: Work on assignments across multiple sessions
- **Auto-save**: Automatic draft saving every 30 seconds
- **Word Count Tracking**: Real-time word counting and progress indicators
- **Final Submission**: Secure one-time submission with confirmation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Yarn package manager

### Installation

1. **Clone and Setup**
   ```bash
   cd homework_assignment_system/app
   yarn install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and SESSION_SECRET in .env
   ```

3. **Database Setup**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Start Development Server**
   ```bash
   yarn dev
   ```

5. **Access Application**
   - Main site: `http://localhost:3000`
   - Teacher login: `http://localhost:3000/teacher/login`
   - Student access: `http://localhost:3000/student`

### Demo Credentials

**Teacher Account:**
- Username: `demo_teacher`
- Password: `demo_password`

**Sample Assignment:**
- Code: `DEMO01`
- Title: "Sample Essay Assignment"

## 📋 Usage Guide

### For Teachers

1. **Create Account**
   - Visit `/teacher/register`
   - Choose username (3+ characters) and password (8+ characters)
   - Account created instantly

2. **Create Assignment**
   - Login and access dashboard
   - Click "Create Assignment" (if under 3 active assignments)
   - Enter title, content (paste text or upload file), and optional instructions
   - Assignment receives unique 6-character code
   - Share code with students

3. **Monitor Progress**
   - Dashboard shows all assignments with real-time student counts
   - Track draft vs. submitted status for each student
   - Download individual or bulk submissions
   - Close/reopen assignments as needed

### For Students

1. **Access Assignment**
   - Visit `/student`
   - Enter your full name and assignment code from teacher
   - Access granted if assignment active and under capacity

2. **Complete Work**
   - Read copy-protected assignment content
   - Write answer in provided text area
   - Work automatically saved every 30 seconds
   - Save drafts manually anytime

3. **Submit Final Answer**
   - Review your work before submission
   - Click "Submit Final Answer" when ready
   - Confirm submission (cannot be undone)
   - Receive confirmation of successful submission

## 🔧 Configuration

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:port/database"
SESSION_SECRET="your-secure-session-secret-key"
```

### Capacity Limits

- **Teacher Sessions**: 3 active assignments maximum
- **Assignment Capacity**: 30 students per assignment
- **Session Duration**: Teacher sessions expire after 2 hours

## 📁 Project Structure

```
app/
├── prisma/
│   └── schema.prisma          # Database schema
├── app/
│   ├── api/                   # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── assignments/       # Assignment management
│   │   └── student/           # Student operations
│   ├── teacher/               # Teacher interface pages
│   ├── student/               # Student interface pages
│   └── globals.css            # Styles with copy protection
├── lib/
│   ├── auth.ts               # Authentication logic
│   └── session.ts            # Session management
└── scripts/
    └── seed.ts               # Database seeding
```

## 🛡️ Security Features

- **Password Security**: bcrypt hashing with 12 salt rounds
- **Session Management**: JWT tokens with HTTP-only cookies
- **Failed Login Protection**: 5 attempts maximum, 15-minute lockout
- **Input Validation**: Server-side validation on all endpoints
- **Copy Protection**: Multi-layered content protection system

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Create teacher account
- `POST /api/auth/login` - Teacher login
- `POST /api/auth/logout` - Logout

### Assignments
- `GET /api/assignments` - List teacher assignments
- `POST /api/assignments` - Create new assignment
- `PATCH /api/assignments/[id]` - Update assignment status
- `DELETE /api/assignments/[id]` - Delete assignment
- `GET /api/assignments/[id]/download` - Download submissions

### Student Operations
- `POST /api/student/access` - Access assignment
- `POST /api/student/save` - Save draft
- `POST /api/student/submit` - Submit final answer

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database permissions

**Assignment Code Not Found**
- Verify code is exactly 6 characters
- Ensure assignment is in 'active' status
- Check for typos (codes are case-insensitive)

**Copy Protection Not Working**
- Ensure JavaScript is enabled
- Check browser compatibility
- Clear browser cache

## 📊 Browser Compatibility

- **Supported**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: Tablet support (768px+ width)
- **Requirements**: JavaScript enabled for copy protection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Check troubleshooting section above
- Review API documentation in `TECH_SPEC.md`
- Consult architecture overview in `ARCHITECTURE.md`

---

Built with ❤️ for academic integrity and educational excellence.
