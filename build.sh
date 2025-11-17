#!/bin/bash
set -e

mkdir -p src/pb

echo "[1] Protobuf: wahl-erstellen"
protoc \
  -I=./proto/proto \
  ./proto/proto/wahlServices.proto \
  --js_out=import_style=commonjs:./src/pb \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:./src/pb 
  
echo "[2] Build Tailwind CSS"
npx tailwindcss -i src/input.css -o src/output.css

echo "[3] Webpack: wahl-erstellen"
npx webpack ./src/wahlleiter/wahl-erstellen/script.js \
  --output-path ./src/dist \
  --output-filename wahlErstellen.js \
  --mode=production

echo "[4] Webpack: wahlleiter-registrieren"
npx webpack ./src/wahlleiter/registrieren/script.js \
  --output-path ./src/dist \
  --output-filename wahlleiterRegistrieren.js \
  --mode=production

echo "[5] Webpack: wahlleiter-anmelden"
npx webpack ./src/script.js \
  --output-path ./src/dist \
  --output-filename wahlleiterAnmeldung.js \
  --mode=production

echo "[6] Webpack: wahlleiter-homepage"
npx webpack ./src/wahlleiter/script.js \
  --output-path ./src/dist \
  --output-filename wahlleiterHomepage.js \
  --mode=production

echo "[7] Webpack: voting"
npx webpack ./src/waehler/script.js \
  --output-path ./src/dist \
  --output-filename voting.js \
  --mode=production

echo "[8] Webpack: result"
npx webpack ./src/result/script.js \
  --output-path ./src/dist \
  --output-filename result.js \
  --mode=production

echo "✅ Build complete."
