# Use a lightweight base image
FROM node:22-alpine

# Create a non-root user for security and Set the working directory
RUN adduser -D appuser && mkdir -p /src
WORKDIR /src
RUN apk add --no-cache --update curl

# Copy package files and install dependencies
COPY package*.json ./
RUN yarn install --production

# Copy the application code
COPY . .

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the application
CMD ["node", "server.js"]

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s \
    CMD curl --fail http://localhost:3000/v1/health-check || exit 1

