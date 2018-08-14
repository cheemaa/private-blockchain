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
        else {
            console.log('Blockchain number of blocks: ' + height);
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
        // return object as a single string
        db.get(blockHeight).then(function(block){
            console.log(JSON.parse(JSON.stringify(block)));
            return JSON.parse(JSON.stringify(block));
        }).catch(function(err) {
            console.log('Not found!', err);
            return err;
        });
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
                    console.log('Valid block!');
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

    getChainBlocks() {
        return new Promise(function(resolve, reject) {
            var blocks = [];
            db.createReadStream().on('data', function (data) {
                blocks.push(data.key);
            }).on('error', function(err) {
                console.log('Unable to read data stream!', err);
                reject(err);
            }).on('close', function() {
                resolve(blocks);
            });
        });
    }

    // Validate blockchain
    validateChain2(){
        let errorLog = [];
        var keys = [];
        var values = [];

        this.getChainBlocks().then(function(blocks) {
            console.log('Blocks length: ' + blocks.length);
            return Promise.all(blocks.map(this.validateBlock));
        }).then(function(blockValidations){
            for (var i = 0; i < this.blockValidations.length-1; i++) {
                errorLog.push(i);
                console.log('Error in block #' + i);
            }
        }).catch(function(error) {
            console.log('Error validating chain: ' + error);
        });

        /*db.createReadStream().on('data', function (data) {
            keys.push(data.key);
        }).on('error', function(err) {
            console.log('Unable to read data stream!', err);
        }).on('close', function() {
            keys.forEach(function(key) {
                this.validateBlock(key).then(function(isValid){
                    if(!isValid) errorLog.push(key);
                    console.log(key + 'is valid: ' + isValid);
                });
            });
            Promise.all(keys.map(this.validateBlock)).then(function(blockValidations){
                for (var i = 0; i < this.blockValidations.length-1; i++) {
                    errorLog.push(i);
                    console.log('Error in block #' + i);
                }
            }).then(function() {
                // compare blocks hash link
                let blockHash = block.hash;
    
                this.getBlock(blockHeight+1).then(function(nextBlock) {
                    let previousHash = this.chain[i+1].previousBlockHash;
                    if (blockHash!==previousHash) {
                        errorLog.push(blockHeight);
                    }
                }).catch(function(error) {
                    
                });
            }).catch(function(error) {
    
            });
        });*/

        
    }

    // Validate blockchain
    validateChain(){
        let errorLog = [];
        for (var i = 0; i < this.chain.length-1; i++) {
            // validate block
            if (!this.validateBlock(i))errorLog.push(i);
            // compare blocks hash link
            let blockHash = this.chain[i].hash;
            let previousHash = this.chain[i+1].previousBlockHash;
            if (blockHash!==previousHash) {
                errorLog.push(i);
            }
        }
        if (errorLog.length>0) {
            console.log('Block errors = ' + errorLog.length);
            console.log('Blocks: '+errorLog);
        } else {
            console.log('No errors detected');
        }
    }
}
