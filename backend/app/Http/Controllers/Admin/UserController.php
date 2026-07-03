<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return $query->paginate(15);
    }

    public function updateRole(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'role' => 'required|in:admin,user'
        ]);

        $user->role = $validated['role'];
        $user->save();
        
        return response()->json($user);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|in:active,blocked'
        ]);

        $user->status = $validated['status'];
        $user->save();
        
        return response()->json($user);
    }
}
