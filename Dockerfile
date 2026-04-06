# ---------- Build Stage ----------
FROM node:25-slim AS builder
WORKDIR /app

# Configure npm for better network resilience
RUN npm config set fetch-retries 5 && \
  npm config set fetch-retry-mintimeout 20000 && \
  npm config set fetch-retry-maxtimeout 120000 && \
  npm config set fetch-timeout 300000 && \
  npm config set registry https://registry.npmjs.org/

COPY app/package*.json ./
# Install with retry logic - retry up to 3 times on failure
RUN for i in 1 2 3; do \
  npm install --omit=dev && break || \
  (echo "Attempt $i failed, retrying..." && sleep 10); \
  done

COPY app ./

# ---------- Runtime Stage ----------
FROM node:25-slim
WORKDIR /app

COPY --from=builder /app ./

# ENV VARIABLES
ENV NODE_ENV=production
ENV JWT_SECRET=access_token_sample_key_1234567890abcdef_access
ENV JWT_REFRESH_SECRET=refresh_token_sample_key_abcdef1234567890_refresh
ENV JWT_ALGORITHM=HS256
ENV JWT_EXPIRES_IN=12343
ENV JWT_REFRESH_EXPIRES_IN=712345
ENV JWT_SALT=jwt_salt_sample_1234567890abcdef

ENV CENTRAL_AUTH_BASE_URL=https://auth.cheche.et/api/v1
ENV CENTRAL_AUTH_API=https://auth.cheche.et/api
ENV BASE_API_URL=https://invoice-test.cheche.et/api/v1
ENV HOST_PROD=https://invoice-test.cheche.et/

RUN mkdir -p assets uploads uploads/documents uploads/temp logs
ENV UPLOAD_PATH=/app/uploads
ENV MAX_FILE_SIZE=10485760

ENV PIN_RATE_LIMIT_MAX_ATTEMPTS=5
ENV PIN_RATE_LIMIT_WINDOW_MINUTES=5
ENV PIN_HASH_SALT_ROUNDS=10

ENV FILES_DIR=../files

EXPOSE 3000
CMD ["node", "app.js"]
