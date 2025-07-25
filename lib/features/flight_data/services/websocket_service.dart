import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class WebSocketService {
  io.Socket? _socket;
  String? _token;
  String? _websocketUrl;
  bool _isConnected = false;
  bool _isAuthenticated = false;

  // Callback for data processing
  Function(Map<String, dynamic>)? onDataReceived;

  // Getters
  bool get isConnected => _isConnected;
  bool get isAuthenticated => _isAuthenticated;

  // Initialize the service with environment variables
  void initialize({required String websocketUrl, required String token}) {
    _websocketUrl = websocketUrl;
    _token = token;
    _connect();
  }

  void _connect() {
    if (_websocketUrl == null || _token == null) {
      debugPrint('WebSocket URL or token not provided');
      return;
    }

    try {
      _socket = io.io(_websocketUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'reconnection': true,
        'reconnectionDelay': 1000,
        'reconnectionAttempts': 5,
      });

      _setupEventListeners();
      _socket!.connect();
    } catch (e) {
      debugPrint('Failed to connect to WebSocket: $e');
    }
  }

  void _setupEventListeners() {
    _socket!.onConnect((_) {
      debugPrint('Connected to WebSocket');
      _isConnected = true;
      _authenticate();
    });

    _socket!.onDisconnect((_) {
      debugPrint('Disconnected from WebSocket');
      _isConnected = false;
      _isAuthenticated = false;
    });

    _socket!.onConnectError((error) {
      debugPrint('WebSocket connection error: $error');
      _isConnected = false;
      _isAuthenticated = false;
    });

    _socket!.onReconnect((_) {
      debugPrint('Reconnected to WebSocket');
      _isConnected = true;
      _authenticate();
    });

    // Listen for flight data messages
    _socket!.on('flightData', (data) {
      _handleDataMessage(data);
    });

    // Listen for authentication response
    _socket!.on('authenticated', (data) {
      debugPrint('Authentication successful');
      _isAuthenticated = true;
    });

    _socket!.on('auth_error', (data) {
      debugPrint('Authentication failed: $data');
      _isAuthenticated = false;
    });
  }

  void _authenticate() {
    if (_token != null && _isConnected) {
      debugPrint('Authenticating with token');
      _socket!.emit('authenticate', _token);
    }
  }

  void _handleDataMessage(dynamic data) {
    debugPrint('Processing data message of type: ${data.runtimeType}');
    debugPrint('Data content: $data');

    try {
      if (data is String) {
        final jsonData = json.decode(data) as Map<String, dynamic>;
        debugPrint('Parsed JSON data: $jsonData');
        _processFlightData(jsonData);
      } else if (data is Map<String, dynamic>) {
        debugPrint('Direct Map data: $data');
        _processFlightData(data);
      } else {
        debugPrint('Unknown data type: ${data.runtimeType}');
      }
    } catch (e) {
      debugPrint('Error processing data message: $e');
    }
  }

  void _processFlightData(Map<String, dynamic> data) {
    // Call the callback if set
    if (onDataReceived != null) {
      debugPrint('Calling onDataReceived callback');
      onDataReceived!.call(data);
    } else {
      debugPrint('onDataReceived callback is null');
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _isAuthenticated = false;
  }

  // Method to get the current connection status
  Map<String, bool> getConnectionStatus() {
    return {'connected': _isConnected, 'authenticated': _isAuthenticated};
  }
}
