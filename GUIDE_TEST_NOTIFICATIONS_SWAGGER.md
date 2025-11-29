# 🔔 Guide de Test des Notifications Firebase sur Swagger

## 📋 Prérequis

1. ✅ Serveur démarré : `npm run start:dev`
2. ✅ Firebase configuré avec `firebase-service-account.json`
3. ✅ Accès à Swagger : `http://localhost:3007/api`
4. ✅ Token JWT valide (obtenu via `/auth/login`)

---

## 🚀 Étapes pour Tester les Notifications

### 1️⃣ **S'authentifier et obtenir un token JWT**

**Endpoint :** `POST /auth/login`

**Body :**
```json
{
  "email": "votre-email@example.com",
  "password": "votre-mot-de-passe"
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Action :** Copiez le `access_token` et cliquez sur le bouton **"Authorize"** en haut de Swagger, puis collez le token.

---

### 2️⃣ **Enregistrer un Token FCM (Optionnel - pour recevoir des push notifications)**

**Endpoint :** `POST /notifications-firebase/register-token`

**Body :**
```json
{
  "fcmToken": "votre-token-fcm-ici",
  "platform": "ANDROID"
}
```

**Exemples de tokens pour tester :**
- **Token de test (pour tester l'enregistrement uniquement)** :
  ```json
  {
    "fcmToken": "test-token-fcm-123456789",
    "platform": "ANDROID"
  }
  ```
- **Token réel FCM** : Généré par votre application mobile (Android/iOS/Web)
  - Format typique : Longue chaîne aléatoire (ex: `dGhpcyBpcyBhIGZha2UgZmNtIHRva2VuIGZvciB0ZXN0aW5n...`)
  - ⚠️ **Attention** : Un JWT (commence par `eyJ...`) n'est PAS un token FCM valide

> **Note :** 
> - Si vous n'avez pas de token FCM réel, vous pouvez utiliser un token de test
> - Les notifications seront quand même **enregistrées dans Firestore**
> - Mais la **push notification ne sera pas envoyée** sans un token FCM valide

**Réponse :**
```json
{
  "success": true
}
```

**En cas d'erreur 500 :**
- Vérifiez que `firebase-service-account.json` existe à la racine du projet
- Vérifiez les logs du serveur pour voir l'erreur détaillée
- Le message d'erreur devrait maintenant être plus clair

---

### 3️⃣ **Envoyer une Notification de Test**

**Endpoint :** `POST /notifications-firebase/test`

**Body :**
```json
{
  "title": "Notification de test",
  "body": "Ceci est une notification de test depuis Swagger !"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Notification de test envoyée. Vérifiez votre appareil si vous avez enregistré un token FCM."
}
```

> **💡 Astuce** : Même si vous n'avez pas de token FCM, la notification sera quand même enregistrée dans Firestore et visible via `GET /notifications-firebase` !

**Ce qui se passe réellement :**

1. **📝 Enregistrement dans Firestore** :
   - La notification est **TOUJOURS** enregistrée dans la collection `notifications` de Firestore
   - Elle contient : `userId`, `type`, `title`, `body`, `visitId`, `housingId`, `role`, `isRead`, `sentBy`, `createdAt`
   - L'ID du document Firestore est généré automatiquement
   - **Même sans token FCM, la notification est enregistrée !**

2. **📱 Envoi Push Notification (si token FCM enregistré)** :
   - Le système récupère tous les tokens FCM de l'utilisateur depuis `userTokens/{userId}`
   - Si des tokens existent, une notification push est envoyée via Firebase Cloud Messaging
   - La notification push contient : `title`, `body`, et des données (`notificationId`, `type`, `visitId`, `housingId`)
   - Si aucun token n'est enregistré, **seulement l'enregistrement Firestore se fait** (pas d'erreur)

3. **✅ Résultat** :
   - La notification est visible via `GET /notifications-firebase`
   - La notification est stockée dans Firestore pour consultation ultérieure
   - Si vous avez un token FCM valide, vous recevrez aussi une push notification sur votre appareil

---

### 4️⃣ **Récupérer vos Notifications**

**Endpoint :** `GET /notifications-firebase`

**Réponse :**
```json
[
  {
    "id": "notification-id-123",
    "userId": "user-id-123",
    "type": "VISIT_ACCEPTED",
    "title": "Notification de test",
    "body": "Ceci est une notification de test depuis Swagger !",
    "visitId": null,
    "housingId": null,
    "role": "CLIENT",
    "isRead": false,
    "sentBy": "COLLECTOR",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### 5️⃣ **Marquer une Notification comme Lue**

**Endpoint :** `PATCH /notifications-firebase/{id}/read`

**Paramètre :** `id` - L'ID de la notification (récupéré à l'étape 4)

**Réponse :**
```json
{
  "success": true
}
```

---

## 📱 Test des Notifications Réelles (avec Appareil)

### Pour tester avec un appareil Android/iOS :

1. **Obtenir un vrai token FCM** depuis votre application mobile
2. **Enregistrer le token** via `POST /notifications-firebase/register-token`
3. **Envoyer une notification de test** via `POST /notifications-firebase/test`
4. **Vérifier** que la notification apparaît sur votre appareil

---

## 🧪 Scénarios de Test Complets

### Scénario 1 : Notification de Visite Acceptée

1. Créer une visite via `POST /visite`
2. Accepter la visite via `PATCH /visite/{id}/status` avec `{ "status": "confirmed" }`
3. Vérifier les notifications via `GET /notifications-firebase`
4. Vous devriez voir une notification "Visite acceptée"

### Scénario 2 : Notification de Visite Refusée

1. Créer une visite via `POST /visite`
2. Refuser la visite via `PATCH /visite/{id}/status` avec `{ "status": "refused" }`
3. Vérifier les notifications via `GET /notifications-firebase`
4. Vous devriez voir une notification "Visite refusée"

### Scénario 3 : Rappels Automatiques

1. Créer une visite avec une date future (ex: dans 3 jours)
2. Accepter la visite
3. Les rappels seront planifiés automatiquement (J-2, J-1, H-2, H-1, 30 min)
4. Les rappels seront envoyés automatiquement par le scheduler (toutes les 5 minutes)

---

## 🔍 Vérification dans Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet Firebase
3. Allez dans **Firestore Database**
4. Vérifiez les collections :

### Collection `notifications`
- **Contient** : Toutes les notifications envoyées (test, visite acceptée, visite refusée, etc.)
- **Structure d'un document** :
  ```json
  {
    "userId": "user-id-123",
    "type": "VISIT_ACCEPTED",
    "title": "Visite acceptée",
    "body": "Votre visite pour Appartement 3 pièces a été acceptée.",
    "visitId": "visite-789",
    "housingId": "logement-456",
    "role": "CLIENT",
    "isRead": false,
    "sentBy": "COLLECTOR",
    "createdAt": Timestamp
  }
  ```
- **Important** : Cette collection est créée automatiquement lors de la première notification

### Collection `notifications-scheduled`
- **Contient** : Notifications planifiées (rappels J-2, J-1, H-2, H-1, 30 min)
- **Structure** :
  ```json
  {
    "userId": "user-id-123",
    "visitId": "visite-789",
    "housingId": "logement-456",
    "type": "VISIT_REMINDER_J2",
    "title": "Rappel de visite (J-2)",
    "body": "Vous avez une visite pour le logement dans 2 jours.",
    "scheduledAt": Date,
    "processed": false,
    "role": "CLIENT",
    "createdAt": Timestamp
  }
  ```
- **Traitement** : Le scheduler (`@Cron`) vérifie toutes les 5 minutes et envoie les notifications dont `scheduledAt` est proche

### Collection `userTokens`
- **Contient** : Les tokens FCM enregistrés par utilisateur
- **Structure** :
  ```json
  {
    "userId": "user-id-123",
    "tokens": [
      {
        "token": "fcm-token-abc123",
        "platform": "ANDROID",
        "updatedAt": Timestamp
      }
    ]
  }
  ```
- **Important** : Un utilisateur peut avoir plusieurs tokens (plusieurs appareils)

---

## ⚠️ Dépannage

### Problème : "Firebase non configuré"
- ✅ Vérifiez que `firebase-service-account.json` est à la racine du projet
- ✅ Vérifiez les logs du serveur pour voir si Firebase s'initialise

### Problème : "Aucune notification reçue"
- ✅ Vérifiez que vous avez un token FCM valide enregistré
- ✅ Vérifiez dans Firestore que la notification a été créée
- ✅ Vérifiez que votre application mobile est configurée correctement

### Problème : "Erreur 401 Unauthorized"
- ✅ Vérifiez que vous avez cliqué sur "Authorize" dans Swagger
- ✅ Vérifiez que votre token JWT est valide et non expiré
- ✅ Reconnectez-vous via `/auth/login` si nécessaire

### Problème : "Erreur 500 Internal Server Error" lors de l'enregistrement du token
- ✅ **Vérifiez que Firebase est initialisé** :
  - Le fichier `firebase-service-account.json` doit exister à la racine du projet
  - Dans les logs du serveur, vous devriez voir : `[FirebaseAdminProvider] Firebase initialisé avec succès`
- ✅ **Vérifiez le token FCM** :
  - Un token FCM ne doit PAS être un JWT (ne doit pas commencer par `eyJ...`)
  - Utilisez un token de test simple pour tester : `test-token-fcm-123456789`
  - Un vrai token FCM est généralement une longue chaîne aléatoire
- ✅ **Vérifiez les logs du serveur** :
  - Cherchez `[NotificationsFirebaseService] Erreur lors de l'enregistrement du token FCM:`
  - Le message d'erreur détaillé vous indiquera la cause exacte
- ✅ **Testez avec un token simple** :
  ```json
  {
    "fcmToken": "test-token-123",
    "platform": "ANDROID"
  }
  ```

---

## 📊 Endpoints Disponibles

| Méthode | Endpoint | Description | Enregistre dans Firestore ? |
|---------|----------|-------------|----------------------------|
| `POST` | `/notifications-firebase/register-token` | Enregistrer un token FCM | ✅ Oui (collection `userTokens`) |
| `GET` | `/notifications-firebase` | Récupérer mes notifications | ❌ Non (lecture seule) |
| `PATCH` | `/notifications-firebase/:id/read` | Marquer comme lue | ✅ Oui (met à jour `isRead`) |
| `POST` | `/notifications-firebase/test` | Envoyer une notification de test | ✅ Oui (collection `notifications`) |

## 🔄 Flux Complet d'une Notification

```
1. Appel API (ex: POST /notifications-firebase/test)
   ↓
2. Service: sendAndStoreNotification()
   ↓
3. Récupération des tokens FCM de l'utilisateur
   ↓
4. Création du document dans Firestore (collection 'notifications')
   ↓
5. Si tokens FCM existent → Envoi push notification via FCM
   ↓
6. Réponse API avec succès
   ↓
7. Notification visible via GET /notifications-firebase
```

**Points importants :**
- ✅ L'enregistrement dans Firestore se fait **TOUJOURS**, même sans token FCM
- ✅ L'envoi push se fait **SEULEMENT** si des tokens FCM sont enregistrés
- ✅ La notification est persistée et peut être récupérée plus tard
- ✅ Le statut `isRead` peut être mis à jour via `PATCH /notifications-firebase/:id/read`

---

## ✅ Checklist de Test

- [ ] Authentification réussie
- [ ] Token JWT configuré dans Swagger
- [ ] Token FCM enregistré (optionnel)
- [ ] Notification de test envoyée
- [ ] Notification visible dans la liste (`GET /notifications-firebase`)
- [ ] Notification marquée comme lue (`PATCH /notifications-firebase/:id/read`)
- [ ] Notification visible dans Firestore Console
- [ ] Push notification reçue sur appareil (si token valide)

---

## 🎯 Résumé : Ce que fait réellement une notification

### ✅ Ce qui est TOUJOURS enregistré :

1. **Dans Firestore - Collection `notifications`** :
   - ✅ Document créé avec tous les détails (title, body, type, userId, etc.)
   - ✅ `createdAt` : Timestamp automatique
   - ✅ `isRead` : `false` par défaut
   - ✅ ID unique généré par Firestore
   - **Cela se fait TOUJOURS, même sans token FCM !**

2. **Dans Firestore - Collection `userTokens`** (si vous enregistrez un token) :
   - ✅ Token FCM enregistré avec la plateforme (ANDROID/IOS/WEB)
   - ✅ `updatedAt` : Timestamp de mise à jour

### 📱 Ce qui est envoyé (si token FCM existe) :

1. **Push Notification via Firebase Cloud Messaging** :
   - ✅ Notification push sur l'appareil (titre + corps)
   - ✅ Données supplémentaires (notificationId, type, visitId, housingId)
   - **Cela se fait SEULEMENT si un token FCM valide est enregistré**

### 🔍 Comment vérifier que c'est enregistré :

1. **Via API** : `GET /notifications-firebase` → Retourne toutes vos notifications
2. **Via Firestore Console** : Collection `notifications` → Voir le document créé
3. **Via Appareil** : Si token FCM valide → Notification push reçue

### 📝 Exemple de test complet :

```bash
# 1. Envoyer une notification de test
POST /notifications-firebase/test
{
  "title": "Test",
  "body": "Ceci est un test"
}

# 2. Vérifier qu'elle est enregistrée
GET /notifications-firebase
# → Vous devriez voir votre notification dans la liste

# 3. Vérifier dans Firestore Console
# → Collection "notifications" → Document avec votre userId
```

---

**🎉 Vous êtes prêt à tester les notifications Firebase !**

**💡 Rappel important** : Les notifications sont **TOUJOURS** enregistrées dans Firestore, même si vous n'avez pas de token FCM. L'enregistrement et l'envoi push sont deux choses séparées !


