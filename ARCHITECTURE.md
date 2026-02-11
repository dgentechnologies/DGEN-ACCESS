# System Architecture

## Overview

DGEN Access Control System v2.0 - A modern, cloud-based access control system with IoT integration.

## Architecture Diagram

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    DGEN ACCESS CONTROL SYSTEM v2.0                         ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │   Web Browser    │         │   ESP32 Device   │                         │
│  │  (Dashboard UI)  │         │   (RFID Reader)  │                         │
│  │                  │         │                  │                         │
│  │  • Dashboard     │         │  • Read RFID     │                         │
│  │  • Employees     │         │  • Send to API   │                         │
│  │  • Logs          │         │  • Control Lock  │                         │
│  │  • Settings      │         │                  │                         │
│  └────────┬─────────┘         └────────┬─────────┘                         │
│           │                            │                                   │
└───────────┼────────────────────────────┼───────────────────────────────────┘
            │                            │
            │ HTTP/HTTPS                 │ HTTP POST
            │ (Port 3000)                │ /verify
            ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      REACT FRONTEND (Vite)                            │ │
│  │                                                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │ │
│  │  │  Dashboard  │  │  Employees  │  │    Logs     │  │  Settings  │ │ │
│  │  │    Page     │  │    Page     │  │    Page     │  │    Page    │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │ │
│  │  │   Layout    │  │   Sidebar   │  │  Services   │                 │ │
│  │  │  Component  │  │  Component  │  │  (API/Data) │                 │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │ │
│  │                                                                       │ │
│  │  Technologies:                                                        │ │
│  │  • React 18, React Router                                            │ │
│  │  • Tailwind CSS, Framer Motion                                       │ │
│  │  • Axios, Firebase SDK                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │ REST API
                                 │ (Port 5000)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                   NODE.JS BACKEND (Express)                           │ │
│  │                                                                       │ │
│  │  ┌──────────────────────────────────────────────────────────────┐   │ │
│  │  │                     API ENDPOINTS                            │   │ │
│  │  │                                                              │   │ │
│  │  │  POST /verify              ← ESP32 RFID verification        │   │ │
│  │  │  GET  /api/users           ← Get all users                  │   │ │
│  │  │  POST /api/users           ← Add new user                   │   │ │
│  │  │  PUT  /api/users/:id       ← Update user                    │   │ │
│  │  │  PUT  /api/users/:id/status ← Toggle ban/unban             │   │ │
│  │  │  DELETE /api/users/:id     ← Delete user                    │   │ │
│  │  │  GET  /api/logs            ← Get access logs                │   │ │
│  │  │  DELETE /api/logs          ← Clear logs                     │   │ │
│  │  │  GET  /health              ← Health check                   │   │ │
│  │  └──────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │ │
│  │  │  Verify Routes   │  │   User Routes    │  │   Log Routes     │  │ │
│  │  │  • Find user     │  │  • CRUD ops      │  │  • Fetch logs    │  │ │
│  │  │  • Log access    │  │  • Validation    │  │  • Clear logs    │  │ │
│  │  │  • Return YES/NO │  │  • Super admin   │  │  • Real-time     │  │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │ │
│  │                                                                       │ │
│  │  Middleware:                                                          │ │
│  │  • CORS, Helmet (security)                                           │ │
│  │  • Body Parser, Morgan (logging)                                     │ │
│  │  • Firebase Admin SDK                                                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 │ Firebase Admin SDK
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      FIREBASE CLOUD PLATFORM                          │ │
│  │                                                                       │ │
│  │  ┌──────────────────────┐        ┌──────────────────────┐           │ │
│  │  │   FIRESTORE          │        │  REALTIME DATABASE   │           │ │
│  │  │  (Primary Storage)   │        │  (Live Updates)      │           │ │
│  │  │                      │        │                      │           │ │
│  │  │  Collections:        │        │  Paths:              │           │ │
│  │  │  • users/            │        │  • logs/             │           │ │
│  │  │    - id              │        │    - timestamp       │           │ │
│  │  │    - name            │        │    - name            │           │ │
│  │  │    - role            │        │    - id              │           │ │
│  │  │    - status          │        │    - status          │           │ │
│  │  │    - isSuperAdmin    │        │                      │           │ │
│  │  │                      │        │  Real-time sync      │           │ │
│  │  │  • logs/             │        │  WebSocket updates   │           │ │
│  │  │    - time            │        │                      │           │ │
│  │  │    - name            │        │                      │           │ │
│  │  │    - id              │        │                      │           │ │
│  │  │    - status          │        │                      │           │ │
│  │  │                      │        │                      │           │ │
│  │  │  • settings/         │        │                      │           │ │
│  │  └──────────────────────┘        └──────────────────────┘           │ │
│  │                                                                       │ │
│  │  Security Rules:                                                      │ │
│  │  • Firestore: .firebase/firestore.rules                              │ │
│  │  • Realtime DB: .firebase/database.rules.json                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. ESP32 Access Verification
```
ESP32 → POST /verify → Backend → Firestore (find user) 
                                     ↓
                            YES/NO ← Status check
                                     ↓
                           Realtime DB (log access)
                                     ↓
                           Frontend (live update)
```

### 2. Employee Management
```
Frontend → POST /api/users → Backend → Firestore (create user)
                                            ↓
                                       Success response
                                            ↓
                                      Frontend refresh
```

### 3. Real-time Logs
```
Backend → Realtime DB (push log) → WebSocket → Frontend (live update)
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Firebase**: Firebase JS SDK

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database SDK**: Firebase Admin SDK
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Environment**: dotenv

### Database
- **Primary**: Firebase Firestore
- **Real-time**: Firebase Realtime Database
- **Storage**: Firebase Cloud Storage (future)
- **Auth**: Firebase Authentication (future)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting Options**: Firebase, Vercel, Heroku, Cloud Run

## Security Architecture

### Authentication & Authorization
```
┌─────────────────────────────────────────────────────────┐
│  Firebase Security Rules                                │
├─────────────────────────────────────────────────────────┤
│  • Firestore: Role-based access control                 │
│  • Realtime DB: Authenticated read/write                │
│  • Super admins: Protected from deletion                │
│  • User verification: Public read for ESP32             │
└─────────────────────────────────────────────────────────┘
```

### Network Security
```
┌─────────────────────────────────────────────────────────┐
│  Backend Middleware                                      │
├─────────────────────────────────────────────────────────┤
│  • CORS: Whitelist allowed origins                       │
│  • Helmet: Security headers                              │
│  • HTTPS: SSL/TLS encryption (production)                │
│  • Environment variables: Sensitive data protection      │
└─────────────────────────────────────────────────────────┘
```

## Scalability

### Horizontal Scaling
- Firebase auto-scales with usage
- Backend can run multiple instances
- Load balancer distributes traffic

### Performance
- Firestore indexed queries
- Realtime DB for live updates
- CDN for frontend static files
- Lazy loading for React components

## Deployment Architecture

### Development
```
Local Machine
├── Backend (localhost:5000)
├── Frontend (localhost:3000)
└── Firebase (cloud)
```

### Production
```
Cloud Platform
├── Backend (Docker container or serverless)
├── Frontend (Static hosting or CDN)
└── Firebase (cloud, auto-scaled)
```

## Monitoring & Logging

- **Application Logs**: Morgan (HTTP requests)
- **Error Tracking**: Console errors logged
- **Firebase Console**: Database usage, rules
- **Health Check**: /health endpoint

## Future Enhancements

### Phase 1 (Current)
✅ Basic access control
✅ Employee management
✅ Real-time logs
✅ ESP32 integration

### Phase 2 (Future)
- [ ] User authentication (Firebase Auth)
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Access schedules
- [ ] Multiple locations

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Machine learning (anomaly detection)
- [ ] Visitor management
- [ ] Integration APIs

## Backup & Recovery

### Data Backup
- Firebase automatic backups (daily)
- Export data via Firebase Console
- Firestore export to Cloud Storage

### Disaster Recovery
- Firebase multi-region replication
- Point-in-time recovery
- Backup restoration procedures

## Compliance & Standards

- **Data Privacy**: GDPR-ready architecture
- **Security**: Industry-standard encryption
- **Audit Trail**: Complete access logging
- **Uptime**: 99.9% SLA (Firebase)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-11
**System Version**: 2.0.0
