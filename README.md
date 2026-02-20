# Tennis Match Maker

A Next.js + TypeScript + Supabase application for organizing social tennis matches with automatic player rotation and match generation.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the migration

This will create all tables, indexes, RLS policies, and sample court data.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
│
├── lib/                         # Core business logic
│   ├── types.ts                 # Core type definitions
│   ├── supabase/               # Supabase clients
│   │   ├── client.ts           # Client-side
│   │   └── server.ts           # Server-side
│   ├── utils/                  # Utility functions
│   │   ├── grade-utils.ts      # Grade conversions
│   │   ├── court-utils.ts      # Court filtering
│   │   └── player-utils.ts     # Player selection
│   └── match-generation/       # Match generation algorithms
│       ├── index.ts            # Main orchestrator
│       ├── player-rotation.ts  # AB-smart rotation
│       ├── perfect-16.ts       # Perfect 16 scenario
│       ├── same-sex-matches.ts # Same-sex doubles
│       └── mixed-matches.ts    # Mixed doubles
│
├── components/                  # React components (to be added)
├── database-types.ts           # TypeScript types for database
├── supabase-migration.sql      # Database schema
└── database-schema.md          # Schema documentation
```

## 🎾 Features

### Current (from original HTML/JS)
- Court selection (grass/hard courts)
- Player registration with grades (2, 2A, 2B, 3, 3A)
- Gender-based matching (M/F)
- Multiple set support (1-6 sets per session)
- Same-sex and mixed doubles formats
- Player rotation algorithm (AB-smart)
- Perfect 16 special scenario
- Manual match creation
- Sit-out tracking (PSO - Previously Sat Out)
- NHC (No Hard Court) preference

### Planned
- [ ] User authentication (Supabase Auth)
- [ ] Event management UI
- [ ] Real-time match updates
- [ ] Player history tracking
- [ ] Repeat partner/opponent detection
- [ ] Grade balancing optimization
- [ ] Mobile-responsive design
- [ ] Print/export functionality

## 🔧 Development

### Key Algorithms

**AB-Smart Rotation**: Ensures players get different partners/opponents across sets by splitting players into two groups (A and B) and rotating them at different rates.

**Perfect 16**: Special algorithm for exactly 16 players of the same gender and grade, ensuring optimal rotation over 5 sets.

**Grade System**:
- Grade 2 (highest)
- Grade 2A
- Grade 2B
- Grade 3
- Grade 3A (lowest)

### Database Schema

See `database-schema.md` for complete documentation.

Key tables:
- `profiles` - User accounts (Supabase Auth)
- `players` - Player master list
- `events` - Tennis sessions
- `courts` - Court definitions
- `matches` - Generated matches
- `match_players` - Player assignments

## 📚 Documentation

- [Database Schema](./database-schema.md) - Complete schema documentation
- [Refactoring Guide](./REFACTORING-GUIDE.md) - Migration from original code
- [Database Types](./database-types.ts) - TypeScript definitions

## 🧪 Testing

```bash
# Run tests (to be added)
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted

## 📝 Migration from Original App

The original HTML/JS application had 125+ functions. These have been consolidated into:
- ~40 focused, testable functions
- Type-safe TypeScript
- Separated UI from business logic
- Modular architecture

See `REFACTORING-GUIDE.md` for detailed mapping.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Private project - All rights reserved

## 🆘 Support

For issues or questions, contact: Paul Oen 0438 374 643
