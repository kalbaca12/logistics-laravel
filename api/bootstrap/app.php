<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role'        => \App\Http\Middleware\RoleMiddleware::class,
            'jwt.auth'    => \PHPOpenSourceSaver\JWTAuth\Http\Middleware\Authenticate::class,
            'jwt.refresh' => \PHPOpenSourceSaver\JWTAuth\Http\Middleware\RefreshToken::class,
        ]);

        // API keliams nereikia CSRF
        $middleware->validateCsrfTokens(except: ['api/*']);

        // Jokio redirect į /login (tiesiog 401 JSON)
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // VISOMS /api/* išimtims grąžink JSON
        $exceptions->render(function (\Throwable $e, $request) {
            if (!($request->expectsJson() || $request->is('api/*'))) {
                return null; // web routes = normal HTML handling
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => $e->errors(),
                ], 422);
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            if ($e instanceof AuthorizationException) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                return response()->json(['message' => 'Not Found'], 404);
            }

            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json(['message' => 'Method Not Allowed'], 405);
            }

            // Default 500 (internal server error)
            return response()->json([
                'message'   => $e->getMessage(),
                'exception' => class_basename($e),
            ], 500);
        });
    })
    ->create();
