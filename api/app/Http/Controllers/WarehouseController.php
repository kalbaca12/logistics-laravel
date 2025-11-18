<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(){ return response()->json(\App\Models\Warehouse::all()); }
public function show($id){ return response()->json(\App\Models\Warehouse::findOrFail($id)); }
public function store(\Illuminate\Http\Request $r){
    $data = $r->validate(['name'=>'required','address'=>'nullable|string']);
    $w = \App\Models\Warehouse::create($data);
    return response()->json($w, 201);
}
public function update(\Illuminate\Http\Request $r, $id){
    $w = \App\Models\Warehouse::findOrFail($id);
    $data = $r->validate(['name'=>'sometimes|required','address'=>'nullable|string']);
    $w->update($data);
    return response()->json($w);
}
public function destroy($id){
    \App\Models\Warehouse::findOrFail($id)->delete();
    return response()->noContent(); // 204
}
}
