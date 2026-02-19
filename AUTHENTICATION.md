# Authentication System Setup Guide

## Overview
The DGEN Access Control System now includes a comprehensive authentication system with role-based access control. This guide will help you set up and use the authentication features.

## User Roles

### Admin Users
Admin users have full access to:
- Dashboard with statistics and charts
- Employee management (add, edit, delete, toggle status)
- Access logs (view and clear)
- Settings page
- Remote unlock functionality from header

### Regular Employees
Regular employees have access to:
- Employee portal with profile information
- Remote unlock button
- Logout functionality

## First-Time Setup

### 1. Create Admin User in Firebase

Before you can log in, you need to have at least one user with admin privileges in your Firebase Firestore database.

#### Option A: Using Firebase Console
1. Go to Firebase Console → Firestore Database
2. Navigate to the `users` collection
3. Add a document with the following structure:
   ```json
   {
     "name": "System Administrator",
     "role": "System Administrator",
     "department": "Administration",
     "status": "Active",
     "isAdmin": true,
     "isSuperAdmin": true,
     "createdAt": "2024-01-01T00:00:00.000Z"
   }
   ```
4. Use the employee ID as the document ID (e.g., `DGEN-ADM-00`)

#### Option B: Using Firebase Admin Script
Create a script to initialize your first admin user:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createAdminUser() {
  await db.collection('users').doc('DGEN-ADM-00').set({
    name: 'System Administrator',
    role: 'System Administrator',
    department: 'Administration',
    status: 'Active',
    isAdmin: true,
    isSuperAdmin: true,
    createdAt: new Date().toISOString()
  });
  console.log('Admin user created successfully!');
}

createAdminUser();
```

### 2. Log In
1. Navigate to `http://localhost:3000/login` (or your deployed URL)
2. Enter your employee ID (e.g., `DGEN-ADM-00`)
3. Enter your password (by default, same as employee ID)
4. Click "Sign In"

### 3. Create Additional Users
Once logged in as admin:
1. Go to "Employees" page from the sidebar
2. Click "Add Employee" button
3. Select department
4. Enter name and role
5. Check "Administrator Access" if you want to grant admin privileges
6. Click "Add Employee"

## Usage Guide

### For Administrators

#### Managing Employees
- **Add Employee**: Click "Add Employee" button, fill in details, optionally check admin access
- **Edit Employee**: Click edit icon on employee card, modify name/role
- **Toggle Status**: Click lock icon to activate/ban employee
- **Delete Employee**: Click trash icon (super admins cannot be deleted)

#### Viewing Logs
- Navigate to "Logs" page from sidebar
- View all access attempts with employee IDs
- Filter by status (Granted, Denied, Manual Unlock)
- Search by employee name or ID
- Clear all logs if needed

#### Remote Unlock
- Click "Remote Unlock" button in header
- Action is logged with your employee ID
- ESP8266 device will poll and trigger unlock

### For Regular Employees

#### Accessing Employee Portal
1. Log in with your employee ID and password
2. You'll be automatically redirected to Employee Portal
3. View your profile information
4. Use "Unlock Door" button to trigger remote unlock

#### Remote Unlock
- Click large "Unlock Door" button in Employee Portal
- Action is logged with your employee ID in the system
- ESP8266 polls server every 3 seconds and triggers unlock

### Logging Out
- Click your profile icon in the header
- Click "Logout" from dropdown menu
- You'll be redirected to login page

## Security Considerations

### Current Implementation (Development)
- ⚠️ Password is the same as employee ID
- Session data stored in localStorage
- Basic validation on client and server

### Required for Production
Before deploying to production, implement:

1. **Password Security**
   - Hash passwords using bcrypt or argon2
   - Store only hashed passwords in database
   - Require strong, unique passwords
   - Implement password reset functionality

2. **Session Management**
   - Use HTTP-only cookies instead of localStorage
   - Implement server-side session validation
   - Add session expiration and refresh tokens
   - Use CSRF tokens for form submissions

3. **Authentication Enhancements**
   - Rate limiting on login attempts
   - Account lockout after failed attempts
   - Two-factor authentication (2FA)
   - Email verification for new accounts
   - Password strength requirements

4. **Security Headers**
   - Set appropriate Content Security Policy
   - Enable HSTS
   - Configure X-Frame-Options
   - Add other security headers

## Troubleshooting

### Can't Log In
- **Problem**: "Invalid employee ID or password"
- **Solution**: Verify employee exists in Firestore with correct ID

### Redirected to Login After Logging In
- **Problem**: Session not persisting
- **Solution**: Check browser localStorage is enabled

### No Admin Access
- **Problem**: Can only see Employee Portal
- **Solution**: Verify `isAdmin: true` is set in Firestore for your user

### Remote Unlock Not Working
- **Problem**: Button doesn't respond
- **Solution**: Check Firebase Admin credentials are configured correctly

## API Reference

### POST /api/auth/login
Authenticate user and create session.

**Request:**
```json
{
  "employeeId": "DGEN-ADM-00",
  "password": "DGEN-ADM-00"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "DGEN-ADM-00",
    "name": "System Administrator",
    "role": "System Administrator",
    "department": "Administration",
    "status": "Active",
    "isAdmin": true,
    "isSuperAdmin": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid employee ID or password"
}
```

### POST /api/remote-open
Trigger remote door unlock (authenticated users only).

**Request:**
```json
{
  "employeeId": "DGEN-ADM-00",
  "employeeName": "System Administrator"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Remote unlock command sent"
}
```

## Support

For issues or questions:
- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review the [Main README](README.md)
- Open an issue on [GitHub](https://github.com/MrTG1B/DGEN-ACESS/issues)
