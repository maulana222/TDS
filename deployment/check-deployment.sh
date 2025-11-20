#!/bin/bash

# Script untuk check deployment status
# Usage: bash check-deployment.sh

echo "=== TDS Deployment Check ==="
echo ""

# Check folder dist
echo "1. Checking dist folder..."
if [ -d "/root/tds/dist" ]; then
    echo "   ✓ Folder dist exists"
    if [ -f "/root/tds/dist/index.html" ]; then
        echo "   ✓ index.html exists"
        echo "   Files in dist: $(ls -1 /root/tds/dist | wc -l)"
    else
        echo "   ✗ index.html NOT FOUND"
    fi
else
    echo "   ✗ Folder dist NOT FOUND"
    echo "   Run: cd /root/tds && npm run build"
fi
echo ""

# Check permissions
echo "2. Checking permissions..."
if [ -d "/root/tds/dist" ]; then
    PERM=$(stat -c "%a" /root/tds/dist)
    echo "   Current permission: $PERM"
    if [ "$PERM" != "755" ] && [ "$PERM" != "775" ]; then
        echo "   ⚠ Warning: Permission should be 755 or 775"
    fi
fi
echo ""

# Check backend
echo "3. Checking backend..."
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 list | grep tds-backend || echo "not running")
    if [[ $PM2_STATUS == *"online"* ]]; then
        echo "   ✓ Backend is running with PM2"
    else
        echo "   ✗ Backend is NOT running"
        echo "   Run: cd /root/tds && pm2 start ecosystem.config.js"
    fi
else
    echo "   ⚠ PM2 not installed"
fi

# Check port 3737
echo "4. Checking port 3737..."
if netstat -tuln | grep -q ":3737 "; then
    echo "   ✓ Port 3737 is in use (backend running)"
else
    echo "   ✗ Port 3737 is NOT in use (backend not running)"
fi
echo ""

# Test backend health
echo "5. Testing backend health endpoint..."
HEALTH=$(curl -s http://localhost:3737/health || echo "failed")
if [[ $HEALTH == *"success"* ]]; then
    echo "   ✓ Backend health check passed"
else
    echo "   ✗ Backend health check failed"
    echo "   Response: $HEALTH"
fi
echo ""

# Check Nginx config
echo "6. Checking Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✓ Nginx config is valid"
else
    echo "   ✗ Nginx config has errors"
    nginx -t
fi
echo ""

# Check Nginx status
echo "7. Checking Nginx service..."
if systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx is running"
else
    echo "   ✗ Nginx is NOT running"
    echo "   Run: systemctl start nginx"
fi
echo ""

# Check domain
echo "8. Testing domain..."
DOMAIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://tds.pix-ly.app || echo "000")
if [ "$DOMAIN_TEST" = "200" ]; then
    echo "   ✓ Domain is accessible (HTTP 200)"
elif [ "$DOMAIN_TEST" = "000" ]; then
    echo "   ✗ Domain is NOT accessible (connection failed)"
else
    echo "   ⚠ Domain returned HTTP $DOMAIN_TEST"
fi
echo ""

# Check .env file
echo "9. Checking .env file..."
if [ -f "/root/tds/.env" ]; then
    echo "   ✓ .env file exists"
    if grep -q "DB_HOST" /root/tds/.env; then
        echo "   ✓ Database config found"
    else
        echo "   ⚠ Database config not found in .env"
    fi
else
    echo "   ✗ .env file NOT FOUND"
    echo "   Create: /root/tds/.env"
fi
echo ""

# Summary
echo "=== Summary ==="
echo "Run these commands if needed:"
echo ""
echo "1. Build frontend:"
echo "   cd /root/tds && npm run build"
echo ""
echo "2. Fix permissions:"
echo "   chown -R root:root /root/tds/dist"
echo "   chmod -R 755 /root/tds/dist"
echo ""
echo "3. Start backend:"
echo "   cd /root/tds && pm2 start ecosystem.config.js"
echo ""
echo "4. Reload Nginx:"
echo "   nginx -t && systemctl reload nginx"
echo ""


# Script untuk check deployment status
# Usage: bash check-deployment.sh

echo "=== TDS Deployment Check ==="
echo ""

# Check folder dist
echo "1. Checking dist folder..."
if [ -d "/root/tds/dist" ]; then
    echo "   ✓ Folder dist exists"
    if [ -f "/root/tds/dist/index.html" ]; then
        echo "   ✓ index.html exists"
        echo "   Files in dist: $(ls -1 /root/tds/dist | wc -l)"
    else
        echo "   ✗ index.html NOT FOUND"
    fi
else
    echo "   ✗ Folder dist NOT FOUND"
    echo "   Run: cd /root/tds && npm run build"
fi
echo ""

# Check permissions
echo "2. Checking permissions..."
if [ -d "/root/tds/dist" ]; then
    PERM=$(stat -c "%a" /root/tds/dist)
    echo "   Current permission: $PERM"
    if [ "$PERM" != "755" ] && [ "$PERM" != "775" ]; then
        echo "   ⚠ Warning: Permission should be 755 or 775"
    fi
fi
echo ""

# Check backend
echo "3. Checking backend..."
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 list | grep tds-backend || echo "not running")
    if [[ $PM2_STATUS == *"online"* ]]; then
        echo "   ✓ Backend is running with PM2"
    else
        echo "   ✗ Backend is NOT running"
        echo "   Run: cd /root/tds && pm2 start ecosystem.config.js"
    fi
else
    echo "   ⚠ PM2 not installed"
fi

# Check port 3737
echo "4. Checking port 3737..."
if netstat -tuln | grep -q ":3737 "; then
    echo "   ✓ Port 3737 is in use (backend running)"
else
    echo "   ✗ Port 3737 is NOT in use (backend not running)"
fi
echo ""

# Test backend health
echo "5. Testing backend health endpoint..."
HEALTH=$(curl -s http://localhost:3737/health || echo "failed")
if [[ $HEALTH == *"success"* ]]; then
    echo "   ✓ Backend health check passed"
else
    echo "   ✗ Backend health check failed"
    echo "   Response: $HEALTH"
fi
echo ""

# Check Nginx config
echo "6. Checking Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✓ Nginx config is valid"
else
    echo "   ✗ Nginx config has errors"
    nginx -t
fi
echo ""

# Check Nginx status
echo "7. Checking Nginx service..."
if systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx is running"
else
    echo "   ✗ Nginx is NOT running"
    echo "   Run: systemctl start nginx"
fi
echo ""

# Check domain
echo "8. Testing domain..."
DOMAIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://tds.pix-ly.app || echo "000")
if [ "$DOMAIN_TEST" = "200" ]; then
    echo "   ✓ Domain is accessible (HTTP 200)"
elif [ "$DOMAIN_TEST" = "000" ]; then
    echo "   ✗ Domain is NOT accessible (connection failed)"
else
    echo "   ⚠ Domain returned HTTP $DOMAIN_TEST"
fi
echo ""

# Check .env file
echo "9. Checking .env file..."
if [ -f "/root/tds/.env" ]; then
    echo "   ✓ .env file exists"
    if grep -q "DB_HOST" /root/tds/.env; then
        echo "   ✓ Database config found"
    else
        echo "   ⚠ Database config not found in .env"
    fi
else
    echo "   ✗ .env file NOT FOUND"
    echo "   Create: /root/tds/.env"
fi
echo ""

# Summary
echo "=== Summary ==="
echo "Run these commands if needed:"
echo ""
echo "1. Build frontend:"
echo "   cd /root/tds && npm run build"
echo ""
echo "2. Fix permissions:"
echo "   chown -R root:root /root/tds/dist"
echo "   chmod -R 755 /root/tds/dist"
echo ""
echo "3. Start backend:"
echo "   cd /root/tds && pm2 start ecosystem.config.js"
echo ""
echo "4. Reload Nginx:"
echo "   nginx -t && systemctl reload nginx"
echo ""

