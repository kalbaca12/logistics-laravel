<?php

namespace App\Http\Controllers;

use App\Models\Shipment; 
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShipmentController extends Controller
{
    public function index()
{
    return response()->json(
        \App\Models\Shipment::with('warehouse')->withCount('packages')->get()
    );
}

public function show($id)
{
    // include related packages (and warehouse if you want)
    $shipment = \App\Models\Shipment::with(['packages', 'warehouse'])->findOrFail($id);
    return response()->json($shipment);
}

public function store(\Illuminate\Http\Request $r)
{
    $data = $r->validate([
        'code'         => 'required|string|max:50|unique:shipments,code',
        'status'       => 'required|string',
        'warehouse_id' => 'required|integer|exists:warehouses,id',
    ]);

    // optional: track creator
    $data['user_id'] = auth('api')->id();  // remove if you don't want this

    $shipment = \App\Models\Shipment::create($data);
    return response()->json($shipment, 201);
}

public function update(\Illuminate\Http\Request $r, $id)
{
    $shipment = \App\Models\Shipment::findOrFail($id);

    $data = $r->validate([
        'code'         => 'sometimes|string|max:50|unique:shipments,code,'.$shipment->id,
        'status'       => 'sometimes|string',
        'warehouse_id' => 'sometimes|integer|exists:warehouses,id',
    ]);

    $shipment->update($data);
    return response()->json($shipment);
}
public function destroy($id)
    {
        $shipment = Shipment::findOrFail($id);

        DB::transaction(function () use ($shipment) {
            $shipment->packages()->delete();
            $shipment->delete();
        });

        // 204 No Content on success
        return response()->noContent();
    }

// HIERARCHINIS: visos pakuotės konkrečiai siuntai
public function packages($id){
    $s = \App\Models\Shipment::findOrFail($id);
    return response()->json($s->packages);
}

}
