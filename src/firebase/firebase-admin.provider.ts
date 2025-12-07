import { Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  useFactory: () => {
    const serviceAccountPath = path.join(
      process.cwd(),
      'firebase-service-account.json',
    );

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[FirebaseAdminProvider] Firebase initialisé avec succès');
      }

      return admin;
    } else {
      console.warn(
        '[FirebaseAdminProvider] Fichier firebase-service-account.json non trouvé. Firebase ne sera pas initialisé.',
      );
      return admin;
    }
  },
};
