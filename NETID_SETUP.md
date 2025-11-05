# NetID Access Control Setup

The kiosk now requires NetIDs to be in an allowed list before users can proceed. This ensures only authorized users can use the system.

## Database Setup

### 1. Run the Schema Update

Run the updated schema SQL in your Supabase SQL Editor:

```sql
-- Create allowed_netids table for access control
CREATE TABLE IF NOT EXISTS allowed_netids (
  id SERIAL PRIMARY KEY,
  netid VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_allowed_netids_netid ON allowed_netids(netid);

-- Enable RLS
ALTER TABLE allowed_netids ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for validation)
CREATE POLICY "Allow public read access to allowed_netids" ON allowed_netids
  FOR SELECT USING (true);
```

### 2. Add NetIDs to the Database

You can add NetIDs using one of these methods:

#### Method A: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **allowed_netids**
3. Click **Insert** → **Insert row**
4. Enter the NetID (e.g., "jsmith")
5. Click **Save**

#### Method B: Via SQL
```sql
INSERT INTO allowed_netids (netid) VALUES 
  ('jsmith'),
  ('mjones'),
  ('dwilliams');
```

#### Method C: Bulk Import (CSV)
1. Prepare a CSV file with NetIDs:
   ```csv
   netid
   jsmith
   mjones
   dwilliams
   ```
2. In Supabase Dashboard → **Table Editor** → **allowed_netids**
3. Click **Import** → Upload CSV

## How It Works

1. **User enters NetID** on the welcome screen
2. **Frontend validates** by calling `/api/auth/validate-netid`
3. **Backend checks** the `allowed_netids` table
4. **If allowed**: User proceeds to dish selection
5. **If not allowed**: User sees error message: "NetID 'xxx' is not authorized. Please contact an administrator."

## Testing

1. **Add a test NetID** to the database:
   ```sql
   INSERT INTO allowed_netids (netid) VALUES ('testuser');
   ```

2. **Try logging in** with:
   - `testuser` → Should work ✅
   - `unauthorized` → Should show error ❌

## Removing NetIDs

To revoke access, simply delete the NetID from the `allowed_netids` table:

```sql
DELETE FROM allowed_netids WHERE netid = 'jsmith';
```

Or use the Supabase dashboard to delete rows.

## Notes

- NetIDs are case-insensitive (stored and compared in lowercase)
- NetIDs are trimmed of whitespace
- The `netid` column has a UNIQUE constraint to prevent duplicates
- Only admins should be able to INSERT/UPDATE/DELETE NetIDs (use service role key for admin operations)


