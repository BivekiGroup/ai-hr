FROM node:20-alpine
WORKDIR /app

ARG VITE_API_BASE=http://api:8080
ENV VITE_API_BASE=$VITE_API_BASE

# Install deps (fallback to npm i if lock out of sync)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci || npm i; else npm i; fi

# Build app
COPY . .
RUN npm run build

# Serve built app with vite preview
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
