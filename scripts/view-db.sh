#!/bin/bash

# Quick database viewer script
# Usage: ./scripts/view-db.sh [database-name]

DB_NAME=${1:-auth_db}
SERVICE_NAME=${DB_NAME%_db}-db

echo "📊 Viewing database: $DB_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# List tables
echo ""
echo "📋 Tables:"
docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -c "\dt"

# Show table data
echo ""
echo "📄 Data:"
case $DB_NAME in
  auth_db)
    docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -c "SELECT id, name, email, role, tenant_id FROM users;"
    ;;
  resource_db)
    docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -c "SELECT * FROM resources;"
    echo ""
    docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -c "SELECT id, resource_id, user_id, start_time, end_time, status FROM bookings;"
    ;;
  marketplace_db)
    docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -c "SELECT * FROM products;"
    echo ""
    docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -c "SELECT id, user_id, total, status FROM orders;"
    ;;
  *)
    echo "Showing first table data..."
    TABLE=$(docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1;" | xargs)
    if [ ! -z "$TABLE" ]; then
      docker compose exec -T $SERVICE_NAME psql -U postgres -d $DB_NAME -c "SELECT * FROM $TABLE LIMIT 10;"
    fi
    ;;
esac

echo ""
echo "✅ Done! Use 'docker compose exec -it $SERVICE_NAME psql -U postgres -d $DB_NAME' for interactive mode"




