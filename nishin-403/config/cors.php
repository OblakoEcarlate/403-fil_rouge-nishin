<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Définis ici les chemins, méthodes, origines et en-têtes autorisés par CORS.
    | En prod, limite les origines à tes domaines exacts.
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        // 'broadcasting/auth',
    ],

    // Autoriser toutes les méthodes ou liste précise: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    'allowed_methods' => ['*'],

    // Origines explicites (utilise ceci si supports_credentials = true)
    'allowed_origins' => [
        // Expo / dev local (ajuste selon tes ports/outils)
        'http://localhost:19006',
        'http://127.0.0.1:19006',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    // Motifs (regex) d’origines autorisées. Pratique pour le LAN (téléphone réel)
    'allowed_origins_patterns' => [
        // http://192.168.x.x[:port]
        '#^http://192\.168\.\d+\.\d+(?::\d+)?$#',
        // http://10.x.x.x[:port]
        '#^http://10\.\d+\.\d+\.\d+(?::\d+)?$#',
        // http://172.16-31.x.x[:port]
        '#^http://172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(?::\d+)?$#',
    ],

    // Autoriser tous les headers ou liste précise: ['Content-Type', 'Authorization', ...]
    'allowed_headers' => ['*'],

    // Headers exposés au client (si tu en as besoin: ['Authorization', 'X-Total-Count', ...])
    'exposed_headers' => [],

    // Durée de mise en cache des pré-requêtes (en secondes)
    'max_age' => 0,

    // Si tu dois envoyer/recevoir des cookies/Authorization cross-site, passe à true
    // et NE mets pas '*' dans allowed_origins (mets des domaines exacts).
    'supports_credentials' => false,
];
