module.exports = class StarRegistrationRequest{
	constructor(blockchainID){
        this.address = blockchainID,
        this.requestTimeStamp = Date.now()
    }
}