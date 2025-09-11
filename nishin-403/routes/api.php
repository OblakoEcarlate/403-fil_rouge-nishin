<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'API Laravel fonctionne!',
        'status' => 'success',
        'timestamp' => now()
    ]);
});
