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
            let requestedBlock = parseInt(encodeURIComponent(request.params.height));
            console.log(requestedBlock);
            
            let data;
            if(isNaN(requestedBlock)) {
                data = { error: 'You must provide a number of a block'};
                h.response(data).code(404); 
            }
            else if(requestedBlock != 0 && height <= requestedBlock) {
                data = { error: 'Chain height is ' + height};
                h.response(data).code(404);
            }
            
            return blockchain.getBlock(encodeURIComponent(request.params.height)); 
        } ).catch( (error) => {
            console.log(error);
            return h.response(data).code(404);
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