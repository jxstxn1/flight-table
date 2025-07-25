class FlightDataMessage {
  final List<FlightDataHeader> headers;
  final List<FlightDataRow> data;

  const FlightDataMessage({required this.headers, required this.data});

  factory FlightDataMessage.fromJson(Map<String, dynamic> json) {
    final headersList = (json['headers'] as List)
        .map(
          (header) => FlightDataHeader.fromJson(header as Map<String, dynamic>),
        )
        .toList();

    final dataList = (json['data'] as List)
        .map((row) => FlightDataRow.fromJson(row as Map<String, dynamic>))
        .toList();

    return FlightDataMessage(headers: headersList, data: dataList);
  }
}

class FlightDataHeader {
  final String key;
  final String label;

  const FlightDataHeader({required this.key, required this.label});

  factory FlightDataHeader.fromJson(Map<String, dynamic> json) {
    // Handle the dynamic header structure from sample.json
    final entry = json.entries.first;
    return FlightDataHeader(key: entry.key, label: entry.value as String);
  }
}

class FlightDataRow {
  final Map<String, dynamic> data;

  const FlightDataRow({required this.data});

  factory FlightDataRow.fromJson(Map<String, dynamic> json) {
    return FlightDataRow(data: json);
  }

  // Helper method to get a specific field value
  String? getFieldValue(String key) {
    final value = data[key];
    return value?.toString();
  }
}
