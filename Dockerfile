# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build ./
COPY nginx.conf /etc/nginx/custom/default.conf.template
COPY docker-entrypoint.d/30-configure-runtime.sh /docker-entrypoint.d/30-configure-runtime.sh
RUN chmod +x /docker-entrypoint.d/30-configure-runtime.sh \
    && rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
