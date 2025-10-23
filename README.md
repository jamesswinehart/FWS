# Food Waste Score Kiosk App

A touch-friendly kiosk web application for measuring and tracking food waste scores in dining halls. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Touch-Optimized Interface**: Large buttons and intuitive navigation designed for kiosk use
- **Real-Time Scale Integration**: Pluggable transport system supporting mock, WebHID, and WebSerial scales
- **Meal Period Tracking**: Automatic detection of breakfast (8:00-10:00), lunch (11:30-13:30), and dinner (18:30-20:30)
- **Leaderboard System**: Top 10 scores with initials submission
- **Database Integration**: Vercel Postgres for persistent data storage with localStorage fallback
- **Idle Timer**: Automatic reset after 25 seconds of inactivity
- **Accessibility**: Full keyboard navigation and screen reader support

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with dark theme
- **Database**: Vercel Postgres with automatic fallback to localStorage
- **Testing**: Jest with React Testing Library
- **Deployment**: Vercel (recommended)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd FWS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Vercel Postgres connection string
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Create a Vercel Postgres database in your Vercel dashboard
2. Copy the connection string to `.env.local`:
   ```bash
   POSTGRES_URL="postgres://username:password@host:port/database"
   ```
3. Deploy to Vercel - the database will be initialized automatically

### Option 2: Local Development

The app automatically falls back to localStorage if no database is configured, so it works out of the box for development.

## Usage

### Basic Flow

1. **Welcome Screen**: Enter NetID and place dish on scale
2. **Dish Selection**: Choose dish type (Plate, Salad Bowl, Cereal Bowl)
3. **Score Calculation**: App calculates food waste score based on weight
4. **Leaderboard**: Submit initials if score qualifies (≥50 points)
5. **Reset**: Automatic reset after idle timeout or manual exit

### Scale Integration

The app supports multiple scale transport methods:

- **Mock Scale** (default): Simulated readings for development
- **WebHID**: USB HID scale integration
- **WebSerial**: Serial port scale integration

Switch transports by modifying `transport/transport.mock.ts` in the main app component.

## API Endpoints

- `POST /api/scores` - Save user score
- `GET /api/scores?netid=xxx&meal_period=xxx` - Get user scores
- `GET /api/leaderboard` - Get leaderboard entries
- `POST /api/leaderboard` - Add leaderboard entry
- `GET /api/analytics?type=daily` - Get daily analytics
- `GET /api/analytics?type=meal&meal_period=breakfast` - Get meal analytics

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main app component
├── components/            # React components
│   ├── CircleGauge.tsx    # Score visualization
│   ├── Screen*.tsx        # Screen components
│   └── StatusBar.tsx      # Status display
├── lib/                   # Utilities and logic
│   ├── database.ts        # Database operations
│   ├── fws.ts             # Scoring algorithm
│   ├── meal.ts            # Meal period utilities
│   ├── state.ts           # State machine
│   └── *.ts               # API wrappers
├── transport/             # Scale transport layer
│   ├── transport.ts       # Interface definition
│   ├── transport.mock.ts  # Mock implementation
│   ├── transport.hid.ts    # WebHID stub
│   └── transport.serial.ts # WebSerial stub
└── __tests__/            # Test files
```

### Key Features

#### State Machine
The app uses a finite state machine for navigation:
- `WELCOME` → `DISH_TYPE` → `SCORE` → `LEADERBOARD`
- Error handling and idle timeout states
- Back navigation support

#### Scoring Algorithm
Food waste scores calculated using logistic function:
```typescript
fws(weightGrams, baselineG=60, sensitivity=60)
```

#### Meal Period Detection
Automatic meal period detection based on time:
- Breakfast: 8:00-10:00
- Lunch: 11:30-13:30  
- Dinner: 18:30-20:30

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Push code to GitHub
   - Connect repository in Vercel dashboard

2. **Set Environment Variables**
   - Add `POSTGRES_URL` in Vercel dashboard
   - Database will be initialized automatically

3. **Deploy**
   - Automatic deployment on push to main branch
   - Custom domain configuration available

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Configuration

### Environment Variables

```bash
# Required for production
POSTGRES_URL="postgres://username:password@host:port/database"

# Optional
NODE_ENV="production"
```

### Customization

- **Meal Times**: Modify `lib/meal.ts` for different dining hall hours
- **Scoring**: Adjust baseline and sensitivity in `lib/fws.ts`
- **UI**: Customize colors and layout in `app/globals.css`
- **Scale**: Implement real scale integration in `transport/` directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the API endpoints in `/app/api`

---

Designed with love by James Swinehart and Team