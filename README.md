# Gee Graphics – Order Management System
------------------------------------------------------------

## Overview

Gee Graphics is a full-featured order management system for custom jersey printing.
Built with React + Firebase, it supports:

- Multi-stage production tracking
- Image compression and Firebase Storage
- Dark/Light mode
- Real-time data sync
- CRUD operations
- Responsive design

------------------------------------------------------------

## Features

Feature | Status
-------- | -------
Welcome Splash Screen | Done
Firebase Auth (Email/Password) | Done
Firestore Data Sync | Done
Image Upload + Compression (<100KB) | Done
8 Production Tabs | Done
Dark/Light Mode Toggle | Done
Live Clock | Done
Pricing Editor | Done
Status Transitions | Done
Glassmorphism Modals | Done
Mobile Responsive | Done

------------------------------------------------------------

## Tech Stack

Frontend:   React 18 + Tailwind CSS + Lucide Icons
Backend:    Firebase (Auth + Firestore + Storage)
State:      React Hooks
Build:      Create React App
Deployment: Vercel / Netlify / Firebase Hosting

------------------------------------------------------------

## Project Structure

src/
├── GeeGraphicsSystem.jsx     # Main dashboard
├── firebase.js                   # Firebase config
├── App.js
├── index.js
├── index.css
└── assets/
public/
├── index.html
└── favicon.ico

------------------------------------------------------------

## Setup and Installation

1. Clone the Repository
   git clone https://github.com/yourusername/gee-graphics.git
   cd gee-graphics

2. Install Dependencies
   npm install

   Requires: react, react-dom, firebase, lucide-react

3. Setup Firebase
   - Go to Firebase Console
   - Create a new project
   - Enable:
     * Authentication → Email/Password
     * Firestore Database
     * Storage

   - Copy config and create src/firebase.js

------------------------------------------------------------

## Example Firebase Config

// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

------------------------------------------------------------

## How to Run

Development Mode:
   npm start
   Open at: http://localhost:3000

Build for Production:
   npm run build
   Output: /build folder

------------------------------------------------------------

## Usage Guide

Welcome Screen:
   Auto-redirects to Login after 1.5s

Create Account / Login:
   Use any email/password
   Session persists via Firebase Auth

Dashboard:
   Header: Logo, Clock, Pricing, Dark Mode
   Tabs: 8 production stages

------------------------------------------------------------

## Tab Functionality

Tab | Actions
---- | -------
Ongoing Teams | Add, Edit, Delete, Start Progress
Status | Advance/Back through 3 stages
Sizing | Add player-specific sizes
Printing → Finished | Status transitions only

------------------------------------------------------------

## Image Upload

Compressed automatically (<100KB)
Uploaded to Firebase Storage
URL saved in Firestore

------------------------------------------------------------

## Dark Mode

Toggle in header (Sun/Moon icons)
Logo color adapts
All components support dark mode

------------------------------------------------------------

## Pricing Page

Editable price list
Saved to Firestore
Real-time sync

------------------------------------------------------------

## Data Flow

Ongoing → Status → Sizing → Printing → Done Print → To Sew → To Deliver → Finished

All data carried forward
Single Firestore document per order
status field controls tab visibility

------------------------------------------------------------

## Firebase Rules (Recommended)

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/prices/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

------------------------------------------------------------

## Deployment

Vercel (Recommended)
   vercel

Firebase Hosting
   npm run build
   firebase init hosting
   firebase deploy

------------------------------------------------------------

## Troubleshooting

Issue | Fix
------|-----
QuotaExceededError | Images are compressed
saveOrders not defined | Use useCallback
Firebase not loading | Check firebase.js config
Dark mode not working | Ensure darkMode state is toggled

------------------------------------------------------------

## Future Features

- PDF Print View
- CSV Export
- Email Notifications
- Admin Panel
- PWA Support
- Multi-user Roles

------------------------------------------------------------

## Contributing

1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push and open PR

------------------------------------------------------------

## License

MIT License – Free to use, modify, and distribute

------------------------------------------------------------

## Credits

Design: Inspired by Next.js and Glassmorphism
Icons: Lucide
Backend: Firebase
Built with React 18 and Tailwind CSS



Live Demo: https://gee-graphics.vercel.app (coming soon)
GitHub: https://github.com/yourusername/gee-graphics

------------------------------------------------------------

Made with passion by [Your Name] © 2025
