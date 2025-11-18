<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::updateOrCreate(['name' => 'Kaunas DC'],   ['address' => 'Taikos pr. 1, Kaunas']);
        Warehouse::updateOrCreate(['name' => 'Vilnius HUB'], ['address' => 'Ozo g. 25, Vilnius']);
        Warehouse::updateOrCreate(['name' => 'Klaipėda Port'], ['address' => 'Jūrų g. 3, Klaipėda']);
    }
}
