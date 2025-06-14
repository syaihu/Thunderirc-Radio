# Thunderirc-Radio

## Overview

NeonWave Radio Station is a modern, interactive radio streaming application with IRC integration. The system combines a React-based web interface with a Node.js/Express backend, real-time WebSocket communication, and an IRC bot for community interaction. The application features a cyberpunk/synthwave aesthetic with neon styling and provides a complete radio station experience including music playback controls, song queues, live chat, and listener comments.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom neon/cyberpunk theme
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: WebSocket client for live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket server using 'ws' library
- **Development**: Vite for development server and HMR
- **Build System**: esbuild for production builds

### IRC Integration
- **Language**: Python 3.11
- **Libraries**: aiohttp, websockets
- **Functionality**: IRC bot that connects to chat servers and handles song requests via `.request` command

## Key Components

### Database Schema
- **tracks**: Store music metadata (title, artist, album, duration, genre, album art)
- **queue_items**: Manage song queue with positions and request information
- **chat_messages**: Store IRC chat messages with timestamps and user info
- **comments**: User comments with like functionality
- **radio_state**: Global radio state (playing status, current track, volume, listener count)

### API Endpoints
- RESTful APIs for CRUD operations on tracks, queue, comments
- WebSocket endpoints for real-time updates
- Real-time broadcasting for radio state changes, chat messages, and queue updates

### UI Components
- **Sidebar**: Station branding and navigation with live listener count
- **PlayerSection**: Music player controls with waveform visualization
- **QueuePanel**: Upcoming tracks management
- **ChatPanel**: IRC chat integration
- **CommentsPanel**: User feedback and interaction
- **WaveformCanvas**: Animated audio waveform visualization

## Data Flow

1. **IRC Bot** connects to IRC servers and listens for `.request` commands
2. **Song Requests** are processed and added to the database queue
3. **WebSocket Server** broadcasts queue updates to all connected clients
4. **React Frontend** receives real-time updates and updates the UI
5. **Radio State** is synchronized across all components via WebSocket
6. **Chat Messages** flow from IRC → WebSocket → Frontend in real-time
7. **User Comments** are stored in database and displayed with like counts

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, shadcn/ui components
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **Utilities**: date-fns, wouter, lucide-react icons
- **Form Handling**: react-hook-form, hookform/resolvers

### Backend Dependencies
- **Core**: Express.js, TypeScript, tsx for development
- **Database**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
- **WebSocket**: ws library for real-time communication
- **Validation**: Zod, drizzle-zod for schema validation
- **Development**: Vite, esbuild for building

### IRC Bot Dependencies
- **Python**: aiohttp for HTTP client, websockets for WebSocket client
- **Async Programming**: Built on asyncio for non-blocking operations

## Deployment Strategy

### Development Environment
- **Start Command**: `npm run dev` - Runs both frontend and backend in development mode
- **Port Configuration**: Backend on port 5000, frontend proxied through Vite
- **Hot Module Replacement**: Enabled via Vite for rapid development
- **Database**: Uses Neon serverless PostgreSQL

### Production Build
- **Build Process**: `npm run build` - Compiles frontend assets and bundles backend
- **Output**: Frontend assets to `dist/public`, backend bundle to `dist/index.js`
- **Start Command**: `npm run start` - Runs production server
- **Deployment Target**: Replit autoscale deployment

### Environment Configuration
- **Database**: Configured via `DATABASE_URL` environment variable
- **WebSocket**: Automatic protocol detection (ws/wss) based on HTTPS
- **IRC Bot**: Configurable server and channel settings

## Recent Changes

- June 14, 2025: Added multiple audio visualizer options (waveform, spectrum analyzer, oscilloscope, level meters) with real-time switching
- June 14, 2025: Implemented fully functional stream controls (fade in/out, crossfade, emergency stop) with visual feedback and toast notifications
- June 14, 2025: Enhanced player section with WebSocket integration for real-time radio state updates
- June 14, 2025: Added comprehensive notification and admin panels with functional overlays
- June 14, 2025: Initial setup with PostgreSQL database integration

## Changelog

- June 14, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
