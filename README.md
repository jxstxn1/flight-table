# Office Flight Table - Real-time Flight Tracking System

A real-time flight tracking system that monitors aircraft in the vicinity of an office location using WebSocket connections for live updates.

## 🚀 Features

### Core Functionality

- **Real-time Aircraft Tracking**: Monitor aircraft within a configurable viewcone via WebSocket
- **Advanced Predictions**: Predict when aircraft will enter/exit the viewcone
- **Smart List Management**: Maintain 8-10 aircraft minimum with priority-based sorting
- **Enhanced UI**: Visual indicators, countdown timers, and real-time updates

### Real-time Features

- **WebSocket Connection**: Live flight data updates with authentication
- **Interception Predictions**: Track aircraft approaching the viewcone with countdown timers
- **State Change Detection**: Immediate updates when aircraft enter/exit/pass through viewcone
- **Visual Indicators**: Highlight incoming aircraft with yellow borders and countdown displays
- **Prediction Confidence**: Calculate confidence scores based on data quality and age

### Enhanced List Management

- **Minimum Aircraft Count**: Always maintain 8-10 aircraft in the list
- **Priority-based Sorting**: Visible > Incoming > Passed, then by distance
- **Smart Cleanup**: Keep passed aircraft until minimum active aircraft count is reached
- **Performance Optimized**: Efficient list operations for large aircraft counts

## 🏗️ Architecture

### Frontend Components

- **WebSocket Service**: Handles real-time connection and authentication
- **Airport Board**: Main UI component with real-time flight display
- **Flight Row**: Individual aircraft display with countdown timers
- **Connection Status**: Real-time WebSocket connection monitoring

### Key Features

- **Real-time Updates**: WebSocket connection for live flight data
- **Authentication**: Secure WebSocket authentication with tokens
- **Auto-reconnection**: Automatic reconnection on connection loss
- **State Management**: React state for flight data and connection status
- **Visual Effects**: Flip animations and real-time countdown displays

### Data Flow

1. **WebSocket Connection**: Connect to backend WebSocket server
2. **Authentication**: Authenticate with provided token
3. **Real-time Updates**: Receive live flight data updates
4. **State Management**: Update UI with new flight information
5. **Visual Feedback**: Display connection status and flight states

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Backend WebSocket server running
- Environment configuration

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd office-flight-table
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Socket.IO Configuration
   NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
   
   # Optional: Override Socket.IO URL for production
   # NEXT_PUBLIC_WEBSOCKET_URL=https://your-backend-domain.com
   ```

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Access the application**

   - Main dashboard: <http://localhost:3000/?token=YOUR_TOKEN>

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | Socket.IO server URL for real-time connection | `http://localhost:3000` | `http://localhost:3000` |

### Environment Variable Details

#### `NEXT_PUBLIC_WEBSOCKET_URL`
- **Purpose**: Specifies the Socket.IO server URL for real-time flight data
- **Format**: HTTP/HTTPS URL (http:// for development, https:// for production)
- **Required**: Yes
- **Example**: 
  - Development: `http://localhost:3000`
  - Production: `https://your-backend-domain.com`

### Authentication Security

The WebSocket authentication token is **NOT** stored in environment variables for security reasons. Instead, it's passed via URL parameter:

- **URL Format**: `http://localhost:3000/?token=YOUR_WEBSOCKET_TOKEN`
- **Security**: Token is passed securely via URL parameter and not exposed in client-side code
- **Validation**: The backend validates the token on WebSocket connection

### Environment Setup Examples

#### Development Setup
```env
# .env.local
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
```

#### Production Setup
```env
# .env.local
NEXT_PUBLIC_WEBSOCKET_URL=https://your-backend-domain.com
```

#### Docker/Container Setup
```env
# .env.local
NEXT_PUBLIC_WEBSOCKET_URL=http://backend:3000
```

### Important Notes

- **File Location**: Environment variables must be in `.env.local` file in the project root
- **NEXT_PUBLIC_ Prefix**: Required for client-side access in Next.js
- **Token Security**: Socket.IO token is passed via URL parameter, not stored in environment variables
- **Backend Connection**: Ensure your backend Socket.IO server is running and accessible
- **Token Validation**: The backend will validate the token on connection
- **URL Access**: Access the app with: `http://localhost:3000/?token=YOUR_TOKEN`

## 📊 Socket.IO Events

### Authentication

- `authenticate` - Send authentication token to server
- `authenticated` - Receive authentication response

### Flight Data

- `flightData` - Receive real-time flight data updates

### Connection Events

- `connect` - Socket.IO connection established
- `disconnect` - Socket.IO connection lost
- `connect_error` - Connection error occurred

## 🎨 UI Features

### Real-time Display

- **Live Updates**: Real-time flight data without polling
- **Connection Status**: Visual indicators for WebSocket connection
- **Authentication Status**: Display authentication state
- **Last Update Time**: Show when data was last received

### Visual Effects

- **Flip Animations**: Character-by-character flip effects for data updates
- **State Colors**: Color-coded aircraft states (Incoming, Visible, Passed, Predicted)
- **Countdown Timers**: Real-time countdown for aircraft entry/exit times
- **Connection Indicators**: Green/red status indicators for connection health

### Responsive Design

- **Grid Layout**: Responsive grid for flight information
- **Mobile Friendly**: Optimized for various screen sizes
- **Dark Theme**: Professional dark theme with high contrast

## 🚀 Deployment

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

### Environment Setup

Ensure your backend WebSocket server is running and accessible at the configured URL. The frontend will automatically connect and authenticate using the provided token.
