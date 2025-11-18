<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = ['name','address'];
    public function shipments(){ return $this->hasMany(Shipment::class); }

}
