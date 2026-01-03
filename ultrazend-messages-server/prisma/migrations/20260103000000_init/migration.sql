-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('CITIZEN', 'SERVER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('SUPPORT', 'P2P', 'GROUP');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION', 'STICKER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'MUTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'SCAM', 'IMPERSONATION', 'VIOLENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('NONE', 'WARNING', 'MESSAGE_DELETED', 'USER_WARNED', 'USER_SUSPENDED', 'USER_BANNED', 'REPORTED_POLICE');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('WELCOME', 'PROTOCOL', 'NOTIFICATION', 'REMINDER', 'CONFIRMATION', 'ALERT', 'SYSTEM');

-- CreateTable
CREATE TABLE "message_servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "wsPort" INTEGER NOT NULL DEFAULT 9001,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "maxDailyMessages" INTEGER NOT NULL DEFAULT 100000,
    "enableEncryption" BOOLEAN NOT NULL DEFAULT false,
    "enableP2P" BOOLEAN NOT NULL DEFAULT false,
    "enableBroadcast" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "messageServerId" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant1Type" "ParticipantType" NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "participant2Type" "ParticipantType" NOT NULL,
    "protocolId" TEXT,
    "departmentId" TEXT,
    "type" "ConversationType" NOT NULL DEFAULT 'SUPPORT',
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "unreadCount1" INTEGER NOT NULL DEFAULT 0,
    "unreadCount2" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "ParticipantType" NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "replyToId" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_channels" (
    "id" TEXT NOT NULL,
    "messageServerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "bannerUrl" TEXT,
    "color" TEXT,
    "departmentId" TEXT,
    "managedBy" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowComments" BOOLEAN NOT NULL DEFAULT false,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_subscriptions" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "notifySMS" BOOLEAN NOT NULL DEFAULT false,
    "notifyPush" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "channel_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_deliveries" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_privacy_settings" (
    "citizenId" TEXT NOT NULL,
    "allowMessagesFromAll" BOOLEAN NOT NULL DEFAULT false,
    "allowMessagesFromServers" BOOLEAN NOT NULL DEFAULT true,
    "blockedCitizens" JSONB NOT NULL DEFAULT '[]',
    "blockedServers" JSONB NOT NULL DEFAULT '[]',
    "notifyNewMessage" BOOLEAN NOT NULL DEFAULT true,
    "notifySound" BOOLEAN NOT NULL DEFAULT true,
    "notifyVibrate" BOOLEAN NOT NULL DEFAULT true,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "showLastSeen" BOOLEAN NOT NULL DEFAULT true,
    "showReadReceipts" BOOLEAN NOT NULL DEFAULT true,
    "autoBackup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_privacy_settings_pkey" PRIMARY KEY ("citizenId")
);

-- CreateTable
CREATE TABLE "message_reports" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reporterType" "ParticipantType" NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "screenshots" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "action" "ModerationAction",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "messageServerId" TEXT,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "event" TEXT NOT NULL,
    "userId" TEXT,
    "citizenId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "channelId" TEXT,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_stats" (
    "id" TEXT NOT NULL,
    "messageServerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "textMessages" INTEGER NOT NULL DEFAULT 0,
    "mediaMessages" INTEGER NOT NULL DEFAULT 0,
    "deletedMessages" INTEGER NOT NULL DEFAULT 0,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "newConversations" INTEGER NOT NULL DEFAULT 0,
    "closedConversations" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "activeCitizens" INTEGER NOT NULL DEFAULT 0,
    "onlineUsers" INTEGER NOT NULL DEFAULT 0,
    "channelMessages" INTEGER NOT NULL DEFAULT 0,
    "channelSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "channelDeliveries" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION,
    "avgMessageLength" DOUBLE PRECISION,
    "reportsCreated" INTEGER NOT NULL DEFAULT 0,
    "reportsResolved" INTEGER NOT NULL DEFAULT 0,
    "usersBlocked" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "websocket_sessions" (
    "id" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "userId" TEXT,
    "userType" "ParticipantType" NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "websocket_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "variables" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_participant1Id_participant1Type_status_idx" ON "conversations"("participant1Id", "participant1Type", "status");

-- CreateIndex
CREATE INDEX "conversations_participant2Id_participant2Type_status_idx" ON "conversations"("participant2Id", "participant2Type", "status");

-- CreateIndex
CREATE INDEX "conversations_protocolId_idx" ON "conversations"("protocolId");

-- CreateIndex
CREATE INDEX "conversations_status_lastMessageAt_idx" ON "conversations"("status", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_participant1Id_participant1Type_participant2Id_key" ON "conversations"("participant1Id", "participant1Type", "participant2Id", "participant2Type", "protocolId");

-- CreateIndex
CREATE INDEX "messages_conversationId_sentAt_idx" ON "messages"("conversationId", "sentAt");

-- CreateIndex
CREATE INDEX "messages_senderId_senderType_idx" ON "messages"("senderId", "senderType");

-- CreateIndex
CREATE INDEX "messages_status_sentAt_idx" ON "messages"("status", "sentAt");

-- CreateIndex
CREATE INDEX "messages_isDeleted_idx" ON "messages"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "official_channels_slug_key" ON "official_channels"("slug");

-- CreateIndex
CREATE INDEX "official_channels_isActive_isPublic_idx" ON "official_channels"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "official_channels_slug_idx" ON "official_channels"("slug");

-- CreateIndex
CREATE INDEX "channel_subscriptions_citizenId_status_idx" ON "channel_subscriptions"("citizenId", "status");

-- CreateIndex
CREATE INDEX "channel_subscriptions_channelId_status_idx" ON "channel_subscriptions"("channelId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "channel_subscriptions_channelId_citizenId_key" ON "channel_subscriptions"("channelId", "citizenId");

-- CreateIndex
CREATE INDEX "channel_messages_channelId_publishedAt_idx" ON "channel_messages"("channelId", "publishedAt");

-- CreateIndex
CREATE INDEX "channel_messages_status_scheduledFor_idx" ON "channel_messages"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "channel_messages_authorId_idx" ON "channel_messages"("authorId");

-- CreateIndex
CREATE INDEX "channel_deliveries_messageId_status_idx" ON "channel_deliveries"("messageId", "status");

-- CreateIndex
CREATE INDEX "channel_deliveries_citizenId_status_idx" ON "channel_deliveries"("citizenId", "status");

-- CreateIndex
CREATE INDEX "channel_deliveries_status_queuedAt_idx" ON "channel_deliveries"("status", "queuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "channel_deliveries_messageId_citizenId_key" ON "channel_deliveries"("messageId", "citizenId");

-- CreateIndex
CREATE INDEX "message_reports_messageId_idx" ON "message_reports"("messageId");

-- CreateIndex
CREATE INDEX "message_reports_reportedBy_reporterType_idx" ON "message_reports"("reportedBy", "reporterType");

-- CreateIndex
CREATE INDEX "message_reports_status_createdAt_idx" ON "message_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "message_logs_messageServerId_timestamp_idx" ON "message_logs"("messageServerId", "timestamp");

-- CreateIndex
CREATE INDEX "message_logs_event_timestamp_idx" ON "message_logs"("event", "timestamp");

-- CreateIndex
CREATE INDEX "message_logs_level_timestamp_idx" ON "message_logs"("level", "timestamp");

-- CreateIndex
CREATE INDEX "message_logs_userId_idx" ON "message_logs"("userId");

-- CreateIndex
CREATE INDEX "message_logs_citizenId_idx" ON "message_logs"("citizenId");

-- CreateIndex
CREATE INDEX "message_stats_messageServerId_date_idx" ON "message_stats"("messageServerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "message_stats_messageServerId_date_hour_key" ON "message_stats"("messageServerId", "date", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "websocket_sessions_socketId_key" ON "websocket_sessions"("socketId");

-- CreateIndex
CREATE INDEX "websocket_sessions_userId_userType_isOnline_idx" ON "websocket_sessions"("userId", "userType", "isOnline");

-- CreateIndex
CREATE INDEX "websocket_sessions_connectedAt_idx" ON "websocket_sessions"("connectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_name_key" ON "message_templates"("name");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_messageServerId_fkey" FOREIGN KEY ("messageServerId") REFERENCES "message_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_channels" ADD CONSTRAINT "official_channels_messageServerId_fkey" FOREIGN KEY ("messageServerId") REFERENCES "message_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "official_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "official_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_deliveries" ADD CONSTRAINT "channel_deliveries_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "channel_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_deliveries" ADD CONSTRAINT "channel_deliveries_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "channel_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_messageServerId_fkey" FOREIGN KEY ("messageServerId") REFERENCES "message_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_stats" ADD CONSTRAINT "message_stats_messageServerId_fkey" FOREIGN KEY ("messageServerId") REFERENCES "message_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
