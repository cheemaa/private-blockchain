'use strict';

const Hapi=require('hapi');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const Blockchain = require('./blockchain');
const Block = require('./block');
const blockchain = new Blockchain();
const StarRegistrationRequest = require('./starRegistrationRequest');
const StarRegistrationRequests = require('./starRegistrationRequests');
const requestsDB = new StarRegistrationRequests();

// Create a server with a host and port
const server=Hapi.server({
    host:'localhost',
    port:8000
});

// Endpoint to retrieve a specific blok
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
            block = JSON.parse(block);
            if(block.body && block.body.star && block.body.star.story) {
                block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString();
            }
            return h.response(block).header('Content-Type', 'application/json').code(200);
        }).catch( (error) => {
            console.log(error);
            return h.response(error).header('Content-Type', 'application/json').code(404);
        } );
    }
});

// Endpoint to get all blocks in the blockchain
server.route({
    method:'GET',
    path:'/blocks',
    handler:function(request,h) {
        return blockchain.getAllBlocks().then((blocks) => {
            return blocks;
        }).catch((error) => {
            console.log('Error retrieving all blocks. ' + error);
            return h.response(error).header('Content-Type', 'application/json').code(400);
        });
    }
});

// Endpoint to retrieve stars registered by a given address
server.route({
    method:'GET',
    path:'/stars/address:{address}',
    handler:function(request,h) {
        let address = encodeURIComponent(request.params.address);
        if(address == undefined || address == '') {
            let error = { error: "You must provide an address"};
            return h.response(error).header('Content-Type', 'application/json').code(400);
        }
        return blockchain.getBlocks(address).then((blocks) => {
            return blocks;
        }).catch((error) => {
            console.log('Error retrieving blocks for a given address. ' + error);
            return h.response(error).header('Content-Type', 'application/json').code(400);
        });
    }
});

// Endpoint to register a new star
server.route({
    method:'POST',
    path:'/block',
    handler:function(request,h) {
        let address = request.payload.address;
        let star = request.payload.star;
        if(address == undefined || address == '' || star == undefined || star == '') {
            let error = { error: "You must provide your address and a star object"};
            return h.response(error).header('Content-Type', 'application/json').code(400);
        }

        if(star.ra == undefined || star.ra == '' || star.dec == undefined || star.dec == '' || star.story == undefined || star.story == '') {
            let error = { error: "A star must contain the following field: ra, de and story"};
            return h.response(error).header('Content-Type', 'application/json').code(400);
        }

        
        star.story = new Buffer(star.story).toString('hex');

        var body = {
            address: address,
            star: star
        }
        return requestsDB.getRequest(address).then((starRegistrationRequest) => {
            if(!starRegistrationRequest.messageSignature) {
                throw {message: 'Validate your identity'}
            }
            return blockchain.addBlock(new Block(body));
        }).then(() => {
            return blockchain.getBlockHeight();
        }).then((height) => {
            return blockchain.getBlock(height);
        }).then((block) => {
            return h.response(block).header('Content-Type', 'application/json').code(200);
        }).catch((error) => {
            console.log(error);
            return h.response({error: error.message}).header('Content-Type', 'application/json').code(400);
        });


        return blockchain.addBlock(new Block(request.payload)).then((result) => {
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

// Endpoint to get a message to be signed, in order to verify identity
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
        return requestsDB.getRequest(address).then((starRegistrationRequest) => {
            let diffRequest = (Date.now() - starRegistrationRequest.requestTimeStamp) / 1000;
            validationWindow = starRegistrationRequest.validationWindow - diffRequest;
            if(validationWindow < 0) {
                throw 'Expired';
            }
            else {
                timeStamp = starRegistrationRequest.requestTimeStamp;
            }
        }).catch((error) => {
            console.log(error);
            let newStarRegistrationRequest = new StarRegistrationRequest(address);
            validationWindow = newStarRegistrationRequest.validationWindow;
            timeStamp = newStarRegistrationRequest.requestTimeStamp;
            return requestsDB.saveRequest(newStarRegistrationRequest);
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

// Endpoint to sign a message
server.route({
    method:'POST',
    path:'/signMessage',
    handler:function(request,h) {
        let privateKey = request.payload.privateKey;
        let message = request.payload.message;

        if(privateKey == undefined || privateKey == '' || message == undefined || message == '') {
            let error = { error: "You must provide your private key and a the message to sign"};
            return h.response(error).header('Content-Type', 'application/json').code(400);
        }

        var keyPair = bitcoin.ECPair.fromWIF('5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss');
        privateKey = keyPair.privateKey;

        var signature = bitcoinMessage.sign(message, privateKey, keyPair.compressed);
        return {signature: signature.toString('base64')};
    }
});

// Endpoint to validate the signature of a messages, in order to be confirm identity and get permission to register a star
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

        return requestsDB.getRequest(address).then((starRegistrationRequest) => {
            let diffRequest = (Date.now() - starRegistrationRequest.requestTimeStamp) / 1000;
            let validationWindow = starRegistrationRequest.validationWindow - diffRequest;
            if(validationWindow < 0) {
                let error = { error: "Expired. Request a new message to sign."};
                return h.response(error).header('Content-Type', 'application/json').code(400);
            }

            if(bitcoinMessage.verify(starRegistrationRequest.message, starRegistrationRequest.address, signature)) {
                starRegistrationRequest.messageSignature = true;
                requestsDB.saveRequest(starRegistrationRequest);
            }

            let response = {
                registerStar: starRegistrationRequest.messageSignature,
                status: {
                  address: address,
                  requestTimeStamp: starRegistrationRequest.requestTimeStamp,
                  message: starRegistrationRequest.message,
                  validationWindow: validationWindow,
                  messageSignature: starRegistrationRequest.messageSignature? 'valid' : 'invalid'
                }
            };
            return response;
        }).catch((error) => {
            console.log(error);
            let errorMessage = { error: error.message};
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