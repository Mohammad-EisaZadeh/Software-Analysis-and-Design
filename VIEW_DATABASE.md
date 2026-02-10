# How to View Your Local Databases

Multiple ways to view and interact with your PostgreSQL databases.

## Method 1: Command Line (psql) - Quickest

### View All Databases

```bash
# List all databases
docker compose exec auth-db psql -U postgres -l
```

### Connect to a Specific Database

```bash
# Connect to auth database
docker compose exec -it auth-db psql -U postgres -d auth_db

# Once connected, you can run SQL commands:
# \dt          - List all tables
# \d users     - Describe users table
# SELECT * FROM users;
# \q           - Quit
```

### Quick Queries (Without Interactive Mode)

```bash
# View all users
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM users;"

# Count users
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT COUNT(*) FROM users;"

# View users with formatted output
docker compose exec auth-db psql -U postgres -d auth_db -c "\x" -c "SELECT * FROM users LIMIT 1;"
```

### View All Tables

```bash
# List tables in auth database
docker compose exec auth-db psql -U postgres -d auth_db -c "\dt"

# List tables in all databases
docker compose exec auth-db psql -U postgres -c "\l"
```

---

## Method 2: GUI Tools (Recommended for Visual Browsing)

### Option A: pgAdmin (Web-based)

#### Install pgAdmin Container

Add to your `docker-compose.yml`:

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
```

Then:
```bash
docker compose up -d pgadmin
```

Access at: http://localhost:5050
- Email: `admin@admin.com`
- Password: `admin`

**Connect to database:**
1. Right-click "Servers" → "Create" → "Server"
2. General tab: Name = "University DB"
3. Connection tab:
   - Host: `auth-db` (or `localhost` if connecting from host)
   - Port: `5432`
   - Database: `auth_db`
   - Username: `postgres`
   - Password: `postgres`
4. Click "Save"

### Option B: DBeaver (Desktop App)

1. **Download**: https://dbeaver.io/download/
2. **Install** DBeaver
3. **Create Connection**:
   - Click "New Database Connection"
   - Select "PostgreSQL"
   - Host: `localhost`
   - Port: `5432`
   - Database: `auth_db` (or any service database)
   - Username: `postgres`
   - Password: `postgres`
   - Click "Test Connection" then "Finish"

### Option C: VS Code Extension

1. Install extension: **"PostgreSQL"** or **"Database Client"**
2. Add connection:
   - Host: `localhost`
   - Port: `5432`
   - Database: `auth_db`
   - User: `postgres`
   - Password: `postgres`

---

## Method 3: Quick Database Viewer Script

Create a simple Node.js script to view data:

```bash
# Create viewer script
cat > view-db.js << 'EOF'
const { Pool } = require('pg');

const databases = [
  { name: 'auth_db', host: 'auth-db' },
  { name: 'resource_db', host: 'resource-db' },
  { name: 'marketplace_db', host: 'marketplace-db' },
];

async function viewDatabase(dbName, host) {
  const pool = new Pool({
    host: host,
    port: 5432,
    database: dbName,
    user: 'postgres',
    password: 'postgres',
  });

  try {
    // List tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\n📊 Database: ${dbName}`);
    console.log('Tables:', tables.rows.map(t => t.table_name).join(', '));

    // Show data from each table
    for (const table of tables.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`  ${table.table_name}: ${count.rows[0].count} rows`);
      
      if (count.rows[0].count > 0 && count.rows[0].count < 10) {
        const data = await pool.query(`SELECT * FROM ${table.table_name} LIMIT 5`);
        console.log('    Sample data:', JSON.stringify(data.rows, null, 2));
      }
    }
  } catch (error) {
    console.error(`Error viewing ${dbName}:`, error.message);
  } finally {
    await pool.end();
  }
}

(async () => {
  for (const db of databases) {
    await viewDatabase(db.name, db.host);
  }
})();
EOF

# Run it
docker compose exec auth-service node view-db.js
```

---

## Method 4: Useful Queries

### Auth Database

```bash
# View all users
docker compose exec auth-db psql -U postgres -d auth_db -c "
SELECT id, name, email, role, tenant_id, created_at 
FROM users 
ORDER BY created_at DESC;
"

# Check user count by role
docker compose exec auth-db psql -U postgres -d auth_db -c "
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
"
```

### Resource Database

```bash
# View all resources
docker compose exec resource-db psql -U postgres -d resource_db -c "
SELECT * FROM resources;
"

# View all bookings
docker compose exec resource-db psql -U postgres -d resource_db -c "
SELECT b.*, r.name as resource_name 
FROM bookings b 
JOIN resources r ON b.resource_id = r.id 
ORDER BY b.start_time DESC;
"
```

### Marketplace Database

```bash
# View products
docker compose exec marketplace-db psql -U postgres -d marketplace_db -c "
SELECT * FROM products;
"

# View orders
docker compose exec marketplace-db psql -U postgres -d marketplace_db -c "
SELECT o.*, 
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
FROM orders o 
ORDER BY o.created_at DESC;
"
```

---

## Method 5: Export Data

### Export to CSV

```bash
# Export users to CSV
docker compose exec auth-db psql -U postgres -d auth_db -c "
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER
" > users.csv
```

### Export to JSON

```bash
# Export users to JSON (using psql with custom format)
docker compose exec auth-db psql -U postgres -d auth_db -t -A -F"," -c "
SELECT json_agg(row_to_json(t)) 
FROM (SELECT * FROM users) t
" > users.json
```

---

## Quick Reference Commands

```bash
# List all databases
docker compose exec auth-db psql -U postgres -l

# Connect to database (interactive)
docker compose exec -it auth-db psql -U postgres -d auth_db

# Quick query
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM users;"

# List tables
docker compose exec auth-db psql -U postgres -d auth_db -c "\dt"

# Describe table structure
docker compose exec auth-db psql -U postgres -d auth_db -c "\d users"

# View table data (formatted)
docker compose exec auth-db psql -U postgres -d auth_db -c "\x" -c "SELECT * FROM users LIMIT 1;"
```

---

## All Database Connections

| Database | Host | Port | Database Name | User | Password |
|----------|------|------|---------------|------|----------|
| Auth | `localhost` | `5432` | `auth_db` | `postgres` | `postgres` |
| Resource | `localhost` | `5432` | `resource_db` | `postgres` | `postgres` |
| Marketplace | `localhost` | `5432` | `marketplace_db` | `postgres` | `postgres` |
| E-Learning | `localhost` | `5432` | `elearning_db` | `postgres` | `postgres` |
| Notification | `localhost` | `5432` | `notification_db` | `postgres` | `postgres` |
| IoT | `localhost` | `5432` | `iot_db` | `postgres` | `postgres` |
| Shuttle | `localhost` | `5432` | `shuttle_db` | `postgres` | `postgres` |

**Note**: When connecting from outside Docker (GUI tools), use `localhost`. When connecting from inside Docker containers, use the service name (e.g., `auth-db`).

---

## VS Code Quick Access

If using VS Code, install the **"Database Client"** extension:

1. Install extension
2. Click database icon in sidebar
3. Click "+" to add connection
4. Fill in connection details (use `localhost` for host)
5. Browse tables and run queries visually

---

## Troubleshooting

### "Connection refused"

Make sure the database container is running:
```bash
docker compose ps auth-db
```

### "Database does not exist"

The database should be created automatically. If not:
```bash
docker compose exec auth-db psql -U postgres -c "CREATE DATABASE auth_db;"
```

### "Password authentication failed"

Default credentials:
- User: `postgres`
- Password: `postgres`

Check in `docker-compose.yml` if changed.




