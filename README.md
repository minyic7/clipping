# Clipping

This guide outlines the steps to set up and run the Clipping UI in a production environment using Docker and Cloudflare Tunnel.

## UI Setup

### Production Environment

Follow these steps to build and deploy the UI:

1. **Install Dependencies & Build the UI**
    - Run the following commands to install npm packages and build the UI:
      ```bash
      npm install
      npm run build
      ```

2. **Build Docker Image**
    - Use the command below to build the Docker image:
      ```bash
      docker build -t clipping-prod .
      ```

3. **Run the Docker Container**
    - Run the Docker container and map it to a port:
      ```bash
      docker run -d -p 7777:80 --name clipping-prod-container clipping-prod
      ```
    - This maps the container's port 80 to port 7777 on the host machine.

4. **Check Logs for Cloudflare Tunnel URL**
    - Retrieve the Cloudflare Tunnel URL to access the website:
      ```bash
      docker logs <container_name_or_id>
      ```
    - Note: Replace `<container_name_or_id>` with the actual container name or ID.

5. **Access the Production Website**
    - Use the URL provided in the Docker logs to access the production website.

---

By following these steps, you can efficiently deploy the Clipping UI and access it via the Cloudflare Tunnel. Ensure that Docker and npm are installed on your system before proceeding with the setup.