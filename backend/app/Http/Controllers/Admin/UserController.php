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

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
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
