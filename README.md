# Blockchain Project 4 v2

This project is Built on top of project 3 with an alteration to fit the stars registration blockchain


## Getting Started

The app.js is the start point and it have all testing fucntions you need to check the chain, with listed example and comments,
you can also delete "miniChain" folder to reset the current saved chain.

## how to run it

1- CD to the project folder.
2- install the app by typing in the terminal "npm install"
3- run the app.js by typing in the terminal "node app.js"
4- you can run it through the restuful API or the directly commands in app.js 

## Interaction with the chain through the RESTful API

### Request Validation

Type: POST request
Address: http://localhost:8000/requestValidation
Params: 
        - address (wallet address)

Return: JSON Object

Example: 
    Request:
        { "address":"15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK" }
    Return:
        {
            "WalletAddress": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
            "requestTimeStamp": "1545007444",
            "message": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK:1545007444:starRegistry",
            "validationWindow": 300
        }

### Validate Request

Type: POST request
Address: http://localhost:8000/message-signature/validate
Params: 
        - address (wallet address)
        - signature (signed message from wallet address with recived message)

Return: JSON Object

Example: 
    Request:
        {
        "address":"15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
        "signature":"IEDGs4AI3QybCtPF0GRJ6EBTZO/Wof3MAddOnLX9udeUc241VHghThq9qVGqUeT0a6hoevYMULS2IWEFriLbZS0="
        }
    Return:
        {
            "registerStar": true,
            "status": {
                "address": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
                "requestTimeStamp": "1545007468",
                "message": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK:1545007444:starRegistry",
                "messageSignature": true,
                "validationWindow": 1800
            }
        }

### Add star (create block)

Type: POST request
Address: http://localhost:8000/block
Params: 
        - address (wallet address)
        - star object (star data and story)

Return: JSON Object

Example: 
    Request:
        {
            "address": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
            "star": {
                        "dec": "68° 52' 56.9",
                        "ra": "16h 29m 1.0s",
                        "story": "Found star using https://www.google.com/sky/"
                    }
        }
    Return:
        {
            "hash": "fbdb518a41b77e3fd1c098312a1c1ce73c42a83449ccd8dd811798f0727fda9e",
            "height": 0,
            "body": {
                "address": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
                "star": {
                    "dec": "68° 52' 56.9",
                    "ra": "16h 29m 1.0s",
                    "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                    "storyDecoded": "Found star using https://www.google.com/sky/"
                }
            },
            "time": "1545007500",
            "previousBlockHash": ""
        }

### Get star data by hash

Type: GET request
Address: http://localhost:8000/stars/hash:{HASH}

        - hash (block hash)

Return: JSON Object

Example: 
    Request:        
       http://localhost:8000/stars/hash:fbdb518a41b77e3fd1c098312a1c1ce73c42a83449ccd8dd811798f0727fda9e    
    Return:
        {
            "hash": "fbdb518a41b77e3fd1c098312a1c1ce73c42a83449ccd8dd811798f0727fda9e",
            "height": 0,
            "body": {
                "address": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
                "star": {
                    "dec": "68° 52' 56.9",
                    "ra": "16h 29m 1.0s",
                    "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                    "storyDecoded": "Found star using https://www.google.com/sky/"
                }
            },
            "time": "1545007500",
            "previousBlockHash": ""
        }

### Get all stars data by owner wallet address

Type: GET request
Address: http://localhost:8000/stars/address:{ADDRESS}
Params: 
        - Address (block hash)

Return: JSON Object

Example: 
    Request:        
       http://localhost:8000/stars/address:15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK     
    Return:
        [
            {
                "hash": "fbdb518a41b77e3fd1c098312a1c1ce73c42a83449ccd8dd811798f0727fda9e",
                "height": 0,
                "body": {
                    "address": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
                    "star": {
                        "dec": "68° 52' 56.9",
                        "ra": "16h 29m 1.0s",
                        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                        "storyDecoded": "Found star using https://www.google.com/sky/"
                    }
                },
                "time": "1545007500",
                "previousBlockHash": ""
            },
            {
                "hash": "2de304cf4f59a313c4de334345d082e1cab0ee9d7e906dd60e84a19629697c54",
                "height": 1,
                "body": {
                    "address": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
                    "star": {
                        "ra": "17h 22m 13.1s",
                        "dec": "-27° 14' 8.2",
                        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                        "storyDecoded": "Found star using https://www.google.com/sky/"
                    }
                },
                "time": "1545007535",
                "previousBlockHash": "fbdb518a41b77e3fd1c098312a1c1ce73c42a83449ccd8dd811798f0727fda9e"
            }
        ]

### Get star (block) data by block height
 
Type: GET request
Address: http://localhost:8000/block/{HEIGHT}
Params: 
        - height (block height)

Return: JSON Object

Example: 
    Request:        
       http://localhost:8000/block/0      
    Return:
        {
            "hash": "fbdb518a41b77e3fd1c098312a1c1ce73c42a83449ccd8dd811798f0727fda9e",
            "height": 0,
            "body": {
                "address": "15DBRdghUuYJmCNmaa2MSJnuwd3y5x6MKK",
                "star": {
                    "dec": "68° 52' 56.9",
                    "ra": "16h 29m 1.0s",
                    "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                    "storyDecoded": "Found star using https://www.google.com/sky/"
                }
            },
            "time": "1545007500",
            "previousBlockHash": ""
        }

## Student Info

Abdullah Almaghlouth
