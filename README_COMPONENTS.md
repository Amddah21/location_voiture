# Structure de Composants - Rentcars

## 📁 Structure du Projet

```
rental_car/
├── components/
│   ├── header/
│   │   ├── header.html
│   │   └── header.css
│   ├── footer/
│   │   ├── footer.html
│   │   └── footer.css
│   └── load-components.js
├── index.html
├── about.html
├── contact.html
├── styles.css
└── script.js
```

## 🚀 Utilisation

### 1. Structure des Composants

Les composants sont organisés dans le dossier `components/` :
- **Header** : `components/header/header.html` et `header.css`
- **Footer** : `components/footer/footer.html` et `footer.css`
- **Loader** : `components/load-components.js`

### 2. Inclusion dans les Pages

Chaque page HTML doit inclure :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <!-- Vos styles et meta tags -->
</head>
<body>
  <!-- Placeholder pour le header -->
  <div id="header-placeholder"></div>

  <!-- Votre contenu principal -->
  <main>
    <!-- ... -->
  </main>

  <!-- Placeholder pour le footer -->
  <div id="footer-placeholder"></div>

  <!-- Script de chargement des composants -->
  <script src="components/load-components.js"></script>
</body>
</html>
```

### 3. Fonctionnalités

#### Header
- Logo cliquable à gauche
- Navigation responsive à droite
- Menu mobile avec animation
- Sticky header (reste en haut lors du scroll)

#### Footer
- 4 colonnes : Logo/Description, Liens rapides, Contact, Réseaux sociaux
- Contacts chargés dynamiquement depuis l'API
- Réseaux sociaux chargés depuis la base de données
- Responsive design

### 4. Chargement Dynamique

Le script `load-components.js` :
- Charge automatiquement le header et footer
- Injecte les CSS associés
- Initialise le menu mobile
- Charge les contacts depuis l'API backend
- Met à jour l'année dans le footer

### 5. Personnalisation

#### Modifier le Header
Éditez `components/header/header.html` et `header.css`

#### Modifier le Footer
Éditez `components/footer/footer.html` et `footer.css`

#### Ajouter des Contacts
Utilisez le dashboard admin (section Contacts) pour ajouter :
- Téléphones
- Emails
- Réseaux sociaux (Facebook, Instagram, etc.)
- Adresses

Les contacts apparaîtront automatiquement dans le footer !

## 📝 Notes

- Les composants sont chargés via `fetch()` API
- Compatible avec tous les navigateurs modernes
- Pas de dépendances externes (sauf FontAwesome pour les icônes)
- Fonctionne avec ou sans serveur web (pour le développement local)

## 🔧 Dépannage

Si les composants ne se chargent pas :
1. Vérifiez que les fichiers existent dans `components/`
2. Ouvrez la console du navigateur pour voir les erreurs
3. Assurez-vous que vous servez les fichiers via un serveur web (pas juste `file://`)
4. Vérifiez les chemins relatifs dans les fichiers HTML

