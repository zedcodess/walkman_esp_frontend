# Frontend - Web Player Retro Walkman

React frontend for the Web Player remote control system with a beautiful retro Walkman design.

## Features

- **Retro Walkman Design**: Minimal, elegant interface inspired by classic portable music players
- **LocalStorage Playlist**: Persistent music library stored in browser
- **Real-time Control**: WebSocket integration for remote commands
- **Audio Visualizer**: Real-time frequency visualization
- **Smooth Animations**: Framer Motion transitions and effects
- **Responsive Design**: Works on desktop, tablet, and mobile
- **File Upload**: Drag-and-drop or click to upload audio files

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Framer Motion**: Smooth animations and transitions
- **Socket.IO Client**: Real-time WebSocket communication
- **Lucide React**: Beautiful, consistent icons
- **CSS Custom Properties**: Modern styling with CSS variables

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `VITE_BACKEND_URL`: Your backend WebSocket URL
4. Deploy automatically

### Netlify
1. Build the project: `npm run build`
2. Upload `dist` folder to Netlify
3. Configure environment variables

### Static Hosting
The built files in `dist/` can be served by any static web server.

## Configuration

### Environment Variables
Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:3000
```

For production:
```env
VITE_BACKEND_URL=https://your-backend-url.com
```

## Usage

### Adding Music
1. Click "Add Music" button
2. Select MP3, OGG, or other audio files
3. Files are stored in browser localStorage
4. Playlist persists across sessions

### Remote Control
- NodeMCU buttons control playback
- Commands appear as notifications
- Real-time synchronization via WebSocket

### Playback Controls
- **Play/Pause**: Space bar or click play button
- **Next Track**: Right arrow or next button
- **Previous Track**: Left arrow or previous button
- **Volume**: Mouse wheel or volume slider

## Design System

### Color Palette
```css
/* Primary Colors */
--bg-primary: #1a1a1a;      /* Main background */
--bg-secondary: #2d2d2d;    /* Secondary background */
--bg-tertiary: #3a3a3a;     /* Tertiary background */
--bg-card: #252525;         /* Card background */

/* Text Colors */
--text-primary: #ffffff;     /* Primary text */
--text-secondary: #b3b3b3;   /* Secondary text */
--text-muted: #666666;       /* Muted text */

/* Accent Colors */
--accent-green: #1db954;     /* Spotify-like green */
--accent-green-hover: #1ed760;
--accent-green-dark: #169c46;
```

### Typography
- **Font**: JetBrains Mono (monospace)
- **Weights**: 300, 400, 500, 600, 700
- **Sizes**: Responsive scaling with rem units

### Spacing System
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

## Components

### App.jsx
Main application component with:
- Audio playback logic
- WebSocket connection
- Playlist management
- UI state management

### Key Features
- **Audio Context**: Web Audio API for visualization
- **File Upload**: HTML5 File API for music upload
- **LocalStorage**: Persistent playlist storage
- **WebSocket**: Real-time command handling

## Audio Support

### Supported Formats
- MP3 (most common)
- OGG Vorbis
- WAV
- M4A (browser dependent)
- FLAC (limited support)

### Browser Compatibility
- Chrome: Full support
- Firefox: Full support
- Safari: Limited codec support
- Edge: Full support

## Performance

### Optimization
- Lazy loading of audio files
- Efficient re-renders with React hooks
- Optimized animations with Framer Motion
- Minimal bundle size with Vite

### Memory Management
- Audio files stored as Object URLs
- Cleanup on component unmount
- Efficient audio context handling

## Customization

### Themes
Modify CSS custom properties in `src/index.css`:
```css
:root {
  --accent-green: #your-color;
  --bg-primary: #your-background;
}
```

### Animations
Adjust Framer Motion variants in components:
```javascript
const variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
```

### Layout
Modify component structure in `App.jsx` and styles in `App.css`.

## Troubleshooting

### Audio Not Playing
- Check browser autoplay policies
- Ensure audio files are valid
- Verify HTTPS for production (required for audio)

### WebSocket Connection Issues
- Verify backend URL in environment variables
- Check CORS configuration on backend
- Ensure backend is running and accessible

### File Upload Issues
- Check file size limits
- Verify audio format support
- Clear localStorage if corrupted

### Performance Issues
- Reduce visualizer complexity
- Disable animations on low-end devices
- Optimize audio file sizes

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required APIs
- Web Audio API
- WebSocket API
- File API
- LocalStorage API
- CSS Custom Properties

## Accessibility

### Features
- Keyboard navigation
- Focus indicators
- Screen reader support
- High contrast mode support

### Keyboard Shortcuts
- `Space`: Play/Pause
- `→`: Next track
- `←`: Previous track
- `↑/↓`: Volume control

## Security

### Considerations
- Files stored locally (no server upload)
- WebSocket connection validation
- Input sanitization
- HTTPS required for production

### Privacy
- No data sent to external servers
- Music files stay in browser
- No tracking or analytics