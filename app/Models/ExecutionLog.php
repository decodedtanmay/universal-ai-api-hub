<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExecutionLog extends Model
{
    protected $fillable = [
        'connector_id', 'source', 'status', 'provider', 'model', 'duration_ms',
        'input_tokens', 'output_tokens', 'total_tokens', 'error_code', 'error_message',
    ];

    public function connector()
    {
        return $this->belongsTo(Connector::class);
    }
}
