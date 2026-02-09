# C and A First Project

A great adventure starts here.

## Overview
A simple shared notepad application where registered users can post messages visible to all logged-in users.

## Features
- User registration
- User login/logout
- Password reset via secret question
- Real-time post visibility
- Rate limiting: 5 posts/minute, 10 posts/hour, 20 posts/day
- Users can delete their own posts only

["PRD](docs/PRD.md) for detailed technical specifications\n\n### Technology Stack\n- **Frontend Framework**: Next.js 14+ (App Router)\n- **Backend Framework**: Next.js API Routes\n- **Database**: PostgreSQL (via Prisma ORM)\n- **Authentication**: NextAuth.js (or custom JWT implementation)\n- **Styling**: Tailwind CSS\n- **Real-time Updates**: Server-Sent Events (SSE) or WebSockets"]

## Team
- Architecture: Archie
- Implementation: Deb
- QA: Qan
- DevOps: Jan