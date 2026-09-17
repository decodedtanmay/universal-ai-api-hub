<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Connector extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'provider', 'model', 'system_prompt',
        'input_schema', 'output_schema', 'auth_mode', 'status',
    ];

    protected function casts(): array
    {
        return [
            'input_schema' => 'array',
            'output_schema' => 'array',
        ];
    }

    public function executionLogs()
    {
        return $this->hasMany(ExecutionLog::class);
    }
}
