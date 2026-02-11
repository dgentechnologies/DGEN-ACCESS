# DGEN Access Control System

A complete, serverless Access Control Server for IoT projects, built with Flask and designed for Vercel deployment.

## 🚀 Features

- **ESP32 Integration**: Receives RFID data from ESP32 devices for access verification
- **Real-time Admin Dashboard**: Modern web interface with dark/cyberpunk aesthetic
- **User Management**: Add, delete, and toggle access rights instantly
- **Live Access Logs**: Real-time logging of all access attempts with auto-refresh
- **Protected Super Admins**: 4 permanent executive users that cannot be deleted

## 📋 Default Super Admin Users

| Name | ID | Role | Status |
| :--- | :--- | :--- | :--- |
| **Tirthankar Dasgupta** | `DGEN-EX-01` | CEO & CTO | Active |
| **Sukomal Debnath** | `DGEN-FI-02` | CFO | Active |
| **Arpan Bairagi** | `DGEN-OP-03` | COO | Active |
| **Sagnik Mandal** | `DGEN-MK-04` | CMO | Active |

## 🔧 Tech Stack

- **Backend**: Python Flask (Vercel Serverless Compatible)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Deployment**: Vercel
- **Data Storage**: In-memory (Python global variables)

## 📁 Project Structure

```
.
├── api/
│   └── index.py           # Flask application with all endpoints
├── templates/
│   └── dashboard.html     # Admin dashboard UI
├── requirements.txt       # Python dependencies
├── vercel.json           # Vercel deployment configuration
└── README.md             # This file
```

## 🌐 API Endpoints

### ESP32 Endpoint
- **POST `/verify`**: Verify RFID data
  - Input: `{"data": "DGEN-EX-01"}` or `{"data": "Tirthankar Dasgupta"}`
  - Output: `"YES"` (access granted) or `"NO"` (access denied)

### Admin Dashboard Endpoints
- **GET `/`**: Admin dashboard UI
- **GET `/get_users`**: Get all users
- **GET `/get_logs`**: Get access logs
- **POST `/add_user`**: Add new user
- **POST `/delete_user`**: Delete user (cannot delete super admins)
- **POST `/toggle_status`**: Toggle user active/banned status

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

### Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python api/index.py
   ```

3. Open browser:
   ```
   http://localhost:5000
   ```

## 📝 Usage

### Adding a User via Dashboard
1. Navigate to the admin dashboard
2. Fill in the "Add New Employee" form
3. Click "Authorize User"

### ESP32 Integration Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverUrl = "https://your-vercel-app.vercel.app/verify";

void checkAccess(String rfidData) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"data\":\"" + rfidData + "\"}";
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    String response = http.getString();
    if (response == "YES") {
      // Grant access - open door, green LED, etc.
    } else {
      // Deny access - red LED, buzzer, etc.
    }
  }
  http.end();
}
```

## ⚠️ Important Notes

- **Data Persistence**: This version uses in-memory storage (Python global variables). Data will reset on Vercel redeployment. For production, integrate a database (PostgreSQL, MongoDB, etc.).
- **Security**: Add authentication and HTTPS for production use
- **Scalability**: Consider using a database for persistent storage

## 📄 License

This project is provided as-is for DGEN Technologies.

## 🤝 Support

For issues or questions, please contact the development team.
