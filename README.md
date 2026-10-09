# Transport Indicators · E-CUBE Strategy Consultants

Page statique (HTML + D3, sans build) qui suit l'électrification des ventes de voitures neuves en France, sur le modèle de la page *Energy Indicators*.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html`, `assets/` | La page (styles, graphiques D3, logo) |
| `data/*.csv` | Données EAFO : immatriculations et parts de marché BEV / PHEV, voitures particulières (M1), France |
| `data/meta.json` | Dates de dernière vérification et de dernière modification des données |
| `scripts/fetch_eafo.py` | Télécharge et contrôle les CSV EAFO (Python standard, sans dépendance) |
| `.github/workflows/update-data.yml` | Lance le script chaque jour à 06:00 UTC et commite si les données ont changé |

Sources :
- https://alternative-fuels-observatory.ec.europa.eu/sites/default/files/csv/france/new_registrations_m1.csv
- https://alternative-fuels-observatory.ec.europa.eu/sites/default/files/csv/france/market_share_new_registrations_m1.csv

## Mise en ligne (GitHub Pages)

1. Créer un dépôt sur GitHub et y déposer le contenu de ce dossier (y compris le dossier caché `.github`).
2. *Settings → Pages* : Source = *Deploy from a branch*, branche `main`, dossier `/ (root)`.
3. *Settings → Actions → General → Workflow permissions* : cocher *Read and write permissions*.
4. *Actions → Update EAFO data → Run workflow* pour tester la mise à jour.

## Aperçu local

La page charge les CSV par `fetch`, elle ne s'ouvre donc pas en double-cliquant sur le fichier. Lancer :

```
python -m http.server 8000
```

puis ouvrir http://localhost:8000.
