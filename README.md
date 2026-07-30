# StrangerPulse - Modern Random Stranger Video & Text Chat

StrangerPulse is a complete, production-ready real-time stranger chat application inspired by Omegle and Discord. It features WebRTC peer-to-peer audio and video streaming, instant text messaging via Socket.IO, smart matchmaking filters, strict 18+ age verification, and local device profile persistence.

## 🚀 Key Features

- **Zero Database Architecture**: Connected users are stored only in server memory while online. No persistent chat logs or user tracking database.
- **Local Storage Persistence**: Profiles, age verification, interests, and matching filter preferences stay saved locally on the user's browser across sessions.
- **WebRTC Audio/Video & Text Chat**: High quality, low-latency video & voice chat using standard STUN signaling and peer-to-peer encryption.
- **Smart Matchmaking Engine**:
  - Filter by Gender (Male, Female, Non-binary, Prefer not to say)
  - Filter by Country (Same Country or Specific)
  - Common Topic/Interest matching
  - Auto-fallback global search after search timeout
- **Privacy First**: Sensitive Google Account details (email address, DOB, IP) are **never** exposed to strangers. Only public tags (Nickname, Gender, Country, Languages, Interests) are visible.
- **Safety & Moderation**: Session-level user blocking, instant report reporting modal, and rate-limiting protection against spam.
- **Modern UI/UX**: Dark & Light theme switcher, Glassmorphism, smooth animations, mobile & desktop responsive layouts.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons
- **Backend**: Node.js, Express, Socket.IO, WebRTC API
- **Auth**: Google OAuth JWT session support with 18+ age self-declaration gatekeeping

## 📦 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 🐳 Docker Deployment

Run with Docker Compose:
```bash
docker-compose up -d --build
```
The application will be accessible at `http://localhost:3000`.

## 🔒 Security & Privacy Rules

1. User data is never stored in persistent databases.
2. WebRTC peer connections communicate directly between clients.
3. Access is restricted to 18+ verified users.
