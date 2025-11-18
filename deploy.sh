#!/bin/bash

# TDS Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting TDS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${RED}⚠️  Please edit .env file with your configuration before continuing!${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found. Please create .env file manually.${NC}"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
npm run build

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed. dist folder not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
    npm install -g pm2
fi

# Stop existing PM2 process if running
if pm2 list | grep -q "tds-backend"; then
    echo -e "${YELLOW}🛑 Stopping existing PM2 process...${NC}"
    pm2 stop tds-backend || true
    pm2 delete tds-backend || true
fi

# Start with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}📊 Check status: pm2 status${NC}"
echo -e "${GREEN}📝 View logs: pm2 logs tds-backend${NC}"
echo -e "${GREEN}🖥️  Monitor: pm2 monit${NC}"

