# Configuration Firebase pour le projet yosra-ffae2

## 📋 Instructions pour configurer Firebase

### 1. Télécharger le fichier de clé de service

1. Va sur [Console Firebase](https://console.firebase.google.com)
2. Sélectionne ton projet **`yosra-ffae2`**
3. Clique sur ⚙️ **Paramètres du projet** (en haut à gauche)
4. Va dans l'onglet **Comptes de service**
5. Clique sur **Générer une nouvelle clé privée**
6. Un fichier JSON sera téléchargé (ex: `yosra-ffae2-firebase-adminsdk-xxxx.json`)

### 2. Placer le fichier dans le projet

1. **Renomme** le fichier téléchargé en : `firebase-service-account.json`
2. **Place-le à la racine du projet** (même niveau que `package.json`)

   ```
   DarnaBackendNest/
   ├── firebase-service-account.json  ← ICI
   ├── package.json
   ├── src/
   └── ...
   ```

### 3. Vérifier que ça fonctionne

1. Relance le serveur :
   ```bash
   npm run start:dev
   ```

2. Tu devrais voir dans les logs :
   ```
   [FirebaseAdminProvider] Firebase initialisé avec succès
   ```

3. Si tu vois un warning :
   ```
   [FirebaseAdminProvider] Fichier firebase-service-account.json non trouvé...
   ```
   → Vérifie que le fichier est bien à la racine et qu'il s'appelle exactement `firebase-service-account.json`

## ✅ Une fois configuré

- Le module `NotificationsFirebase` sera **actif**
- Les notifications seront enregistrées dans **Firestore** (collection `notifications`)
- Les push notifications seront envoyées via **FCM**
- Les rappels automatiques (J-2, J-1, H-2, H-1) fonctionneront

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ne commite JAMAIS le fichier `firebase-service-account.json` dans Git !

Ajoute-le dans `.gitignore` :
```
firebase-service-account.json
```










