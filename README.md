# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. In this project a webservice is created to expose basic methods of a private blockchain.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

## Getting Node.js server running locally

Hapi framework is used.

In order to get it running in your local machine follow these steps:
1. npm install
2. npm start
3. The API is available at http://localhost:8000

## Endpoints

This API has been created with Hapijs and contains 2 endpoints:

1. GET /block/{blockHeight}
2. POST /block

Run a REST client in order to perform calls to the 2 exposed methods.
