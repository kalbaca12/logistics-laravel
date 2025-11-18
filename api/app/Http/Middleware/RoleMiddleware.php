<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = auth('api')->user(); // or auth()->user()

        // Not authenticated -> 401 (UNAUTHORIZED)
        if (! $user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        // Authenticated but not allowed -> 403 (FORBIDDEN)
        if (! in_array($user->role, $roles, true)) {
            return response()->json(['error' => 'forbidden'], 403);
        }

        return $next($request);
    }
}
