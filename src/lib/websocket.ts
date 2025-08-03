import { io, Socket } from "socket.io-client";

// Types based on the backend guide
export interface FlightDataUpdate {
  flightData: {
    headers: Array<{ [key: string]: string }>;
    data: EnhancedFlightStatus[];
  };
}

export interface EnhancedFlightStatus {
  icao24: string;
  state: "Incoming" | "Visible" | "Passed";
  callSign: string;
  origin: string;
  destination: string;
  aircraft: string;
  aircraftType?: string;
  operator?: string;
  registration?: string;
  distance?: number;
  estimatedTimeToIntersection?: number;

  // Enhanced prediction fields
  estimatedEntryTime?: number;
  estimatedExitTime?: number | null;
  heading?: number;
  speed?: number;
  lastUpdated?: number;

  // Frontend expected fields
  isPrediction?: boolean;
  dataHash?: string;
}

export interface AuthenticationResponse {
  success: boolean;
  error?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private authToken: string | null = null;

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    // Get Socket.IO URL from environment or use default
    // Socket.IO uses HTTP/HTTPS URLs, not WebSocket URLs
    const socketUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3000";

    this.socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Authenticate immediately after connection if token is available
      if (this.authToken) {
        this.authenticate();
      }
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      this.isConnected = false;
      this.isAuthenticated = false;

      // Attempt to reconnect
      this.attemptReconnect();
    });

    this.socket.on("authenticated", (response: AuthenticationResponse) => {
      if (response.success) {
        console.log("Successfully authenticated");
        this.isAuthenticated = true;
      } else {
        console.error("Authentication failed:", response.error);
        this.isAuthenticated = false;
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.isConnected = false;
      this.isAuthenticated = false;
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  public connect(token: string) {
    // Store the token for authentication
    this.authToken = token;

    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.isAuthenticated = false;
      this.authToken = null;
    }
  }

  public authenticate() {
    if (!this.socket || !this.isConnected) {
      console.error("Cannot authenticate: not connected");
      return;
    }

    if (!this.authToken) {
      console.error("No authentication token provided");
      return;
    }

    console.log("Authenticating with WebSocket server...");
    this.socket.emit("authenticate", this.authToken);
  }

  public onFlightData(callback: (data: FlightDataUpdate) => void) {
    if (!this.socket) return;

    this.socket.on("flightData", (data: FlightDataUpdate) => {
      console.log("Received flight data update:", data);
      callback(data);
    });
  }

  public onAuthenticationStatus(
    callback: (status: AuthenticationResponse) => void
  ) {
    if (!this.socket) return;

    this.socket.on("authenticated", callback);
  }

  public onConnectionStatus(callback: (connected: boolean) => void) {
    if (!this.socket) return;

    this.socket.on("connect", () => callback(true));
    this.socket.on("disconnect", () => callback(false));
  }

  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
    };
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();
