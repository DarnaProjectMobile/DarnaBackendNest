import * as mongoose from 'mongoose';
import { LogementSchema } from '../src/logement/schemas/logement.schema';

// Connexion à MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/DarnaDB';

// Modèle Logement
const LogementModel = mongoose.model('Logement', LogementSchema);

// Données des logements à ajouter
const logements = [
  {
    annonceId: 'appartement-3-pieces-centre-ville',
    ownerId: 'default-owner-id', // Remplacez par un ID d'utilisateur réel si nécessaire
    title: 'Appartement 3 pièces - Centre Ville',
    description: 'Bel appartement de 3 pièces situé en plein centre-ville. Proche de tous les commerces et transports en commun. Appartement lumineux et bien entretenu.',
    address: 'Centre Ville, Tunis',
    price: 450,
    rooms: 3,
    surface: 75,
    available: true,
    images: [],
    location: {
      latitude: 36.8065,
      longitude: 10.1815
    }
  },
  {
    annonceId: 'studio-meuble-lyon-1',
    ownerId: 'default-owner-id',
    title: 'Studio meublé - Lyon',
    description: 'Studio meublé et équipé, idéal pour étudiant. Situé dans un quartier calme et bien desservi. Proche des universités et commerces.',
    address: 'Lyon, France',
    price: 380,
    rooms: 1,
    surface: 25,
    available: true,
    images: [],
    location: {
      latitude: 45.7640,
      longitude: 4.8357
    }
  },
  {
    annonceId: 'chambre-t4-marseille-8e',
    ownerId: 'default-owner-id',
    title: 'Chambre dans T4 - Marseille 8e',
    description: 'Chambre disponible dans un appartement T4 partagé avec 3 autres colocataires. Appartement spacieux avec cuisine équipée, salon et salle de bain partagée. Quartier calme et bien desservi.',
    address: 'Marseille 8e, France',
    price: 320,
    rooms: 1,
    surface: 15,
    available: true,
    images: [],
    location: {
      latitude: 43.2503,
      longitude: 5.3845
    }
  },
  {
    annonceId: 'studio-meuble-lyon-2',
    ownerId: 'default-owner-id',
    title: 'Studio meublé - Lyon',
    description: 'Studio moderne et fonctionnel, parfait pour un étudiant. Meublé et équipé, proche des transports et des commerces. Quartier animé et sécurisé.',
    address: 'Lyon, France',
    price: 400,
    rooms: 1,
    surface: 28,
    available: true,
    images: [],
    location: {
      latitude: 45.7500,
      longitude: 4.8500
    }
  },
  // Ajoutons plus de logements pour avoir "beaucoup" comme demandé
  {
    annonceId: 'appartement-2-pieces-tunis',
    ownerId: 'default-owner-id',
    title: 'Appartement 2 pièces - Tunis',
    description: 'Appartement 2 pièces récent, bien situé. Idéal pour couple ou étudiant. Proche des transports et commerces.',
    address: 'Tunis, Tunisie',
    price: 350,
    rooms: 2,
    surface: 50,
    available: true,
    images: [],
    location: {
      latitude: 36.8000,
      longitude: 10.1800
    }
  },
  {
    annonceId: 'chambre-colocation-paris',
    ownerId: 'default-owner-id',
    title: 'Chambre en colocation - Paris',
    description: 'Chambre dans appartement partagé avec 2 autres personnes. Appartement moderne, cuisine équipée, salon commun. Proche métro.',
    address: 'Paris, France',
    price: 550,
    rooms: 1,
    surface: 18,
    available: true,
    images: [],
    location: {
      latitude: 48.8566,
      longitude: 2.3522
    }
  },
  {
    annonceId: 'studio-tunis-centre',
    ownerId: 'default-owner-id',
    title: 'Studio - Tunis Centre',
    description: 'Studio moderne et fonctionnel en plein centre de Tunis. Idéal pour étudiant ou jeune professionnel. Bien desservi.',
    address: 'Tunis Centre, Tunisie',
    price: 280,
    rooms: 1,
    surface: 22,
    available: true,
    images: [],
    location: {
      latitude: 36.8065,
      longitude: 10.1815
    }
  },
  {
    annonceId: 'appartement-4-pieces-marseille',
    ownerId: 'default-owner-id',
    title: 'Appartement 4 pièces - Marseille',
    description: 'Grand appartement 4 pièces avec balcon. Parfait pour famille ou grande colocation. Quartier résidentiel calme.',
    address: 'Marseille, France',
    price: 650,
    rooms: 4,
    surface: 95,
    available: true,
    images: [],
    location: {
      latitude: 43.2965,
      longitude: 5.3698
    }
  },
  {
    annonceId: 'chambre-t3-lyon',
    ownerId: 'default-owner-id',
    title: 'Chambre dans T3 - Lyon',
    description: 'Chambre disponible dans T3 partagé. Appartement lumineux, cuisine équipée, salon commun. Quartier étudiant.',
    address: 'Lyon, France',
    price: 340,
    rooms: 1,
    surface: 16,
    available: true,
    images: [],
    location: {
      latitude: 45.7640,
      longitude: 4.8357
    }
  },
  {
    annonceId: 'studio-meuble-paris',
    ownerId: 'default-owner-id',
    title: 'Studio meublé - Paris',
    description: 'Studio meublé et équipé dans quartier animé. Proche métro et commerces. Idéal pour étudiant.',
    address: 'Paris, France',
    price: 600,
    rooms: 1,
    surface: 20,
    available: true,
    images: [],
    location: {
      latitude: 48.8566,
      longitude: 2.3522
    }
  }
];

async function addLogements() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier les logements existants
    const existingLogements = await LogementModel.find({
      annonceId: { $in: logements.map(l => l.annonceId) }
    }).exec();

    if (existingLogements.length > 0) {
      console.log(`⚠️  ${existingLogements.length} logement(s) existent déjà avec ces annonceId:`);
      existingLogements.forEach(l => console.log(`   - ${l.annonceId}`));
    }

    // Filtrer les logements qui n'existent pas encore
    const existingAnnonceIds = existingLogements.map(l => l.annonceId);
    const logementsToAdd = logements.filter(l => !existingAnnonceIds.includes(l.annonceId));

    if (logementsToAdd.length === 0) {
      console.log('ℹ️  Tous les logements existent déjà. Aucun ajout nécessaire.');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n📝 Ajout de ${logementsToAdd.length} logement(s)...`);

    // Insérer les logements
    const results = await LogementModel.insertMany(logementsToAdd, { ordered: false });

    console.log(`\n✅ ${results.length} logement(s) ajouté(s) avec succès !`);
    console.log('\n📋 Liste des logements ajoutés:');
    results.forEach((logement, index) => {
      console.log(`   ${index + 1}. ${logement.title} - ${logement.address} (${logement.price}€)`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des logements:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
addLogements();


