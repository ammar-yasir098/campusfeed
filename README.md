# 🎓 UMT CampusFeed — University Portal & Student Community Platform

**UMT CampusFeed** is a modern, full-stack **Single Page Application (SPA)** designed for students at the **University of Management and Technology (UMT), Lahore**. It provides an official student communication hub for announcements, academic discussions, society events, lost & found items, and campus buy & sell listings.

---

## 🌟 Key Features

- 🏛️ **Official UMT Lahore Branding** — UMT Deep Navy Blue (`#0f2942`) and crisp white academic styling
- 🔐 **JWT Authentication** — Dedicated Sign In & Account Registration pages with JWT token authorization and Bcrypt password hashing
- 🛡️ **Server-Side Input Validation** — All forms validated with `express-validator` (name, email format, password length, post content limits)
- 📌 **Fixed Left Sidebar Navigation** — Quick access to Campus Feed, Saved Bookmarks, My Profile, and Category Filters
- 📰 **Categorized Campus Feed**:
  - 📢 **Announcements** — Exam dates, university notices
  - 📅 **Events** — Technofests, hackathons, society events
  - 💬 **General** — Academic discussions & campus advice
  - ⚠️ **Lost & Found** — Lost items & security handovers
  - 🛍️ **Buy & Sell** — Used textbooks, electronics & dorm supplies
- 🔄 **Infinite Scroll Pagination** — Initial batch loads 5 posts, followed by automatic 3-post batch fetches as you scroll
- ❤️ **Interactive Likes & Comments** — Instant like/unlike toggle and expandable comment threads with student avatars
- 🔖 **Saved Bookmarks** — Bookmark important deadlines or events to view in a personalized saved feed
- 🗳️ **Student Polls** — Create and vote on polls attached to posts (single vote, locked after voting)
- 🖼️ **Image & Avatar Uploads** — Multer image storage saved in `uploads/` and served statically
- 🔍 **Real-Time Search** — Instant filtering across post titles, content, categories, and student author names
- 👁️ **Shadowban Support** — Shadowbanned users' posts are hidden from everyone except themselves
- 🛠️ **Admin Control Panel** — Manage users: ban, suspend, mute, shadowban, verify, promote/demote roles; issue official post takedowns with reason logs
- 📱 **Mobile Responsive** — Drawer sidebar with overlay backdrop on small screens
- 🌐 **URL-Based Routing** — React Router v6 with browser back/forward support (`/feed`, `/login`, `/signup`, `/profile`, `/bookmarks`, `/admin`)

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express 5 | ^5.2.1 | REST API server |
| PostgreSQL | — | Relational database |
| Sequelize ORM | ^6.37.8 | Database models & associations |
| JSON Web Tokens (JWT) | ^9.0.3 | Authentication tokens (7-day expiry) |
| Bcrypt | ^6.0.0 | Password hashing (salt rounds: 10) |
| Multer | ^2.2.0 | File & avatar uploads |
| express-validator | — | Server-side input validation |
| express-rate-limit | ^8.6.0 | Login brute-force protection (5 attempts / 15 min in production) |
| dotenv | — | Environment configuration |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2.7 | UI framework (SPA) |
| React Router DOM | ^7.x | Client-side URL routing |
| Vite | ^8.1.1 | Build tool & dev server |
| Lucide React | ^1.27.0 | Icon library |
| Vanilla CSS3 | — | Custom design tokens & glassmorphism |

---

## 📁 Project Directory Structure

```text
campusfeed_backend/
├── config/
│   └── database.js               # Sequelize PostgreSQL connection config
├── middleware/
│   ├── authMiddleware.js          # JWT verification + user status check
│   ├── adminMiddleware.js         # Admin role enforcement middleware
│   ├── uploadMiddleware.js        # Multer file storage middleware
│   ├── validate.js                # Generic express-validator error handler
│   └── validators.js             # Validation rule chains (signup, login, post, comment, profile)
├── models/
│   ├── User.js                    # User model (id, name, email, role, status, studentId, department, bio, avatarUrl, isVerified, lastLoginIp)
│   ├── Post.js                    # Post model (id, title, content, category, imageUrl, isTakedown, takedownReason, userId)
│   ├── Like.js                    # Like model (userId, postId)
│   ├── Comment.js                 # Comment model (id, text, userId, postId)
│   ├── Bookmark.js                # Bookmark model (userId, postId)
│   ├── Poll.js                    # Poll model (id, question, postId)
│   ├── PollOption.js              # Poll option model (id, optionText, pollId)
│   ├── PollVote.js                # Poll vote model (id, userId, pollId, optionId)
│   └── index.js                   # All model associations (hasMany, belongsTo, CASCADE)
├── Routes/
│   ├── authRoutes.js              # Auth endpoints (/signup, /login, /me) + rate limiting
│   ├── postRoutes.js              # Feed, CRUD, likes, comments, bookmarks, polls, takedowns
│   ├── userRoutes.js              # Profile, avatar update, bookmarks
│   ├── uploadRoutes.js            # Dedicated file upload endpoint
│   └── adminRoutes.js             # Admin: user management, status, verify, role changes
├── scripts/
│   ├── syncDb.js                  # Database sync script (npm run db:sync)
│   └── seedPosts.js               # Seeds 50 posts across 5 categories
├── uploads/                        # Uploaded images and avatar pictures (static)
├── frontend/                       # React + Vite SPA
│   ├── .env                        # Frontend environment (VITE_API_URL)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.jsx        # Full-page Sign In & Register (URL-driven mode)
│   │   │   ├── Sidebar.jsx         # Left nav sidebar (desktop + mobile drawer)
│   │   │   ├── PostCard.jsx        # Post display with likes, comments, polls, takedown banners
│   │   │   ├── CreatePostModal.jsx # Create post modal (text, category, image, poll)
│   │   │   ├── ProfileView.jsx     # Profile page with post history
│   │   │   ├── ProfileModal.jsx    # Edit profile & avatar upload modal
│   │   │   ├── AdminDashboard.jsx  # Admin control panel (user search, status, verify, role)
│   │   │   ├── HeaderSearchBar.jsx # Top search bar & category filter
│   │   │   ├── CategoryFilter.jsx  # Category filter buttons
│   │   │   └── VerifiedBadge.jsx   # Blue checkmark verified badge
│   │   ├── services/
│   │   │   └── api.js              # Centralized API client (fetch wrapper, token management)
│   │   ├── App.jsx                 # Root app with React Router routes
│   │   ├── App.css                 # Component-specific styles
│   │   ├── index.css               # Global UMT design system (tokens, utilities, animations)
│   │   └── main.jsx                # React entry point with BrowserRouter
│   └── package.json
├── .env                            # Backend environment variables
├── .gitignore
├── server.js                       # Express server entry point
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18 or higher
- **PostgreSQL** installed and running locally

### 2. Clone & Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

**Backend `.env`** (root directory):
```env
# PostgreSQL Connection
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=campus-feed

NODE_ENV=development

PORT=5000
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
```

**Frontend `frontend/.env`**:
```env
VITE_API_URL=http://localhost:5000
```

> ⚠️ **Production Note**: In production, set `NODE_ENV=production` to disable `alter:true` on Sequelize sync and enforce CORS strictly.

### 4. Database Setup

```bash
# Sync PostgreSQL tables
npm run db:sync

# (Optional) Seed 50 sample posts across 5 categories
node scripts/seedPosts.js
```

### 5. Run the Application

```bash
# Start backend (root directory) — http://localhost:5000
npm run dev

# Start frontend (in a new terminal) — http://localhost:5173
cd frontend
npm run dev
```

> 💡 **First User is Auto-Admin**: The very first registered account is automatically assigned the `admin` role for easy initial setup.

---

## 🌐 Frontend Routes

| URL | Page | Auth Required |
|---|---|---|
| `/feed` | Main campus feed (default) | No (guest view) |
| `/login` | Sign In page | No |
| `/signup` | Register page | No |
| `/bookmarks` | Saved bookmarks | ✅ Yes |
| `/profile` | Student profile & post history | ✅ Yes |
| `/admin` | Admin control panel | ✅ Admin only |

---

## 📡 API Reference

### 🔐 Auth Endpoints (`/api/auth`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new student account | No |
| `POST` | `/api/auth/login` | Sign in & receive JWT token (rate limited) | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | ✅ Yes |

### 📰 Post Feed Endpoints (`/api/posts`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/posts?category=&limit=5&offset=0` | Get paginated feed posts | No |
| `GET` | `/api/posts/:id` | Get single post with comments & poll | No |
| `POST` | `/api/posts` | Create new post (text + image + optional poll) | ✅ Yes |
| `DELETE` | `/api/posts/:id` | Delete post (author or admin) | ✅ Yes |
| `POST` | `/api/posts/:id/takedown` | Admin takedown with reason log | ✅ Admin |
| `POST` | `/api/posts/:id/like` | Toggle like/unlike | ✅ Yes |
| `POST` | `/api/posts/:id/bookmark` | Toggle save bookmark | ✅ Yes |
| `GET` | `/api/posts/:id/comments` | Fetch comment thread | No |
| `POST` | `/api/posts/:id/comments` | Add comment | ✅ Yes |
| `DELETE` | `/api/posts/comments/:commentId` | Delete comment (author only) | ✅ Yes |
| `POST` | `/api/posts/:id/poll/vote` | Vote on a poll option (locked, once only) | ✅ Yes |

### 👤 User Profile Endpoints (`/api/users`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/users/profile` | Get current student profile & post history | ✅ Yes |
| `PUT` | `/api/users/profile` | Update profile info & avatar | ✅ Yes |
| `GET` | `/api/users/bookmarks` | Fetch saved bookmarked posts | ✅ Yes |
| `GET` | `/api/users/:id` | Get any user's public profile | No |

### 🛡️ Admin Endpoints (`/api/admin`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/admin/users?q=&status=` | Search & list users with stats | ✅ Admin |
| `POST` | `/api/admin/users/:id/status` | Set user status (active/suspended/banned/muted/shadowbanned) | ✅ Admin |
| `POST` | `/api/admin/users/:id/verify` | Toggle verified badge | ✅ Admin |
| `POST` | `/api/admin/users/:id/role` | Promote/demote user role | ✅ Admin |

---

## 🔒 Security Features

- **JWT Auth** — 7-day token expiry, verified on every protected request
- **Password Hashing** — Bcrypt with 10 salt rounds
- **Rate Limiting** — Login: 5 attempts per 15 min (production), 20 in dev
- **CORS** — Restricted to `FRONTEND_URL` env variable only
- **Input Validation** — `express-validator` on all write endpoints
- **Shadowban** — Posts hidden from feed without notifying the user
- **Admin Self-Protection** — Admins cannot ban/demote their own account

---

## 🗄️ Database Models & Associations

```
User ──┬── hasMany ──► Post ──┬── hasMany ──► Like
       ├── hasMany ──► Like   ├── hasMany ──► Comment
       ├── hasMany ──► Comment├── hasMany ──► Bookmark
       ├── hasMany ──► Bookmark├── hasOne  ──► Poll ──┬── hasMany ──► PollOption
       └── hasMany ──► PollVote                       └── hasMany ──► PollVote
```

All associations use **CASCADE delete** — deleting a user removes all their posts, likes, comments, bookmarks, and votes.

---

## 📜 License
This project is licensed under the **MIT License** — free to use for educational purposes.

---

*Built with ❤️ for UMT Lahore students.*
