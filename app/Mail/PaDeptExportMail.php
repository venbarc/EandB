<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaDeptExportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        private readonly string $filePath,
        private readonly int $recordCount,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'PA Department Export - ' . now()->format('m/d/Y'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.pa-dept-export',
            with: [
                'recordCount' => $this->recordCount,
                'date'        => now()->format('m/d/Y'),
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromStorage($this->filePath)
                ->as(basename($this->filePath))
                ->withMime('text/csv'),
        ];
    }
}
