// ============================================================
// Shared Types for PayNoy — Discord QR Payment Bot Platform
// ============================================================

// ── Enums ──────────────────────────────────────────────────

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    EXPIRED = 'expired',
    FAILED = 'failed',
}

export enum ServerPlan {
    FREE = 'free',
    PRO = 'pro',
    ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PAST_DUE = 'past_due',
    CANCELLED = 'cancelled',
}

export enum AuditEventType {
    ORDER_CREATED = 'order.created',
    PAYMENT_SUCCESS = 'payment.success',
    PAYMENT_FAILED = 'payment.failed',
    WEBHOOK_RECEIVED = 'webhook.received',
    ROLE_ASSIGNED = 'role.assigned',
    ROLE_ASSIGN_FAILED = 'role.assign_failed',
    ORDER_EXPIRED = 'order.expired',
    SERVER_REGISTERED = 'server.registered',
}

export enum FailedJobStatus {
    PENDING = 'pending',
    RETRIED = 'retried',
    RESOLVED = 'resolved',
}

// ── Database Entities ──────────────────────────────────────

export interface User {
    id: string;
    discord_id: string;
    email: string | null;
    created_at: string;
}

export interface Server {
    id: string;
    discord_guild_id: string;
    owner_id: string;
    plan: ServerPlan;
    status: string;
    support_channel_id?: string | null;
    promptpay_name: string | null;
    promptpay_account: string | null;
    created_at: string;
}

export interface Product {
    id: string;
    server_id: string;
    name: string;
    price: number;
    role_id: string;
    embed_json: EmbedConfig;
    button_config: ButtonConfig;
    created_at: string;
}

export interface Order {
    id: string;
    server_id: string;
    product_id: string;
    user_discord_id: string;
    amount: number;
    status: OrderStatus;
    omise_source_id: string | null;
    omise_charge_id: string | null;
    idempotency_key: string | null;
    discord_channel_id?: string;
    interaction_token?: string;
    expires_at: string;
    role_assigned_at: string | null;
    created_at: string;
}

export interface Payment {
    id: string;
    order_id: string;
    event_type: string;
    raw_data: Record<string, unknown>;
    created_at: string;
}

export interface Subscription {
    id: string;
    server_id: string;
    plan: ServerPlan;
    status: SubscriptionStatus;
    next_billing_date: string;
}

export interface AuditLog {
    id: string;
    server_id: string | null;
    event_type: AuditEventType;
    actor_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface FailedJob {
    id: string;
    job_type: string;
    payload: Record<string, unknown>;
    error: string;
    attempts: number;
    status: FailedJobStatus;
    created_at: string;
    updated_at: string;
}

export interface WebhookEvent {
    id: string;
    event_id: string;
    event_type: string;
    processed_at: string;
}

// ── Embed / Button Config ──────────────────────────────────

export interface EmbedConfig {
    title: string;
    description: string;
    color?: number;
    image?: string;
    thumbnail?: string;
    footer?: string;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export interface ButtonConfig {
    label: string;
    style: 'Primary' | 'Secondary' | 'Success' | 'Danger';
    emoji?: string;
}

// ── API DTOs ───────────────────────────────────────────────

export interface CreateOrderRequest {
    server_id: string;
    discord_guild_id?: string;
    product_id: string;
    discord_user_id: string;
    idempotency_key: string;
    discord_channel_id?: string;
    interaction_token?: string;
}

export interface CreateOrderResponse {
    order_id: string;
    qr_code_url: string;
    amount: number;
    expires_at: string;
    receiver_name?: string;
    receiver_account_masked?: string;
}

export interface RetryJobRequest {
    job_id: string;
}

// ── Omise Types ────────────────────────────────────────────

export interface OmiseSource {
    id: string;
    object: 'source';
    type: 'promptpay';
    amount: number;
    currency: string;
    scannable_code: {
        type: 'qr';
        image: {
            filename: string;
            download_uri: string;
        };
    };
}

export interface OmiseCharge {
    id: string;
    object: 'charge';
    amount: number;
    currency: string;
    status: string;
    source: OmiseSource;
    paid: boolean;
    metadata: Record<string, string>;
}

export interface OmiseWebhookPayload {
    id: string;
    object: 'event';
    key: string;
    created_at: string;
    data: OmiseCharge;
}

// ── Role Assignment Job ────────────────────────────────────

export interface RoleAssignmentPayload {
    order_id: string;
    guild_id: string;
    user_id: string;
    role_id: string;
}
