#!/bin/bash

echo "Seeding all databases..."

# Wait for databases to be ready
sleep 5

echo "Seeding auth service..."
docker-compose exec -T auth-service npm run seed

echo "Seeding resource service..."
docker-compose exec -T resource-service npm run seed

echo "Seeding marketplace service..."
docker-compose exec -T marketplace-service npm run seed

echo "Seeding elearning service..."
docker-compose exec -T elearning-service npm run seed

echo "Seeding iot service..."
docker-compose exec -T iot-service npm run seed

echo "Seeding shuttle service..."
docker-compose exec -T shuttle-service npm run seed

echo "All databases seeded!"





