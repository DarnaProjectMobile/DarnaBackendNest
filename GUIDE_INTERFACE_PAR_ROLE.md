# 🎯 Guide : Afficher l'Interface selon le Rôle (Client/Colocataire)

## ✅ Le Backend est Déjà Configuré !

Le backend retourne **automatiquement le rôle** dans la réponse de login. Vous pouvez utiliser ce rôle pour afficher la bonne interface.

---

## 📱 Réponse du Backend lors du Login

### Endpoint : `POST /auth/login`

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "role": "client",        // ← LE RÔLE EST ICI !
    "dateDeNaissance": "1990-01-15",
    "numTel": "12345678",
    "gender": "Male",
    "image": "photo.jpg"
  }
}
```

### Rôles possibles :
- `"client"` → Interface Client
- `"collocator"` → Interface Colocataire
- `"sponsor"` → Interface Sponsor
- `"admin"` → Interface Admin

---

## 🔧 Implémentation Swift

### 1️⃣ Modèle de Données

```swift
import Foundation

// Modèle User avec le rôle
struct User: Codable {
    let _id: String
    let username: String
    let email: String
    let role: String  // "client", "collocator", "sponsor", "admin"
    let dateDeNaissance: String?
    let numTel: String?
    let gender: String?
    let image: String?
}

// Réponse de login
struct LoginResponse: Codable {
    let access_token: String
    let user: User
}

// Enum pour les rôles (optionnel mais recommandé)
enum UserRole: String {
    case client = "client"
    case collocator = "collocator"
    case sponsor = "sponsor"
    case admin = "admin"
    
    var displayName: String {
        switch self {
        case .client: return "Client"
        case .collocator: return "Colocataire"
        case .sponsor: return "Sponsor"
        case .admin: return "Administrateur"
        }
    }
}
```

### 2️⃣ Service d'Authentification

```swift
import Foundation

class AuthService {
    static let shared = AuthService()
    private let baseURL = "http://192.168.137.217:3002"
    
    // Login
    func login(email: String, password: String) async throws -> LoginResponse {
        let url = URL(string: "\(baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "email": email,
            "password": password
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "AuthError", code: 401, userInfo: [NSLocalizedDescriptionKey: "Login failed"])
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(LoginResponse.self, from: data)
    }
}
```

### 3️⃣ ViewModel avec Gestion du Rôle

```swift
import SwiftUI
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var userRole: UserRole?
    @Published var errorMessage: String?
    @Published var isLoading = false
    
    private let authService = AuthService.shared
    
    // Fonction de login
    func login() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await authService.login(email: email, password: password)
                
                // Sauvegarder le token
                UserDefaults.standard.set(response.access_token, forKey: "access_token")
                
                // Sauvegarder l'utilisateur
                if let userData = try? JSONEncoder().encode(response.user) {
                    UserDefaults.standard.set(userData, forKey: "current_user")
                }
                
                // Mettre à jour l'état
                self.currentUser = response.user
                self.userRole = UserRole(rawValue: response.user.role.lowercased())
                self.isAuthenticated = true
                self.isLoading = false
                
            } catch {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    // Vérifier si l'utilisateur est connecté au démarrage
    func checkAuthStatus() {
        if let token = UserDefaults.standard.string(forKey: "access_token"),
           let userData = UserDefaults.standard.data(forKey: "current_user"),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            self.currentUser = user
            self.userRole = UserRole(rawValue: user.role.lowercased())
            self.isAuthenticated = true
        }
    }
    
    // Déconnexion
    func logout() {
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "current_user")
        self.currentUser = nil
        self.userRole = nil
        self.isAuthenticated = false
    }
}
```

### 4️⃣ Vue Principale avec Navigation selon le Rôle

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                // Afficher l'interface selon le rôle
                if let role = authViewModel.userRole {
                    switch role {
                    case .client:
                        ClientHomeView()
                    case .collocator:
                        ColocataireHomeView()
                    case .sponsor:
                        SponsorHomeView()
                    case .admin:
                        AdminHomeView()
                    }
                } else {
                    Text("Rôle non reconnu")
                }
            } else {
                LoginView()
                    .environmentObject(authViewModel)
            }
        }
        .onAppear {
            authViewModel.checkAuthStatus()
        }
    }
}
```

### 5️⃣ Vue de Login

```swift
import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Connexion")
                .font(.largeTitle)
                .bold()
            
            TextField("Email", text: $authViewModel.email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
            
            SecureField("Mot de passe", text: $authViewModel.password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            if let error = authViewModel.errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Button(action: {
                authViewModel.login()
            }) {
                if authViewModel.isLoading {
                    ProgressView()
                } else {
                    Text("Se connecter")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(authViewModel.isLoading)
        }
        .padding()
    }
}
```

### 6️⃣ Interfaces Spécifiques par Rôle

#### Interface Client
```swift
struct ClientHomeView: View {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Bienvenue Client !")
                    .font(.title)
                
                // Vos visites
                NavigationLink("Mes Visites", destination: MyVisitesView())
                
                // Créer une visite
                NavigationLink("Réserver une Visite", destination: CreateVisiteView())
                
                // Déconnexion
                Button("Déconnexion") {
                    authViewModel.logout()
                }
            }
            .navigationTitle("Espace Client")
        }
    }
}
```

#### Interface Colocataire
```swift
struct ColocataireHomeView: View {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Bienvenue Colocataire !")
                    .font(.title)
                
                // Visites de mes logements
                NavigationLink("Visites de mes Logements", destination: MyLogementsVisitesView())
                
                // Gérer mes logements
                NavigationLink("Mes Logements", destination: MyLogementsView())
                
                // Déconnexion
                Button("Déconnexion") {
                    authViewModel.logout()
                }
            }
            .navigationTitle("Espace Colocataire")
        }
    }
}
```

---

## 🎯 Résumé du Flux

1. **Login** → Backend retourne `{ access_token, user: { role: "client" ou "collocator" } }`
2. **Sauvegarder** → Token + User dans UserDefaults
3. **Vérifier le rôle** → `user.role` = "client" ou "collocator"
4. **Afficher l'interface** → `ClientHomeView()` ou `ColocataireHomeView()`

---

## ✅ Exemple d'Utilisation Complète

```swift
// Dans votre App.swift
@main
struct MyApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
        }
    }
}
```

---

## 🔐 Sécurité

- Le rôle est aussi dans le **JWT token** (pour vérification côté serveur)
- Le rôle dans la réponse est utilisé uniquement pour l'**affichage côté client**
- Les endpoints backend vérifient toujours le rôle via le token JWT

---

**✅ Le backend est déjà prêt ! Il vous suffit d'utiliser `user.role` dans votre code Swift pour afficher la bonne interface.**

