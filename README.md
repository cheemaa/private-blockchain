# Blockchain Data

Notary service to register stars implemented using blockchain.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

## Getting Node.js server running locally

Hapi framework is used.

In order to get it running in your local machine follow these steps:
1. npm install
2. npm start
3. The API is available at http://localhost:8000

## Endpoints

This API has been created with Hapijs and contains the following endpoints:

### Validate identity
In order to register a star you must first validate your identity. Follow this steps to do so:
1. Request a message to be signed:
```
curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}'
```
2. Sign the message using your private key
3. Provide the signed message in order to be able to register a star
```
curl -X "POST" "http://localhost:8000/message-signature/validate" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
}'
```

### Register a star
Once your identity has been validated you can register one star. To do so:
1. Call this endpoint:
```
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}'
```

### Lookup service
You can lookup stars with the following endpoints:
1. Get a block indicating the block height in the blockchain:
```
curl "http://localhost:8000/block/1"
```
2. Get a block by its hash:
```
curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
```
3. Get all the blocks registered by a given address:
```
curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
```
4. Get all the blocks in the chain:
```
curl "http://localhost:8000/blocks"
```