/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    //this.addBlock(new Block("First block in the chain - Genesis block"));
    this.getBlockHeight().then(function(height) {
        if(height == 0) {
            console.log('Empty blockchain - Create genesis block');
            let genesisBlock = new Block("First block in the chain - Genesis block");
            genesisBlock.time = new Date().getTime().toString().slice(0,-3);
            genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
            return db.put(0, JSON.stringify(genesisBlock));
        }
    }).then(function(result){
        console.log('*** Blockchain instantiated ***');
    }).catch(function(error) {
        console.log('Error instantiating blockchain: ' + error);
    });
  }

  // Add new block
  addBlock(newBlock) {
    this.getBlockHeight().then(function(height) {
        // Block height
        newBlock.height = height;
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        return db.get(height - 1);
    }).then(function(lastBlock) {
        lastBlock = JSON.parse(lastBlock);
        // Previous block hash
        newBlock.previousBlockHash = lastBlock.hash;
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        console.log('New block to be added: ' + JSON.stringify(newBlock));
        // Adding block object to chain
        return db.put(newBlock.height, JSON.stringify(newBlock));
    }).then(function(result){
        console.log('Block #' + newBlock.height + ' saved!');
    }).catch(function(error) {
        console.log('Error saving block #' + newBlock.height + ': ' + error);
    });
  }

    // Get block height
    getBlockHeight(){
        let blockHeight = 0;
        return new Promise(function(resolve, reject) {
            db.createReadStream().on('data', function (data) {
                blockHeight++;
            }).on('error', function(err) {
                console.log('Unable to read data stream!', err);
                reject(err);
            }).on('close', function() {
                resolve(blockHeight);
            })
        });
    }

    // get block
    getBlock(blockHeight){
        return db.get(blockHeight);
    }

    // validate block
    validateBlock(blockHeight){
        return new Promise(function(resolve, reject) {
            db.get(blockHeight).then(function(block){
                // get block object
                block = JSON.parse(block);
                // get block hash
                let blockHash = block.hash;
                // remove block hash to test block integrity
                block.hash = '';
                // generate block hash
                let validBlockHash = SHA256(JSON.stringify(block)).toString();
                // Compare
                if (blockHash===validBlockHash) {
                    resolve(true);
                } else {
                    console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
                    resolve(false);
                }
            }).catch(function(err) {
                console.log('Not found!', err);
                reject(err);
            });
        });
    }

    // Validate blockchain
    validateChain(){
        let errorLog = [];
        var keys = [];
        var values = [];

        db.createReadStream().on('data', (data) => {
            keys.push(data.key);
            values.push(data.value);
        }).on('error', (err) => {
            console.log('Unable to read data stream!', err);
        }).on('close', () => {
            Promise.all(keys.map(this.validateBlock)).then((validations) => {
                for(var i=0; i < keys.length; i++) {
                    if(!validations[i]) {
                        errorLog.push(i);
                    }
                }
                keys.splice(-1,1);
                return Promise.all(keys.map(key => this.getBlock(parseInt(key)+1)));
            }).then((nextBlocks) => {
                for (var i = 0; i < nextBlocks.length; i++) {
                    let blockHash = JSON.parse(values[i]).hash;
                    let previousHash = JSON.parse(nextBlocks[i]).previousBlockHash;
                    if (blockHash!==previousHash) {
                        errorLog.push(i);
                    }
                }
                if (errorLog.length>0) {
                    console.log('Block errors = ' + errorLog.length);
                    console.log('Blocks: ' + errorLog);
                } else {
                    console.log('No errors detected');
                }
            }).catch((error) => {
                console.log(error);
            });
        });        
    }
}


let b = new Blockchain();
b.getBlockHeight().then(function(height) {
    console.log('Block height: ' + height);
    return b.getBlock(height + 1);
}).catch(function(error) {
    console.log('Index not found in database.');
    return b.getBlock(0);
}).then(function(block) {
    console.log('Block #0: ' + block);
    return b.validateBlock(0);
}).then(function(isValid) {
    console.log('Block 0 is valid: ' + isValid);
    return b.getBlock(1);
}).then(function(block) {
    console.log('Block #1: ' + block);
    //Block 1 is invalid
    return b.validateBlock(1);
}).then(function(isValid) {
    console.log('Block 1 is valid: ' + isValid);
    return b.getBlock(2);
}).then(function(block) {
    console.log('Block #2: ' + block);
    return b.validateBlock(2);
}).then(function(isValid) {
    console.log('Block 2 is valid: ' + isValid);
    return b.getBlock(3);
}).then(function(block) {
    console.log('Block #3: ' + block);
    return b.validateBlock(3);
}).then(function(isValid) {
    console.log('Block 3 is valid: ' + isValid);
    return b.validateChain();
}).then(function(result) {
    console.log('Valid Chain');
}).catch(function(error) {
    console.log('Error: ' + error)
});
