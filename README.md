# Daily Reflection

A full-stack productivity journaling application that helps users bridge the gap between planning and execution through visual schedule comparison and reflective journaling.

## 🎯 Overview

**Daily Reflection** follows a two-phase daily cycle:

1. **Planning Phase**: Before the day starts, users define their expected schedule or goals (upload image or Napchart)
2. **Reflection Phase**: At the end of the day, users add their actual schedule and write reflections comparing expectations vs reality

Inspired by Amitabh Bachchan's daily notes practice, this app combines:
- Visual schedule comparison (expected vs actual)
- Rich text journaling with Markdown support
- GitHub-style activity heatmap (journal + GitHub commits + LeetCode problems)
- Streak tracking and motivational "Day X" counter

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Features**: Image upload, Rich text editor, GitHub/LeetCode API integration
- **UI**: Radix UI + shadcn/ui components, Framer Motion animations

## 📚 Documentation

### For Interviews & Understanding the Project:

- **[README_INTERVIEW_GUIDE.md](./README_INTERVIEW_GUIDE.md)** - Start here! Quick interview prep guide
- **[PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md)** - Deep technical analysis of the entire codebase
- **[INTERVIEW_PREPARATION.md](./INTERVIEW_PREPARATION.md)** - 26 common interview Q&A with detailed answers
- **[codebase-analysis.md](./codebase-analysis.md)** - Additional codebase insights

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Setup environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your MongoDB URI, GitHub token, etc.
   ```

3. **Create uploads folder:**
   ```bash
   mkdir -p public/uploads
   ```

4. **Start MongoDB:**
   ```bash
   mongod
   ```

5. **Run development server:**
   ```bash
   bun run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 📖 How It Works

### Daily Cycle:
1. Visit homepage → Plan today or tomorrow
2. Upload expected schedule (image or Napchart URL)
3. Later: Add actual schedule + reflection text
4. View your journey: Streaks, Day X counter, activity heatmap

### Key Features:
- **Entry Management**: Create entries for today/tomorrow (not past dates)
- **Dual Image Upload**: File upload or Napchart integration
- **Rich Text Editor**: Markdown-based reflection journaling
- **Activity Heatmap**: Combined view of journal entries, GitHub contributions, LeetCode submissions
- **Streak Tracking**: Maintain daily reflection streaks
- **Day Counter**: Track your reflection journey ("Day 27")

## 🎨 Features Showcase

- ✅ Visual schedule comparison
- ✅ Markdown reflection editor with live preview
- ✅ GitHub & LeetCode activity integration
- ✅ Productivity heatmap (GitHub-style)
- ✅ Streak tracking with calendar view
- ✅ Dark/Light theme support
- ✅ Responsive design
- ✅ Smooth animations

## 🔐 Security

- XSS prevention with DOMPurify
- File upload validation
- Zod schema validation
- MongoDB injection prevention
- Secure environment variables

## 📝 License

Personal project - All rights reserved

---

**For interview preparation and project understanding, start with [README_INTERVIEW_GUIDE.md](./README_INTERVIEW_GUIDE.md)**