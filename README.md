# LifePilot AI

An **AI-powered productivity copilot** that analyzes deadline risk, prioritizes tasks automatically, generates smart plans, and provides intelligent coaching to keep you on track.

## Features

- **Dashboard** - Real-time overview of tasks, deadlines, and productivity metrics
- **Task Management** - Create, update, and organize tasks with deadline tracking
- **AI Analysis** - Automatic analysis of task deadlines and risk assessment
- **Smart Planner** - AI-generated daily schedules optimized for your tasks
- **AI Coach** - Conversational AI assistant providing guidance and motivation
- **Insights** - Analytics and productivity trends visualization

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: Firebase/Firestore
- **AI Integration**: Google Gemini API 2.4
- **UI Components**: Recharts (analytics), Lucide Icons, Motion (animations)

## Getting Started

### Prerequisites
- Node.js 16+
- Firebase project configured
- Google Gemini API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create a `.env.local` file with your Gemini API key: `GEMINI_API_KEY=your_key_here`
   - Configure Firebase credentials in `src/firebase/config.ts`

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Starts at `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
src/
├── pages/              # Feature pages (Dashboard, AI Coach, Smart Planner, etc.)
├── components/         # Reusable components (Navbar)
├── firebase/          # Firebase configuration
├── types.ts           # TypeScript type definitions
└── main.tsx           # React entry point
```

## Key Features Explained

- **Real-time Sync**: All tasks automatically sync to Firebase
- **AI-Powered Insights**: Google Gemini analyzes your tasks and provides risk assessment
- **Intelligent Scheduling**: Smart Planner creates optimal daily schedules based on deadlines and priorities
- **Interactive Coaching**: AI Coach learns from your tasks and provides personalized productivity tips

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Run production build
npm run lint       # Run TypeScript compiler check
npm run preview    # Preview production build
npm run clean      # Clean dist folder
```

## Deployment

Built with Vite for optimal production builds. Deploy the `dist` folder to any static hosting service or use the Express backend for server-side rendering.

## License

Private project

---

**LifePilot AI** - Your intelligent productivity companion 🚀
