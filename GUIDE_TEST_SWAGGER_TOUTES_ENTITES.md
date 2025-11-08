# 📘 Guide Complet de Test Swagger - Toutes les Entités

## 🚀 Accès à Swagger

1. Démarrez le serveur : `npm run start:dev`
2. Ouvrez : `http://localhost:3000/api`
3. Toutes les sections sont disponibles dans Swagger

---

## 🔐 Authentification (OBLIGATOIRE pour la plupart des endpoints)

### Étape 1 : Se connecter
```
POST /auth/login
Body:
{
  "email": "test@example.com",
  "password": "password123"
}
```
**Copiez le `access_token` de la réponse**

### Étape 2 : Autoriser dans Swagger
1. Cliquez sur **"Authorize"** 🔓 (en haut à droite)
2. Entrez : `Bearer votre_access_token`
3. Cliquez "Authorize" puis "Close"

---

# 📋 1. USER (Utilisateurs)

## 🔓 Endpoints Publics (pas d'authentification)

### POST /auth/register - Créer un compte
**Section : Auth**

**Test :**
1. Cliquez sur `POST /auth/register`
2. Cliquez "Try it out"
3. Remplissez le formulaire :
   ```
   username: testuser
   email: test@example.com
   password: password123
   role: Client
   dateDeNaissance: 1990-01-15
   numTel: 12345678
   gender: Male
   image: (optionnel - choisir fichier)
   ```
4. Cliquez "Execute"

**Réponse attendue :**
```json
{
  "_id": "678f1234567890",
  "username": "testuser",
  "email": "test@example.com",
  "role": "Client",
  "dateDeNaissance": "1990-01-15",
  "numTel": "12345678",
  "gender": "Male"
}
```

### POST /auth/login - Se connecter
**Section : Auth**

**Test :**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### POST /users/forgot-password - Mot de passe oublié
**Section : User**

**Test :**
```json
{
  "email": "test@example.com"
}
```

### POST /users/reset-password - Réinitialiser mot de passe
**Section : User**

**Test :**
```json
{
  "code": "123456",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

---

## 🔒 Endpoints Protégés (authentification requise)

### GET /users - Liste tous les utilisateurs (Admin uniquement)
**Section : User**

**Test :**
1. Authentifiez-vous avec un compte admin
2. Cliquez "Try it out" → "Execute"

**Réponse :**
```json
[
  {
    "_id": "678f1234567890",
    "username": "testuser",
    "email": "test@example.com",
    "role": "Client"
  }
]
```

### GET /users/me - Mon profil
**Section : User**

**Test :**
1. Authentifiez-vous
2. Cliquez "Try it out" → "Execute"

**Réponse :**
```json
{
  "_id": "678f1234567890",
  "username": "testuser",
  "email": "test@example.com",
  "role": "Client",
  "dateDeNaissance": "1990-01-15",
  "numTel": "12345678",
  "gender": "Male",
  "image": "profile.jpg"
}
```

### PATCH /users/me/image - Mettre à jour mon image
**Section : User**

**Test :**
1. Cliquez "Try it out"
2. Cliquez "Choose File" et sélectionnez une image
3. Cliquez "Execute"

### POST /users/send-verification - Envoyer code de vérification
**Section : User**

**Test :**
1. Cliquez "Try it out" → "Execute"
2. Le code sera envoyé à votre email

### POST /users/me/verify - Vérifier email
**Section : User**

**Test :**
```json
{
  "code": "123456"
}
```
*(Utilisez le code reçu par email)*

### PUT /users/:id - Mettre à jour un utilisateur
**Section : User**

**Test :**
- **Paramètre :** `id` = `678f1234567890`
- **Body :**
```json
{
  "username": "nouveauUsername",
  "email": "nouveau@email.com",
  "numTel": "98765432"
}
```

### DELETE /users/:id - Supprimer un utilisateur (Admin uniquement)
**Section : User**

**Test :**
- **Paramètre :** `id` = `678f1234567890`
- Cliquez "Execute"

---

# 📋 2. EVALUATION (Évaluations)

## 🔒 Tous les endpoints nécessitent l'authentification

### POST /evaluation - Créer une évaluation
**Section : Evaluation**

**Test :**
```json
{
  "userId": "678f1234567890",
  "evaluatorId": "678f0987654321",
  "rating": 5,
  "comment": "Excellent service, très satisfait !",
  "logementId": "678f1111111111"
}
```

**Notes :**
- `rating` : nombre entre 1 et 5
- `comment` : optionnel
- `logementId` : optionnel
- `userId` ≠ `evaluatorId` (on ne peut pas s'évaluer soi-même)

**Réponse :**
```json
{
  "_id": "678f2222222222",
  "userId": "678f1234567890",
  "evaluatorId": "678f0987654321",
  "rating": 5,
  "comment": "Excellent service, très satisfait !",
  "logementId": "678f1111111111",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### GET /evaluation - Liste toutes les évaluations
**Section : Evaluation**

**Test :**
- Cliquez "Try it out" → "Execute"

**Avec filtres (Query Parameters) :**
- `?userId=678f1234567890` - Évaluations d'un utilisateur
- `?evaluatorId=678f0987654321` - Évaluations données par un utilisateur

**Exemple :**
```
GET /evaluation?userId=678f1234567890
```

### GET /evaluation/:id - Récupérer une évaluation
**Section : Evaluation**

**Test :**
- **Paramètre :** `id` = `678f2222222222`
- Cliquez "Execute"

### PATCH /evaluation/:id - Mettre à jour une évaluation
**Section : Evaluation**

**Test :**
- **Paramètre :** `id` = `678f2222222222`
- **Body :**
```json
{
  "rating": 4,
  "comment": "Très bien, mais peut s'améliorer"
}
```

### DELETE /evaluation/:id - Supprimer une évaluation
**Section : Evaluation**

**Test :**
- **Paramètre :** `id` = `678f2222222222`
- Cliquez "Execute"

---

# 📋 3. NOTIFICATION (Notifications)

## 🔒 Tous les endpoints nécessitent l'authentification

### POST /notification - Créer une notification
**Section : Notification**

**Test :**
```json
{
  "userId": "678f1234567890",
  "title": "Nouvelle visite programmée",
  "message": "Votre visite a été confirmée pour le 20 janvier 2024",
  "type": "visite",
  "data": {
    "visiteId": "678f3333333333",
    "date": "2024-01-20T14:00:00.000Z"
  }
}
```

**Réponse :**
```json
{
  "_id": "678f4444444444",
  "userId": "678f1234567890",
  "title": "Nouvelle visite programmée",
  "message": "Votre visite a été confirmée pour le 20 janvier 2024",
  "type": "visite",
  "isRead": false,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### GET /notification - Liste toutes les notifications
**Section : Notification**

**Test :**
- Cliquez "Try it out" → "Execute"

**Avec filtres (Query Parameters) :**
- `?userId=678f1234567890` - Notifications d'un utilisateur
- `?userId=678f1234567890&unread=true` - Notifications non lues d'un utilisateur

**Exemples :**
```
GET /notification?userId=678f1234567890
GET /notification?userId=678f1234567890&unread=true
```

### GET /notification/:id - Récupérer une notification
**Section : Notification**

**Test :**
- **Paramètre :** `id` = `678f4444444444`
- Cliquez "Execute"

### PUT /notification/:id/read - Marquer comme lue
**Section : Notification**

**Test :**
- **Paramètre :** `id` = `678f4444444444`
- Cliquez "Execute"

**Réponse :**
```json
{
  "_id": "678f4444444444",
  "isRead": true,
  ...
}
```

### PUT /notification/user/:userId/read-all - Marquer toutes comme lues
**Section : Notification**

**Test :**
- **Paramètre :** `userId` = `678f1234567890`
- Cliquez "Execute"

### PATCH /notification/:id - Mettre à jour une notification
**Section : Notification**

**Test :**
- **Paramètre :** `id` = `678f4444444444`
- **Body :**
```json
{
  "title": "Titre modifié",
  "message": "Message modifié"
}
```

### DELETE /notification/:id - Supprimer une notification
**Section : Notification**

**Test :**
- **Paramètre :** `id` = `678f4444444444`
- Cliquez "Execute"

---

# 📋 4. VISITE (Visites)

## 🔒 Tous les endpoints nécessitent l'authentification

### POST /visite - Créer une visite
**Section : Visite**

**Test :**
```json
{
  "logementId": "678f1111111111",
  "userId": "678f1234567890",
  "dateVisite": "2024-01-20T14:00:00.000Z",
  "notes": "Je souhaite visiter l'appartement en fin d'après-midi",
  "contactPhone": "12345678"
}
```

**Notes :**
- `dateVisite` : Format ISO 8601 (ex: `2024-01-20T14:00:00.000Z`)
- `notes` : optionnel
- `contactPhone` : optionnel

**Réponse :**
```json
{
  "_id": "678f5555555555",
  "logementId": "678f1111111111",
  "userId": "678f1234567890",
  "dateVisite": "2024-01-20T14:00:00.000Z",
  "status": "pending",
  "notes": "Je souhaite visiter l'appartement en fin d'après-midi",
  "contactPhone": "12345678",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### GET /visite - Liste toutes les visites
**Section : Visite**

**Test :**
- Cliquez "Try it out" → "Execute"

**Avec filtres (Query Parameters) :**
- `?userId=678f1234567890` - Visites d'un utilisateur
- `?logementId=678f1111111111` - Visites d'un logement

**Exemples :**
```
GET /visite?userId=678f1234567890
GET /visite?logementId=678f1111111111
```

### GET /visite/:id - Récupérer une visite
**Section : Visite**

**Test :**
- **Paramètre :** `id` = `678f5555555555`
- Cliquez "Execute"

### PUT /visite/:id/status - Mettre à jour le statut
**Section : Visite**

**Test :**
- **Paramètre :** `id` = `678f5555555555`
- **Body :**
```json
{
  "status": "confirmed"
}
```

**Statuts possibles :**
- `pending` - En attente
- `confirmed` - Confirmée
- `completed` - Terminée
- `cancelled` - Annulée

**Réponse :**
```json
{
  "_id": "678f5555555555",
  "status": "confirmed",
  ...
}
```

### PATCH /visite/:id - Mettre à jour une visite
**Section : Visite**

**Test :**
- **Paramètre :** `id` = `678f5555555555`
- **Body :**
```json
{
  "dateVisite": "2024-01-21T15:00:00.000Z",
  "notes": "Nouvelle note"
}
```

### DELETE /visite/:id - Supprimer une visite
**Section : Visite**

**Test :**
- **Paramètre :** `id` = `678f5555555555`
- Cliquez "Execute"

---

# 📋 5. LOGEMENT (Logements)

## 🔒 Tous les endpoints nécessitent l'authentification

### POST /logement - Créer un logement
**Section : Logement**

**Test :**
```json
{
  "ownerId": "678f1234567890",
  "title": "Appartement moderne centre-ville",
  "description": "Bel appartement de 80m² avec 3 pièces, proche du centre-ville",
  "address": "123 Rue de la République",
  "city": "Tunis",
  "price": 500,
  "surface": 80,
  "rooms": 3,
  "type": "appartement",
  "available": true,
  "images": [
    "image1.jpg",
    "image2.jpg"
  ],
  "location": {
    "latitude": 36.8065,
    "longitude": 10.1815
  },
  "amenities": [
    "wifi",
    "parking",
    "climatisation"
  ]
}
```

**Réponse :**
```json
{
  "_id": "678f1111111111",
  "ownerId": "678f1234567890",
  "title": "Appartement moderne centre-ville",
  "description": "Bel appartement de 80m² avec 3 pièces",
  "address": "123 Rue de la République",
  "city": "Tunis",
  "price": 500,
  "surface": 80,
  "rooms": 3,
  "type": "appartement",
  "available": true,
  "images": ["image1.jpg", "image2.jpg"],
  "location": {
    "latitude": 36.8065,
    "longitude": 10.1815
  },
  "amenities": ["wifi", "parking", "climatisation"],
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### GET /logement - Liste tous les logements
**Section : Logement**

**Test :**
- Cliquez "Try it out" → "Execute"

**Avec filtres (Query Parameters) :**
- `?ownerId=678f1234567890` - Logements d'un propriétaire
- `?city=Tunis` - Logements dans une ville
- `?available=true` - Logements disponibles

**Exemples :**
```
GET /logement?ownerId=678f1234567890
GET /logement?city=Tunis
GET /logement?available=true
```

### GET /logement/:id - Récupérer un logement
**Section : Logement**

**Test :**
- **Paramètre :** `id` = `678f1111111111`
- Cliquez "Execute"

### PATCH /logement/:id - Mettre à jour un logement
**Section : Logement**

**Test :**
- **Paramètre :** `id` = `678f1111111111`
- **Body :**
```json
{
  "price": 550,
  "available": false,
  "description": "Description mise à jour"
}
```

### DELETE /logement/:id - Supprimer un logement
**Section : Logement**

**Test :**
- **Paramètre :** `id` = `678f1111111111`
- Cliquez "Execute"

---

# 🎯 Scénarios de Test Complets

## Scénario 1 : Créer un logement et demander une visite

1. **Créer un logement** :
   ```
   POST /logement
   {
     "ownerId": "678f1234567890",
     "title": "Appartement test",
     "description": "Description test",
     "address": "123 Rue Test",
     "city": "Tunis",
     "price": 500,
     "surface": 80,
     "rooms": 3
   }
   ```
   **Copiez l'ID du logement créé**

2. **Demander une visite** :
   ```
   POST /visite
   {
     "logementId": "ID_DU_LOGEMENT",
     "userId": "678f0987654321",
     "dateVisite": "2024-01-20T14:00:00.000Z"
   }
   ```

3. **Confirmer la visite** :
   ```
   PUT /visite/:id/status
   {
     "status": "confirmed"
   }
   ```

---

## Scénario 2 : Évaluer un utilisateur après une visite

1. **Créer une évaluation** :
   ```
   POST /evaluation
   {
     "userId": "678f1234567890",
     "evaluatorId": "678f0987654321",
     "rating": 5,
     "comment": "Excellent locataire, très respectueux",
     "logementId": "678f1111111111"
   }
   ```

2. **Voir toutes les évaluations d'un utilisateur** :
   ```
   GET /evaluation?userId=678f1234567890
   ```

---

## Scénario 3 : Gérer les notifications

1. **Créer une notification** :
   ```
   POST /notification
   {
     "userId": "678f1234567890",
     "title": "Nouvelle visite",
     "message": "Vous avez une nouvelle demande de visite"
   }
   ```

2. **Voir les notifications non lues** :
   ```
   GET /notification?userId=678f1234567890&unread=true
   ```

3. **Marquer comme lue** :
   ```
   PUT /notification/:id/read
   ```

4. **Marquer toutes comme lues** :
   ```
   PUT /notification/user/:userId/read-all
   ```

---

# ⚠️ Notes Importantes

## Formats de Données

### Dates
- ✅ Format ISO 8601 : `2024-01-20T14:00:00.000Z`
- ✅ Format simple : `1990-01-15` (pour dateDeNaissance)
- ❌ Formats incorrects : `20/01/2024`, `01-20-2024`

### IDs
- Utilisez les IDs MongoDB (ex: `678f1234567890`)
- Les IDs sont retournés dans les réponses POST

### Ratings
- Nombre entre 1 et 5 uniquement

### Statuts Visite
- `pending`, `confirmed`, `completed`, `cancelled`

---

## Codes de Réponse

- **200** : Succès
- **201** : Créé avec succès
- **400** : Données invalides
- **401** : Non autorisé (pas de token ou token invalide)
- **403** : Accès refusé (pas les droits)
- **404** : Non trouvé

---

## 🔍 Dépannage

### Erreur 401
- Vérifiez que vous êtes authentifié
- Vérifiez que le token n'est pas expiré
- Ré-autorisez dans Swagger

### Erreur 400
- Vérifiez le format des données
- Vérifiez que tous les champs requis sont remplis
- Vérifiez les types de données (string, number, date)

### Erreur 404
- Vérifiez que l'ID existe
- Vérifiez que l'ID est correct

---

**Bon test ! 🚀**

