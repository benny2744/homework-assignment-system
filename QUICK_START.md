
# Quick Start Guide

Get the Homework Assignment System up and running in 5 minutes.

## ⚡ Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ Yarn package manager (`yarn --version`)
- ✅ PostgreSQL database running
- ✅ Git for version control

## 🚀 Installation Steps

### 1. Navigate to Project
```bash
cd homework_assignment_system/app
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Environment Setup
Create and configure your environment variables:
```bash
# .env file already configured with database
# Verify DATABASE_URL is correct for your setup
cat .env
```

### 4. Database Setup
```bash
# Push schema to database
npx prisma db push

# Seed with demo data
npx prisma db seed
```

### 5. Start Development Server
```bash
yarn dev
```

### 6. Access Application
Open your browser and visit:
- **Main Site**: http://localhost:3000
- **Teacher Login**: http://localhost:3000/teacher/login
- **Student Access**: http://localhost:3000/student

## 🧪 Test the System

### Try Teacher Features
1. **Login with demo account:**
   - Username: `demo_teacher`
   - Password: `demo_password`

2. **Create a new assignment:**
   - Visit dashboard → "Create Assignment"
   - Add title and content
   - Note the generated 6-character code

3. **Monitor submissions:**
   - Dashboard shows real-time student progress
   - Download submissions when ready

### Try Student Features  
1. **Access demo assignment:**
   - Go to http://localhost:3000/student
   - Name: `Your Name`
   - Code: `DEMO01`

2. **Test the editor:**
   - Write some text in the protected editor
   - Try to copy the question (should be blocked)
   - Save draft and exit

3. **Return to continue:**
   - Enter same name and code
   - Your draft should be restored

## 🎯 Key Features to Test

### 🔒 Copy Protection
- Right-click on assignment questions (blocked)
- Try Ctrl+C on question text (blocked)
- Press F12 for developer tools (blocked)
- Text selection on questions (blocked)

### 💾 Save & Continue
- Write content and manually save
- Exit and re-enter with same name
- Auto-save works every 30 seconds
- Submit final answer (one-time only)

### 📊 Capacity Management
- Create 3+ assignments (limit warning)
- Add 30+ students to one assignment
- Real-time counters on dashboard

## 🔧 Common Commands

### Development
```bash
# Start development server
yarn dev

# Type checking
yarn tsc --noEmit

# Database operations
npx prisma studio          # Visual database browser
npx prisma db push         # Update database schema
npx prisma generate        # Regenerate Prisma client
npx prisma db seed         # Add demo data
```

### Production
```bash
# Build for production
yarn build

# Start production server  
yarn start

# Database migration
npx prisma migrate deploy
```

## 🐛 Troubleshooting

### Database Issues
```bash
# If database connection fails
npx prisma db push --force-reset

# If Prisma client issues
npx prisma generate
```

### Port Issues
```bash
# If port 3000 is busy
PORT=3001 yarn dev
```

### Reset Demo Data
```bash
# Reset to fresh demo data
npx prisma db seed
```

## 📚 Next Steps

Once you have the system running:

1. **Read the Documentation:**
   - `README.md` - Complete overview
   - `ARCHITECTURE.md` - System design
   - `TECH_SPEC.md` - Technical details
   - `API_REFERENCE.md` - API documentation

2. **Customize the System:**
   - Modify capacity limits in schema
   - Adjust auto-save intervals
   - Update styling and branding
   - Add additional validation rules

3. **Deploy to Production:**
   - Set up production database
   - Configure environment variables
   - Deploy to your hosting platform
   - Enable HTTPS for security

## 🆘 Need Help?

- **Documentation**: Check `README.md` for detailed instructions
- **API Issues**: Consult `API_REFERENCE.md` for endpoint details
- **Technical Problems**: Review `TECH_SPEC.md` for troubleshooting
- **Architecture Questions**: See `ARCHITECTURE.md` for system design

---

**🎉 You're ready to use the Homework Assignment System!**

The system is designed for academic integrity with comprehensive copy protection, easy assignment management, and seamless student experience.
