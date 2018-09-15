module.exports = class StarRegistrationRequest{
	constructor(blockchainID){
        this.address = blockchainID,
        this.requestTimeStamp = Date.now(),
        this.message = this.address + ':' + this.requestTimeStamp + ':starRegistry',
        this.validationWindow = 300,
        this.messageSignature = false
    }
}