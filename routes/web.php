<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AppointmentController;

Route::get('/', [DashboardController::class, 'index']);

// Must be before /{appointment} pattern routes to avoid conflict
Route::post('/appointments/import',           [AppointmentController::class, 'import']);
Route::get('/appointments/export',            [AppointmentController::class, 'exportAll']);
Route::get('/appointments/export/availity',   [AppointmentController::class, 'exportAvailty']);

Route::patch('/appointments/{appointment}',       [AppointmentController::class, 'update']);
Route::patch('/appointments/{appointment}/psc',   [AppointmentController::class, 'updatePsc']);
