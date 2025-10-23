<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use App\Models\Character;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SyncController extends Controller
{

    public function pushTeam(Request $request)
    {
        $data = $request->input('team');

        if (!$data || !isset($data['id'], $data['updated_at'], $data['slots'])) {
            return response()->json(['error' => 'Team invalide'], 400);
        }

        $user = $request->user();
        $team = Team::where('user_id', $user->id)->first();

        // 🔹 Validation des personnages
        $slots = $data['slots'];
        foreach ($slots as $slotName => $characterId) {
            if ($characterId && !Character::where('id', $characterId)->exists()) {
                $slots[$slotName] = null;
            }
        }

        $incomingUpdatedAt = Carbon::parse($data['updated_at']);

        // 🆕 Création si absente
        if (!$team) {
            $team = Team::create([
                'id' => $data['id'],
                'user_id' => $user->id,
                'slots' => $slots, // plus besoin de json_encode !
                'updated_at' => $incomingUpdatedAt,
            ]);

            return response()->json([
                'message' => 'Team créée sur le serveur',
                'team' => $team,
            ]);
        }

        // 🔄 Mise à jour si plus récent
        if ($incomingUpdatedAt->gt($team->updated_at)) {
            $team->update([
                'slots' => $slots, // directement l'objet
                'updated_at' => $incomingUpdatedAt,
            ]);

            return response()->json([
                'message' => 'Team mise à jour depuis le front',
                'team' => $team,
            ]);
        }

        return response()->json([
            'message' => 'Version serveur conservée',
            'team' => $team,
        ]);
    }


    public function getChanges(Request $request)
    {
        $since = (int) $request->query('since', 0);
        $date = Carbon::createFromTimestamp($since);

        $user = $request->user();

        // Personnages modifiés/supprimés globalement
        $characters = Character::withTrashed()
            ->where(function ($q) use ($date) {
                $q->where('updated_at', '>', $date)
                ->orWhere('deleted_at', '>', $date);
            })
            ->get();

        // Teams modifiées (slots changés)
        $team = Team::where('user_id', $user->id)
            ->where('updated_at', '>=', $date)
            ->get();

        return response()->json([
            'characters' => $characters,
            'team' => $team,
            'serverTimestamp' => time(),
        ]);
    }


    public function fullSync(Request $request)
    {
        $user = $request->user();

        $characters = Character::all();
        $team = Team::where('user_id', $user->id)->get();

        return response()->json([
            'characters' => $characters,
            'team' => $team[0],
            'serverTimestamp' => time()
        ]);
    }



}
