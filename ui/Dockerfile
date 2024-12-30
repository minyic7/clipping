# Use the nginx:stable-perl image
FROM nginx:stable-perl

# Install cloudflared for tunneling
RUN apt-get update && apt-get install -y curl \
    && curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared

# Copy the built Vite project files to the NGINX web root
COPY dist/ /usr/share/nginx/html/

# Configure NGINX for a single-page application (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set up environment variables for Cloudflare
ENV CLOUDFLARED_TUNNEL_NAME="clipping-ui" \
    CLOUDFLARED_CREDENTIALS_DIR="/root/.cloudflared" \
    CLOUDFLARED_DOMAIN="clipping.world"

# Copy required cloudflared credential and setup script into the container
COPY .cloudflared/ /root/.cloudflared/
COPY setup-cloudflared.sh /usr/local/bin/setup-cloudflared.sh

# Make the setup script executable
RUN chmod +x /usr/local/bin/setup-cloudflared.sh

# Expose port 80
EXPOSE 80

# Start NGINX and Cloudflare Tunnel
CMD ["/bin/sh", "-c", "/usr/local/bin/setup-cloudflared.sh && nginx -g 'daemon off;' & cloudflared tunnel run $CLOUDFLARED_TUNNEL_NAME"]
