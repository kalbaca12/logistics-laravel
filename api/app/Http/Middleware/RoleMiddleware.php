<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (! auth('api')->check()) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $roleFromToken = auth('api')->payload()->get('role');

        if ($roleFromToken === null) {
            $user = auth('api')->user();
            $roleFromToken = $user?->role;
        }

        if (! in_array($roleFromToken, $roles, true)) {
            return response()->json(['error' => 'forbidden'], 403);
        }

        return $next($request);
    }
}
