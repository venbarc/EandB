<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;

// Guest-only routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLogin'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);

    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email');

    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->name('password.store');
});

Route::post('/logout', [LoginController::class, 'logout'])->name('logout')->middleware('auth');

// Protected routes
Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index']);

    // Must be before /{appointment} pattern routes to avoid conflict
    Route::post('/appointments/import',           [AppointmentController::class, 'import']);
    Route::post('/appointments/sync-api',         [AppointmentController::class, 'syncFromApi']);
    Route::get('/appointments/sync-progress',     [AppointmentController::class, 'syncProgress']);
    Route::get('/appointments/export',            [AppointmentController::class, 'exportAll']);
    Route::get('/appointments/export/availity',   [AppointmentController::class, 'exportAvailty']);
    Route::get('/appointments/export/pa-dept',    [AppointmentController::class, 'exportPaDept']);

    Route::patch('/appointments/{appointment}',       [AppointmentController::class, 'update']);
    Route::patch('/appointments/{appointment}/psc',   [AppointmentController::class, 'updatePsc']);
    Route::patch('/appointments/{appointment}/pa-dept-submission', [AppointmentController::class, 'togglePaDeptSubmission']);
});
