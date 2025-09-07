# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Deatherage Metronome** - a React-based web metronome application built with modern TypeScript and audio synthesis capabilities. The app provides precise timing with customizable time signatures, tempo control, and audio-visual feedback using the Tone.js Web Audio API.

## Key Technologies

- **React 19.1.0** with TypeScript - Modern React with latest features
- **Tone.js 15.1.22** - Web Audio API wrapper for audio synthesis and timing
- **Tailwind CSS 4.1.11** with **daisyUI 5.0.48** - Styling framework with component library
- **Vite 7.0.4** - Fast build tool and development server

## Architecture

### Core Application Structure

The app follows a simple single-page architecture:

- **`src/main.tsx`** - Application entry point with React root mounting
- **`src/App.tsx`** - Main metronome component containing all functionality
- **`src/index.css`** - Global styles with Tailwind/daisyUI configuration
- **`index.html`** - HTML entry point with dark theme default

### Key Architectural Patterns

1. **Error Boundary Pattern** - Custom ErrorBoundary class component wraps the entire app for graceful error handling
2. **Audio Context Management** - Careful initialization and cleanup of Tone.js audio contexts to handle browser audio policies
3. **Precision Timing** - Uses `setInterval` with Tone.js for accurate musical timing
4. **State-Driven UI** - React state drives visual beat indicators, button states, and tempo display

### Audio Implementation

The metronome uses **two separate Tone.js synthesizers**:
- **Regular beats**: Square wave oscillator (C6 pitch)  
- **Accent beats**: Sawtooth wave oscillator (C7 pitch, +6dB volume) for downbeats

Critical audio handling includes:
- Manual audio context initialization due to browser autoplay policies
- Proper cleanup of intervals and audio resources
- Error handling for audio context failures

### Time Signature System

Supports multiple time signatures with different beat groupings:
- Standard: 2/4, 3/4, 4/4, 5/4, 7/4
- Compound: 6/8, 3/8

Visual beat indicators show current position with accent highlighting.

## Development Commands

```bash
# Start development server
pnpm run dev

# Build for production  
pnpm run build

# Lint codebase
pnpm run lint

# Preview production build
pnpm run preview
```

## Code Conventions

- **TypeScript strict mode** enabled with comprehensive type checking
- **ESLint configuration** includes React hooks and TypeScript rules
- **Error handling** - All audio operations wrapped in try-catch blocks
- **Component patterns** - Functional components with hooks, class components only for error boundaries
- **State management** - Local React state, no external state management needed
- **Styling** - Tailwind utility classes with daisyUI component classes

## Key Implementation Details

### Audio Context Initialization
The app requires user interaction before starting audio due to browser policies. The "Initialize Audio" button handles this requirement.

### Tempo Changes
When changing BPM while running, the metronome stops and restarts with new timing to maintain accuracy.

### Beat Calculation
Current beat tracking uses modular arithmetic: `nextBeat = prevBeat === selectedTimeSignature.beats ? 1 : prevBeat + 1`

### Memory Management
Proper cleanup of Tone.js synthesizers and intervals prevents memory leaks and audio context issues.
- This project uses pnpm instead of npm, so update any development commands in CLAUDE.md to reflect that.