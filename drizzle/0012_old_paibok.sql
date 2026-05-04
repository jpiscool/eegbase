CREATE TABLE "consumables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'units' NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"par_level" integer DEFAULT 10 NOT NULL,
	"usage_per_session" real,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"protocol_id" uuid,
	"presenting_concerns" text,
	"target_session_count" integer,
	"session_frequency" text,
	"outcome_measures" text[],
	"decision_rules" text,
	"goals" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"review_date" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "referral_source" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "icd10_code" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "rendering_provider" text;--> statement-breakpoint
ALTER TABLE "consumables" ADD CONSTRAINT "consumables_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;