<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('availabilities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barbershop_id');
            $table->uuid('barber_id');
            $table->integer('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('availabilities'); }
};
