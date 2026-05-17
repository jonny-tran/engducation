CREATE TYPE "public"."part_of_speech" AS ENUM('noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'idiom', 'phrasal_verb');--> statement-breakpoint
CREATE TABLE "user_bookmarks" (
	"user_id" text NOT NULL,
	"vocabulary_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_bookmarks_user_id_vocabulary_id_pk" PRIMARY KEY("user_id","vocabulary_id")
);
--> statement-breakpoint
CREATE TABLE "vocabularies" (
	"id" text PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"ipa" text NOT NULL,
	"part_of_speech" "part_of_speech" NOT NULL,
	"meaning_vi" text NOT NULL,
	"example_en" text NOT NULL,
	"example_vi" text NOT NULL,
	"audio_url" text,
	"level" "course_level" NOT NULL,
	"topic" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_vocabulary_id_vocabularies_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabularies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vocabularies_word_part_of_speech_idx" ON "vocabularies" USING btree ("word","part_of_speech");