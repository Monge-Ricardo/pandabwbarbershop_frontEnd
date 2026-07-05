<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->has('barbershop_id')) {
            $query->where('barbershop_id', $request->query('barbershop_id'));
        }

        $query->where('is_active', true);

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'barbershop_id' => 'required|uuid',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image_url' => 'nullable|string',
        ]);

        $validatedData['id'] = (string) Str::uuid();
        $validatedData['is_active'] = true;
        $validatedData['created_at'] = now();

        $product = Product::create($validatedData);

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $validatedData = $request->validate([
            'barbershop_id' => 'sometimes|required|uuid',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'stock' => 'sometimes|required|integer|min:0',
            'image_url' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($validatedData);

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $this->authorize('update', $product);

        $product->update([
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Producto desactivado correctamente.'
        ]);
    }
}