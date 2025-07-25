import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:office_flight_table/features/flight_data/models/flight_data_message.dart';
import 'package:office_flight_table/features/flight_data/services/websocket_service.dart';

final websocketServiceProvider = Provider<WebSocketService>((ref) {
  return WebSocketService();
});

final websocketNotifierProvider =
    NotifierProvider<WebSocketNotifier, AsyncValue<FlightDataMessage?>>(() {
      return WebSocketNotifier();
    });

class WebSocketNotifier extends Notifier<AsyncValue<FlightDataMessage?>> {
  late WebSocketService _websocketService;

  @override
  AsyncValue<FlightDataMessage?> build() {
    _websocketService = ref.read(websocketServiceProvider);

    // Get environment variables
    const websocketUrl = String.fromEnvironment(
      'WEBSOCKET_URL',
      defaultValue: 'http://localhost:3000',
    );
    const token = String.fromEnvironment(
      'TOKEN',
      defaultValue: 'your-token-here',
    );

    // Set up data processing callback BEFORE initializing
    _websocketService.onDataReceived = (Map<String, dynamic> data) {
      try {
        final flightData = FlightDataMessage.fromJson(data);
        debugPrint(
          'Parsed flight data: ${flightData.headers.length} headers, ${flightData.data.length} rows',
        );
        state = AsyncValue.data(flightData);
      } catch (e) {
        debugPrint('Error parsing flight data: $e');
        state = AsyncValue.error(e, StackTrace.current);
      }
    };

    // Initialize WebSocket connection
    _initializeWebSocket(websocketUrl: websocketUrl, token: token);

    // Set up disposal
    ref.onDispose(() {
      _websocketService.disconnect();
    });

    return const AsyncValue.data(null);
  }

  void _initializeWebSocket({
    required String websocketUrl,
    required String token,
  }) {
    debugPrint('Initializing WebSocket with URL: $websocketUrl');
    _websocketService.initialize(websocketUrl: websocketUrl, token: token);
  }

  Map<String, bool> getConnectionStatus() {
    return _websocketService.getConnectionStatus();
  }
}
