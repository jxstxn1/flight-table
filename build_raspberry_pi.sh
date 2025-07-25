#!/bin/bash

# Build script for Raspberry Pi deployment
set -e

echo "Building Office Flight Table for Raspberry Pi..."

# Clean previous builds
flutter clean

# Get dependencies
flutter pub get

# Build for Linux with release mode and ARM optimizations
flutter build linux --release --dart-define=FLUTTER_TARGET_PLATFORM=linux-arm64 --dart-define-from-file=./.env

echo "Build completed successfully!"
echo ""
echo "To deploy to Raspberry Pi:"
echo "1. Copy the build/linux/x64/release/bundle/ directory to your Raspberry Pi"
echo "2. Copy linux/office_flight_table.desktop to /home/pi/.config/autostart/"
echo "3. Copy linux/office_flight_table.service to /etc/systemd/system/"
echo "4. Run: sudo systemctl enable office_flight_table.service"
echo "5. Run: sudo systemctl start office_flight_table.service" 