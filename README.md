# Clipping

This guide outlines the steps to set up and run the Clipping UI in a production environment using Docker and Cloudflare Tunnel.

## UI Setup - Production Environment

### Prerequisites
- Registered domain `clipping.world` with Cloudflare.
- Cloudflare Tunnel credentials (`cert.pem` and `<tunnel-id>.json`).
- Docker installed.

### File Structure
```
.
├── .cloudflared/
│   ├── cert.pem                # Cloudflare certificate
│   ├── <tunnel-id>.json        # Tunnel credentials file
│   ├── config.yml              # define ingress rule
├── dist/                       # Built Vite project files
├── nginx.conf                  # NGINX configuration
├── setup-cloudflared.sh        # Setup script
├── Dockerfile
```

### (Important) Prepare credentials
1. First made a folder named .cloudflared to place you credentials and move it to the same level and Dockerfile
2. Generate cert.pem with cmd: `cloudflared tunnel login`
3. Create a Tunnel and Generate <tunnel-id>.json: `cloudflared tunnel create <tunnel-name>`

### Cloudflare DNS
Add these DNS records in Cloudflare:

- **CNAME** for root domain:
  Name: @ Type: CNAME Target: <tunnel-id>.cfargotunnel.com Proxy Status: Proxied

- **CNAME** for `www` subdomain:
  Name: www Type: CNAME Target: <tunnel-id>.cfargotunnel.com Proxy Status: Proxied

### Configuring `config.yml`
Create and place `config.yml` in `.cloudflared/`:
```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
- hostname: clipping.world
  service: http://localhost:80
- hostname: www.clipping.world
  service: http://localhost:80
- service: http_status:404
```
### Docker Commands
Build the dist folder
```bash
npm run build
```

Build the Docker image:
```bash
docker build -t clipping-world .
```

Run the container:
```bash
docker run -d -p 8080:80 --name clipping-world-container clipping-world
```

Ensure auto-restart:
```bash
docker update --restart unless-stopped clipping-world-container
```
### Verifications
Check if the tunnel is running:
```bash
cloudflared tunnel list
```

Test website availability:
```bash
curl -I https://clipping.world
```
Test website availability (for powershell):
```bash
Invoke-WebRequest -Uri https://clipping.world -Method Head
```

### Notes
Keep cert.pem and <tunnel-id>.json secure.
For 24/7 availability, keep the PC or server hosting the tunnel running. 
Or consider move the project to a cloud service