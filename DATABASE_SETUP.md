# Vercel Postgres Database Setup Guide

## 🔐 Password Protection

The kiosk app now includes password protection! Set up authentication by adding environment variables.

### Authentication Setup

1. **Set Kiosk Password**:
   ```bash
   KIOSK_PASSWORD=your_secure_password_here
   ```

2. **Default Password**: If not set, defaults to `admin123`

3. **Access Control**:
   - Users must enter the password to access the kiosk
   - Session lasts 24 hours
   - Logout button available in debug panel (press 'D')

## 1. Create Vercel Postgres Database

1. Go to your Vercel dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Choose a name for your database (e.g., "food-waste-score")
4. Select a region close to your users
5. Click **Create**

## 2. Get Connection String

1. In your Vercel dashboard, go to **Storage**
2. Click on your Postgres database
3. Go to the **Settings** tab
4. Copy the **Connection String** (starts with `postgres://`)

## 3. Set Environment Variables

Create a `.env.local` file in your project root:

```bash
# Vercel Postgres Connection String
POSTGRES_URL="postgres://username:password@host:port/database"

# Alternative: Individual parameters
POSTGRES_HOST="your-postgres-host"
POSTGRES_PORT="5432"
POSTGRES_DATABASE="your-database-name"
POSTGRES_USERNAME="your-username"
POSTGRES_PASSWORD="your-password"
```

## 4. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables in Vercel dashboard
4. Deploy!

## 5. Database Schema

The app will automatically create these tables on first run:

### `user_scores` table:
- `id` (SERIAL PRIMARY KEY)
- `netid` (VARCHAR(50))
- `meal_period` (VARCHAR(20))
- `score` (INTEGER)
- `dish_type` (VARCHAR(20))
- `weight_grams` (DECIMAL(10,2))
- `created_at` (TIMESTAMP)

### `leaderboard_entries` table:
- `id` (SERIAL PRIMARY KEY)
- `initials` (VARCHAR(3))
- `score` (INTEGER)
- `netid` (VARCHAR(50))
- `meal_period` (VARCHAR(20))
- `created_at` (TIMESTAMP)

## 6. API Endpoints

- `POST /api/scores` - Save user score
- `GET /api/scores?netid=xxx&meal_period=xxx` - Get user scores
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/leaderboard` - Add leaderboard entry
- `GET /api/analytics?type=daily` - Get daily analytics
- `GET /api/analytics?type=meal&meal_period=breakfast` - Get meal analytics

## 7. Testing Locally

1. Install dependencies: `npm install`
2. Set up `.env.local` with your Postgres connection
3. Run development server: `npm run dev`
4. The database will be initialized automatically on first API call

## 8. Production Considerations

- **Connection Pooling**: Vercel Postgres handles this automatically
- **Backups**: Automatic backups included
- **Scaling**: Scales automatically with usage
- **Security**: SSL connections enforced
- **Monitoring**: Available in Vercel dashboard

## 9. Migration from localStorage

The app includes fallback to localStorage if the database is unavailable, ensuring a smooth transition and reliability.
