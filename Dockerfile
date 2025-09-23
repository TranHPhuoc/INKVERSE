# ---- Build stage ----
FROM node:20 AS build
WORKDIR /app

# cài deps
COPY package*.json ./
RUN npm ci

# copy source & build
COPY . .

ARG VITE_API_BASE_URL=https://api.inkverse.site
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27


COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
