#!/bin/bash

# Simple local database setup script
# Creates SQLite databases and seed data for local development

echo "Setting up local SQLite databases..."

# Create data directories
mkdir -p services/auth-service/data
mkdir -p services/resource-service/data
mkdir -p services/marketplace-service/data
mkdir -p services/elearning-service/data
mkdir -p services/notification-service/data
mkdir -p services/iot-service/data
mkdir -p services/shuttle-service/data

echo "Data directories created!"
echo ""
echo "To use SQLite locally:"
echo "1. Install sqlite3: npm install sqlite3 --save"
echo "2. Update service code to use SQLite instead of PostgreSQL"
echo "3. Or use the simplified docker-compose.local.yml"
echo ""
echo "For the simplest setup, just use docker-compose.local.yml:"
echo "  docker compose -f docker-compose.local.yml up"




