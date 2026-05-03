ALTER TABLE "clients" ADD COLUMN "check_in_token" text;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_check_in_token_unique" UNIQUE("check_in_token");