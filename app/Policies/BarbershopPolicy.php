<?php

namespace App\Policies;

use App\Models\Barbershop;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BarbershopPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Barbershop $barbershop): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Barbershop $barbershop): bool
    {
        return \App\Models\BarbershopMember::where('barbershop_id', $barbershop->id)
            ->where('user_id', $user->id)
            ->where('role', 'owner')
            ->where('status', 'active')
            ->exists();
    }
}
