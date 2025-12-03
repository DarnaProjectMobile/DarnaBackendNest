# ✅ Configuration .env et Notifications Firebase

## 📋 Ce qui a été configuré

### 1. Fichier `.env` créé ✅
Le fichier `.env` a été créé à la racine du projet avec toutes les variables nécessaires :
- `PORT` : Port du serveur (3007)
- `MONGO_URI` : URI de connexion MongoDB
- `JWT_SECRET` : Clé secrète pour JWT (⚠️ À changer en production)
- `MAIL_USER` : Email pour l'envoi de mails
- `MAIL_PASS` : Mot de passe d'application pour l'email

### 2. Configuration JWT mise à jour ✅
- `src/auth/auth.module.ts` : Utilise maintenant `JWT_SECRET` depuis `.env`
- `src/auth/jwt.strategy.ts` : Utilise maintenant `JWT_SECRET` depuis `.env`

### 3. Notifications Firebase ✅
Le système de notifications Firebase est **déjà configuré et actif** :
- ✅ Module `NotificationsFirebaseModule` configuré
- ✅ Service `NotificationsFirebaseService` prêt
- ✅ Scheduler automatique pour les rappels (toutes les 5 minutes)
- ✅ Controller avec endpoints Swagger
- ✅ Fichier `firebase-service-account.json` présent

## 🔧 Configuration requise

### 1. Modifier le fichier `.env`

Ouvrez le fichier `.env` et modifiez les valeurs suivantes :

```env
# Changez cette clé secrète en production
JWT_SECRET=votre-cle-secrete-securisee

# Configurez votre email
MAIL_USER=votre-email@gmail.com
MAIL_PASS=votre-mot-de-passe-application
```

**Pour générer une clé JWT sécurisée :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Pour Gmail (App Password) :**
1. Activez la vérification en 2 étapes sur votre compte Google
2. Allez sur : https://myaccount.google.com/apppasswords
3. Générez un mot de passe d'application pour "Mail"
4. Utilisez ce mot de passe dans `MAIL_PASS`

### 2. Vérifier Firebase

Le fichier `firebase-service-account.json` est déjà présent. Si vous devez le régénérer :

1. Allez sur [Console Firebase](https://console.firebase.google.com)
2. Sélectionnez votre projet **yosra-ffae2**
3. ⚙️ **Paramètres du projet** > **Comptes de service**
4. Cliquez sur **Générer une nouvelle clé privée**
5. Renommez le fichier en `firebase-service-account.json`
6. Placez-le à la racine du projet

## 🚀 Comment utiliser les notifications

### 1. Démarrer le serveur

```bash
npm run start:dev
```

Vous devriez voir dans les logs :
```
[FirebaseAdminProvider] Firebase initialisé avec succès
```

### 2. Endpoints disponibles

Tous les endpoints sont documentés dans Swagger : `http://localhost:3007/api`

#### Enregistrer un token FCM
```
POST /notifications-firebase/register-token
Body: {
  "platform": "ANDROID" | "IOS" | "WEB",
  "fcmToken": "votre-token-fcm"
}
```

#### Récupérer mes notifications
```
GET /notifications-firebase
```

#### Marquer comme lue
```
PATCH /notifications-firebase/:id/read
```

#### Envoyer une notification de test
```
POST /notifications-firebase/test
Body: {
  "title": "Titre",
  "body": "Message"
}
```

### 3. Collections Firestore créées automatiquement

Les collections suivantes seront créées automatiquement lors de l'utilisation :
- `notifications` : Toutes les notifications envoyées
- `userTokens` : Tokens FCM par utilisateur
- `notifications-scheduled` : Notifications planifiées (rappels)

### 4. Types de notifications

Le système gère automatiquement :
- ✅ Visite acceptée
- ✅ Visite refusée
- ✅ Rappels automatiques (J-2, J-1, H-2, H-1, 30 min avant)
- ✅ Notifications pour clients et collecteurs

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Démarrer le serveur** : `npm run start:dev`
2. **Vérifier les logs** : Vous devriez voir "Firebase initialisé avec succès"
3. **Tester via Swagger** : `http://localhost:3007/api`
4. **Enregistrer un token** : Utilisez l'endpoint `/notifications-firebase/register-token`
5. **Envoyer une notification de test** : Utilisez l'endpoint `/notifications-firebase/test`

## 🔒 Sécurité

- ✅ Le fichier `.env` est dans `.gitignore` (ne sera pas commité)
- ✅ Le fichier `firebase-service-account.json` est dans `.gitignore`
- ⚠️ **IMPORTANT** : Changez `JWT_SECRET` en production !

## 📝 Notes

- Les notifications sont **automatiquement enregistrées** dans Firestore
- Les push notifications sont **automatiquement envoyées** via FCM
- Le scheduler traite les rappels **toutes les 5 minutes**
- Toutes les notifications sont liées à un `userId` pour la sécurité





