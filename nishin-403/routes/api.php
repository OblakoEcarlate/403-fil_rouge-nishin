<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\ArtifactsController;
use App\Http\Controllers\TeamController;


//getArtifactsStats
Route::get('/getArtefactStat', [ArtifactsController::class, 'getArtifactsStats']);

//removeArtifact
Route::delete('/removeArtifact', [ArtifactsController::class, 'removeArtifact']);

//addArtifact
Route::post('/addArtifact', [ArtifactsController::class, 'addArtifact']);



//**** SIMULATION
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
