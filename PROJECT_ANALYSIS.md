# Daily Reflection - Technical Project Analysis

## 🎯 Project Overview

**Daily Reflection** is a sophisticated full-stack web application that helps users plan and reflect on their daily activities through a productivity journaling system. It combines schedule planning, reflection journaling, and productivity tracking into a cohesive experience.

### Core Concept
The app follows a two-phase daily cycle:
1. **Planning Phase**: Users define their expected schedule/goals for today or tomorrow
2. **Reflection Phase**: At the end of the day, users upload their actual schedule and write reflections comparing expected vs. actual outcomes

## 🏗️ Technical Architecture

### Tech Stack

**Frontend:**
- **Framework**: Next.js 15.3.4 (App Router with React Server Components)
- **React**: v19.1.0 with React Server Components
- **UI Library**: Radix UI primitives + shadcn/ui components
- **Styling**: TailwindCSS v4.0.6
- **State Management**: TanStack Query (React Query) v5.83.0
- **Animations**: Framer Motion v12.23.9
- **Rich Text**: Marked.js (Markdown parser) + Custom Rich Text Editor
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

**Backend:**
- **Framework**: Next.js API Routes (Server-side)
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Local file system (`public/uploads/`)
- **API Design**: RESTful APIs with type-safe validation

**External Integrations:**
- **GitHub API**: GraphQL API for contribution calendar data
- **LeetCode API**: GraphQL API for coding activity data
- **Napchart**: Image generation from Napchart.com for sleep/time tracking

**Development Tools:**
- **Runtime**: Bun (fast JavaScript runtime)
- **Language**: TypeScript (strict typing)
- **Validation**: Zod schemas
- **Date/Time**: Luxon for timezone-aware date handling

### Architecture Patterns

1. **Server-First Architecture**: Uses React Server Components (RSC) for improved performance
2. **API-First Design**: Clear separation between frontend and backend through REST APIs
3. **Type Safety**: Full TypeScript coverage with Zod runtime validation
4. **Component-Driven**: Modular, reusable components with shadcn/ui patterns
5. **Progressive Enhancement**: Dynamic imports for code splitting

## 🔑 Key Features Breakdown

### 1. Daily Entry Management
**File**: `src/app/entries/[date_string]/page.tsx`

- Users can create entries for today and tomorrow (future dates allowed)
- Cannot create entries for past dates (403 forbidden)
- Each entry has:
  - **Expected Schedule Image**: What you planned to do
  - **Actual Schedule Image**: What you actually did
  - **Reflection Text**: Rich text journal entry with markdown support

**Technical Implementation:**
- Dynamic routing using Next.js App Router `[date_string]` parameter
- Server-side data fetching with `fetch()` and `cache: "no-store"`
- Lazy loading of image uploader and rich text editor components for performance

### 2. Image Upload System
**File**: `src/components/image-uploader.tsx`

Supports two methods:
- **File Upload**: Direct image upload to `/public/uploads/`
- **URL Input**: Napchart chart integration or direct image URLs

**Smart Features:**
- Base64 preview generation
- Napchart chart ID auto-detection (converts `abc123456` → `https://napchart.com/api/v2/getImage?chartid=abc123456`)
- Optimistic UI updates with local state
- Image validation and error handling
- Local storage staging for unsaved changes

**API Endpoints:**
- `POST /api/upload`: Handles file uploads, saves to disk
- `DELETE /api/delete-image`: Removes images from disk

### 3. Rich Text Reflection Editor
**File**: `src/components/very-rich-text-editor.tsx`

- Markdown-based editor with live preview
- Sanitized HTML rendering using DOMPurify (XSS prevention)
- Supports formatting, lists, links, code blocks
- Auto-save capability with debouncing
- Character count tracking

### 4. Activity Heatmap & Productivity Tracking
**Files**: `src/components/heatmap/*`, `src/lib/heatmap/*`

A GitHub-style contribution heatmap that aggregates:
- **Journal Entries**: Days with completed reflections
- **GitHub Contributions**: Commits, PRs, issues from GitHub API
- **LeetCode Submissions**: Coding problems solved

**Technical Features:**
- Combined data visualization from multiple sources
- 12-month rolling window display
- Color intensity based on activity level (5 levels: none → maximum)
- Caching strategy to avoid API rate limits (1-2 hour cache)
- Graceful error handling with fallback to cached data
- Beautiful loading animation using Framer Motion

**Data Flow:**
1. Frontend requests from `/api/productivity`
2. Backend fetches from GitHub GraphQL API (requires token)
3. Backend fetches from LeetCode GraphQL API
4. Backend queries MongoDB for journal entries
5. Data merged, normalized, and cached in memory
6. Response sent to frontend with combined activity data

### 5. Streak & Calendar System
**File**: `src/components/streak-header.tsx`

- Horizontal scrollable calendar view
- Shows which days have entries (flame icon 🔥)
- Current streak calculation based on consecutive days
- Auto-scroll to current date
- Month navigation with smooth transitions
- Responsive design for mobile and desktop

**Database Query:**
```typescript
// Efficiently queries only dates, sorted chronologically
await EntryModel.find({}, { date: 1 }).sort({ date: 1 })
```

### 6. Day Counter System
**File**: `src/models/entry.ts` - `calculateDayX()`

Innovative feature that assigns each entry a sequential "Day X" number:
- First entry = Day 1
- Second entry = Day 2
- Helps users track their journey (e.g., "Day 47 of my reflection journey")

**Why it's clever:**
- Doesn't rely on consecutive dates
- Only counts actual entries
- Motivational aspect: see how many days you've reflected

## 📊 Database Schema

### Entry Model (MongoDB/Mongoose)

```typescript
{
  date: Date,                         // UTC date (unique)
  expectedScheduleImageUrl: String,   // Path or URL to planned schedule
  actualScheduleImageUrl: String,     // Path or URL to actual schedule  
  reflectionText: String,             // Markdown text
  createdAt: Date,                    // Auto-generated
  updatedAt: Date                     // Auto-generated
}
```

**Key Design Decisions:**
- `date` field is unique (one entry per day)
- All fields except `date` are optional (progressive entry completion)
- UTC storage with local timezone conversion for display
- Lean queries (`{}, { date: 1 }`) for performance

## 🔐 Security Considerations

1. **XSS Prevention**: DOMPurify sanitizes all user HTML/Markdown
2. **File Upload Security**: 
   - Type validation (images only)
   - Size limits enforced
   - Files stored outside web root initially, then moved to `/uploads/`
3. **API Authentication**: GitHub token stored in env variables
4. **Input Validation**: Zod schemas validate all API inputs/outputs
5. **SQL/NoSQL Injection**: Mongoose ODM provides query protection
6. **Rate Limiting**: API caching reduces external API calls

## 🎨 UI/UX Design

### Design System
- **Theme**: Dark mode optimized with light mode support (next-themes)
- **Color Palette**: Purple accent (`#9400ff`) with neutral grays
- **Typography**: Modern, readable font hierarchy
- **Layout**: Centered max-width containers (6xl = 1152px)
- **Spacing**: Consistent Tailwind spacing scale

### Animations
- **Loading States**: Skeleton screens and shimmer effects
- **Transitions**: Smooth hover states and page transitions
- **Micro-interactions**: Button press effects, toast notifications
- **Advanced**: Rotating text animation on homepage

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:` for different screen sizes
- Touch-friendly UI elements
- Horizontal scroll for calendar on mobile

## 🚀 Performance Optimizations

1. **Code Splitting**: Dynamic imports for heavy components
   ```typescript
   const ImageUploader = dynamic(() => import("@/components/image-uploader"), { ssr: false })
   ```

2. **Server Components**: Default to RSC for zero JS sent to client

3. **Image Optimization**: Next.js `<Image>` component with lazy loading

4. **Database Queries**: Lean queries, projection to fetch only needed fields
   ```typescript
   .find({}, { date: 1 }).lean()  // Only fetch dates, return plain objects
   ```

5. **Caching Strategy**:
   - GitHub API: 1 hour in-memory cache
   - LeetCode API: 2 hour in-memory cache
   - Reduces API calls and improves response time

6. **Query Optimization**: TanStack Query for client-side caching and deduplication

## 🔄 Data Flow Examples

### Creating a New Entry:
1. User visits `/entries/2024-11-26`
2. Server component calls `GET /api/entries/find-or-create/2024-11-26`
3. API checks MongoDB for existing entry
4. If not found, creates new entry with empty fields
5. Returns entry data to server component
6. Server component renders with entry data
7. Client components hydrate for interactivity

### Uploading an Image:
1. User selects image in ImageUploader component
2. Client converts to base64 for preview
3. On save, `POST /api/upload` with FormData
4. Server validates image type and size
5. Saves to `/public/uploads/{timestamp}_{filename}`
6. Returns file path
7. Client updates entry via `PUT /api/entries/[date_string]`
8. MongoDB updated with new image URL

### Saving Reflection:
1. User types in VeryRichTextEditor
2. Component state updates (controlled input)
3. User clicks "Save All Changes"
4. Client calls `PUT /api/entries/[date_string]`
5. Request includes: `{ reflectionText, expectedScheduleImageUrl, actualScheduleImageUrl }`
6. Server validates with Zod schema
7. MongoDB findOneAndUpdate by date
8. Success toast shown to user
9. React Query invalidates cache

## 🧪 Development Workflow

### Local Setup:
```bash
# Install dependencies
bun install

# Setup environment
cp env.example .env.local
# Edit .env.local with your MongoDB URI, GitHub token, etc.

# Start MongoDB
mongod

# Run development server
bun run dev
```

### Build Process:
```bash
bun run build    # Next.js build with static optimization
bun run start    # Production server
bun run lint     # ESLint checks
```

## 🎯 Unique Selling Points

1. **Future Planning**: Unlike typical journals, allows planning tomorrow today
2. **Visual Comparison**: Side-by-side expected vs. actual schedules
3. **Productivity Integration**: GitHub + LeetCode activity tracking
4. **Napchart Integration**: Seamless time-blocking with popular tool
5. **Day Counter**: Gamification through journey tracking
6. **Streak Motivation**: Visual streak tracking encourages consistency
7. **Rich Reflection**: Markdown support for detailed thoughts

## 🛠️ Technical Challenges Solved

### 1. Timezone Handling
**Problem**: MongoDB stores UTC, users expect local dates  
**Solution**: Luxon library for timezone-aware conversions
```typescript
// Convert YYYY-MM-DD (local) → UTC Date (MongoDB)
dateStringToUtcDate("2024-11-26")

// Convert UTC Date (MongoDB) → YYYY-MM-DD (local)  
utcDateToDateString(new Date("2024-11-26T00:00:00Z"))
```

### 2. Day X Calculation
**Problem**: Efficiently assign sequential numbers to non-consecutive entries  
**Solution**: Sort all dates, find index of target date
```typescript
const entries = await EntryModel.find({}, { date: 1 }).sort({ date: 1 })
const index = entries.findIndex(e => e.date === targetDate)
return index + 1
```

### 3. Image Status Validation
**Problem**: Broken image URLs in database  
**Solution**: Check file existence, clean up invalid URLs on fetch
```typescript
async function checkImageStatus(url: string) {
  const exists = await fs.access(publicPath).then(() => true).catch(() => false)
  return { exists, error: exists ? undefined : {...} }
}
```

### 4. API Rate Limiting
**Problem**: GitHub/LeetCode APIs have rate limits  
**Solution**: In-memory cache with TTL + fallback to stale data
```typescript
const cached = cache.get(key)
if (cached) return cached

try {
  const data = await fetchFromAPI()
  cache.set(key, data, ttl)
  return data
} catch (error) {
  return cache.get(key) || throwError()
}
```

### 5. Large Data Pagination
**Problem**: Fetching all entries can be slow  
**Solution**: Limit queries, implement pagination
```typescript
await EntryModel.find().sort({ date: -1 }).limit(100)
```

## 📈 Scalability Considerations

**Current Architecture:**
- Local file storage
- In-memory caching
- Single MongoDB connection

**Potential Improvements:**
- Cloud storage (S3, Cloudinary) for images
- Redis for distributed caching
- CDN for static assets
- Database connection pooling
- Background jobs for external API fetching

## 🔮 Future Enhancements (Ideas)

1. **Multi-user Support**: User authentication, personal journals
2. **Goal Setting**: Define and track specific goals
3. **Analytics Dashboard**: Trends, insights, completion rates
4. **Habit Tracking**: Checkbox habits alongside schedule
5. **Export/Backup**: PDF export, data backup functionality
6. **Mobile App**: React Native companion app
7. **AI Insights**: GPT-4 analysis of reflection patterns
8. **Social Features**: Share achievements, compare streaks
9. **Templates**: Pre-made schedule templates
10. **Reminders**: Notifications for daily reflection

## 💡 What Makes This Project Impressive

### For Developers:
- **Modern Stack**: Uses cutting-edge Next.js 15 with RSC
- **Type Safety**: Full TypeScript + Zod validation
- **Best Practices**: Clean architecture, separation of concerns
- **Performance**: Optimized queries, code splitting, caching
- **Real Integrations**: Working GitHub/LeetCode API integration

### For Users:
- **Solves Real Problem**: Planning vs. reality gap awareness
- **Beautiful UI**: Professional, polished design
- **Fast & Responsive**: Snappy interactions, smooth animations
- **Feature-Rich**: Heatmap, streaks, rich text, dual image upload
- **Motivating**: Gamification elements encourage consistency

### For Interviews:
- **Full-Stack**: Frontend + Backend + Database + External APIs
- **Complex Features**: Timezone handling, file uploads, real-time updates
- **Scalable Architecture**: Well-structured, maintainable codebase
- **Problem Solving**: Clear technical decisions with rationale
- **Production Ready**: Error handling, validation, security considerations

---

This project demonstrates proficiency in:
- ✅ Modern React/Next.js development
- ✅ Full-stack web application architecture
- ✅ Database design and optimization
- ✅ API integration and design
- ✅ UI/UX design principles
- ✅ Performance optimization
- ✅ Security best practices
- ✅ TypeScript and type safety
- ✅ State management patterns
- ✅ Real-world problem solving
