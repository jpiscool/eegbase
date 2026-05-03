CREATE TABLE "cpt_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"administered_at" timestamp DEFAULT now() NOT NULL,
	"duration_seconds" integer NOT NULL,
	"total_stimuli" integer NOT NULL,
	"target_count" integer NOT NULL,
	"hits" integer NOT NULL,
	"misses" integer NOT NULL,
	"false_alarms" integer NOT NULL,
	"avg_reaction_time_ms" integer,
	"accuracy" real NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "cpt_results" ADD CONSTRAINT "cpt_results_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;