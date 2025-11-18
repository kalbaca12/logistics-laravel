<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Package;
use App\Models\Shipment;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $s1 = Shipment::where('code', 'SHP-1001')->first()?->id;
        $s2 = Shipment::where('code', 'SHP-1002')->first()?->id;
        $s3 = Shipment::where('code', 'SHP-1003')->first()?->id;
        $s4 = Shipment::where('code', 'SHP-1004')->first()?->id;

        if (!($s1 && $s2 && $s3 && $s4)) {
            $this->command->warn('Shipments not found — run ShipmentSeeder first.');
            return;
        }
        Package::updateOrCreate(
            ['shipment_id' => $s1, 'description' => 'Books'],
            ['weight' => 12.4, 'length' => 40.0, 'width' => 30.0, 'height' => 25.0, 'fragile' => false]
        );

        Package::updateOrCreate(
            ['shipment_id' => $s1, 'description' => 'Clothes'],
            ['weight' => 6.8, 'length' => 35.0, 'width' => 25.0, 'height' => 20.0, 'fragile' => false]
        );
        Package::updateOrCreate(
            ['shipment_id' => $s2, 'description' => 'Laptops'],
            ['weight' => 8.1, 'length' => 45.0, 'width' => 35.0, 'height' => 8.0, 'fragile' => true]
        );

        Package::updateOrCreate(
            ['shipment_id' => $s2, 'description' => 'Headsets'],
            ['weight' => 3.2, 'length' => 25.0, 'width' => 20.0, 'height' => 10.0, 'fragile' => true]
        );
        Package::updateOrCreate(
            ['shipment_id' => $s3, 'description' => 'Furniture'],
            ['weight' => 30.0, 'length' => 150.0, 'width' => 80.0, 'height' => 100.0, 'fragile' => false]
        );

        Package::updateOrCreate(
            ['shipment_id' => $s3, 'description' => 'Tools'],
            ['weight' => 9.7, 'length' => 50.0, 'width' => 40.0, 'height' => 20.0, 'fragile' => false]
        );

        Package::updateOrCreate(
            ['shipment_id' => $s4, 'description' => 'Shoes'],
            ['weight' => 5.0, 'length' => 35.0, 'width' => 25.0, 'height' => 12.0, 'fragile' => false]
        );

        Package::updateOrCreate(
            ['shipment_id' => $s4, 'description' => 'Phones'],
            ['weight' => 2.3, 'length' => 15.0, 'width' => 10.0, 'height' => 8.0, 'fragile' => true]
        );
    }
}
