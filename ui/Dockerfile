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

# Expose port 80
EXPOSE 80

# Start NGINX and Cloudflare Tunnel using the shell script
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;' & cloudflared tunnel --url http://localhost:80"]