#!/bin/sh

CERT_PATH="$CLOUDFLARED_CREDENTIALS_DIR/cert.pem"

# Check if cert.pem exists
if [ ! -f "$CERT_PATH" ]; then
    echo "Error: cert.pem not found at $CERT_PATH"
    echo "Please provide a valid cert.pem file for Cloudflare authentication."
    exit 1
fi

# Retrieve the tunnel ID for the given tunnel name
TUNNEL_ID=$(cloudflared tunnel list | grep "$CLOUDFLARED_TUNNEL_NAME" | awk '{print $1}')

# Check if the tunnel ID was found
if [ -z "$TUNNEL_ID" ]; then
    echo "Error: No tunnel found with the name $CLOUDFLARED_TUNNEL_NAME."
    echo "Please ensure the tunnel exists in your Cloudflare account."
    exit 1
fi

# Check if the corresponding JSON credentials file exists
TUNNEL_JSON_PATH="$CLOUDFLARED_CREDENTIALS_DIR/$TUNNEL_ID.json"
if [ ! -f "$TUNNEL_JSON_PATH" ]; then
    echo "Error: Tunnel credentials file not found at $TUNNEL_JSON_PATH"
    echo "Please provide the correct JSON file for the tunnel $TUNNEL_ID."
    exit 1
fi

# If both cert.pem and the JSON file exist, proceed
echo "Starting Cloudflare tunnel for $CLOUDFLARED_TUNNEL_NAME with tunnel ID $TUNNEL_ID..."
