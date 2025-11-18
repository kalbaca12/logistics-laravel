<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shipment;
use App\Models\Warehouse;

class ShipmentSeeder extends Seeder
{
    public function run(): void
    {
        $kaunas  = Warehouse::where('name','Kaunas DC')->first()->id;
        $vilnius = Warehouse::where('name','Vilnius HUB')->first()->id;
        $klaipeda= Warehouse::where('name','Klaipėda Port')->first()->id;

        Shipment::updateOrCreate(['code' => 'SHP-1001'], ['status' => 'created',   'warehouse_id' => $kaunas]);
        Shipment::updateOrCreate(['code' => 'SHP-1002'], ['status' => 'in_transit','warehouse_id' => $vilnius]);
        Shipment::updateOrCreate(['code' => 'SHP-1003'], ['status' => 'arrived',   'warehouse_id' => $vilnius]);
        Shipment::updateOrCreate(['code' => 'SHP-1004'], ['status' => 'created',   'warehouse_id' => $klaipeda]);
    }
}
