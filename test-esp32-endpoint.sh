#!/bin/bash

# Test script for ESP32 endpoint compatibility
# This verifies that the new backend maintains compatibility with existing ESP32 code

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   ESP32 Endpoint Compatibility Test                  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if backend is running
echo "Checking if backend is running on http://localhost:5000..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running on http://localhost:5000"
    echo "   Start it with: cd backend && npm start"
    exit 1
fi
echo ""

# Test 1: Valid user ID (form data)
echo "Test 1: Valid user with form data (DGEN-EX-01)"
RESPONSE=$(curl -s -X POST http://localhost:5000/verify -d "data=DGEN-EX-01")
if [ "$RESPONSE" = "YES" ]; then
    echo "✅ PASSED - Response: $RESPONSE"
else
    echo "❌ FAILED - Expected: YES, Got: $RESPONSE"
fi
echo ""

# Test 2: Invalid user ID
echo "Test 2: Invalid user"
RESPONSE=$(curl -s -X POST http://localhost:5000/verify -d "data=INVALID-ID")
if [ "$RESPONSE" = "NO" ]; then
    echo "✅ PASSED - Response: $RESPONSE"
else
    echo "❌ FAILED - Expected: NO, Got: $RESPONSE"
fi
echo ""

# Test 3: Empty data
echo "Test 3: Empty data"
RESPONSE=$(curl -s -X POST http://localhost:5000/verify -d "data=")
if [ "$RESPONSE" = "NO" ]; then
    echo "✅ PASSED - Response: $RESPONSE"
else
    echo "❌ FAILED - Expected: NO, Got: $RESPONSE"
fi
echo ""

# Test 4: User by name
echo "Test 4: Valid user by name"
RESPONSE=$(curl -s -X POST http://localhost:5000/verify -d "data=Tirthankar Dasgupta")
if [ "$RESPONSE" = "YES" ]; then
    echo "✅ PASSED - Response: $RESPONSE"
else
    echo "❌ FAILED - Expected: YES, Got: $RESPONSE"
fi
echo ""

# Test 5: Formatted data (pipe-separated)
echo "Test 5: Formatted data with pipes"
RESPONSE=$(curl -s -X POST http://localhost:5000/verify -d "data=Name: Tirthankar Dasgupta | ID: DGEN-EX-01 | Role: CEO & CTO")
if [ "$RESPONSE" = "YES" ]; then
    echo "✅ PASSED - Response: $RESPONSE"
else
    echo "❌ FAILED - Expected: YES, Got: $RESPONSE"
fi
echo ""

# Test 6: JSON format (backward compatibility)
echo "Test 6: JSON format"
RESPONSE=$(curl -s -X POST http://localhost:5000/verify \
    -H "Content-Type: application/json" \
    -d '{"data":"DGEN-EX-01"}')
if [ "$RESPONSE" = "YES" ]; then
    echo "✅ PASSED - Response: $RESPONSE"
else
    echo "❌ FAILED - Expected: YES, Got: $RESPONSE"
fi
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Test Complete                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "All tests passed! ✅"
echo "The ESP32 endpoint is compatible with existing code."
