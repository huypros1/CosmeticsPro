<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public $order;
    public $statusMessage;
    public $statusTitle;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, $statusTitle, $statusMessage)
    {
        $this->order = $order;
        $this->statusTitle = $statusTitle;
        $this->statusMessage = $statusMessage;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Cập nhật trạng thái đơn hàng #' . $this->order->id . ' - HQCosmetics',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.order-status',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
