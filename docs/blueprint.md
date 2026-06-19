# **App Name**: PulseQueue

## Core Features:

- Rapid Intake Portal: A receptionist-facing interface optimized for speed with a one-tap entry system for incoming patients using Firestore's real-time document listeners.
- Atomic Transaction Handler: Utilizes Firestore transactions for the 'Call Next' operation, ensuring data integrity and preventing race conditions during high-volume periods.
- Predictive Wait-Time Tool: An AI-powered reasoning tool that analyzes rolling averages of consultation durations and real-time volume to generate dynamic, hyper-accurate wait-time estimates.
- Live Patient Monitor: A dedicated, mobile-responsive view for patients that provides instant updates and alerts when they are at the front of the queue.
- Ghost-Patient Resolution: A one-click 'No-Show' function that automatically skips inactive patients and adjusts metrics in the cloud database without breaking sequence.
- The 30-Second Buffer: An undo safety net feature that retains the state of the last completed token in a temporary buffer, allowing receptionists to revert accidental triggers.
- Connection Sentry: An automated monitoring system that displays a reconnection overlay if latency exceeds safe thresholds, protecting clinical workflow during internet outages.

## Style Guidelines:

- Primary color: Electric Blue (#1A81E6) reflecting a precise and reliable medical environment. Background color: Deep Onyx (#0D1012), providing a professional dark mode canvas for the neumorphic interface. Accent: Neon Cyan (#17CEA4) for clear calls-to-action.
- Headline font: 'Space Grotesk', chosen for its technical, scientific clarity. Body text font: 'Inter', ensuring high legibility and an objective, machined feel across all devices.
- Icons feature thick, rounded geometric strokes that integrate with the neumorphic style, using subtle gradients to imply tactile buttons.
- Neumorphic card layout with soft inner and outer shadows to create a sense of physical depth on a flat screen, ideal for high-interaction clinic management.
- Soft micro-transitions (0.2s duration) applied to 'Next' actions and button presses to provide tactile confirmation, accompanied by subtle UI pings for patient alerts.