<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\ArtifactsController;
use App\Http\Controllers\TeamController;

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
Route::get('/calculateartifact', [SimulationController::class, 'calculateATKArtifact']);

//simulateDamageWithArtifact
Route::get('/simulateDamageWithArtifact', [SimulationController::class, 'simulateDamageWithArtifact']);



//addCharacterToSlot
Route::post('/addCharacterToSlot', [TeamController::class, 'addCharacterToSlot']);

//getTeam
Route::get('/getTeam', [TeamController::class, 'getTeam']);

//removeCharacterFromSlot
Route::delete('/removeCharacterFromSlot', [TeamController::class, 'removeCharacterFromSlot']);
