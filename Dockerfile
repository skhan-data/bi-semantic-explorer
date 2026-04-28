# Use a slim Node.js image to keep the container size small
FROM node:20-bullseye-slim

# Install Python 3 and Git
# Python is needed for pbi_extractor.py
# Git is needed for the 'Clone Repository' feature
RUN apt-get update && \
    apt-get install -y python3 python-is-python3 git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application using tsx
# This runs the backend server which also serves the built frontend from /dist
CMD ["npx", "tsx", "server.ts"]
