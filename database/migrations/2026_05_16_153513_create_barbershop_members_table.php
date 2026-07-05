<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('barbershop_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('barbershop_id');
            $table->uuid('user_id');
            $table->string('role');
            $table->string('status')->default('active');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('barbershop_members'); }
};
