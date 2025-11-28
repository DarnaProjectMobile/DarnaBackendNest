# 📱 Configuration Swift pour se connecter au Backend NestJS

## 🌐 URL du Backend

Votre backend tourne sur la machine avec l'IP : **192.168.137.217** sur le port **3002**

### ✅ URL Base à utiliser dans Swift :
```
http://192.168.137.217:3002
```

---

## 🔧 Configuration Swift - Exemple complet

### 1️⃣ Créer un fichier `APIConfig.swift`

```swift
import Foundation

struct APIConfig {
    // ⚠️ CHANGEZ CETTE IP PAR L'IP DU PC QUI FAIT TOURNER LE BACKEND
    static let baseURL = "http://192.168.137.217:3002"
    
    static let endpoints = [
        "login": "\(baseURL)/auth/login",
        "register": "\(baseURL)/auth/register",
        "users": "\(baseURL)/users",
        "annonces": "\(baseURL)/annonces",
        "reviews": "\(baseURL)/reviews",
        "visite": "\(baseURL)/visite"
    ]
}
```

### 2️⃣ Exemple de Service API pour l'authentification

```swift
import Foundation

class AuthService {
    
    // MARK: - Login
    func login(email: String, password: String) async throws -> LoginResponse {
        let url = URL(string: "\(APIConfig.baseURL)/auth/login")!
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
    
    // MARK: - Register
    func register(userData: RegisterData, image: Data?) async throws -> User {
        let url = URL(string: "\(APIConfig.baseURL)/auth/register")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Configuration pour multipart/form-data
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Ajouter les champs texte
        let fields: [String: Any] = [
            "username": userData.username,
            "email": userData.email,
            "password": userData.password,
            "role": userData.role,
            "dateDeNaissance": userData.dateDeNaissance,
            "numTel": userData.numTel,
            "gender": userData.gender
        ]
        
        for (key, value) in fields {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }
        
        // Ajouter l'image si présente
        if let imageData = image {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"image\"; filename=\"photo.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 201 else {
            throw NSError(domain: "AuthError", code: 400, userInfo: [NSLocalizedDescriptionKey: "Registration failed"])
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(User.self, from: data)
    }
}

// MARK: - Models
struct LoginResponse: Codable {
    let access_token: String
    let user: User
}

struct User: Codable {
    let _id: String
    let username: String
    let email: String
    let role: String?
}

struct RegisterData {
    let username: String
    let email: String
    let password: String
    let role: String
    let dateDeNaissance: String
    let numTel: String
    let gender: String
}
```

### 3️⃣ Utilisation dans votre View/ViewModel

```swift
import SwiftUI

@MainActor
class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var accessToken: String?
    @Published var errorMessage: String?
    
    private let authService = AuthService()
    
    func login() {
        Task {
            do {
                let response = try await authService.login(email: email, password: password)
                accessToken = response.access_token
                // Sauvegarder le token (UserDefaults, Keychain, etc.)
                UserDefaults.standard.set(response.access_token, forKey: "access_token")
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
```

### 4️⃣ Requêtes avec authentification (avec token JWT)

```swift
class UserService {
    private var accessToken: String? {
        UserDefaults.standard.string(forKey: "access_token")
    }
    
    func getUsers() async throws -> [User] {
        let url = URL(string: "\(APIConfig.baseURL)/users")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // ⚠️ IMPORTANT : Ajouter le token JWT dans l'header Authorization
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "APIError", code: httpResponse?.statusCode ?? 500)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode([User].self, from: data)
    }
}
```

---

## 🔒 Configuration Info.plist pour HTTP (si nécessaire)

Si vous utilisez HTTP (non HTTPS), ajoutez dans votre `Info.plist` :

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.137.217</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

**OU** dans Xcode :
1. Sélectionnez votre projet dans le navigateur
2. Sélectionnez votre target
3. Onglet **Info**
4. Ajoutez **App Transport Security Settings**
5. Ajoutez **Allow Arbitrary Loads** = **YES** (pour développement seulement)

---

## ✅ Points importants

1. **IP du Backend** : Changez `192.168.137.217` si l'IP du PC backend change
2. **Port** : Le backend écoute sur le port `3002`
3. **Token JWT** : Pour les endpoints protégés, ajoutez `Authorization: Bearer <token>` dans les headers
4. **CORS** : Le backend est déjà configuré pour accepter les requêtes depuis n'importe quelle origine
5. **Même réseau** : Assurez-vous que les deux machines (Swift et Backend) sont sur le même réseau Wi-Fi/Ethernet

---

## 🧪 Test rapide depuis Swift

```swift
// Test simple pour vérifier la connexion
func testConnection() {
    guard let url = URL(string: "http://192.168.137.217:3002") else { return }
    
    URLSession.shared.dataTask(with: url) { data, response, error in
        if let error = error {
            print("❌ Erreur: \(error)")
        } else if let httpResponse = response as? HTTPURLResponse {
            print("✅ Statut: \(httpResponse.statusCode)")
        }
    }.resume()
}
```

---

## 📋 Endpoints disponibles

- **Auth** : `POST /auth/login`, `POST /auth/register`
- **Users** : `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- **Annonces** : `/annonces/*`
- **Reviews** : `/reviews/*`
- **Visite** : `/visite/*`
- **Swagger Docs** : `http://192.168.137.217:3002/api`

---

**💡 Astuce** : Pour connaître l'IP actuelle du PC backend, exécutez dans le terminal du PC backend :
```powershell
ipconfig | findstr /i "IPv4"
```




