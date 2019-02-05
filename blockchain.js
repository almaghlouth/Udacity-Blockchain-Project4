const SHA256 = require('crypto-js/sha256');
const LevelDBClass = require('./leveldb');
const BlockClass = require('./block');
const hex2ascii = require('hex2ascii');
var bitcoin = require('bitcoinjs-lib');
var bitcoinMessage = require('bitcoinjs-message');
const db = new LevelDBClass.LevelDB();
const TimeoutRequestsWindowTime = 5 * 60 * 1000;
const ValidRequestsWindowTime = 30 * 60 * 1000;


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
    constructor() {
        //this blockchain doesnot make a default genesis block
        //this.alphaBlock();
        this.reqmempool = [];
        this.validmempool = [];
        this.timeoutRequests = [];
    }

    //takes address and create validation request with message data or return pending validation request if it is in mempool
    requestValidation(address) {
        let t = new Date().getTime().toString().slice(0, -3);
        let obj = {
            address: address,
            requestTimeStamp: t,
            message: address + ":" + t + ":starRegistry",
        }
        return this.addReqPool(obj);
    }

    //takes address and return the request index in the pool or -1 if it doesnot exist
    checkReqPool(address) {
        for (var i = 0; i < this.reqmempool.length; i++) {
            if (address === this.reqmempool[i].address) {
                return i;
            }
        }
        return -1;
    }

    //takes the index number and retrieve pending validation request
    getReqPool(index) {
        return this.reqmempool[index];
    }

    //add validation request to the mempool or return pending validation request or pending valid request
    addReqPool(obj) {
        let valid = this.checkValidPool(obj.address);
        let obj2;
        if (valid == -1) {
            let index = this.checkReqPool(obj.address);
            if (index == -1) {
                this.reqmempool.push(obj);
                let self = this;
                this.timeoutRequests[obj.address] = setTimeout(function() { self.removeReqPool(obj.address) }, TimeoutRequestsWindowTime);
                //obj2 = JSON.parse(JSON.stringify(obj));
                obj2 = {
                    WalletAddress: obj.address,
                    requestTimeStamp: obj.requestTimeStamp,
                    message: obj.message,
                }
                obj2.validationWindow = TimeoutRequestsWindowTime / 1000;
                console.log("\nnew pending request added " + JSON.stringify(obj2) + "\n");
                return obj2;
            } else {
                obj2 = this.getReqPool(index);
                let timeElapse = (new Date().getTime().toString().slice(0, -3)) - obj2.requestTimeStamp;
                let timeLeft = (TimeoutRequestsWindowTime / 1000) - timeElapse;
                //obj2 = JSON.parse(JSON.stringify(obj2));
                let obj3 = {
                    WalletAddress: obj2.address,
                    requestTimeStamp: obj2.requestTimeStamp,
                    message: obj2.message,
                }
                obj3.validationWindow = timeLeft;
                console.log("\npending request already in Pool " + JSON.stringify(obj3) + "\n");
                return obj3;
            }
        } else {
            let obj4 = this.getValidPool(valid);
            let timeElapse = (new Date().getTime().toString().slice(0, -3)) - obj4.status.requestTimeStamp;
            let timeLeft = (ValidRequestsWindowTime / 1000) - timeElapse;
            obj4 = JSON.parse(JSON.stringify(obj4));
            obj4.status.validationWindow = timeLeft;
            console.log("\nvalid request already in Pool " + JSON.stringify(obj4) + "\n");
            return obj4;
        }
    }

    //takes object with message and signtaue to validate the request, return the valid request or the already pending valid request
    validateRequest(obj) {
        //console.log(obj);
        let valid = this.checkValidPool(obj.address);
        if (valid == -1) {
            let index = this.checkReqPool(obj.address);
            //console.log(index);
            if (index > -1) {
                let tempObj = this.getReqPool(index);
                //console.log(tempObj);
                //console.log(this.reqmempool);
                let verify = bitcoinMessage.verify(tempObj.message, obj.address, obj.signature);
                //console.log(verify);
                //let verify = true;
                if (verify == true) {

                    this.removeReqPool(obj.address);
                    let obj2 = {
                        registerStar: true,
                        status: {
                            address: tempObj.address,
                            requestTimeStamp: (new Date().getTime().toString().slice(0, -3)),
                            message: tempObj.message,
                            messageSignature: verify,
                        }
                    };
                    let self = this;
                    this.validmempool.push(obj2);
                    this.timeoutRequests[obj2.status.address] = setTimeout(function() { self.removeValidPool(obj2.status.address) }, ValidRequestsWindowTime);
                    obj2 = JSON.parse(JSON.stringify(obj2));
                    let timeElapse = (new Date().getTime().toString().slice(0, -3)) - obj2.status.requestTimeStamp;
                    let timeLeft = (ValidRequestsWindowTime / 1000) - timeElapse;
                    obj2.status.validationWindow = timeLeft;
                    console.log("\nvalid request added to the Poll " + JSON.stringify(obj2) + "\n");
                    return obj2;
                } else {
                    return { error: "Could not validate signature" };
                }
            } else {
                return { error: "no request for validation was found for this address" };
            }
        } else {
            return this.getValidPool(valid);
        }
    }

    //takes the address and remove the pending validation request form the pool along with the timeout
    removeReqPool(address) {
        for (var i = 0; i < this.reqmempool.length; i++) {
            if (address === this.reqmempool[i].address) {
                this.reqmempool.splice(i, 1);
                clearTimeout(this.timeoutRequests[address]);
                console.log("\npending request removed from Pool " + JSON.stringify(address) + "\n");
                return true;
            }
        }
        return false;
    }

    //takes address and return the valid request index in the pool or -1 if it doesnot exist
    checkValidPool(address) {
        for (var i = 0; i < this.validmempool.length; i++) {
            if (address === this.validmempool[i].status.address) {
                return i;
            }
        }
        return -1;
    }

    //takes the index number and retrieve a valid request from the pool
    getValidPool(index) {
        let obj2 = this.validmempool[index];
        let timeElapse = (new Date().getTime().toString().slice(0, -3)) - obj2.status.requestTimeStamp;
        let timeLeft = (ValidRequestsWindowTime / 1000) - timeElapse;
        obj2 = JSON.parse(JSON.stringify(obj2));
        obj2.status.validationWindow = timeLeft;
        return obj2;
    }

    //takes the address and remove the valid request form the pool along with the timeout
    removeValidPool(address) {
        for (var i = 0; i < this.validmempool.length; i++) {
            if (address === this.validmempool[i].status.address) {
                this.validmempool.splice(i, 1);
                clearTimeout(this.timeoutRequests[address]);
                console.log("\nvalid request removed from Pool " + JSON.stringify(address) + "\n");
                return true;
            }
        }
        return false;
    }

    /*
    //create the Genesis block for new chain if it doesnt already exist
    async alphaBlock() {
        await db.doCount().then(async(count) => {
            var x = await count;
            if (x == 0) {
                this.addBlock(new BlockClass.Block("First block in the chain - Genesis block"));
            }
        });
    }
    */

    //add objct of address and star infromation and check the validation of the address then add it to the chain and return the block  object
    addBlock(obj) {
            let self = this;
            //console.log(obj);
            return new Promise(async function(resolve, reject) {
                let valid = await self.checkValidPool(obj.address);
                if (valid > -1) {
                    //console.log(valid);

                    //check if star object included with the address
                    if (typeof obj.star.dec == "string" || typeof obj.star.ra == "string" || typeof obj.star.story == "string" || typeof obj.star.mag == "string" || typeof obj.star.cen == "string") {
                        //ensure the sotry is less thn 250 words
                        if (obj.star.story.split(" ").length < 249) {
                            //let s = obj.star.story;
                            let hx = Buffer.from(obj.star.story).toString('hex');
                            obj.star.story = hx;
                            var x = 0;
                            var pre = '';
                            let newBlock = new BlockClass.Block(obj);
                            //let innerSelf = self;
                            console.log(valid);
                            await db.doCount().then(async(count) => {
                                x = await count;
                                newBlock.time = new Date().getTime().toString().slice(0, -3);
                                // Assign Block height
                                newBlock.height = x;
                                // previous block hash
                                if (x > 0) {
                                    await db.getVal(x - 1).then(async(res) => {
                                        pre = await JSON.parse(res).hash;
                                        newBlock.previousBlockHash = pre;
                                    });
                                }
                                //console.log(newBlock);
                                // Block hash with SHA256 using newBlock and converting to a string
                                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                                // Adding block object to the levelDB
                                //console.log(valid);
                                await db.addNew(x, JSON.stringify(newBlock));
                                self.removeValidPool(obj.address);
                                resolve(newBlock);

                            });
                        } else {
                            reject({ error: "The story exceed 250 words limit" });
                        }
                    } else {
                        reject({ error: "Star data is missing, or attempted to submit multi stars in one request" });
                    }
                } else {
                    reject({ error: "Address has not been validated" });
                }
            });
        }
        /*
        getStar(hash) {
            let obj = Promise.resolve().then(() => this.getBlock(hash));
            //.then(() => greet('fred'))
            //.then(closeGate);
            //let obj = await this.getBlock(hash).then((res) => { return res; });
            //obj.star.storyDecoded = hex2ascii(obj.star.story);
            return obj;
        }
        */
        /*
        // Add new block, (optional) return a proimse
        addBlock(newBlock) {
            var x = 0;
            var pre = '';
            return new Promise(async function(resolve, reject) {
                await db.doCount().then(async(count) => {
                    x = await count;
                    newBlock.time = new Date().getTime().toString().slice(0, -3);
                    // Assign Block height
                    newBlock.height = x;
                    // previous block hash
                    if (x > 0) {
                        await db.getVal(x - 1).then(async(res) => {
                            pre = await JSON.parse(res).hash;
                            newBlock.previousBlockHash = pre;
                        });
                    }
                    // Block hash with SHA256 using newBlock and converting to a string
                    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                    // Adding block object to the levelDB
                    await db.addNew(x, JSON.stringify(newBlock));
                    resolve(newBlock);
                });
            });
        }
        */


    //getall chain contents and print them in the console log
    getAll() {
        db.parse();
    }

    // Edit a block for test the validiation functions
    //ex: modBlock("e9fe6db803283f48618e4a99136e881d59e91a53b933e058373f36ce8574a3e8",
    // 1, "4th block in the chain", "1541893658",
    //"f1c0cd053c6da4c54b55b032db2726fffc2a0bb0fc30aa05bfddb604599c0883");
    // this function will not be included in the released version
    /*
    modBlock(hash, height, body, time, pre) {
        var block = new BlockClass.Block(body);
        block.height = height;
        block.hash = hash;
        block.time = time;
        block.previousBlockHash = pre;
        db.addNew(height, JSON.stringify(block));
    }
    */


    // get most recent block height
    //ex:  getBlockHeight().then((res) => { console.log("Current Block Height: " + res) });
    async getBlockHeight() {
        var x = 0;
        await db.doCount().then(async(count) => {
            x = await count;
            if (x == 0) {} else if (x > 0) {
                x--;
            }
        });
        //console.log(x);
        return x;
    }


    // get block and return it's value
    //ex: getBlock(7).then((res) =>{ console.log(res); });
    getBlock(blockHeight) {
        return new Promise(function(resolve, reject) {
            db.getVal(blockHeight).then(async(res) => {
                res = await JSON.parse(res);
                res.body.star.storyDecoded = hex2ascii(res.body.star.story);
                //console.log(res);
                resolve(res);
            });
        });
    }

    //get block by it's hash value
    getBlockByHash(hash) {
        var index;
        let self = this;
        return new Promise(async function(resolve, reject) {
            index = await db.hashToKey(hash).then((res) => { return res; });
            if (index == -1) {
                reject({ error: "no block found with the hash value" });
            } else {
                self.getBlock(index).then((res) => { resolve(res); });
            }
        });
    }

    //get all stars by an address
    getAllByAddress(address) {
        return new Promise(function(resolve, reject) {
            db.listFromAddress(address).then(async(res) => {
                res = await JSON.parse(res);
                for (var i = 0; i < res.length; i++) {
                    //res[i].body.star = JSON.parse(JSON.stringify(res[i].body.star));

                    res[i].body.star.storyDecoded = hex2ascii(res[i].body.star.story);
                    //console.log(res[i].body.star);
                    //console.log(l);
                }
                res = JSON.parse(JSON.stringify(res));
                if (JSON.stringify(res) === JSON.stringify([])) {
                    reject({ error: "none found" })
                } else {
                    resolve(res);
                }

            }).catch((res) => { console.log(res); });
        });
    }

    // validate block, also validate the previous block hash with the calculated hash of that block
    //ex: validateBlock(5).then((res) => { console.log("Block: " + res.height + " is " + res.valid + "\nCalculated Block Hash: " + res.hash) });
    validateBlock(blockHeight) {
        let data = {
            height: blockHeight,
            valid: '',
            hash: ''
        };
        let cHash;
        let preBlock = new BlockClass.Block();
        return new Promise(async function(resolve, reject) {
            await db.getVal(blockHeight).then(async(res) => {
                res = JSON.parse(res);
                // get block object
                let block = res;
                // get block hash
                let blockHash = block.hash;
                // remove block hash to test block integrity
                block.hash = '';
                // generate block hash
                data.hash = await SHA256(JSON.stringify(block)).toString();

                if (block.height == 0) {
                    cHash = '';
                } else {
                    await db.getVal(blockHeight - 1).then(async(res2) => {
                        res2 = await JSON.parse(res2);
                        preBlock.hash = '';
                        preBlock.height = res2.height;
                        preBlock.time = res2.time;
                        preBlock.body = res2.body;
                        preBlock.previousBlockHash = res2.previousBlockHash;

                        cHash = await SHA256(JSON.stringify(preBlock)).toString();;
                    });
                }
                // Compare
                if ((blockHash === data.hash) && (cHash === res.previousBlockHash)) {
                    data.valid = true;
                } else {
                    //console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
                    data.valid = false;
                }
                resolve(data);
                //console.log(res);
            });
        });
    }


    // Validate blockchain then print the false blocks
    validateChain() {
        let i = 0;
        let errorLog = [];
        let x = 0;
        db.doCount().then(async(count) => {
            x = await count;

            for (i = 0; i < x; i++) {
                await this.validateBlock(i).then(async(res) => {
                    if (res.valid === false) {
                        await errorLog.push(res.height);
                    }
                });
            }
            if (errorLog.length > 0) {
                console.log('Block errors = ' + errorLog.length);
                console.log('Blocks: ' + errorLog);
            } else {
                console.log('No errors detected');
            }
        });
    }

    // Validate blockchain then print the false blocks and also double checks the link with previous block
    // 
    validateChain2() {
        let i = 0;
        let errorLog = [];
        let x = 0;
        let preHash;
        let cHash;
        db.doCount().then(async(count) => {
            x = await count;
            for (i = 0; i < x; i++) {
                //validate current block of the loop
                await this.validateBlock(i).then(async(res) => {
                    //caclulate previous block hash to compare with current hash
                    if (i > 0) {
                        await this.validateBlock(i - 1).then(async(res2) => {
                            preHash = await res2.hash;
                            //get the stored previousBlockHash in current block of the loop 
                            await db.getVal(i).then(async(res3) => {
                                res3 = await JSON.parse(res3);
                                cHash = await res3.previousBlockHash;
                                //if current block is invalid by current hash calculation add to errorLog
                                if (res.valid === false) {
                                    await errorLog.push(res.height);
                                }
                                //or if the current previousBlockHash did not match the previous block hash calculation add to errorLog
                                else if (cHash != preHash) {
                                    await errorLog.push(res.height);
                                    //console.log("X " + cHash + " Y " + preHash);
                                }
                            });
                        });
                    } else {
                        //check Genisis block validation
                        if (res.valid === false) {
                            await errorLog.push(res.height);
                        }
                    }
                });
            }
            if (errorLog.length > 0) {
                console.log('Block errors = ' + errorLog.length);
                console.log('Blocks: ' + errorLog);
            } else {
                console.log('No errors detected');
            }
        });
    }


}

module.exports.Blockchain = Blockchain;