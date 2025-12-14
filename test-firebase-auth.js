
const admin = require('firebase-admin');
const fs = require('fs');

try {
    const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));
    console.log('Read service account for project:', serviceAccount.project_id);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase initialized. Attempting to verify connectivity...');

    // Try to interact with Auth service (list users) as a lightweight check
    admin.auth().listUsers(1)
        .then((listUsersResult) => {
            console.log('Successfully connected to Firebase Auth.');
            console.log('Found ' + listUsersResult.users.length + ' users.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error connecting to Firebase Auth:', error);
            process.exit(1);
        });

} catch (error) {
    console.error('Fatal error in test script:', error);
    process.exit(1);
}
