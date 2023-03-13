# prepsheets

## Backups for codes I wrote for Prepsheets


## package.json: to make emulators work for remote database:
    "emulators": "firebase emulators:start --only=auth,functions --project=prod"
    
## firebasewrapper: comment these lines:
      // connectFirestoreEmulator(firestore, 'localhost', 8080);
      // connectStorageEmulator(storage, 'localhost', 9199);
