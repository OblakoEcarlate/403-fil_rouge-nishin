<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use App\Models\Character;
use Illuminate\Support\Facades\Validator;

class SyncController extends Controller
{
    public function pushChanges(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'slots' => 'required|array',
            'slots.slot1' => 'nullable|array',
            'slots.slot2' => 'nullable|array',
            'slots.slot3' => 'nullable|array',
            'slots.slot4' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $team = Team::firstOrCreate(
            ['user_id' => $user->id],
            ['slots' => [
                'slot1' => null,
                'slot2' => null,
                'slot3' => null,
                'slot4' => null
            ]]
        );

        $team->slots = $request->input('slots');
        $team->save();

        foreach ($request->input('slots') as $slotName => $characterData) {
            if ($characterData && isset($characterData['_id'])) {
                $character = Character::find($characterData['_id']);
                if ($character) {
                    $slotNumber = (int) str_replace('slot', '', $slotName);
                    $character->slot = $slotNumber;
                    $character->save();
                }
            }
        }

        $currentCharacterIds = collect($team->slots)
            ->filter()
            ->pluck('_id')
            ->toArray();

        Character::where('user_id', $user->id)
            ->where('slot', '>', 0)
            ->whereNotIn('_id', $currentCharacterIds)
            ->update(['slot' => 0]);

        return response()->json([
            'success' => true,
            'team' => $team->fresh()
        ]);
    }

    public function getChanges(Request $request)
    {
        $user = $request->user();
        $since = $request->query('since', '2000-01-01');

        $team = Team::where('user_id', $user->id)
            ->where('updated_at', '>', $since)
            ->first();

        if (!$team) {
            $team = Team::firstOrCreate(
                ['user_id' => $user->id],
                ['slots' => [
                    'slot1' => null,
                    'slot2' => null,
                    'slot3' => null,
                    'slot4' => null
                ]]
            );
        }

        $characters = Character::where('user_id', $user->id)
            ->where('updated_at', '>', $since)
            ->get();

        return response()->json([
            'now' => now()->toISOString(),
            'team' => [
                'id' => $team->_id,
                'user_id' => $team->user_id,
                'slots' => $team->slots,
                'updated_at' => $team->updated_at
            ],
            'characters' => $characters
        ]);
    }

    public function fullSync(Request $request)
    {
        $user = $request->user();

        $team = Team::firstOrCreate(
            ['user_id' => $user->id],
            ['slots' => [
                'slot1' => null,
                'slot2' => null,
                'slot3' => null,
                'slot4' => null
            ]]
        );

        $characters = Character::all();

        return response()->json([
            'team' => [
                'id' => $team->_id,
                'user_id' => $team->user_id,
                'slots' => $team->slots,
                'updated_at' => $team->updated_at
            ],
            'characters' => $characters
        ]);
    }

}
