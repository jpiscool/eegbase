ALTER TABLE "clients" ADD COLUMN "report_token" text;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_report_token_unique" UNIQUE("report_token");