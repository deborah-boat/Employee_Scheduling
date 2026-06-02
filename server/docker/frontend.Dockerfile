# ── Stage 1: Build the React/Vite app ────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifests and install all dependencies (Vite is a devDependency needed to build)
# (build context is ./client, so paths here are relative to client/)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source files — client/.dockerignore keeps node_modules and .env out
COPY . .

# VITE_API_BASE_URL is embedded into the JS bundle at build time by Vite
# Override this arg when building for production with the real backend URL
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Serve the compiled static files with Nginx ──────────────────────
FROM nginx:alpine AS runner

# Copy Vite's /dist output into Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing: unknown paths fall back to index.html so React Router works
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
