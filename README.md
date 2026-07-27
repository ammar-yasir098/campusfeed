# 🎓 UMT CampusFeed — University Portal & Student Community Platform

**UMT CampusFeed** is a modern, full-stack web application designed for students at the **University of Management and Technology (UMT), Lahore**. It provides an official student communication hub for announcements, academic discussions, society events, lost & found items, and campus buy & sell listings.

---

## 🌟 Key Features

- 🏛️ **Official UMT Lahore Branding**: Built with UMT Deep Navy Blue (`#0f2942`) and crisp white academic styling.
- 🔐 **Dedicated Auth System**: Dedicated full-page Sign In & Account Registration with JWT token authorization and Bcrypt password hashing.
- 📌 **Fixed Left Sidebar Navigation**: Quick access to **Campus Feed**, **Saved Bookmarks**, **My Profile**, and **Category Filters**.
- 📰 **Categorized Campus Feed**:
  - 📢 **Announcements** (Exam dates, university notices)
  - 📅 **Events** (Technofests, hackathons, society events)
  - 💬 **General** (Academic discussions & campus advice)
  - ⚠️ **Lost & Found** (Lost items & security handovers)
  - 🛍️ **Buy & Sell** (Used textbooks, electronics, & dorm supplies)
- 🔄 **Infinite Scroll Pagination**: Initial batch loads 5 posts (`limit=5, offset=0`), followed by automatic 3-post batch fetches as you scroll.
- ❤️ **Interactive Likes & Comments**: Instant like/unlike toggle and expandable comment threads with student avatars.
- 🔖 **Saved Bookmarks**: Bookmark important deadlines or events to view in a personalized saved feed.
- 🖼️ **Direct Image & Avatar Uploads**: Multer image storage saved in `uploads/` and served statically.
- 🔍 **Real-Time Search Bar**: Instant search filtering across post titles, content, categories, and student author names.

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize (INTEGER auto-increment primary keys)
- **Authentication**: JSON Web Tokens (JWT) & Bcrypt
- **File Uploads**: Multer
- **Security**: Express Rate Limiting & CORS

### Frontend
- **Framework**: React 19 (Vite build tool)
- **Styling**: Vanilla CSS3 (Custom Design Tokens & Glassmorphism)
- **Icons**: Lucide React

---

## 📁 Project Directory Structure

```text
campusfeed_backend/
├── config/
│   └── database.js             # Sequelize PostgreSQL connection
├── middleware/
│   ├── authMiddleware.js       # JWT Verification Middleware
│   └── uploadMiddleware.js     # Multer File Storage Middleware
├── models/
│   ├── User.js                 # User Model (id, name, email, studentId, department, bio, avatarUrl)
│   ├── Post.js                 # Post Model (id, title, content, category, imageUrl, userId)
│   ├── Like.js                 # Like Model (userId, postId)
│   ├── Comment.js              # Comment Model (id, text, userId, postId)
│   ├── Bookmark.js             # Bookmark Model (userId, postId)
│   └── index.js                # Relational Model Associations
├── Routes/
│   ├── authRoutes.js           # Auth Endpoints (/signup, /login, /me)
│   ├── postRoutes.js           # Feed & Post Endpoints (/api/posts)
│   ├── userRoutes.js           # Profile & Bookmark Endpoints (/api/users)
│   └── uploadRoutes.js         # Dedicated Upload Endpoint (/api/upload)
├── scripts/
│   ├── syncDb.js               # Database Sync Script (npm run db:sync)
│   └── seedPosts.js            # Seeding 50 Posts across 5 categories
├── uploads/                    # Uploaded images and avatar pictures
├── frontend/                   # React + Vite Web Application
│   ├── src/
│   │   ├── components/         # Sidebar, PostCard, AuthPage, ProfileView, Modals
│   │   ├── services/           # Centralized API Service Client
│   │   ├── App.jsx             # Main Application Container
│   │   └── index.css           # UMT White & Navy Design System
│   └── package.json
├── server.js                   # Express Backend Entrypoint
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** installed and running locally

### 2. Environment Configuration (`.env`)
Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here

# PostgreSQL Credentials
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=campus-feed
```

### 3. Database Setup & Seeding
Run database synchronization and populate 50 realistic UMT student posts:

```bash
# Sync PostgreSQL Database Tables
npm run db:sync

# Seed 10 posts per category (50 total posts)
node scripts/seedPosts.js
```

### 4. Running the Application

#### Start Backend Server:
```bash
# In the root directory
npm run dev
# Server will start on http://localhost:5000
```

#### Start Frontend Web Application:
```bash
cd frontend
npm install
npm run dev
# React Vite App will start on http://localhost:5173
```

---

## 📡 API Reference

### 🔐 Auth Endpoints (`/api/auth`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new student account | No |
| `POST` | `/api/auth/login` | Sign in & receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Yes |

### 📰 Post Feed Endpoints (`/api/posts`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts?category=...&limit=5&offset=0` | Get feed posts with pagination | No |
| `GET` | `/api/posts/:id` | Get single post details | No |
| `POST` | `/api/posts` | Create new post (supports file upload) | Yes |
| `DELETE` | `/api/posts/:id` | Delete post (author only) | Yes |
| `POST` | `/api/posts/:id/like` | Toggle like/unlike | Yes |
| `POST` | `/api/posts/:id/bookmark` | Toggle save bookmark | Yes |
| `GET` | `/api/posts/:id/comments` | Fetch post comment thread | No |
| `POST` | `/api/posts/:id/comments` | Add comment to post | Yes |

### 👤 User Profile Endpoints (`/api/users`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Get current student profile & post history | Yes |
| `PUT` | `/api/users/profile` | Update profile info & avatar picture | Yes |
| `GET` | `/api/users/bookmarks` | Fetch saved bookmarked posts | Yes |

---

## 📜 License
This project is licensed under the MIT License - feel free to use it for educational purposes.
