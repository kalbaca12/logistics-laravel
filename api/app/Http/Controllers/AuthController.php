<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\RefreshToken;
use Illuminate\Support\Str;
use Carbon\Carbon;


class AuthController extends Controller
{
      public function register(Request $r)
{
    $data = $r->validate([
        'name'     => ['required','string','max:255'],
        'email'    => ['required','email','max:255','unique:users,email'],
        'password' => ['required','string','min:8'],
        'role'     => ['in:guest,operator,admin'],
    ]);

    $user = User::create([
        'name'     => $data['name'],
        'email'    => $data['email'],
        'password' => Hash::make($data['password']),
        'role'     => $data['role'] ?? 'guest',
    ]);


    $token = null;
    try {
        $token = auth('api')->login($user);
    } catch (\Throwable $e) {
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


public function login(Request $r)
{
    $cred = $r->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    if (! $token = auth('api')->attempt($cred)) {
        return response()->json(['error' => 'invalid_credentials'], 401);
    }

    $user = auth('api')->user();

    $plainRefreshToken = Str::random(64);

    RefreshToken::create([
        'user_id'    => $user->id,
        'token_hash' => hash('sha256', $plainRefreshToken),
        'expires_at' => now()->addDays(7),
        'revoked'    => false,
    ]);

    return response()->json([
        'access_token'  => $token,
        'refresh_token' => $plainRefreshToken,
        'token_type'    => 'bearer',
        'expires_in'    => auth('api')->factory()->getTTL() * 60,
    ]);
}


    public function me(){ return response()->json(auth('api')->user()); }

    public function logout()
{
    $user = auth('api')->user();

    auth('api')->logout();

    if ($user) {
        $user->refreshTokens()->update(['revoked' => true]);
    }

    return response()->noContent();
}

    public function refreshToken(Request $request)
{
    $data = $request->validate([
        'refresh_token' => ['required', 'string'],
    ]);

    $hashed = hash('sha256', $data['refresh_token']);

    $stored = RefreshToken::where('token_hash', $hashed)
        ->where('revoked', false)
        ->where('expires_at', '>', now())
        ->first();

    if (! $stored) {
        return response()->json(['error' => 'invalid_refresh_token'], 401);
    }

    $user = $stored->user;

    $stored->update(['revoked' => true]);

    $newAccessToken = auth('api')->login($user);

    $newPlainRefreshToken = Str::random(64);

    RefreshToken::create([
        'user_id'    => $user->id,
        'token_hash' => hash('sha256', $newPlainRefreshToken),
        'expires_at' => now()->addDays(7),
        'revoked'    => false,
    ]);

    return response()->json([
        'access_token'  => $newAccessToken,
        'token_type'    => 'bearer',
        'expires_in'    => auth('api')->factory()->getTTL() * 60,
        'refresh_token' => $newPlainRefreshToken,
    ]);
}

}
