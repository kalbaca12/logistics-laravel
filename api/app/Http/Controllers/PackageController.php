<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(){ return response()->json(\App\Models\Package::all()); }
public function show($id){ return response()->json(\App\Models\Package::findOrFail($id)); }
public function store(\Illuminate\Http\Request $r){
    $data = $r->validate([
        'shipment_id'=>'required|exists:shipments,id',
        'description'=>'nullable|string',
        'weight'=>'nullable|numeric',
        'length'=>'nullable|numeric',
        'width'=>'nullable|numeric',
        'height'=>'nullable|numeric',
        'fragile'=>'boolean'
    ]);
    $p = \App\Models\Package::create($data);
    return response()->json($p, 201);
}
public function update(\Illuminate\Http\Request $r, $id){
    $p = \App\Models\Package::findOrFail($id);
    $data = $r->validate([
        'description'=>'nullable|string',
        'weight'=>'nullable|numeric',
        'length'=>'nullable|numeric',
        'width'=>'nullable|numeric',
        'height'=>'nullable|numeric',
        'fragile'=>'boolean'
    ]);
    $p->update($data);
    return response()->json($p);
}
public function destroy($id){
    \App\Models\Package::findOrFail($id)->delete();
    return response()->noContent(); // 204
}

}
