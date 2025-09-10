<h1 align="center"><a href="https://github.com/OblakoEcarlate/403-fil_rouge-nishin" target="_blank">Fil-rouge 403 - Nishin</a></h1>


## A propos de Nishin

Nishin est une application basée sur le jeu "Genshin Impact" permettant 
de calculer les dégâts d'un personnage DPS au sein d'une équipe de 3 autres
Support. Chaque personnage peut avoir des artéfacts qui donnent des statistiques
supplémentaires et peut donner un bonus (si c'est un support).



## Architecture

- **Backend** : [Laravel](https://laravel.com/).
- **Base de données** : [MongoDB](https://www.mongodb.com/).
- **Conteneurisation** : [Docker](https://www.docker.com/).
- **Partie mobile** : [React Native](https://reactnative.dev/).


## Prérequis et Installation

- **Docker** : [Suivre ce lien si besoin](https://docs.docker.com/desktop/setup/install/linux/).
- **GIT**


### Clonage et configuration du projet
```
git clone git@github.com:OblakoEcarlate/403-fil_rouge-nishin.git

cd /nishin-403

cp .env.example .env

docker compose run --rm app php artisan key:generate
```



## Configuration Docker

2 volumes :
- mongo-data : données de la base de données
- composer-cache : pour les dépendances de Composer

Services :
1. app (Laravel)
    - Image : Build à partir du Dockerfile
    - Ports : 8000, à configurer dans le Dockerfile
    - Volumes : Code source et cache Composer
    - Dépendances : Doit démarrer après le service MongoDB
    - Healthcheck : Vérification de la "santé", c'est-à-dire si PHP fonctionne correctement
2. mongo (MongoDB)
    - Image : mongo version 6
    - Ports : 27017
    - Volumes : mongo-data pour la persistance
    - Authentification : Active la connexion avec les variables d'environnement
    - Healthcheck : Vérification de la "santé", c'est-à-dire si MongoDB répond aux requêtes



## Variables d'environnement

Créez un fichier .env à la racine : 

### Configuration BDD
- DB_CONNECTION=mongodb
- DB_HOST=mongo
- DB_PORT=27017
- DB_DATABASE=your_database_name
- DB_USERNAME=your_mongo_username
- DB_PASSWORD=your_mongo_password

### Configuration APP
- APP_ENV=local
- APP_DEBUG=true
- APP_KEY=your_generated_app_key



## Commandes de base

Démarrer les conteneurs
```
docker compose up
```

Arrêter les conteneurs
```
docker compose down
```


Voir les logs de l'application
```
docker compose logs app
```


Voir les logs de MongoDB
```
docker compose logs mongo
```


Exécuter une commande artisan dans le conteneur
```
docker compose exec app php artisan [command]
```
