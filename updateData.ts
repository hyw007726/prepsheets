import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
const db = admin.firestore();
export const testFirebaseOnCall = functions
.region('europe-west2')
.https.onCall(async (data, context) => { 
  const collectionRef = db.collection(
    `/users/ymRr9in8inMSOikbMrt6/referenceIngredients`,
  );
  const collectionData = await collectionRef.get();
  for (const doc of collectionData.docs) {
    console.log(doc);
  }
});
export const copyManagedIngredientsPriceToCustomer = functions
  .region('europe-west2')
  .https.onRequest(async (req, res) => {
    const collectionRef = db.collection(
      `/users/ymRr9in8inMSOikbMrt6/referenceIngredients`,
    );
    //8jEbPI6cMPO1jfD5e6ep  local test customer id
    //ymRr9in8inMSOikbMrt6 Tribe'id
    const ingredientsRef = db.collection(`/ingredients`);
    const collectionData = await collectionRef.get();
    const size = collectionData.size;
    if (size >= 1000) {
      //Tribe has fewer than 1000 ingredients
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Too many ingredients',
      );
    }
    const batch1 = db.batch();
    const batch2 = db.batch();
    const promises: Promise<FirebaseFirestore.WriteResult[]>[] = [];
    let bDocCtr = 0;
    for (const doc of collectionData.docs) {
      const managedIngredientsRef=await ingredientsRef.doc(doc.id).get();
      const price = await managedIngredientsRef.get('price');
      bDocCtr += 1;
      if(!price) continue;
      if (bDocCtr < 500) {
        batch1.update(doc.ref, { price: price });
      } else {
        batch2.update(doc.ref, { price: price });
      }
    }
    promises.push(batch1.commit());
    if (bDocCtr >= 500) {
      promises.push(batch2.commit());
    }
    Promise.all(promises)
      .then(() => console.log('Batches committed'))
      .catch(() => false);
    res.send({
      status: 'done',
    });
  });

export const setManagedIngredientsPricesToZero = functions
  .region('europe-west2')
  .https.onRequest(async (req, res) => {
    const ingredientsRef = db.collection(`/ingredients`);
    const ingredientsData = await ingredientsRef.get();
    const promises: Promise<FirebaseFirestore.WriteResult[]>[] = [];
    var batch = db.batch();
    let bDocCtr = 0;
    for (const doc of ingredientsData.docs) {
      if (bDocCtr < 500) {
        batch.update(doc.ref, { price: 0 });
        bDocCtr += 1;
      } else {
        promises.push(batch.commit());
        batch = db.batch();
        bDocCtr = 0;
      }
    }
    Promise.all(promises)
      .then(() => console.log('Batches committed'))
      .catch(() => false);
    res.send({
      status: 'done',
    });
  });
