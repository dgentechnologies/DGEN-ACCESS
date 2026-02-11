from flask import Flask, request, jsonify, render_template
from datetime import datetime

app = Flask(__name__, template_folder='../templates')

# ========================================
# DATA PERSISTENCE STRATEGY
# ========================================
# NOTE: Using Python global variables for prototype.
# Data will reset on Vercel redeployment, which is acceptable for this stage.
# For production, consider using a database (PostgreSQL, MongoDB, etc.)

# Initialize with 4 permanent executive users
USERS = {
    "DGEN-EX-01": {
        "name": "Tirthankar Dasgupta",
        "id": "DGEN-EX-01",
        "role": "CEO & CTO",
        "status": "Active",
        "is_super_admin": True
    },
    "DGEN-FI-02": {
        "name": "Sukomal Debnath",
        "id": "DGEN-FI-02",
        "role": "CFO",
        "status": "Active",
        "is_super_admin": True
    },
    "DGEN-OP-03": {
        "name": "Arpan Bairagi",
        "id": "DGEN-OP-03",
        "role": "COO",
        "status": "Active",
        "is_super_admin": True
    },
    "DGEN-MK-04": {
        "name": "Sagnik Mandal",
        "id": "DGEN-MK-04",
        "role": "CMO",
        "status": "Active",
        "is_super_admin": True
    }
}

# Access logs storage
ACCESS_LOGS = []

# ========================================
# HELPER FUNCTIONS
# ========================================

def find_user_by_data(data):
    """
    Search for user by ID or Name
    """
    # First try exact ID match
    if data in USERS:
        return USERS[data]
    
    # Then try name match (case-insensitive)
    for user_id, user in USERS.items():
        if user["name"].lower() == data.lower():
            return user
    
    return None

def log_access(user_data, status):
    """
    Log an access attempt
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "time": timestamp,
        "name": user_data["name"] if user_data else "Unknown",
        "id": user_data["id"] if user_data else "Unknown",
        "status": status
    }
    ACCESS_LOGS.insert(0, log_entry)  # Insert at beginning for newest first
    # Keep only last 100 logs to prevent memory issues
    if len(ACCESS_LOGS) > 100:
        ACCESS_LOGS.pop()
    return log_entry

# ========================================
# API ENDPOINTS
# ========================================

@app.route('/verify', methods=['POST'])
def verify():
    """
    ESP32 API Endpoint - Verifies RFID data
    Input: {"data": "DGEN-EX-01"} or {"data": "Tirthankar Dasgupta"}
    Output: "YES" or "NO"
    """
    try:
        json_data = request.json
        if not json_data:
            return "NO", 200
        
        data = json_data.get('data', '').strip()
        
        if not data:
            return "NO", 200
        
        # Search for user
        user = find_user_by_data(data)
        
        if user and user["status"] == "Active":
            # User exists and is active - grant access
            log_access(user, "Granted")
            return "YES", 200
        elif user:
            # User exists but is banned
            log_access(user, "Denied")
            return "NO", 200
        else:
            # Unknown user
            log_access(None, "Denied")
            return "NO", 200
            
    except Exception as e:
        print(f"Error in verify endpoint: {e}")
        return "NO", 200

@app.route('/')
def dashboard():
    """
    Admin Dashboard
    """
    return render_template('dashboard.html')

@app.route('/get_users', methods=['GET'])
def get_users():
    """
    Get all users for the dashboard
    """
    return jsonify(list(USERS.values()))

@app.route('/add_user', methods=['POST'])
def add_user():
    """
    Add a new user
    """
    try:
        data = request.json
        name = data.get('name', '').strip()
        user_id = data.get('id', '').strip()
        role = data.get('role', '').strip()
        
        if not name or not user_id or not role:
            return jsonify({"success": False, "message": "All fields are required"}), 400
        
        if user_id in USERS:
            return jsonify({"success": False, "message": "User ID already exists"}), 400
        
        USERS[user_id] = {
            "name": name,
            "id": user_id,
            "role": role,
            "status": "Active",
            "is_super_admin": False
        }
        
        return jsonify({"success": True, "message": "User added successfully"})
        
    except Exception as e:
        print(f"Error adding user: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/delete_user', methods=['POST'])
def delete_user():
    """
    Delete a user (cannot delete super admins)
    """
    try:
        data = request.json
        user_id = data.get('id', '').strip()
        
        if user_id not in USERS:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        if USERS[user_id].get("is_super_admin", False):
            return jsonify({"success": False, "message": "Cannot delete super admin users"}), 403
        
        del USERS[user_id]
        
        return jsonify({"success": True, "message": "User deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/toggle_status', methods=['POST'])
def toggle_status():
    """
    Toggle user active/banned status
    """
    try:
        data = request.json
        user_id = data.get('id', '').strip()
        
        if user_id not in USERS:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Toggle status
        current_status = USERS[user_id]["status"]
        USERS[user_id]["status"] = "Banned" if current_status == "Active" else "Active"
        
        return jsonify({
            "success": True, 
            "message": "Status updated successfully",
            "new_status": USERS[user_id]["status"]
        })
        
    except Exception as e:
        print(f"Error toggling status: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/get_logs', methods=['GET'])
def get_logs():
    """
    Get access logs
    """
    return jsonify(ACCESS_LOGS)

# ========================================
# VERCEL HANDLER
# ========================================

# For Vercel serverless function
app_handler = app

# For local testing only - Debug mode should never be used in production
# When deployed to Vercel, this block is not executed
if __name__ == '__main__':
    app.run(debug=True, port=5000)
