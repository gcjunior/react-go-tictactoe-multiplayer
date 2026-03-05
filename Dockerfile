# ---------- build react ----------
FROM node:20 AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# ---------- build go ----------
FROM golang:1.25 AS backend-builder

WORKDIR /app/api

COPY api/go.mod ./
RUN go mod download

COPY api .

RUN go build -o server


# ---------- final image ----------
FROM debian:bookworm-slim

WORKDIR /app

COPY --from=backend-builder /app/api/server .
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8080

CMD ["./server"]