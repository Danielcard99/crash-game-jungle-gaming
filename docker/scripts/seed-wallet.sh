#!/bin/sh
set -e

echo "Waiting for Keycloak..."
until curl -sf http://keycloak:8080/realms/crash-game/.well-known/openid-configuration > /dev/null; do
  sleep 2
done

echo "Getting admin token..."
ADMIN_TOKEN=$(curl -sf -X POST http://keycloak:8080/realms/master/protocol/openid-connect/token \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=admin" \
  | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

echo "Getting player UUID..."
PLAYER_ID=$(curl -sf "http://keycloak:8080/admin/realms/crash-game/users?username=player" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

echo "Player UUID: $PLAYER_ID"

echo "Waiting for Wallets service..."
until curl -sf http://wallets:4002/wallets/health > /dev/null; do
  sleep 2
done

echo "Seeding wallet with R\$1000,00..."
RESULT=$(curl -s -w "\n%{http_code}" -X POST http://wallets:4002/wallets/seed \
  -H "Content-Type: application/json" \
  -d "{\"playerId\": \"$PLAYER_ID\", \"secret\": \"dev-seed-secret\"}")

echo "Result: $RESULT"
echo "Done!"