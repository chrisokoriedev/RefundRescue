FROM node:24-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci

# Copy application source
COPY . .

# Expose backend API port
EXPOSE 5000

# Set environment
ENV PORT=5000
ENV NODE_ENV=production

# Start Express server via tsx
CMD ["npm", "start"]
