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
    return new Promise(function(resolve, reject) {
      db.get(address).then((request) => {
        resolve(JSON.parse(request));
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  // Add new block
  saveRequest(newRequest) {
    return db.put(newRequest.address, JSON.stringify(newRequest));
  }

  deleteRequest(address) {
    return db.del(address);
  }
}