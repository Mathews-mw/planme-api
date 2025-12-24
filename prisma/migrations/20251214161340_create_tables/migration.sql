-- CreateEnum
CREATE TYPE "AccountProvider" AS ENUM ('CREDENTIALS', 'GOOGLE');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('PASSWORD_RECOVER', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'NONE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('NONE', 'DAILY_INTERVAL', 'WEEKLY_DAYS', 'MONTHLY_DAY_OF_MONTH', 'MONTHLY_WEEKDAYS_OF_MONTH', 'YEARLY_INTERVAL');

-- CreateEnum
CREATE TYPE "RecurrenceEndType" AS ENUM ('ONCE', 'NEVER', 'ON_DATE', 'AFTER_OCCURRENCES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "avatar_url" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "AccountProvider" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "register_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrence_rules" (
    "id" TEXT NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "end_type" "RecurrenceEndType" NOT NULL,
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "interval" INTEGER,
    "weekdays_bitmask" INTEGER,
    "day_of_month" INTEGER,
    "week_of_month" INTEGER,
    "weekday_of_month" INTEGER,
    "max_occurrences" INTEGER,

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_definitions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recurrence_rule_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'NONE',
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "task_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_occurrences" (
    "id" TEXT NOT NULL,
    "task_definition_id" TEXT NOT NULL,
    "occurrence_date_time" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "task_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "task_definition_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_key" ON "accounts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_account_id_key" ON "accounts"("provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_id_provider_key" ON "accounts"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_id_key" ON "sessions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_user_id_key" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recurrence_rules_id_key" ON "recurrence_rules"("id");

-- CreateIndex
CREATE INDEX "recurrence_rules_frequency_idx" ON "recurrence_rules"("frequency");

-- CreateIndex
CREATE UNIQUE INDEX "task_definitions_id_key" ON "task_definitions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "task_definitions_recurrence_rule_id_key" ON "task_definitions"("recurrence_rule_id");

-- CreateIndex
CREATE INDEX "task_definitions_user_id_idx" ON "task_definitions"("user_id");

-- CreateIndex
CREATE INDEX "task_definitions_is_starred_idx" ON "task_definitions"("is_starred");

-- CreateIndex
CREATE INDEX "task_definitions_deadline_idx" ON "task_definitions"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "task_occurrences_id_key" ON "task_occurrences"("id");

-- CreateIndex
CREATE INDEX "task_occurrences_task_definition_id_occurrence_date_time_idx" ON "task_occurrences"("task_definition_id", "occurrence_date_time");

-- CreateIndex
CREATE INDEX "task_occurrences_status_idx" ON "task_occurrences"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subtasks_id_key" ON "subtasks"("id");

-- CreateIndex
CREATE INDEX "subtasks_task_definition_id_position_idx" ON "subtasks"("task_definition_id", "position");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_definitions" ADD CONSTRAINT "task_definitions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_definitions" ADD CONSTRAINT "task_definitions_recurrence_rule_id_fkey" FOREIGN KEY ("recurrence_rule_id") REFERENCES "recurrence_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_occurrences" ADD CONSTRAINT "task_occurrences_task_definition_id_fkey" FOREIGN KEY ("task_definition_id") REFERENCES "task_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_definition_id_fkey" FOREIGN KEY ("task_definition_id") REFERENCES "task_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
