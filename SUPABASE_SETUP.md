# Supabase Database Setup Guide

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

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose your organization
4. Enter project details:
   - **Name**: `food-waste-score`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click **"Create new project"**
6. Wait for the project to be ready (2-3 minutes)

## 2. Get Connection Details

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **"Run"** to create the tables and policies

## 4. Set Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Authentication
KIOSK_PASSWORD=your_secure_password_here

# Optional
NODE_ENV=development
```

## 5. Deploy to Vercel

1. **Connect Repository**:
   - Push code to GitHub
   - Connect repository in Vercel dashboard

2. **Set Environment Variables**:
   - Add `NEXT_PUBLIC_SUPABASE_URL` in Vercel dashboard
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel dashboard
   - Add `KIOSK_PASSWORD` in Vercel dashboard

3. **Deploy**:
   - Automatic deployment on push to main branch
   - Database will be initialized automatically

## 6. Database Schema

The app will automatically create these tables:

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

## 7. API Endpoints

- `POST /api/scores` - Save user score
- `GET /api/scores?netid=xxx&meal_period=xxx` - Get user scores
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/leaderboard` - Add leaderboard entry
- `GET /api/analytics?type=daily` - Get daily analytics
- `GET /api/analytics?type=meal&meal_period=breakfast` - Get meal analytics

## 8. Testing Locally

1. Install dependencies: `npm install`
2. Set up `.env.local` with your Supabase credentials
3. Run development server: `npm run dev`
4. The database will be initialized automatically on first API call

## 9. Production Considerations

- **Row Level Security**: Enabled for data protection
- **Public Access**: Configured for kiosk use (read/write)
- **Indexes**: Optimized for performance
- **Analytics Views**: Pre-built for reporting
- **Real-time**: Supabase supports real-time subscriptions if needed

## 10. Migration from Vercel Postgres

If migrating from Vercel Postgres:

1. Export data from Vercel Postgres
2. Import data into Supabase
3. Update environment variables
4. Deploy with new configuration

## 11. Monitoring & Analytics

Supabase provides built-in:
- **Database metrics** in dashboard
- **Query performance** monitoring
- **Real-time logs** and debugging
- **Automatic backups** and point-in-time recovery

---

Built with Supabase for reliable, scalable data storage.
