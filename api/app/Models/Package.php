<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = ['shipment_id','description','weight','length','width','height','fragile'];
    protected $casts = [
        'weight'  => 'decimal:2',
        'length'  => 'decimal:2',
        'width'   => 'decimal:2',
        'height'  => 'decimal:2',
        'fragile' => 'boolean',
    ];
    public function shipment(){ return $this->belongsTo(Shipment::class); }

}
