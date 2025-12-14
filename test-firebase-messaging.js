
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

console.log('Testing credentials for project:', serviceAccount.project_id);

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const message = {
        notification: { title: 'Test', body: 'Test' },
        token: 'fake_token_1234567890' // Token invalide volontaire
    };

    console.log('Attempting to send test message...');

    admin.messaging().send(message)
        .then((response) => {
            console.log('Unexpected success:', response);
        })
        .catch((error) => {
            // Si l'erreur concerne le token, c'est que l'authentification a fonctionné !
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered' ||
                error.message.includes('The registration token is not a valid FCM registration token')) {
                console.log('✅ SUCCÈS : Les identifiants sont VALIDES ! (L\'API a bien rejeté le faux token)');
                console.log('Configuration Firebase OK pour le projet:', serviceAccount.project_id);
            } else {
                console.error('❌ ÉCHEC : Erreur d\'authentification ou autre:', error.code, error.message);
            }
        });

} catch (e) {
    console.error('Crash du script:', e);
}
