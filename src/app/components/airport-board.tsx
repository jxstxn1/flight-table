"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  websocketService,
  type FlightStatus,
  type FlightDataUpdate,
  type StateChangeEvent,
} from "@/lib/websocket";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";

interface FlipCharProps {
  char: string;
  delay?: number;
}

function FlipChar({ char, delay = 0 }: FlipCharProps) {
  const [currentChar, setCurrentChar] = useState(" ");
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipping(true);

      let iterations = 0;
      const maxIterations = 8 + Math.random() * 6;

      const flipInterval = setInterval(() => {
        if (iterations < maxIterations) {
          setCurrentChar(
            CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)] || " "
          );
          iterations++;
        } else {
          setCurrentChar(char);
          setIsFlipping(false);
          clearInterval(flipInterval);
        }
      }, 80);

      return () => clearInterval(flipInterval);
    }, delay);

    return () => clearTimeout(timer);
  }, [char, delay]);

  return (
    <span
      className={cn(
        "inline-block w-4 text-center font-mono transition-transform duration-100",
        isFlipping && "animate-pulse"
      )}
    >
      {currentChar}
    </span>
  );
}

interface FlipTextProps {
  text: string;
  delay?: number;
}

function FlipText({ text, delay = 0 }: FlipTextProps) {
  return (
    <span className="inline-block">
      {text.split("").map((char, index) => (
        <FlipChar key={index} char={char} delay={delay + index * 50} />
      ))}
    </span>
  );
}

function FlightRow({ flight, index }: { flight: FlightStatus; index: number }) {
  const getStateColor = (state: FlightStatus["state"]) => {
    switch (state) {
      case "Incoming":
        return "text-yellow-400";
      case "Visible":
        return "text-green-400";
      case "Passed":
        return "text-red-400";
      default:
        return "text-white";
    }
  };

  const baseDelay = index * 200;

  // Enhanced countdown timer using prediction data
  const [timeToEntry, setTimeToEntry] = useState<number>(0);
  const [timeToExit, setTimeToExit] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      let entryTimeLeft = 0;
      let exitTimeLeft: number | null = null;

      // Calculate times based on flight data
      if (flight.state === "Incoming") {
        if (flight.estimatedEntryTime) {
          const now = Date.now();
          entryTimeLeft = Math.max(0, (flight.estimatedEntryTime - now) / 1000);
        } else if (flight.estimatedTimeToIntersection) {
          entryTimeLeft = Math.max(0, flight.estimatedTimeToIntersection);
        }
      }

      if (flight.state === "Visible" && flight.estimatedExitTime) {
        const now = Date.now();
        exitTimeLeft = Math.max(0, (flight.estimatedExitTime - now) / 1000);
      }

      setTimeToEntry(entryTimeLeft);
      setTimeToExit(exitTimeLeft);
    };

    // Update immediately and then every second
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [
    flight.state,
    flight.estimatedTimeToIntersection,
    flight.estimatedEntryTime,
    flight.estimatedExitTime,
  ]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "grid grid-cols-5 gap-4 py-3 px-6 border-b border-gray-700 hover:bg-gray-800/50 transition-colors",
        flight.state === "Passed" && "opacity-75", // Slightly dim passed aircraft
        flight.state === "Incoming" &&
          "border-l-4 border-yellow-400 bg-yellow-900/10", // Highlight incoming aircraft
        flight.state === "Visible" &&
          "border-l-4 border-green-400 bg-green-900/10" // Highlight visible aircraft
      )}
    >
      <div className="font-mono text-lg font-bold">
        <FlipText text={flight.callSign} delay={baseDelay} />
      </div>
      <div className="font-mono text-lg">
        <FlipText
          text={flight.aircraftType || flight.aircraft}
          delay={baseDelay + 100}
        />
      </div>
      <div className="font-mono text-lg">
        <FlipText text={flight.origin} delay={baseDelay + 200} />
      </div>
      <div className="font-mono text-lg">
        <FlipText text={flight.destination} delay={baseDelay + 300} />
      </div>
      <div
        className={cn(
          "font-mono text-lg font-semibold",
          getStateColor(flight.state)
        )}
      >
        <FlipText text={flight.state.toUpperCase()} delay={baseDelay + 400} />
        {flight.state === "Incoming" &&
          (flight.estimatedEntryTime || flight.estimatedTimeToIntersection) && (
            <div className="text-xs text-yellow-300 mt-1">
              Entry in: {formatTime(timeToEntry)}
            </div>
          )}
        {flight.state === "Visible" && flight.estimatedExitTime && (
          <div className="text-xs text-green-300 mt-1">
            Exit in: {formatTime(timeToExit || 0)}
          </div>
        )}
      </div>
    </div>
  );
}

interface AirportBoardProps {
  token: string;
}

export default function AirportBoard({ token }: AirportBoardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [flights, setFlights] = useState<FlightStatus[]>([]);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isAuthenticated: false,
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  // WebSocket connection and data handling
  useEffect(() => {
    // Connect to WebSocket with the provided token
    websocketService.connect(token);

    // Listen for connection status changes
    websocketService.onConnectionStatus((connected) => {
      setConnectionStatus((prev) => ({ ...prev, isConnected: connected }));
    });

    // Listen for authentication status changes
    websocketService.onAuthenticationStatus((response) => {
      setConnectionStatus((prev) => ({
        ...prev,
        isAuthenticated: response.success,
      }));
    });

    // Listen for flight data updates (full sync every 15 seconds)
    websocketService.onFlightData((data: FlightDataUpdate) => {
      console.log("Received flight data update:", data);

      // Validate and transform the flight data
      try {
        let flightData = data?.flightData?.data;
        console.log("flightData.data:", flightData);
        console.log("flightData.data type:", typeof flightData);
        console.log("flightData.data is array:", Array.isArray(flightData));

        // Handle different possible data structures
        if (!flightData) {
          // Try alternative data structures
          if (Array.isArray(data)) {
            console.log("Data is directly an array, using as flight data");
            flightData = data as FlightStatus[];
          } else {
            const dataAsUnknown = data as unknown as Record<string, unknown>;
            if (dataAsUnknown?.data && Array.isArray(dataAsUnknown.data)) {
              console.log(
                "Data has direct 'data' property, using as flight data"
              );
              flightData = dataAsUnknown.data as FlightStatus[];
            } else if (
              dataAsUnknown?.flights &&
              Array.isArray(dataAsUnknown.flights)
            ) {
              console.log("Data has 'flights' property, using as flight data");
              flightData = dataAsUnknown.flights as FlightStatus[];
            } else {
              console.error("No valid flight data found in:", data);
              return;
            }
          }
        }

        if (!Array.isArray(flightData)) {
          console.error("Invalid flight data structure:", data);
          console.error(
            "Expected flight data to be an array, got:",
            typeof flightData
          );
          return;
        }

        console.log("Final flight data:", flightData);
        console.log("Number of flights:", flightData.length);

        // Use the flight data directly since it matches our interface
        setFlights(flightData);
        setLastUpdateTime(Date.now());
      } catch (error) {
        console.error("Error processing flight data:", error);
      }
    });

    // Listen for state change events (immediate optimistic updates)
    websocketService.onStateChange((stateChange: StateChangeEvent) => {
      console.log("Received state change event:", stateChange);

      const { aircraftId, previousState, newState, callSign, timestamp } =
        stateChange.data;

      // Log the state change for debugging
      console.log(`State change: ${callSign} ${previousState} → ${newState}`);

      // Apply optimistic update
      setFlights((prevFlights) => {
        const updatedFlights = prevFlights.map((flight) => {
          if (flight.icao24 === aircraftId) {
            console.log(
              `Updating aircraft ${callSign} state from ${flight.state} to ${newState}`
            );
            return {
              ...flight,
              state: newState as FlightStatus["state"],
              lastUpdated: timestamp,
            };
          }
          return flight;
        });

        return updatedFlights;
      });

      setLastUpdateTime(Date.now());
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [token]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sortFlightsByState = (flights: FlightStatus[]) => {
    const stateOrder = { Visible: 0, Incoming: 1, Passed: 2 };
    return [...flights].sort(
      (a, b) => stateOrder[a.state] - stateOrder[b.state]
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">
            OFFICE FLIGHT INFORMATION
          </h1>
          <div className="text-xl font-mono">
            {currentTime.toLocaleTimeString()} -{" "}
            {currentTime.toLocaleDateString()}
          </div>

          {/* Connection Status */}
          <div className="text-sm text-gray-400 mt-2">
            WebSocket Status:{" "}
            <span
              className={
                connectionStatus.isConnected ? "text-green-400" : "text-red-400"
              }
            >
              {connectionStatus.isConnected ? "Connected" : "Disconnected"}
            </span>
            {" | "}
            Authentication:{" "}
            <span
              className={
                connectionStatus.isAuthenticated
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {connectionStatus.isAuthenticated
                ? "Authenticated"
                : "Not Authenticated"}
            </span>
            {" | "}
            Total Aircraft: {flights.length}
          </div>

          {/* Last Update Time */}
          {lastUpdateTime && (
            <div className="text-xs text-gray-500 mt-1">
              Last Update: {new Date(lastUpdateTime).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Connection Error State */}
        {!connectionStatus.isConnected && (
          <div className="text-center py-8">
            <div className="text-red-400 text-xl">
              WebSocket Connection Failed
            </div>
            <div className="text-gray-400 text-sm mt-2">
              Unable to connect to the flight data server
            </div>
          </div>
        )}

        {/* Authentication Error State */}
        {connectionStatus.isConnected && !connectionStatus.isAuthenticated && (
          <div className="text-center py-8">
            <div className="text-yellow-400 text-xl">
              Authentication Required
            </div>
            <div className="text-gray-400 text-sm mt-2">
              Waiting for authentication with the server
            </div>
          </div>
        )}

        {/* Board */}
        {connectionStatus.isConnected && connectionStatus.isAuthenticated && (
          <div className="bg-black rounded-lg shadow-2xl overflow-hidden border-4 border-gray-700">
            {/* Column Headers */}
            <div className="grid grid-cols-5 gap-4 py-4 px-6 bg-gray-800 border-b-2 border-yellow-400">
              <div className="font-mono text-lg font-bold text-yellow-400">
                CALLSIGN
              </div>
              <div className="font-mono text-lg font-bold text-yellow-400">
                AIRCRAFT
              </div>
              <div className="font-mono text-lg font-bold text-yellow-400">
                ORIGIN
              </div>
              <div className="font-mono text-lg font-bold text-yellow-400">
                DESTINATION
              </div>
              <div className="font-mono text-lg font-bold text-yellow-400">
                STATUS
              </div>
            </div>

            {/* Recent Aircraft Indicator */}
            {flights.length > 0 && (
              <div className="px-6 py-2 bg-gray-700/50 border-b border-gray-600">
                <div className="text-sm text-gray-300 font-mono">
                  Showing {flights.length} aircraft (including predictions and
                  passed)
                </div>
              </div>
            )}

            {/* Flight Rows */}
            <div className="divide-y divide-gray-700">
              {sortFlightsByState(flights).map((flight, index) => (
                <FlightRow
                  key={`${flight.callSign}-${flight.aircraft}-${flight.state}`}
                  flight={flight}
                  index={index}
                />
              ))}
            </div>

            {/* Empty State */}
            {flights.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-lg">No flights currently tracked</div>
                <div className="text-sm mt-2">
                  Waiting for real-time flight data from WebSocket server
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400">
          <p className="font-mono">
            Real-time flight information via WebSocket connection
          </p>
          <p className="font-mono text-sm mt-1">
            Live updates with authentication and automatic reconnection
          </p>
        </div>
      </div>
    </div>
  );
}
