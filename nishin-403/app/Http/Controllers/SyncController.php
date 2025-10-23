<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use App\Models\Character;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SyncController extends Controller
{
    public function pushChanges(Request $request)
    {
        $records = $request->input('records', []);
        $syncedIds = [];

        foreach ($records as $data) {
            $character = Character::find($data['id']);
            if (!$character) {
                // Nouveau document
                Character::create($data);
                $syncedIds[] = $data['id'];
            } else {
                // Compare les timestamps pour éviter d’écraser du récent
                if ($data['updated_at'] > $character->updated_at) {
                    $character->update($data);
                    $syncedIds[] = $character->_id;
                }
            }
        }

        return response()->json(['syncedIds' => $syncedIds]);
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
