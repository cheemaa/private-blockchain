'use strict';

const Hapi=require('hapi');
const Blockchain = require('./blockchain');
const Block = require('./block');
const blockchain = new Blockchain();
const StarRegistrationRequest = require('./starRegistrationRequest');
const StarRegistrationRequests = require('./starRegistrationRequests');
const requestsDB = new StarRegistrationRequests();
const maxValidationWindow = 300;

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// Add the route
server.route({
    method:'GET',
    path:'/block/{height}',
    handler:function(request,h) {
        return blockchain.getBlockHeight().then( (height) => {
            let requestedBlockHeight = parseInt(encodeURIComponent(request.params.height));
            
            let data;
            if(isNaN(requestedBlockHeight)) {
                data = { error: 'You must provide a number of a block'};
                throw data; 
            }
            else if(requestedBlockHeight != 0 && height < requestedBlockHeight) {
                data = { error: 'Chain height is ' + height};
                throw data;
            }
            
            return blockchain.getBlock(encodeURIComponent(request.params.height));
        } ).then((block) => {
            return h.response(block).header('Content-Type', 'application/json').code(200);
        }).catch( (error) => {
            console.log(error);
            return h.response(error).header('Content-Type', 'application/json').code(404);
        } );
    }
});

server.route({
    method:'POST',
    path:'/block',
    handler:function(request,h) {
        let body = request.payload.body;
        if(body == undefined || body == '') {
            let error = { error: "Body can't be empty"};
            return h.response(error).header('Content-Type', 'application/json').code(400);
        }

        return blockchain.addBlock(new Block(body)).then((result) => {
            return blockchain.getBlockHeight();
        }).then((height) => {
            return blockchain.getBlock(height);
        }).then((block) => {
            return h.response(block).header('Content-Type', 'application/json').code(200);
        }).catch((error) => {
            console.log(error);
            return h.response(error).header('Content-Type', 'application/json').code(400);
        });
    }
});

server.route({
    method:'POST',
    path:'/requestValidation',
    handler:function(request,h) {
        let address = request.payload.address;
        if(address == undefined || address == '') {
            let error = { error: "You must provide your address"};
            return h.response(error).header('Content-Type', 'application/json').code(400);
        }

        let validationWindow;
        let timeStamp;
        return requestsDB.getRequest(address).then((requestTimeStamp) => {
            let diffRequest = (Date.now() - requestTimeStamp) / 1000;
            validationWindow = maxValidationWindow - diffRequest;
            if(validationWindow < 0) {
                throw 'Expired';
            }
            else {
                timeStamp = requestTimeStamp;
            }
        }).catch((error) => {
            console.log(error);
            let starRegistrationRequest = new StarRegistrationRequest(address);
            validationWindow = maxValidationWindow;
            timeStamp = starRegistrationRequest.requestTimeStamp;
            return requestsDB.saveRequest(starRegistrationRequest);
        }).then(() => {
            let response = {
                address: address,
                requestTimeStamp: timeStamp,
                message: address + ':' + timeStamp + ':starRegistry',
                validationWindow: validationWindow
            };
            return h.response(response).header('Content-Type', 'application/json').code(200);
        }).catch((error) => {
            console.log(error);
            return h.response(error).header('Content-Type', 'application/json').code(400);
        });
    }
});

server.route({
    method:'POST',
    path:'/message-signature/validate',
    handler:function(request,h) {
        let address = request.payload.address;
        let signature = request.payload.signature;
        if(address == undefined || address == '' || signature == undefined || signature == '') {
            let error = { error: "You must provide your address and the signature to the message"};
            return h.response(error).header('Content-Type', 'application/json').code(400);
        }

        return requestsDB.getRequest(address).then((requestTimeStamp) => {
            let diffRequest = (Date.now() - requestTimeStamp) / 1000;
            let validationWindow = maxValidationWindow - diffRequest;
            if(validationWindow < 0) {
                let error = { error: "Expired. Request a new message to sign."};
                return h.response(error).header('Content-Type', 'application/json').code(400);
            }

            let response = {
                registerStar: true,
                status: {
                  address: address,
                  requestTimeStamp: requestTimeStamp,
                  message: address + ":" + requestTimeStamp +":starRegistry",
                  validationWindow: validationWindow,
                  messageSignature: "valid"
                }
            };
            return response;
        }).catch((error) => {
            console.log(error);
            let errorMessage = { error: "Obtain first a message to sign by calling this endpoint: /requestValidation"};
            return h.response(errorMessage).header('Content-Type', 'application/json').code(400);
        });
    }
});

// Start the server
async function start() {
    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();