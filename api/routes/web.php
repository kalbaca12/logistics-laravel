<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\PackageController;

Route::prefix('api/v1')->group(function () {

    // --- PING TEST (GET) ---
    Route::get('/ping', fn() => response()->json(['status' => 'ok']));

    // --- AUTH ---
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/refresh', [AuthController::class, 'refreshToken']);
    Route::middleware('auth:api')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        

        // Role test endpoints
        Route::get('/admin-only', fn() => response()->json(['ok' => true]))
            ->middleware('role:admin');
        Route::get('/operator-or-admin', fn() => response()->json(['ok' => true]))
            ->middleware('role:operator,admin');
    });

    // --- PUBLIC (guest gali skaityti) ---
    Route::get('/warehouses', [WarehouseController::class,'index']);
    Route::get('/warehouses/{id}', [WarehouseController::class,'show']);
    Route::get('/shipments', [ShipmentController::class,'index']);
    Route::get('/shipments/{id}', [ShipmentController::class,'show']);
    Route::get('/packages', [PackageController::class,'index']);
    Route::get('/packages/{id}', [PackageController::class,'show']);

    // --- AUTH + ROLES ---
    Route::middleware('auth:api')->group(function () {

        // Warehouses: tik admin
        Route::post('/warehouses', [WarehouseController::class,'store'])
            ->middleware('role:admin');
        Route::put('/warehouses/{id}', [WarehouseController::class,'update'])
            ->middleware('role:admin');
        Route::delete('/warehouses/{id}', [WarehouseController::class,'destroy'])
            ->middleware('role:admin');

        // Shipments: operator arba admin
        Route::post('/shipments', [ShipmentController::class,'store'])
            ->middleware('role:operator,admin');
        Route::put('/shipments/{id}', [ShipmentController::class,'update'])
            ->middleware('role:operator,admin');
        Route::delete('/shipments/{id}', [ShipmentController::class,'destroy'])
            ->middleware('role:operator,admin');

        // Hierarchinis metodas: visos pakuotės konkrečiai siuntai
        Route::get('/shipments/{id}/packages', [ShipmentController::class,'packages']);

        // Packages: operator arba admin
        Route::post('/packages', [PackageController::class,'store'])
            ->middleware('role:operator,admin');
        Route::put('/packages/{id}', [PackageController::class,'update'])
            ->middleware('role:operator,admin');
        Route::delete('/packages/{id}', [PackageController::class,'destroy'])
            ->middleware('role:operator,admin');
    });
});
