<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\EmbedsOne;

class Team extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'teams';

    protected $fillable = [
        'slots',
        'user_id',
    ];

    protected $attributes = [
        'slots' => [
            'slot1' => null,
            'slot2' => null,
            'slot3' => null,
            'slot4' => null,
        ],
    ];

    // Relation vers l'utilisateur (embeddée, si tu veux)
    public function user(): EmbedsOne
    {
        return $this->embedsOne(User::class);
    }

    /**
     * Vérifie si un slot est libre
     */
    public function isSlotAvailable(string $slot): bool
    {
        return empty($this->slots[$slot]);
    }

    protected static function booted()
    {
        static::creating(function ($team) {
            if (empty($team->slots)) {
                $team->slots = [
                    'slot1' => null,
                    'slot2' => null,
                    'slot3' => null,
                    'slot4' => null
                ];
            }
        });
    }


    /**
     * Assigne un Character à un slot
     */
    public function assignToSlot(string $slot, Character $character): void
    {
        // 1️⃣ On récupère les slots actuels
        $slots = $this->slots ?? [];

        // 2️⃣ On nettoie tout : si c’est un tableau (un objet Character), on garde juste son id
        $cleaned = [];
        foreach ($slots as $key => $value) {
            if (is_array($value)) {
                $cleaned[$key] = $value['_id'] ?? $value['id'] ?? null;
            } else {
                $cleaned[$key] = $value;
            }
        }

        // 3️⃣ On assigne le nouveau perso (juste son id)
        $cleaned[$slot] = (string) $character->_id;

        // 4️⃣ On sauvegarde
        $this->slots = $cleaned;
        $this->save();
    }

    /**
     * Supprime un Character d’un slot
     */
    public function unassignFromSlot(string $slot, Character $character): void
    {
        $slots = $this->slots ?? [];

        // On nettoie au cas où
        foreach ($slots as $key => $value) {
            if (is_array($value)) {
                $slots[$key] = $value['_id'] ?? $value['id'] ?? null;
            }
        }

        if (isset($slots[$slot]) && (string) $slots[$slot] === (string) $character->_id) {
            $slots[$slot] = null;
            $this->slots = $slots;
            $this->save();
        }
    }

    /**
     * Récupère le Character d’un slot
     */
    public function getCharacterForSlot(string $slot): ?Character
    {
        $slots = $this->slots ?? [];
        $charId = $slots[$slot] ?? null;

        if (!$charId) {
            return null;
        }

        return Character::find($charId);
    }

    /**
     * Récupère tous les personnages assignés (facultatif)
     */
    public function getAssignedCharacters(): array
    {
        $assigned = [];
        foreach ($this->slots as $slot => $charId) {
            if ($charId) {
                $assigned[$slot] = Character::find($charId);
            } else {
                $assigned[$slot] = null;
            }
        }
        return $assigned;
    }


    public function getSlotsWithCharacters(): array
    {
        $slots = $this->slots ?? [];

        $charIds = collect($slots)
            ->filter()
            ->map(fn($slot) => is_array($slot) ? ($slot['_id'] ?? null) : $slot)
            ->filter()
            ->values();

        $characters = Character::whereIn('_id', $charIds)->get()->keyBy('_id');

        $formatted = [];
        foreach ($slots as $slotName => $slotValue) {
            $charId = is_array($slotValue) ? ($slotValue['_id'] ?? null) : $slotValue;
            $formatted[$slotName] = $charId && isset($characters[$charId])
                ? $characters[$charId]->toArray()
                : null;
        }

        return $formatted;
    }



    public function populateSlots(): array
    {
        $populated = [];

        foreach ($this->slots as $slot => $charId) {
            if ($charId) {
                $character = Character::find($charId);
                $populated[$slot] = $character ? $character->toArray() : null;
            } else {
                $populated[$slot] = null;
            }
        }

        return $populated;
    }
}
