<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void {
    Schema::create('packages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('shipment_id')->constrained('shipments')->cascadeOnDelete();

    $table->decimal('weight', 8, 2);
    $table->decimal('length', 8, 2)->nullable(); // cm
    $table->decimal('width',  8, 2)->nullable(); // cm
    $table->decimal('height', 8, 2)->nullable(); // cm
    $table->boolean('fragile')->default(false);

    $table->string('description')->nullable();

    $table->timestamps();
});

}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
