# 🔧 Correction de l'erreur Firestore NOT_FOUND

## ❌ Problème

L'erreur `5 NOT_FOUND` indique que **Firestore n'est pas initialisé** dans votre projet Firebase.

## ✅ Solution : Initialiser Firestore dans Firebase Console

### Étapes à suivre :

1. **Allez sur Firebase Console**
   - Ouvrez : https://console.firebase.google.com
   - Sélectionnez votre projet : **`darnadam-70385`** (ou le nom de votre projet)

2. **Activez Firestore Database**
   - Dans le menu de gauche, cliquez sur **"Firestore Database"**
   - Si vous voyez un bouton **"Créer une base de données"**, cliquez dessus
   - Si la base existe déjà, passez à l'étape 3

3. **Choisir le mode de sécurité**
   - **Pour le développement** : Choisissez **"Mode test"**
     - Les règles permettent les lectures/écritures pendant 30 jours
   - **Pour la production** : Choisissez **"Mode production"** et configurez les règles

4. **Sélectionner l'emplacement**
   - Choisissez une région proche (ex: `europe-west` ou `us-central`)
   - Cliquez sur **"Activer"**

5. **Configurer les règles de sécurité (si mode production)**

   Si vous avez choisi le mode production, allez dans l'onglet **"Règles"** et utilisez :

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Permettre l'écriture pour le compte de service (backend)
       match /{document=**} {
         allow read, write: if request.auth != null || 
                            request.auth.token.firebase.sign_in_provider == 'custom';
       }
       
       // Ou pour le développement, permettre tout (ATTENTION: seulement pour dev)
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   ⚠️ **IMPORTANT** : Les règles `allow read, write: if true;` sont **DANGEREUSES** en production. Utilisez-les uniquement pour le développement.

6. **Vérifier que c'est activé**
   - Vous devriez voir une interface avec des collections vides
   - Le message "Aucune collection" est normal au début

## 🔄 Après l'initialisation

1. **Redémarrez votre backend** (si nécessaire)
2. **Réessayez de vous connecter** depuis l'app Android
3. **Vérifiez les logs** - vous devriez voir :
   ```
   [NotificationsFirebaseService] ✅ Token FCM enregistré pour l'utilisateur ...
   ```

## 🔍 Vérification dans Firebase Console

Après l'enregistrement réussi, vous pouvez vérifier dans Firebase Console :

1. Allez dans **Firestore Database**
2. Vous devriez voir une collection **`userTokens`**
3. Cliquez dessus pour voir les documents avec les tokens FCM

## 📝 Notes importantes

- **Mode Test** : Les règles expirent après 30 jours, vous devrez les reconfigurer
- **Mode Production** : Vous devez configurer les règles de sécurité appropriées
- Le compte de service (firebase-service-account.json) a normalement les permissions nécessaires pour écrire dans Firestore

## 🆘 Si le problème persiste

1. Vérifiez que le fichier `firebase-service-account.json` est présent et valide
2. Vérifiez que le projet Firebase correspond bien (project_id dans google-services.json = project_id dans firebase-service-account.json)
3. Vérifiez les permissions du compte de service dans Firebase Console > Paramètres > Comptes de service






















