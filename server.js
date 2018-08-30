'use strict';

const Hapi=require('hapi');
const Blockchain = require('./blockchain');
const Block = require('./block');
const blockchain = new Blockchain();

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
                return h.response(data).header('Content-Type', 'application/json').code(404); 
            }
            else if(requestedBlockHeight != 0 && height <= requestedBlockHeight) {
                data = { error: 'Chain height is ' + height};
                return h.response(data).header('Content-Type', 'application/json').code(404);
            }
            
            return blockchain.getBlock(encodeURIComponent(request.params.height)); 
        } ).catch( (error) => {
            console.log(error);
            return h.response(error).code(500);
        } );
    }
});

server.route({
    method:'POST',
    path:'/block',
    handler:function(request,h) {
        blockchain.addBlock(new Block(request.payload.data));
        return 200;
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