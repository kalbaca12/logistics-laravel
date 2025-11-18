<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => Hash::make('secret1234'), 'role' => 'admin']
        );

        User::updateOrCreate(
            ['email' => 'operator@example.com'],
            ['name' => 'Operator', 'password' => Hash::make('secret1234'), 'role' => 'operator']
        );

        User::updateOrCreate(
            ['email' => 'guest@example.com'],
            ['name' => 'Guest', 'password' => Hash::make('secret1234'), 'role' => 'guest']
        );
    }
}
