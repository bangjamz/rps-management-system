#!/bin/bash

BASE_URL="http://localhost:5001/api"
USERNAME="bangjamz_superadmin"
PASSWORD="password123"

echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r .token)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login Failed"
  echo $LOGIN_RESPONSE
  exit 1
fi
echo "✅ Login Successful. Token received."

echo "--------------------------------"
echo "2. Testing Get All Users..."
USERS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" $BASE_URL/users)
if [ "$USERS_RESPONSE" == "200" ]; then
  echo "✅ Get All Users: OK"
else
  echo "❌ Get All Users: Failed (Code: $USERS_RESPONSE)"
fi

echo "--------------------------------"
echo "3. Testing Create Random User..."
RANDOM_NUM=$RANDOM
USER_PAYLOAD="{\"username\":\"user_$RANDOM_NUM\",\"password\":\"password123\",\"email\":\"user_$RANDOM_NUM@test.com\",\"role\":\"dosen\",\"nama_lengkap\":\"Test User $RANDOM_NUM\"}"
CREATE_USER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$USER_PAYLOAD" $BASE_URL/users)
if [ "$CREATE_USER_RESPONSE" == "201" ]; then
  echo "✅ Create User: OK"
else
  echo "❌ Create User: Failed (Code: $CREATE_USER_RESPONSE)"
fi

echo "--------------------------------"
echo "4. Testing Get Custom Roles..."
ROLES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" $BASE_URL/admin/roles)
if [ "$ROLES_RESPONSE" == "200" ]; then
  echo "✅ Get Custom Roles: OK"
else
  echo "❌ Get Custom Roles: Failed (Code: $ROLES_RESPONSE)"
fi

echo "--------------------------------"
echo "5. Testing Create Custom Role..."
ROLE_PAYLOAD="{\"name\":\"Role_$RANDOM_NUM\",\"description\":\"Test Role\",\"permissions\":[\"users.view\"]}"
CREATE_ROLE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$ROLE_PAYLOAD" $BASE_URL/admin/roles)
if [ "$CREATE_ROLE_RESPONSE" == "201" ]; then
  echo "✅ Create Custom Role: OK"
else
  echo "❌ Create Custom Role: Failed (Code: $CREATE_ROLE_RESPONSE)"
fi

echo "--------------------------------"
echo "6. Testing Get Fakultas..."
FAKULTAS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" $BASE_URL/organization/fakultas)
if [ "$FAKULTAS_RESPONSE" == "200" ]; then
  echo "✅ Get Fakultas: OK"
else
  echo "❌ Get Fakultas: Failed (Code: $FAKULTAS_RESPONSE)"
fi

echo "--------------------------------"
echo "7. Testing Create Fakultas..."
FAK_PAYLOAD="{\"kode\":\"FAK_$RANDOM_NUM\",\"nama\":\"Fakultas Test $RANDOM_NUM\",\"deskripsi\":\"Test Deskripsi\"}"
CREATE_FAK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$FAK_PAYLOAD" $BASE_URL/organization/fakultas)
if [ "$CREATE_FAK_RESPONSE" == "201" ]; then
  echo "✅ Create Fakultas: OK"
else
  echo "❌ Create Fakultas: Failed (Code: $CREATE_FAK_RESPONSE)"
fi
