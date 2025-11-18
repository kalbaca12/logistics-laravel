<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = ['code','status','warehouse_id','user_id'];

    public function packages()
    {
        return $this->hasMany(\App\Models\Package::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(\App\Models\Warehouse::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
