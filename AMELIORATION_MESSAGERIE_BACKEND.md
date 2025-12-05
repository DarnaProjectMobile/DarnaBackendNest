# Amélioration de la messagerie - Modifications Backend

## Date : 2025-12-05

## Résumé des modifications

Ajout de trois fonctionnalités majeures à la messagerie :
1. **Suppression de messages** (soft delete)
2. **Modification de messages**
3. **Accusés de lecture** (sent, delivered, read)

---

## Fichiers modifiés

### 1. Schéma MongoDB
**Fichier** : `src/chat/schemas/message.schema.ts`

**Nouveaux champs** :
```typescript
@Prop({ default: false })
isDeleted: boolean;

@Prop({ default: false })
isEdited: boolean;

@Prop({ type: Date, default: null })
editedAt?: Date;

@Prop({ default: 'sent' })
status: string; // 'sent', 'delivered', 'read'

@Prop({ type: Date, default: null })
deliveredAt?: Date;
```

### 2. DTOs
**Nouveaux fichiers créés** :
- `src/chat/dto/update-message.dto.ts`
- `src/chat/dto/update-status.dto.ts`

### 3. Service
**Fichier** : `src/chat/chat.service.ts`

**Nouvelles méthodes** :
- `deleteMessage(messageId, userId)` - Suppression soft delete
- `updateMessage(messageId, newContent, userId)` - Modification
- `updateMessageStatus(messageId, status, userId)` - Mise à jour statut

### 4. Controller
**Fichier** : `src/chat/chat.controller.ts`

**Nouveaux endpoints** :
- `DELETE /chat/message/:messageId`
- `PATCH /chat/message/:messageId`
- `PATCH /chat/message/:messageId/status`

### 5. Gateway WebSocket
**Fichier** : `src/chat/chat.gateway.ts`

**Nouveaux gestionnaires** :
- `delete_message` → émet `message_deleted`
- `update_message` → émet `message_updated`
- `update_message_status` → émet `message_status_changed`

---

## Installation et démarrage

### Installation des dépendances
```bash
npm install
```

### Démarrage en mode développement
```bash
npm run start:dev
```

### Build pour production
```bash
npm run build
npm run start:prod
```

---

## Tests avec Swagger

### Accès à Swagger UI
```
http://localhost:3009/api
```

### 1. Authentification
1. Cliquer sur "Authorize" en haut à droite
2. Entrer le token JWT : `Bearer {votre_token}`
3. Cliquer sur "Authorize"

### 2. Test DELETE /chat/message/{messageId}
```json
// Paramètres
messageId: "675123456789abcdef012345"

// Réponse attendue (200)
{
  "_id": "675123456789abcdef012345",
  "isDeleted": true,
  "content": "Message supprimé",
  "images": [],
  "status": "sent",
  ...
}
```

### 3. Test PATCH /chat/message/{messageId}
```json
// Paramètres
messageId: "675123456789abcdef012345"

// Body
{
  "content": "Nouveau contenu du message"
}

// Réponse attendue (200)
{
  "_id": "675123456789abcdef012345",
  "content": "Nouveau contenu du message",
  "isEdited": true,
  "editedAt": "2025-12-05T20:00:00.000Z",
  ...
}
```

### 4. Test PATCH /chat/message/{messageId}/status
```json
// Paramètres
messageId: "675123456789abcdef012345"

// Body
{
  "status": "read"
}

// Réponse attendue (200)
{
  "_id": "675123456789abcdef012345",
  "status": "read",
  "read": true,
  "readAt": "2025-12-05T20:00:00.000Z",
  "deliveredAt": "2025-12-05T20:00:00.000Z",
  ...
}
```

---

## Vérification MongoDB

### Connexion à MongoDB
```bash
mongosh
```

### Sélectionner la base de données
```javascript
use darna
```

### Voir les messages
```javascript
// Voir tous les messages
db.messages.find().pretty()

// Voir un message spécifique
db.messages.findOne({ _id: ObjectId("675123456789abcdef012345") })

// Voir les messages supprimés
db.messages.find({ isDeleted: true }).pretty()

// Voir les messages modifiés
db.messages.find({ isEdited: true }).pretty()

// Voir les messages par statut
db.messages.find({ status: "read" }).pretty()
```

### Exemple de document
```javascript
{
  _id: ObjectId("675123456789abcdef012345"),
  visiteId: "674987654321fedcba098765",
  senderId: "user123",
  receiverId: "user456",
  content: "Bonjour, je suis intéressé",
  images: [],
  type: "text",
  read: false,
  readAt: null,
  // Nouveaux champs
  isDeleted: false,
  isEdited: false,
  editedAt: null,
  status: "sent",
  deliveredAt: null,
  createdAt: ISODate("2025-12-05T19:00:00.000Z"),
  updatedAt: ISODate("2025-12-05T19:00:00.000Z")
}
```

---

## Logs du backend

### Suppression de message
```
[ChatService] ✅ Message 675123456789abcdef012345 supprimé par user123
[ChatGateway] Message 675123456789abcdef012345 deleted by user user123
```

### Modification de message
```
[ChatService] ✅ Message 675123456789abcdef012345 modifié par user123
[ChatGateway] Message 675123456789abcdef012345 updated by user user123
```

### Mise à jour de statut
```
[ChatService] ✅ Statut du message 675123456789abcdef012345 mis à jour à "read" par user456
[ChatGateway] Message 675123456789abcdef012345 status updated to "read" by user user456
```

---

## Sécurité et validations

### Suppression
- ✅ Vérification que l'utilisateur est l'expéditeur
- ✅ Soft delete (données conservées)
- ✅ Contenu remplacé par "Message supprimé"
- ✅ Images supprimées

### Modification
- ✅ Vérification que l'utilisateur est l'expéditeur
- ✅ Vérification que le message n'est pas supprimé
- ✅ Vérification que le message ne contient pas d'images
- ✅ Validation du contenu non vide

### Statuts
- ✅ Vérification que l'utilisateur est le destinataire
- ✅ Validation du statut (sent/delivered/read)
- ✅ Mise à jour automatique des dates

---

## WebSocket - Événements

### Événements reçus (du client)
1. `delete_message` : `{ messageId: string }`
2. `update_message` : `{ messageId: string, content: string }`
3. `update_message_status` : `{ messageId: string, status: string }`

### Événements émis (vers les clients)
1. `message_deleted` : `{ messageId: string, visiteId: string }`
2. `message_updated` : `MessageResponse` (message complet)
3. `message_status_changed` : `{ messageId, status, deliveredAt, readAt }`

---

## Migration de données

### Aucune migration nécessaire !

Les nouveaux champs ont des valeurs par défaut :
- `isDeleted: false`
- `isEdited: false`
- `status: "sent"`
- `editedAt: null`
- `deliveredAt: null`

Les anciens messages fonctionneront automatiquement avec ces valeurs par défaut.

---

## Dépannage

### Erreur : "Message non trouvé"
**Cause** : L'ID du message est invalide ou le message n'existe pas
**Solution** : Vérifier l'ID dans MongoDB

### Erreur : "Vous ne pouvez supprimer que vos propres messages"
**Cause** : L'utilisateur essaie de supprimer un message qu'il n'a pas envoyé
**Solution** : Vérifier que `senderId` correspond à `userId`

### Erreur : "Impossible de modifier un message contenant des images"
**Cause** : Le message contient des images
**Solution** : Seuls les messages texte peuvent être modifiés

### Erreur : "Vous ne pouvez mettre à jour le statut que des messages que vous avez reçus"
**Cause** : L'utilisateur essaie de mettre à jour le statut d'un message qu'il a envoyé
**Solution** : Seul le destinataire peut mettre à jour le statut

### WebSocket ne fonctionne pas
**Cause** : Token JWT invalide ou manquant
**Solution** : Vérifier que le token est passé dans `auth.token` lors de la connexion

---

## Checklist de déploiement

- [ ] Installer les dépendances : `npm install`
- [ ] Compiler le projet : `npm run build`
- [ ] Vérifier MongoDB est accessible
- [ ] Vérifier les variables d'environnement (.env)
- [ ] Tester les endpoints avec Swagger
- [ ] Vérifier les logs du serveur
- [ ] Tester la connexion WebSocket
- [ ] Démarrer en production : `npm run start:prod`

---

## Variables d'environnement

Assurez-vous que votre fichier `.env` contient :
```env
JWT_SECRET=yourSecretKey
MONGODB_URI=mongodb://localhost:27017/darna
PORT=3009
```

---

## Performance

### Optimisations implémentées
- ✅ Soft delete (pas de suppression physique)
- ✅ Index MongoDB sur `visiteId` et `senderId`
- ✅ Requêtes optimisées avec `.exec()`
- ✅ Validation côté serveur

### Recommandations futures
- Ajouter une pagination pour les messages
- Implémenter un cache Redis pour les messages récents
- Ajouter des index composites pour les requêtes fréquentes

---

## Conclusion

Le backend est maintenant prêt avec :
- ✅ 3 nouveaux endpoints REST
- ✅ 3 nouveaux gestionnaires WebSocket
- ✅ Validation et sécurité complètes
- ✅ Logs détaillés pour le débogage
- ✅ Documentation Swagger à jour

Toutes les modifications sont rétrocompatibles et ne nécessitent aucune migration de données ! 🎉
