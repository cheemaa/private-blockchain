const level = require('level');
const registrationDB = './registrationdata';
const db = level(registrationDB);

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

module.exports = class StarRegistrationRequests{
  constructor(){
    
  }

  getRequest(address) {
    return db.get(address);
  }

  // Add new block
  saveRequest(newRequest) {
    return db.put(newRequest.address, newRequest.requestTimeStamp);
  }
}