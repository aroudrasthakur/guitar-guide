# Guitar Guide MVP

A web-based guitar learning application that uses computer vision to provide real-time chord coaching with AR-style overlays.

## Features

- **Real-time Hand Tracking**: Uses MediaPipe Hands for accurate fingertip detection
- **Fretboard Detection**: Heuristic-based detection with manual calibration fallback
- **Chord Recognition**: Real-time chord matching with stability tracking
- **AR Overlays**: Visual feedback showing target finger positions and correctness
- **Practice Modes**: Chord drills and transition practice
- **PWA Support**: Works offline after initial load

## Tech Stack

- **Next.js 14+** with App Router and TypeScript
- **MediaPipe Hands** for hand tracking
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Canvas 2D API** for overlay rendering

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Local Setup

1. **Clone the repo (if you haven't already)**:

   ```bash
   git clone <your-repo-url> guitar-guide
   cd guitar-guide
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables** (optional for now):

   - Copy `.env.example` to `.env.local`:

     ```bash
     cp .env.example .env.local
     ```

   - Currently no variables are required, but as you add them, define them in `.env.local`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

### Build

```bash
npm run build
npm start
```

## Running Tests

### Unit tests

```bash
npm test
```

### E2E tests (Playwright)

```bash
npm run test:e2e
```

## Project Structure

```
guitar-guide/
├── app/                    # Next.js routes
│   ├── onboarding/         # Onboarding flow
│   ├── calibrate/          # Fretboard calibration
│   └── practice/           # Practice modes
├── components/             # Shared UI components
├── features/               # Feature modules
│   ├── calibration/        # Calibration logic
│   ├── chord-trainer/      # Chord matching and UI
│   └── ml/                 # Computer vision
│       ├── hands/          # Hand tracking
│       └── fretboard/      # Fretboard detection
├── lib/                    # Core utilities
└── packages/shared/        # Shared code
```

## Usage

1. **Onboarding**: Select your handedness and guitar type
2. **Calibration**: Position your guitar and calibrate the fretboard (auto or manual)
3. **Practice**: Select a chord and practice with real-time feedback

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 14+)

Requires camera access and WebRTC support.

## License

MIT
