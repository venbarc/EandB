<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaExportLog extends Model
{
    protected $fillable = [
        'status',
        'recipients',
        'record_count',
        'file_name',
        'error_message',
        'executed_at',
    ];

    protected $casts = [
        'recipients'  => 'array',
        'executed_at' => 'datetime',
    ];
}
