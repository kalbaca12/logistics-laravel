<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
      public function register(Request $r)
{
    $data = $r->validate([
        'name'     => ['required','string','max:255'],
        'email'    => ['required','email','max:255','unique:users,email'],
        'password' => ['required','string','min:8'],
        'role'     => ['in:guest,operator,admin'], // optional
    ]);

    $user = User::create([
        'name'     => $data['name'],
        'email'    => $data['email'],
        'password' => Hash::make($data['password']),
        'role'     => $data['role'] ?? 'guest',
    ]);

    // Bandome automatiškai prisiloginti ir grąžinti JWT, kad kiti testai turėtų tokeną
    $token = null;
    try {
        // veikia su php-open-source-saver/jwt-auth
        $token = auth('api')->login($user);
    } catch (\Throwable $e) {
        // jei JWT dar nesukonfigūruotas – vis tiek 201, tik be tokeno
    }

    return response()->json([
        'message' => 'Registered',
        'user'    => [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
        ],
        'access_token' => $token,
        'token_type'   => $token ? 'bearer' : null,
        'expires_in'   => $token ? auth('api')->factory()->getTTL() * 60 : null,
    ], 201);
}


    public function login(Request $r){
        $cred = $r->validate([
            'email'=>'required|email',
            'password'=>'required'
        ]);
        if (!$token = auth('api')->attempt($cred)) {
            return response()->json(['error'=>'invalid_credentials'], 401);
        }
        return $this->respondWithToken($token);
    }

    public function me(){ return response()->json(auth('api')->user()); }

    public function logout(){
        auth('api')->logout();
        return response()->noContent(); // 204
    }

    public function refresh(){
        return $this->respondWithToken(auth('api')->refresh());
    }

    protected function respondWithToken($token){
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60
        ]);
    }
}
