<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\ArtifactsController;

Route::get('/test', function () {
    return response()->json([
        'message' => 'API Laravel fonctionne!',
        'status' => 'success',
        'timestamp' => now()
    ]);
});

Route::get('/testdmgdpsbase', [SimulationController::class, 'simulateBasicDamageForDPS']);

Route::get('/testarte', [SimulationController::class, 'simulateDamageWithArtifact']);

//getArtifactsStats -> charactername
Route::get('/getartefact', [ArtifactsController::class, 'getArtifactsStats']);

//removeArtifact -> avec characterName et slot
Route::delete('/removeartifact', [ArtifactsController::class, 'removeArtifact']);

//addArtifact(Request $request, string $characterName, Artifact $artifact)
Route::post('/addartifact', [ArtifactsController::class, 'addArtifact']);

//calculateATKArtifact
Route::get('/calculateartifact', [ArtifactsController::class, 'calculateATKArtifact']);
