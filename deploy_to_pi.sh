#!/bin/bash

# Deployment script for Raspberry Pi
# Usage: ./deploy_to_pi.sh <raspberry-pi-ip>

if [ $# -eq 0 ]; then
    echo "Usage: ./deploy_to_pi.sh <raspberry-pi-ip>"
    echo "Example: ./deploy_to_pi.sh 192.168.1.100"
    exit 1
fi

PI_IP=$1
PI_USER="pi"

echo "Deploying to Raspberry Pi at $PI_IP..."

# Check if build exists
if [ ! -d "build/linux/x64/release/bundle" ]; then
    echo "Error: Build not found. Please run ./build_raspberry_pi.sh first."
    exit 1
fi

# Copy the app bundle
echo "Copying app bundle..."
scp -r build/linux/x64/release/bundle/ $PI_USER@$PI_IP:/usr/local/bin/office_flight_table/

# Copy desktop entry
echo "Copying desktop entry..."
scp linux/office_flight_table.desktop $PI_USER@$PI_IP:/home/pi/.config/autostart/

# Copy systemd service
echo "Copying systemd service..."
scp linux/office_flight_table.service $PI_USER@$PI_IP:/tmp/

# SSH and set up
echo "Setting up on Raspberry Pi..."
ssh $PI_USER@$PI_IP << 'EOF'
    # Create symbolic link
    sudo ln -sf /usr/local/bin/office_flight_table/office_flight_table /usr/local/bin/office_flight_table
    
    # Install systemd service
    sudo cp /tmp/office_flight_table.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable office_flight_table.service
    sudo systemctl start office_flight_table.service
    
    echo "Deployment completed!"
    echo "Service status:"
    sudo systemctl status office_flight_table.service
EOF

echo "Deployment completed successfully!" 