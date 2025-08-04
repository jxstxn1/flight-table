# Frontend State Updates Documentation

## Overview

This document explains how the frontend should handle state updates from the flight-table-backend WebSocket connection.

## WebSocket Events

### 1. Flight Data Updates

The backend sends flight data updates every 15 seconds via the `flightData` event:

```typescript
interface FlightDataUpdate {
  flightData: {
    headers: Array<{ [key: string]: string }>;
    data: FlightStatus[];
  };
}
```

### 2. State Change Events

The backend also sends individual state change events via the `stateChange` event:

```typescript
interface StateChangeEvent {
  type: 'stateChange';
  data: {
    aircraftId: string;
    previousState: string | null;
    newState: string;
    callSign: string;
    timestamp: number;
  };
}
```

## Flight Status Interface

```typescript
interface FlightStatus {
  icao24: string; // Unique aircraft identifier
  state: 'Incoming' | 'Visible' | 'Passed';
  callSign: string;
  origin: string;
  destination: string;
  aircraft: string;
  aircraftType?: string;
  operator?: string;
  registration?: string;
  distance?: number;
  estimatedTimeToIntersection?: number;
  estimatedEntryTime?: number;
  estimatedExitTime?: number | null;
  heading?: number;
  speed?: number;
  lastUpdated?: number;
  isPrediction?: boolean;
  dataHash?: string;
}
```

## State Management Guidelines

### 1. Optimistic Updates

The frontend should implement optimistic updates to provide immediate feedback:

- **Incoming → Visible**: When an aircraft transitions from "Incoming" to "Visible", update the UI immediately
- **Visible → Passed**: When an aircraft transitions from "Visible" to "Passed", update the UI immediately
- **New Aircraft**: When a new aircraft appears, add it to the UI immediately

### 2. State Transition Handling

```typescript
// Example state transition handling
function handleStateChange(stateChange: StateChangeEvent) {
  const { aircraftId, previousState, newState, callSign } = stateChange;
  
  switch (newState) {
    case 'Incoming':
      // Add aircraft to incoming list
      addToIncomingList(aircraftId, callSign);
      break;
      
    case 'Visible':
      // Move aircraft from incoming to visible
      moveToVisibleList(aircraftId, callSign);
      break;
      
    case 'Passed':
      // Move aircraft to passed list or remove
      moveToPassedList(aircraftId, callSign);
      break;
  }
}
```

### 3. Data Synchronization

- **Full Data Sync**: Every 15 seconds, the backend sends complete flight data
- **Incremental Updates**: State change events provide immediate updates
- **Conflict Resolution**: If there's a conflict between optimistic updates and server data, prioritize server data

### 4. UI State Management

```typescript
interface UIState {
  incoming: FlightStatus[];
  visible: FlightStatus[];
  passed: FlightStatus[];
  lastUpdate: number;
}

// Example state management
class FlightTableState {
  private state: UIState = {
    incoming: [],
    visible: [],
    passed: [],
    lastUpdate: Date.now()
  };

  updateFromServer(flightData: FlightStatus[]) {
    // Categorize aircraft by state
    this.state.incoming = flightData.filter(f => f.state === 'Incoming');
    this.state.visible = flightData.filter(f => f.state === 'Visible');
    this.state.passed = flightData.filter(f => f.state === 'Passed');
    this.state.lastUpdate = Date.now();
    
    this.notifyUI();
  }

  handleStateChange(stateChange: StateChangeEvent) {
    // Apply optimistic update
    this.applyOptimisticUpdate(stateChange);
    
    // Notify UI immediately
    this.notifyUI();
  }

  private applyOptimisticUpdate(stateChange: StateChangeEvent) {
    const { aircraftId, newState, callSign } = stateChange;
    
    // Remove aircraft from all lists
    this.state.incoming = this.state.incoming.filter(f => f.icao24 !== aircraftId);
    this.state.visible = this.state.visible.filter(f => f.icao24 !== aircraftId);
    this.state.passed = this.state.passed.filter(f => f.icao24 !== aircraftId);
    
    // Add to appropriate list based on new state
    // Note: This is a simplified example - you'd need the full FlightStatus object
    switch (newState) {
      case 'Incoming':
        // Add to incoming (you'd need the full object)
        break;
      case 'Visible':
        // Add to visible
        break;
      case 'Passed':
        // Add to passed
        break;
    }
  }
}
```

## WebSocket Connection Management

### 1. Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

class FlightTableWebSocket {
  private socket: Socket | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    this.socket = io('ws://your-backend-url');
    
    this.socket.on('connect', () => {
      console.log('Connected to flight table WebSocket');
      this.authenticate();
    });

    this.socket.on('authenticated', (response: { success: boolean }) => {
      if (response.success) {
        console.log('Successfully authenticated');
      } else {
        console.error('Authentication failed');
      }
    });

    this.socket.on('flightData', (data: FlightDataUpdate) => {
      this.handleFlightData(data);
    });

    this.socket.on('stateChange', (data: StateChangeEvent) => {
      this.handleStateChange(data);
    });
  }

  private authenticate() {
    if (this.socket) {
      this.socket.emit('authenticate', this.token);
    }
  }

  private handleFlightData(data: FlightDataUpdate) {
    // Update UI with complete flight data
    this.updateUI(data.flightData);
  }

  private handleStateChange(data: StateChangeEvent) {
    // Apply optimistic update
    this.applyOptimisticUpdate(data);
  }
}
```

### 2. Error Handling

```typescript
// Add error handling to WebSocket connection
this.socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
  // Implement reconnection logic
});

this.socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason);
  // Implement reconnection logic
});
```

## Performance Considerations

### 1. Debouncing Updates

```typescript
class DebouncedUpdater {
  private timeout: NodeJS.Timeout | null = null;
  private pendingUpdates: StateChangeEvent[] = [];

  update(update: StateChangeEvent) {
    this.pendingUpdates.push(update);
    
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(() => {
      this.applyUpdates();
    }, 100); // Debounce for 100ms
  }

  private applyUpdates() {
    // Apply all pending updates at once
    this.pendingUpdates.forEach(update => {
      this.applyUpdate(update);
    });
    
    this.pendingUpdates = [];
    this.notifyUI();
  }
}
```

### 2. Memory Management

- Clean up old aircraft data periodically
- Limit the number of "passed" aircraft kept in memory
- Implement proper cleanup when components unmount

## Testing State Updates

### 1. Mock WebSocket for Testing

```typescript
class MockFlightTableWebSocket {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  // Simulate state changes for testing
  simulateStateChange(aircraftId: string, fromState: string, toState: string) {
    this.emit('stateChange', {
      type: 'stateChange',
      data: {
        aircraftId,
        previousState: fromState,
        newState: toState,
        callSign: 'TEST',
        timestamp: Date.now()
      }
    });
  }
}
```

## Best Practices

1. **Always implement optimistic updates** for better user experience
2. **Handle connection errors gracefully** with retry logic
3. **Validate data** before applying updates
4. **Use TypeScript interfaces** for type safety
5. **Implement proper cleanup** to prevent memory leaks
6. **Test state transitions** thoroughly
7. **Log state changes** for debugging purposes

## Debugging

### 1. Enable Debug Logging

```typescript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  this.socket.onAny((eventName, ...args) => {
    console.log(`WebSocket event: ${eventName}`, args);
  });
}
```

### 2. State Change Logging

```typescript
private logStateChange(stateChange: StateChangeEvent) {
  console.log(`State change: ${stateChange.data.callSign} ${stateChange.data.previousState} → ${stateChange.data.newState}`);
}
```

This documentation provides a comprehensive guide for implementing state updates in the frontend application.
