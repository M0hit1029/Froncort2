## 🧠 Tech Stack

**Co-verse** is built with a modern, collaborative stack centered around **Next.js**, **React**, and **Yjs**, combining powerful real-time synchronization with a clean, scalable frontend architecture.

---

### 📝 Real-Time Collaboration

- **Tiptap Editor** — Rich text editor built on ProseMirror, extended with image, table, code block, and mention support.  
- **Yjs** — CRDT-based data layer enabling real-time shared editing.  
- **@hocuspocus/provider** — WebSocket connector between client and server for live collaboration.  
- **Hocuspocus Server** — WebSocket server handling synchronization and multi-user sessions.  
- **lowlight / diff** — Syntax highlighting and text diff utilities for code blocks and version previews.

---

### 🌐 WebSocket for Real-Time Sync

Co-verse uses a **WebSocket connection** (via **Hocuspocus**) to synchronize document changes instantly among all connected users.

```ts
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'

const ydoc = new Y.Doc()
const provider = new HocuspocusProvider({
  url: 'wss://hocuspocus-ws.onrender.com',
  name: 'co-verse-room',
  document: ydoc,
})
```

> 💡 For production, self-host a Hocuspocus server to manage authentication, persistence, and scaling.

---

### 🧩 UI & State Management

- **Zustand** — Lightweight state management.  
- **Radix UI** — Accessible and composable UI primitives.  
- **Lucide React** — Modern icon set.  
- **Framer Motion** — Animations and gestures.

---

### 💅 Styling

- **Tailwind CSS** — Utility-first styling framework.  
- **clsx** & **tailwind-merge** — Conditional class management and style merging.  
- **class-variance-authority** — Variant-driven component styling.

---

### 🧰 Tooling

- **ESLint + Prettier** — Code quality and formatting.  
- **Next.js Scripts** — Build, run, and lint commands.

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Lint the codebase
```

---

### 🧭 Notes

- Built on **Next.js + React 19** with **Yjs-powered collaboration**.  
- Designed for **real-time co-editing**, **clean UI**, and **scalable performance**.  
- Perfect foundation for live document editors, note-taking tools, or collaborative apps.
