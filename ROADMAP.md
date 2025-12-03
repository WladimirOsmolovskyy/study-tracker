# Study Tracker Roadmap

This document outlines the feature release plan and roadmap for the Study Tracker application.

## Phase 1: Foundation & Stability (Current Focus)
**Goal:** Ensure the current application is robust, bug-free, and the data model is consistent.

- [ ] **Database Schema Sync**
  - [ ] Add `score` column to `events` table in `supabase/schema.sql` (currently used in code but missing in schema file).
  - [ ] Verify `trackers` table usage. If unused, decide to remove or fully implement.
- [ ] **Trackers Implementation**
  - [ ] Implement CRUD operations for `trackers` in `useStudyStore` (currently missing).
  - [ ] Add UI for managing trackers (e.g., progress bars for long-term assignments).
- [ ] **Bug Fixes & Polish**
  - [ ] Ensure `EventModal` handles all event types correctly.
  - [ ] Verify recurring event generation logic.
  - [ ] Improve error handling in Supabase calls.

## Phase 2: Core Enhancements
**Goal:** Improve the daily usage experience with better visualization and organization tools.

- [ ] **Calendar View**
  - [ ] Implement a monthly/weekly calendar view for events.
  - [ ] Allow dragging and dropping events to change dates.
- [ ] **Dashboard Improvements**
  - [ ] Add "Upcoming Deadlines" list sorted by urgency.
  - [ ] Add "Recent Activity" or "Today's Focus" section.
- [ ] **Search & Filtering**
  - [ ] Add search bar for courses and events.
  - [ ] Add filters for Event Type (Lecture, Exam, etc.) and Completion Status.

## Phase 3: Advanced Features
**Goal:** Add analytical and productivity features to help students perform better.

- [ ] **Grade Tracking & Analytics**
  - [ ] Calculate current course grade based on event scores.
  - [ ] Visualize grade trends over time.
  - [ ] Support different grading weights (e.g., Exams 40%, Homework 20%).
- [ ] **Notifications & Reminders**
  - [ ] In-app notifications for upcoming deadlines (e.g., "Exam in 2 days").
  - [ ] Email reminders (via Supabase Edge Functions or similar).
- [ ] **File Attachments**
  - [ ] Allow uploading syllabus, assignment PDFs, or lecture notes to courses/events.

## Phase 4: User Experience & Ecosystem
**Goal:** Make the app feel premium, personal, and accessible everywhere.

- [ ] **Profile & Settings**
  - [ ] User profile page (avatar, name).
  - [ ] App settings (Theme preference persistence, Notification settings).
- [ ] **Mobile Optimization (PWA)**
  - [ ] Ensure full responsiveness on mobile.
  - [ ] Add PWA manifest for "Add to Home Screen" functionality.
- [ ] **Onboarding**
  - [ ] Interactive tour for new users.
  - [ ] Better empty states with "Get Started" prompts.

## Future Ideas (Backlog)
- [ ] **Study Timer (Pomodoro)**: Built-in focus timer linked to tasks.
- [ ] **Collaboration**: Share courses or study groups with other users.
- [ ] **Calendar Integration**: Sync with Google Calendar / Apple Calendar.
