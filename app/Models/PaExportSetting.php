<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaExportSetting extends Model
{
    protected $fillable = [
        'enabled',
        'schedule_time',
        'export_scope',
        'recipients',
    ];

    protected $casts = [
        'enabled'    => 'boolean',
        'recipients' => 'array',
    ];

    /**
     * Always return the singleton settings row.
     */
    public static function instance(): static
    {
        return static::firstOrCreate([], [
            'enabled'       => false,
            'schedule_time' => '08:00',
            'export_scope'  => 'all',
            'recipients'    => [],
        ]);
    }
}
