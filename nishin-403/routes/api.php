<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SyncController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\ArtifactsController;
use App\Http\Controllers\TeamController;


Route::middleware('auth:sanctum')->group(function () {
//getArtifactsStats
Route::get('/getArtifactStat', [ArtifactsController::class, 'getArtifactsStats']);

//removeArtifact
Route::delete('/removeArtifact', [ArtifactsController::class, 'removeArtifact']);

//addArtifact
Route::post('/addArtifact', [ArtifactsController::class, 'addArtifact']);



//**** SIMULATION
//simulateBasicDamageForDPS
Route::get('/simulateBasicDamageForDPS', [SimulationController::class, 'simulateBasicDamageForDPS']);

//simulateDamageWithArtifact
Route::get('/simulateDamageWithArtifact', [SimulationController::class, 'simulateDamageWithArtifact']);

//simulateDamageWithBuffForDPS
Route::get('/simulateDamageWithBuffForDPS', [SimulationController::class, 'simulateDamageWithBuffForDPS']);

//simulateDamageForDPS
Route::get('/simulateDamageForDPS', [SimulationController::class, 'simulateDamageForDPS']);



//**** EQUIPE
//getSlot1CharacterOfTeam - PRIVATE
Route::get('/getSlot1CharacterOfTeam', [SimulationController::class, 'getSlot1CharacterOfTeam']);

//addCharacterToSlot
Route::post('/addCharacterToSlot', [TeamController::class, 'addCharacterToSlot']);

//getTeam
Route::get('/getTeam', [TeamController::class, 'getTeam']);

//removeCharacterFromSlot
Route::delete('/removeCharacterFromSlot', [TeamController::class, 'removeCharacterFromSlot']);

//getAllCharacter
Route::get('/getAllCharacters', [TeamController::class, 'getAllCharacters']);


Route::post('/sync/push', [SyncController::class, 'pushTeam']);
Route::get('/sync/changes', [SyncController::class, 'getChanges']);
Route::get('/sync/full', [SyncController::class, 'fullSync']);
});


// LOGIN *************************
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
