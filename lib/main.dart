import 'dart:async';
import 'dart:io';

import 'package:flip_board/flip_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:office_flight_table/features/flight_data/models/flight_data_message.dart';
import 'package:office_flight_table/features/flight_data/notifier/websocket_notifier.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Office Flight Table',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.black,
        // Optimize for Raspberry Pi display
        textTheme: const TextTheme(
          bodyLarge: TextStyle(fontSize: 20),
          bodyMedium: TextStyle(fontSize: 18),
        ),
      ),
      home: const MyHomePage(),
      // Disable debug banner for production
      debugShowCheckedModeBanner: false,
    );
  }
}

class FlipBoardRow extends StatefulWidget {
  final String text;
  final TextStyle? style;

  const FlipBoardRow({super.key, required this.text, this.style});

  @override
  State<FlipBoardRow> createState() => _FlipBoardRowState();
}

class _FlipBoardRowState extends State<FlipBoardRow> {
  late List<StreamController<String>> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      widget.text.length,
      (i) => StreamController<String>.broadcast(),
    );
    for (int i = 0; i < widget.text.length; i++) {
      _controllers[i].add(widget.text[i]);
    }
  }

  @override
  void didUpdateWidget(covariant FlipBoardRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.text.length != oldWidget.text.length) {
      // Dispose old controllers
      for (final c in _controllers) {
        c.close();
      }
      // Create new controllers for new length
      _controllers = List.generate(
        widget.text.length,
        (i) => StreamController<String>.broadcast(),
      );
      for (int i = 0; i < widget.text.length; i++) {
        _controllers[i].add(widget.text[i]);
      }
    } else {
      // Update streams if text changes
      for (int i = 0; i < widget.text.length; i++) {
        if (i < oldWidget.text.length && widget.text[i] != oldWidget.text[i]) {
          _controllers[i].add(widget.text[i]);
        }
      }
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(widget.text.length, (i) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 1.0),
          child: FlipWidget(
            flipType: FlipType.middleFlip,
            itemStream: _controllers[i].stream,
            itemBuilder: (context, value) => Text(
              value ?? '',
              style:
                  widget.style ??
                  const TextStyle(fontFamily: 'monospace', fontSize: 22),
            ),
            flipDirection: AxisDirection.down,
          ),
        );
      }),
    );
  }
}

class MyHomePage extends ConsumerStatefulWidget {
  const MyHomePage({super.key});

  @override
  ConsumerState<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends ConsumerState<MyHomePage> {
  @override
  void initState() {
    super.initState();
    // Set fullscreen mode
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setFullscreen();
    });
  }

  void _setFullscreen() {
    // Set fullscreen mode for Linux/Raspberry Pi
    if (Platform.isLinux) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      // Hide cursor for kiosk mode
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: Colors.transparent,
        ),
      );
    }
  }

  void _exitFullscreen() {
    // Exit fullscreen mode
    if (Platform.isLinux) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
  }

  @override
  Widget build(BuildContext context) {
    final flightDataAsync = ref.watch(websocketNotifierProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: KeyboardListener(
        focusNode: FocusNode(),
        onKeyEvent: (event) {
          if (event is KeyDownEvent &&
              event.logicalKey == LogicalKeyboardKey.escape) {
            _exitFullscreen();
          }
        },
        child: Center(
          child: flightDataAsync.when(
            data: (flightData) {
              if (flightData == null) {
                return const Center(
                  child: Text(
                    'Waiting for data...',
                    style: TextStyle(color: Colors.white),
                  ),
                );
              }

              return _buildFlightTable(flightData);
            },
            loading: () => const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
            error: (error, stack) => Center(
              child: Text(
                'Error: $error',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFlightTable(FlightDataMessage flightData) {
    if (flightData.data.isEmpty) {
      return const Center(
        child: Text(
          'No flight data available.',
          style: TextStyle(color: Colors.white),
        ),
      );
    }

    // Calculate column widths based on headers and data
    final columnWidths = <int>[];
    for (int i = 0; i < flightData.headers.length; i++) {
      int maxWidth = flightData.headers[i].label.length;
      for (final row in flightData.data) {
        final value = row.getFieldValue(flightData.headers[i].key) ?? '';
        if (value.length > maxWidth) {
          maxWidth = value.length;
        }
      }
      columnWidths.add(maxWidth);
    }

    // Create header row with proper alignment
    final headerRow = flightData.headers
        .asMap()
        .entries
        .map((entry) => entry.value.label.padRight(columnWidths[entry.key]))
        .join('  ');

    // Create data rows with proper alignment
    final dataRows = flightData.data.map((row) {
      final rowString = flightData.headers
          .asMap()
          .entries
          .map((entry) {
            final value = row.getFieldValue(entry.value.key) ?? '';
            return value.padRight(columnWidths[entry.key]);
          })
          .join('  ');
      return rowString;
    }).toList();

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Header row
          Text(
            headerRow,
            style: const TextStyle(
              fontFamily: 'Courier',
              fontSize: 20,
              color: Colors.yellow,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          // Data rows
          ...dataRows.map(
            (row) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2.0),
              child: Text(
                row,
                style: const TextStyle(
                  fontFamily: 'Courier',
                  fontSize: 20,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
