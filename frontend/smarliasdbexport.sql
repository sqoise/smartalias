-- Adminer 5.0.6 PostgreSQL 16.10 dump

\connect "smartliasdb";

-- Could not export type gtrgm

DROP FUNCTION IF EXISTS "check_uploads_directory";;
CREATE FUNCTION "check_uploads_directory" () RETURNS text LANGUAGE plpgsql AS '
BEGIN
  RETURN ''Ensure uploads directory exists at: <project_root>/uploads/'';
END;
';

DROP FUNCTION IF EXISTS "gin_extract_query_trgm";;
CREATE FUNCTION "gin_extract_query_trgm" () RETURNS internal LANGUAGE c AS 'gin_extract_query_trgm';

DROP FUNCTION IF EXISTS "gin_extract_value_trgm";;
CREATE FUNCTION "gin_extract_value_trgm" () RETURNS internal LANGUAGE c AS 'gin_extract_value_trgm';

DROP FUNCTION IF EXISTS "gin_trgm_consistent";;
CREATE FUNCTION "gin_trgm_consistent" () RETURNS bool LANGUAGE c AS 'gin_trgm_consistent';

DROP FUNCTION IF EXISTS "gin_trgm_triconsistent";;
CREATE FUNCTION "gin_trgm_triconsistent" () RETURNS char LANGUAGE c AS 'gin_trgm_triconsistent';

DROP FUNCTION IF EXISTS "gtrgm_compress";;
CREATE FUNCTION "gtrgm_compress" () RETURNS internal LANGUAGE c AS 'gtrgm_compress';

DROP FUNCTION IF EXISTS "gtrgm_consistent";;
CREATE FUNCTION "gtrgm_consistent" () RETURNS bool LANGUAGE c AS 'gtrgm_consistent';

DROP FUNCTION IF EXISTS "gtrgm_decompress";;
CREATE FUNCTION "gtrgm_decompress" () RETURNS internal LANGUAGE c AS 'gtrgm_decompress';

DROP FUNCTION IF EXISTS "gtrgm_distance";;
CREATE FUNCTION "gtrgm_distance" () RETURNS float8 LANGUAGE c AS 'gtrgm_distance';

DROP FUNCTION IF EXISTS "gtrgm_in";;
CREATE FUNCTION "gtrgm_in" () RETURNS gtrgm LANGUAGE c AS 'gtrgm_in';

DROP FUNCTION IF EXISTS "gtrgm_options";;
CREATE FUNCTION "gtrgm_options" () RETURNS void LANGUAGE c AS 'gtrgm_options';

DROP FUNCTION IF EXISTS "gtrgm_out";;
CREATE FUNCTION "gtrgm_out" () RETURNS cstring LANGUAGE c AS 'gtrgm_out';

DROP FUNCTION IF EXISTS "gtrgm_penalty";;
CREATE FUNCTION "gtrgm_penalty" () RETURNS internal LANGUAGE c AS 'gtrgm_penalty';

DROP FUNCTION IF EXISTS "gtrgm_picksplit";;
CREATE FUNCTION "gtrgm_picksplit" () RETURNS internal LANGUAGE c AS 'gtrgm_picksplit';

DROP FUNCTION IF EXISTS "gtrgm_same";;
CREATE FUNCTION "gtrgm_same" () RETURNS internal LANGUAGE c AS 'gtrgm_same';

DROP FUNCTION IF EXISTS "gtrgm_union";;
CREATE FUNCTION "gtrgm_union" () RETURNS gtrgm LANGUAGE c AS 'gtrgm_union';

DROP FUNCTION IF EXISTS "set_limit";;
CREATE FUNCTION "set_limit" () RETURNS float4 LANGUAGE c AS 'set_limit';

DROP FUNCTION IF EXISTS "show_limit";;
CREATE FUNCTION "show_limit" () RETURNS float4 LANGUAGE c AS 'show_limit';

DROP FUNCTION IF EXISTS "show_trgm";;
CREATE FUNCTION "show_trgm" () RETURNS _text LANGUAGE c AS 'show_trgm';

DROP FUNCTION IF EXISTS "similarity";;
CREATE FUNCTION "similarity" () RETURNS float4 LANGUAGE c AS 'similarity';

DROP FUNCTION IF EXISTS "similarity_dist";;
CREATE FUNCTION "similarity_dist" () RETURNS float4 LANGUAGE c AS 'similarity_dist';

DROP FUNCTION IF EXISTS "similarity_op";;
CREATE FUNCTION "similarity_op" () RETURNS bool LANGUAGE c AS 'similarity_op';

DROP FUNCTION IF EXISTS "strict_word_similarity";;
CREATE FUNCTION "strict_word_similarity" () RETURNS float4 LANGUAGE c AS 'strict_word_similarity';

DROP FUNCTION IF EXISTS "strict_word_similarity_commutator_op";;
CREATE FUNCTION "strict_word_similarity_commutator_op" () RETURNS bool LANGUAGE c AS 'strict_word_similarity_commutator_op';

DROP FUNCTION IF EXISTS "strict_word_similarity_dist_commutator_op";;
CREATE FUNCTION "strict_word_similarity_dist_commutator_op" () RETURNS float4 LANGUAGE c AS 'strict_word_similarity_dist_commutator_op';

DROP FUNCTION IF EXISTS "strict_word_similarity_dist_op";;
CREATE FUNCTION "strict_word_similarity_dist_op" () RETURNS float4 LANGUAGE c AS 'strict_word_similarity_dist_op';

DROP FUNCTION IF EXISTS "strict_word_similarity_op";;
CREATE FUNCTION "strict_word_similarity_op" () RETURNS bool LANGUAGE c AS 'strict_word_similarity_op';

DROP FUNCTION IF EXISTS "unaccent";;
CREATE FUNCTION "unaccent" () RETURNS text LANGUAGE c AS 'unaccent_dict';

DROP FUNCTION IF EXISTS "unaccent";;
CREATE FUNCTION "unaccent" () RETURNS text LANGUAGE c AS 'unaccent_dict';

DROP FUNCTION IF EXISTS "unaccent_init";;
CREATE FUNCTION "unaccent_init" () RETURNS internal LANGUAGE c AS 'unaccent_init';

DROP FUNCTION IF EXISTS "unaccent_lexize";;
CREATE FUNCTION "unaccent_lexize" () RETURNS internal LANGUAGE c AS 'unaccent_lexize';

DROP FUNCTION IF EXISTS "word_similarity";;
CREATE FUNCTION "word_similarity" () RETURNS float4 LANGUAGE c AS 'word_similarity';

DROP FUNCTION IF EXISTS "word_similarity_commutator_op";;
CREATE FUNCTION "word_similarity_commutator_op" () RETURNS bool LANGUAGE c AS 'word_similarity_commutator_op';

DROP FUNCTION IF EXISTS "word_similarity_dist_commutator_op";;
CREATE FUNCTION "word_similarity_dist_commutator_op" () RETURNS float4 LANGUAGE c AS 'word_similarity_dist_commutator_op';

DROP FUNCTION IF EXISTS "word_similarity_dist_op";;
CREATE FUNCTION "word_similarity_dist_op" () RETURNS float4 LANGUAGE c AS 'word_similarity_dist_op';

DROP FUNCTION IF EXISTS "word_similarity_op";;
CREATE FUNCTION "word_similarity_op" () RETURNS bool LANGUAGE c AS 'word_similarity_op';

DROP TABLE IF EXISTS "announcement_sms_logs";
DROP SEQUENCE IF EXISTS announcement_sms_logs_id_seq;
CREATE SEQUENCE announcement_sms_logs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 20 CACHE 1;

CREATE TABLE "public"."announcement_sms_logs" (
    "id" integer DEFAULT nextval('announcement_sms_logs_id_seq') NOT NULL,
    "announcement_id" integer,
    "target_groups" jsonb NOT NULL,
    "total_recipients" integer NOT NULL,
    "successful_sends" integer DEFAULT '0',
    "failed_sends" integer DEFAULT '0',
    "sms_content" text NOT NULL,
    "sent_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "provider_response" jsonb,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcement_sms_logs_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."announcement_sms_logs" IS 'Simplified SMS logging per announcement (batch summary instead of per-recipient tracking)';

COMMENT ON COLUMN "public"."announcement_sms_logs"."total_recipients" IS 'Total number of recipients who should receive the SMS';

COMMENT ON COLUMN "public"."announcement_sms_logs"."successful_sends" IS 'Number of SMS messages successfully sent';

COMMENT ON COLUMN "public"."announcement_sms_logs"."failed_sends" IS 'Number of SMS messages that failed to send';

COMMENT ON COLUMN "public"."announcement_sms_logs"."provider_response" IS 'JSON response from SMS provider for debugging';

CREATE INDEX idx_announcement_sms_logs_announcement_id ON public.announcement_sms_logs USING btree (announcement_id);

CREATE INDEX idx_announcement_sms_logs_sent_at ON public.announcement_sms_logs USING btree (sent_at);

INSERT INTO "announcement_sms_logs" ("id", "announcement_id", "target_groups", "total_recipients", "successful_sends", "failed_sends", "sms_content", "sent_at", "provider_response", "created_at") VALUES
(11,	82,	'["special_category:PWD"]',	1,	0,	1,	'[BARANGAY ANNOUNCEMENT]
Ayuda 9th Tranche

Announcement! Dumating na po ang ayuda for 9th tranche
- Barangay Office',	'2025-10-09 00:22:10.020509',	'[{"error": "Your bulk SMS messages have been successfully added to the queue and will be processed shortly.", "phone": "09268939406", "success": false, "messageId": null}]',	'2025-10-09 00:22:10.020509'),
(12,	83,	'["all"]',	4,	4,	0,	'Announcement! Dumating na po ang ayuda for 10th tranche',	'2025-10-09 01:05:14.68634',	'[{"error": null, "phone": "09067268602", "success": true, "messageId": "iSms-JXcvFO,iSms-fulMfo,iSms-JL1xvm,iSms-K1WuRv"}, {"error": null, "phone": "09294838765", "success": true, "messageId": "iSms-JXcvFO,iSms-fulMfo,iSms-JL1xvm,iSms-K1WuRv"}, {"error": null, "phone": "09268939406", "success": true, "messageId": "iSms-JXcvFO,iSms-fulMfo,iSms-JL1xvm,iSms-K1WuRv"}, {"error": null, "phone": "09220939092", "success": true, "messageId": "iSms-JXcvFO,iSms-fulMfo,iSms-JL1xvm,iSms-K1WuRv"}]',	'2025-10-09 01:05:14.68634'),
(13,	64,	'["special_category:PWD"]',	1,	1,	0,	'[BARANGAYLIAS]

Reminder to all property owners: Real property tax declarations are due by December 31st. Visit the barangay office for payment.

This is an auto-generated message. Do not reply.',	'2025-10-09 01:15:23.405138',	'[{"error": null, "phone": "09268939406", "success": true, "messageId": "iSms-8FmJXa"}]',	'2025-10-09 01:15:23.405138'),
(14,	82,	'["special_category:PWD"]',	1,	1,	0,	'[SMARTLIAS]

Announcement! Dumating na po ang ayuda for 9th tranche

This is an auto-generated message. Do not reply.',	'2025-10-09 03:33:15.224778',	'[{"error": null, "phone": "09268939406", "success": true, "messageId": "iSms-XHWgar"}]',	'2025-10-09 03:33:15.224778'),
(15,	65,	'["all"]',	3,	3,	0,	'[SMARTLIAS]

Guidelines for New Year celebration: No firecrackers allowed. Community fireworks display will be held at the barangay plaza. Let''s cel...

This is an auto-generated message. Do not reply.',	'2025-10-09 04:17:40.758328',	'[{"error": null, "phone": "09067268602", "success": true, "messageId": "iSms-qhKI7P,iSms-Ceaw8c,iSms-2NBck0"}, {"error": null, "phone": "09294838765", "success": true, "messageId": "iSms-qhKI7P,iSms-Ceaw8c,iSms-2NBck0"}, {"error": null, "phone": "09268939406", "success": true, "messageId": "iSms-qhKI7P,iSms-Ceaw8c,iSms-2NBck0"}]',	'2025-10-09 04:17:40.758328'),
(17,	85,	'["special_category:SOLO_PARENT"]',	1,	1,	0,	'[SMARTLIAS]

Announcement! Dumating na po ang ayuda for SP

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum 2

This is an auto-generated message. Do not reply.',	'2025-10-09 12:50:17.431583',	'[{"error": null, "phone": "09067268602", "success": true, "messageId": "iSms-KGV1tC"}]',	'2025-10-09 12:50:17.431583'),
(18,	86,	'["special_category:PWD"]',	1,	1,	0,	'[SMARTLIAS]

Announcement! Dumating na po ang ayuda para sa mga PWDs

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum 2

This is an auto-generated message. Do not reply.',	'2025-10-09 13:54:11.047313',	'[{"error": null, "phone": "09268939406", "success": true, "messageId": "iSms-trVpFl"}]',	'2025-10-09 13:54:11.047313'),
(19,	87,	'["special_category:PWD"]',	1,	1,	0,	'[SMARTLIAS]

December 2025 Ayuda at pamasko ng brgy lias for PWDs',	'2025-10-14 17:45:31.287193',	'[{"error": null, "phone": "09268939406", "success": true, "messageId": "iSms-rv2VKM"}]',	'2025-10-14 17:45:31.287193');

DROP TABLE IF EXISTS "announcements";
DROP SEQUENCE IF EXISTS announcements_id_seq;
CREATE SEQUENCE announcements_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 88 CACHE 1;

CREATE TABLE "public"."announcements" (
    "id" integer DEFAULT nextval('announcements_id_seq') NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" text NOT NULL,
    "type" character varying(50) DEFAULT 'general',
    "created_by" integer,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "published_by" integer,
    "published_at" timestamp,
    "target_type" character varying(20),
    "target_value" character varying(100),
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."announcements" IS 'Barangay announcements and notifications with optional image support';

COMMENT ON COLUMN "public"."announcements"."published_by" IS 'User who published (may differ from created_by for approval workflows)';

COMMENT ON COLUMN "public"."announcements"."published_at" IS 'Publication timestamp: NULL = draft, NOT NULL = published';

COMMENT ON COLUMN "public"."announcements"."target_type" IS 'SMS indicator: NULL = SMS OFF, "all" = SMS to all residents, "special_category" = specific group, etc.';

COMMENT ON COLUMN "public"."announcements"."target_value" IS 'SMS target value (e.g., "PWD" for special_category, "18-65" for age_group, NULL for "all")';

CREATE INDEX idx_announcements_type ON public.announcements USING btree (type);

CREATE INDEX idx_announcements_created_at ON public.announcements USING btree (created_at);

CREATE INDEX idx_announcements_published_at ON public.announcements USING btree (published_at);

CREATE INDEX idx_announcements_target ON public.announcements USING btree (target_type, target_value);

INSERT INTO "announcements" ("id", "title", "content", "type", "created_by", "created_at", "updated_at", "published_by", "published_at", "target_type", "target_value") VALUES
(78,	'Ayuda 6th Tranche',	'Announcement! Dumating na po ang ayuda para sa 6th Tranche.',	'3',	6,	'2025-10-07 19:43:21.899673',	'2025-10-07 19:43:57.675',	6,	'2025-10-07 19:43:57.675',	NULL,	NULL),
(81,	'Ayuda 8th Tranche',	'Announcement! Dumating na po ang ayuda for 8th tranche',	'4',	6,	'2025-10-08 22:19:46.363611',	'2025-10-08 22:20:05.77',	6,	'2025-10-08 22:20:05.77',	'special_category',	'PWD'),
(84,	'What is Lorem Ipsum?',	'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type a',	'1',	6,	'2025-10-09 01:32:36.225098',	'2025-10-09 01:35:10.554',	6,	'2025-10-09 01:35:10.554',	NULL,	NULL),
(87,	'Ayuda for everyone',	'December 2025 Ayuda at pamasko ng brgy lias for PWDs',	'3',	6,	'2025-10-10 15:35:23.255732',	'2025-10-14 17:45:30.232',	14,	'2025-10-14 17:45:30.232',	'special_category',	'PWD'),
(74,	'Ayudan 3rd Tranche',	'Announcement! Dumating na po ang ayuda para sa 3rd tranche.',	'4',	6,	'2025-10-06 17:22:24.906352',	'2025-10-06 18:13:00.928',	6,	'2025-10-06 18:13:00.928',	NULL,	NULL),
(51,	'Community Clean-Up Drive',	'Join us this Saturday for our monthly community clean-up drive. Let''s work together to keep our barangay clean and green. Bring your gloves and cleaning materials!',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-08-15 16:00:00',	NULL,	NULL),
(52,	'Free Health Check-Up',	'The barangay health center is offering free health check-ups and vaccinations for all residents this Friday from 8 AM to 5 PM. Bring your health card and valid ID.',	'2',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-07-22 17:00:00',	NULL,	NULL),
(53,	'Water Interruption Advisory',	'Water supply will be temporarily interrupted tomorrow from 9 AM to 3 PM for emergency pipe repairs. Please store enough water for your needs.',	'5',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-10-03 23:00:00',	NULL,	NULL),
(54,	'Christmas Celebration Planning Meeting',	'All residents are invited to attend the Christmas celebration planning meeting on December 15th at the barangay hall. Your ideas and participation are welcome!',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-28 18:00:00',	NULL,	NULL),
(56,	'Senior Citizens Cash Assistance Program',	'Senior citizens are reminded to claim their quarterly cash assistance at the barangay hall. Bring your senior citizen ID and barangay clearance.',	'4',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-08-05 21:00:00',	NULL,	NULL),
(57,	'Typhoon Preparedness Advisory',	'A typhoon is expected to affect our area this weekend. Please secure your properties and prepare emergency kits. Evacuation center is ready at the barangay hall.',	'5',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-10-01 15:00:00',	NULL,	NULL),
(58,	'Barangay Assembly Meeting',	'Quarterly barangay assembly meeting will be held on December 18th at 2 PM. All household representatives are required to attend. Important matters will be discussed.',	'1',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-10 22:00:00',	NULL,	NULL),
(59,	'Job Fair Announcement',	'A job fair will be held at the barangay covered court on December 22nd. Various companies will be accepting applications. Bring your resume and valid IDs.',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-05 18:00:00',	NULL,	NULL),
(60,	'Garbage Collection Schedule Update',	'New garbage collection schedule: Biodegradable waste on Mondays and Thursdays, Non-biodegradable on Tuesdays and Fridays. Recyclables on Saturdays.',	'1',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-07-10 16:00:00',	NULL,	NULL),
(61,	'Free Skills Training Workshop',	'Free cooking and baking workshop for interested residents. Limited slots available. Register at the barangay hall until December 16th. Materials provided.',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-06-25 17:30:00',	NULL,	NULL),
(62,	'Road Closure Advisory',	'Main road will be closed for repairs from December 14-16. Use alternate routes via Purok 3 and Purok 5. Heavy vehicles are not allowed.',	'5',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-21 00:00:00',	NULL,	NULL),
(63,	'Youth Development Program',	'Calling all youth ages 15-21! Join our youth development program featuring leadership training, sports activities, and educational workshops. Registration ongoing.',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-08-30 19:00:00',	NULL,	NULL),
(55,	'Basketball Tournament Registration',	'Basketball tournament registration is now open! Teams must register by December 20th. Maximum of 12 players per team. Contact the barangay sports coordinator.',	'3',	1,	'2025-09-05 16:56:47.727716',	'2025-10-05 16:56:47.727716',	1,	'2025-09-15 19:00:00',	NULL,	NULL),
(75,	'Ayuda 4th Tranche',	'Announcement! Dumating na po ang ayuda para sa 4th Tranche.',	'1',	6,	'2025-10-06 18:41:48.458084',	'2025-10-06 18:49:43.605',	6,	'2025-10-06 18:49:43.605',	'multiple',	'["special_category:PWD","special_category:SENIOR_CITIZEN"]'),
(82,	'Ayuda 9th Tranche',	'Announcement! Dumating na po ang ayuda for 9th tranche',	'5',	6,	'2025-10-08 23:48:41.333',	'2025-10-09 03:33:14.654',	6,	'2025-10-09 03:33:14.654',	'special_category',	'PWD'),
(85,	'Ayuda for SP',	'Announcement! Dumating na po ang ayuda for SP

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum 2',	'1',	6,	'2025-10-09 11:10:49.40895',	'2025-10-09 12:50:16.525',	6,	'2025-10-09 12:50:16.525',	'special_category',	'SOLO_PARENT'),
(64,	'Tax Declaration Reminder',	'Reminder to all property owners: Real property tax declarations are due by December 31st. Visit the barangay office for payment.',	'1',	1,	'2025-10-05 16:56:47.727716',	'2025-10-09 01:15:22.348',	6,	'2025-10-09 01:15:22.348',	'special_category',	'PWD'),
(80,	'Ayuda 7th Tranche',	'Announcement! Dumating na po ang ayuda para sa 7th Tranche.',	'4',	6,	'2025-10-08 00:10:07.366292',	'2025-10-08 00:11:03.442',	6,	'2025-10-08 00:11:03.442',	'multiple',	'["special_category:PWD","special_category:SENIOR_CITIZEN","special_category:SOLO_PARENT"]'),
(65,	'New Year Celebration Guidelines',	'Guidelines for New Year celebration: No firecrackers allowed. Community fireworks display will be held at the barangay plaza. Let''s celebrate safely!',	'3',	1,	'2025-10-05 16:56:47.727716',	'2025-10-09 04:17:39.771',	6,	'2025-10-09 04:17:39.771',	'all',	NULL),
(83,	'Ayuda 10th Tranche',	'Announcement! Dumating na po ang ayuda for 10th tranche',	'4',	6,	'2025-10-09 01:05:10.335975',	'2025-10-09 01:05:14.016',	6,	'2025-10-09 01:05:14.016',	'all',	NULL),
(86,	'Ayuda for PWDs',	'Announcement! Dumating na po ang ayuda para sa mga PWDs

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum 2',	'4',	6,	'2025-10-09 13:54:02.010441',	'2025-10-09 13:54:10.081',	6,	'2025-10-09 13:54:10.081',	'special_category',	'PWD'),
(72,	'Ayuda 2nd Tranche',	'Announcement! Dumating napo ang ayuda para sa mga walang pera. Bumisita po sa ating barangay office upang kumuha ng ayuda. Maraming Salamat po.',	'1',	6,	'2025-10-06 10:29:54.850391',	'2025-10-06 18:13:15.127',	6,	'2025-10-06 18:13:15.127',	NULL,	NULL);

DROP TABLE IF EXISTS "audit_logs";
DROP SEQUENCE IF EXISTS audit_logs_id_seq;
CREATE SEQUENCE audit_logs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."audit_logs" (
    "id" integer DEFAULT nextval('audit_logs_id_seq') NOT NULL,
    "table_name" character varying(50) NOT NULL,
    "record_id" integer NOT NULL,
    "operation" character varying(10) NOT NULL,
    "old_values" jsonb,
    "new_values" jsonb,
    "changed_by" integer,
    "changed_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_operation_check" CHECK (((operation)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
) WITH (oids = false);

COMMENT ON TABLE "public"."audit_logs" IS 'System audit trail for data changes';

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);

CREATE INDEX idx_audit_logs_record_id ON public.audit_logs USING btree (record_id);

CREATE INDEX idx_audit_logs_operation ON public.audit_logs USING btree (operation);

CREATE INDEX idx_audit_logs_changed_at ON public.audit_logs USING btree (changed_at);


DROP TABLE IF EXISTS "chat_conversations";
DROP SEQUENCE IF EXISTS chat_conversations_id_seq;
CREATE SEQUENCE chat_conversations_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 79 CACHE 1;

CREATE TABLE "public"."chat_conversations" (
    "id" integer DEFAULT nextval('chat_conversations_id_seq') NOT NULL,
    "user_id" integer,
    "session_id" character varying(100) NOT NULL,
    "started_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "ended_at" timestamp,
    "is_active" integer DEFAULT '1',
    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."chat_conversations" IS 'Chat sessions between users and chatbot';

CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations USING btree (user_id);

CREATE INDEX idx_chat_conversations_session_id ON public.chat_conversations USING btree (session_id);

CREATE INDEX idx_chat_conversations_active ON public.chat_conversations USING btree (is_active);

INSERT INTO "chat_conversations" ("id", "user_id", "session_id", "started_at", "ended_at", "is_active") VALUES
(61,	NULL,	'session-1759930221116-5tfa8lwf4',	'2025-10-08 22:43:28.075978',	'2025-10-08 22:56:37.902875',	0),
(62,	NULL,	'session-1759935397911-ykwb1fi18',	'2025-10-08 22:56:40.561875',	'2025-10-08 22:57:16.941856',	0),
(63,	NULL,	'session-1759935436971-po1n4lx3y',	'2025-10-08 22:57:19.350278',	'2025-10-09 01:03:19.736428',	0),
(64,	NULL,	'session-1759942999738-v1wshgrum',	'2025-10-09 01:06:48.375188',	'2025-10-09 01:27:32.987528',	0),
(65,	NULL,	'session-1759944452993-p66ymvez6',	'2025-10-09 04:15:40.277623',	'2025-10-09 13:10:11.866496',	0),
(66,	NULL,	'session-1759986611881-0dsanxeux',	'2025-10-09 13:10:17.091004',	'2025-10-09 13:13:27.648176',	0),
(67,	NULL,	'session-1759986807655-an6espipl',	'2025-10-09 13:47:14.403868',	'2025-10-09 14:11:38.099629',	0),
(68,	NULL,	'session-1759990298111-ih77yazek',	'2025-10-09 14:11:41.029612',	'2025-10-09 14:41:02.289421',	0),
(69,	NULL,	'session-1759992062306-9xgezsibu',	'2025-10-09 14:41:04.655881',	'2025-10-09 14:47:20.948379',	0),
(70,	NULL,	'session-1759992440960-guxturnoq',	'2025-10-09 14:47:25.831105',	'2025-10-09 14:48:11.659066',	0),
(71,	NULL,	'session-1759992520737-0zedfkw94',	'2025-10-09 14:50:50.761171',	'2025-10-09 14:51:02.551963',	0),
(72,	NULL,	'session-1759992662558-rtj2kvliq',	'2025-10-09 14:51:15.645267',	'2025-10-09 14:55:16.516382',	0),
(73,	NULL,	'session-1759992916526-jdq0q92sh',	'2025-10-09 14:59:05.056602',	'2025-10-09 15:02:00.667467',	0),
(74,	NULL,	'session-1759993320678-ymg6bqcl9',	'2025-10-09 15:02:04.532179',	'2025-10-09 15:11:11.563886',	0),
(75,	NULL,	'session-1759993871588-uxvtrxxa6',	'2025-10-09 23:03:46.357879',	'2025-10-10 10:11:13.925887',	0),
(76,	NULL,	'session-1760087485853-5t4ajrvoe',	'2025-10-10 22:50:01.839222',	NULL,	1),
(77,	NULL,	'session-1760062273937-68tnnn3o8',	'2025-10-10 23:01:48.35817',	'2025-10-10 23:31:12.476746',	0),
(78,	NULL,	'session-1760110272489-1brtsfwud',	'2025-10-12 13:50:34.479265',	'2025-10-14 14:06:40.609815',	0);

DROP TABLE IF EXISTS "chat_messages";
DROP SEQUENCE IF EXISTS chat_messages_id_seq;
CREATE SEQUENCE chat_messages_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 498 CACHE 1;

CREATE TABLE "public"."chat_messages" (
    "id" integer DEFAULT nextval('chat_messages_id_seq') NOT NULL,
    "conversation_id" integer,
    "message_type" character varying(20) NOT NULL,
    "message_text" text NOT NULL,
    "faq_id" integer,
    "was_helpful" integer,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_messages_message_type_check" CHECK (((message_type)::text = ANY ((ARRAY['user'::character varying, 'bot'::character varying, 'system'::character varying])::text[])))
) WITH (oids = false);

COMMENT ON TABLE "public"."chat_messages" IS 'Individual messages within chat conversations';

COMMENT ON COLUMN "public"."chat_messages"."was_helpful" IS 'User feedback: NULL=no feedback, 1=helpful, 0=not helpful';

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages USING btree (conversation_id);

CREATE INDEX idx_chat_messages_type ON public.chat_messages USING btree (message_type);

CREATE INDEX idx_chat_messages_faq_id ON public.chat_messages USING btree (faq_id);

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);

INSERT INTO "chat_messages" ("id", "conversation_id", "message_type", "message_text", "faq_id", "was_helpful", "created_at") VALUES
(369,	61,	'user',	'are you ai?',	NULL,	NULL,	'2025-10-08 22:43:28.088968'),
(370,	61,	'bot',	'Yes, I am Ka-Lias, a helpful AI assistant for Barangay Lias, Marilao, Bulacan. I''m here to provide information and assist residents with their inquiries about barangay services and procedures.',	NULL,	NULL,	'2025-10-08 22:43:30.694658'),
(371,	61,	'user',	'are you still ai?',	NULL,	NULL,	'2025-10-08 22:56:00.437103'),
(372,	61,	'bot',	'I''m sorry, I couldn''t find a specific answer to your question. 

Here are some things I can help you with:
• Document requests and requirements
• Barangay services and programs
• Office hours and contact information
• Registration and account questions
• Announcements and updates

Please try rephrasing your question or browse the FAQ categories below.',	NULL,	NULL,	'2025-10-08 22:56:01.973595'),
(373,	62,	'user',	'are you AI?',	NULL,	NULL,	'2025-10-08 22:56:40.570401'),
(374,	62,	'bot',	'I''m sorry, I couldn''t find a specific answer to your question. 

Here are some things I can help you with:
• Document requests and requirements
• Barangay services and programs
• Office hours and contact information
• Registration and account questions
• Announcements and updates

Please try rephrasing your question or browse the FAQ categories below.',	NULL,	NULL,	'2025-10-08 22:56:41.788606'),
(375,	63,	'user',	'are you ai?',	NULL,	NULL,	'2025-10-08 22:57:19.36254'),
(376,	63,	'bot',	'I''m sorry, I couldn''t find a specific answer to your question. 

Here are some things I can help you with:
• Document requests and requirements
• Barangay services and programs
• Office hours and contact information
• Registration and account questions
• Announcements and updates

Please try rephrasing your question or browse the FAQ categories below.',	NULL,	NULL,	'2025-10-08 22:57:20.685016'),
(377,	63,	'user',	'are you AI?',	NULL,	NULL,	'2025-10-08 23:05:03.821278'),
(378,	63,	'bot',	'Yes, I am Ka-Lias, an AI assistant specifically designed to help residents of Barangay Lias, Marilao, Bulacan.',	NULL,	NULL,	'2025-10-08 23:05:07.101918'),
(379,	63,	'user',	'are you still AI?',	NULL,	NULL,	'2025-10-08 23:25:44.903088'),
(380,	63,	'bot',	'Yes, I am still Ka-Lias, an AI assistant dedicated to helping residents of Barangay Lias, Marilao, Bulacan. How may I assist you today?',	NULL,	NULL,	'2025-10-08 23:25:47.12134'),
(381,	64,	'user',	'are you AI?',	NULL,	NULL,	'2025-10-09 01:06:48.38115'),
(382,	64,	'bot',	'Yes, I am an AI assistant named Ka-Lias, here to help residents of Barangay Lias with information and guidance regarding barangay services and procedures.',	NULL,	NULL,	'2025-10-09 01:06:50.257812'),
(383,	64,	'user',	'can you help me to locate where is barangay lias office?',	NULL,	NULL,	'2025-10-09 01:07:01.853116'),
(384,	64,	'bot',	'I apologize, but I don''t have the exact physical address or directions to the Barangay Lias office in my current information.

For the precise location, I recommend that you:
*   Visit the Barangay Lias office directly to inquire.
*   Ask a local resident of Barangay Lias for directions.

The Barangay Lias office hours are:
*   **Monday to Friday:** 8:00 AM - 5:00 PM (with a lunch break from 12:00 PM - 1:00 PM)
*   **Saturday:** 8:00 AM - 12:00 PM
*   **Sunday & Holidays:** Closed',	NULL,	NULL,	'2025-10-09 01:07:06.874849'),
(385,	64,	'user',	'What are the office hours?',	NULL,	NULL,	'2025-10-09 01:27:15.691621'),
(386,	64,	'bot',	'**Barangay Lias Office Hours:**

📅 **Monday to Friday:** 8:00 AM - 5:00 PM
📅 **Saturday:** 8:00 AM - 12:00 PM
📅 **Sunday & Holidays:** Closed

**Lunch Break:** 12:00 PM - 1:00 PM

For urgent matters outside office hours, please contact the emergency hotline or reach out to barangay officials.',	5,	NULL,	'2025-10-09 01:27:15.732996'),
(387,	64,	'user',	'How can I contact barangay officials?',	NULL,	NULL,	'2025-10-09 01:27:18.825563'),
(388,	64,	'bot',	'You can contact Barangay Lias officials through:

📞 **Barangay Hall Landline:** (046) XXX-XXXX
📱 **Mobile/SMS:** 0947-XXX-XXXX
📧 **Email:** barangaylias@example.com
📍 **Visit:** Barangay Hall, Barangay Lias, Imus, Cavite

**Office Hours:**
• Monday-Friday: 8:00 AM - 5:00 PM
• Saturday: 8:00 AM - 12:00 PM

For emergencies, please contact the emergency hotline: **911**',	6,	NULL,	'2025-10-09 01:27:18.930464'),
(389,	65,	'user',	'are you AI?',	NULL,	NULL,	'2025-10-09 04:15:40.288254'),
(390,	65,	'bot',	'Yes, I am Ka-Lias, an AI assistant specifically designed to help residents of Barangay Lias, Marilao, Bulacan with their inquiries.',	NULL,	NULL,	'2025-10-09 04:15:42.340325'),
(391,	65,	'user',	'How much is the doucment?',	NULL,	NULL,	'2025-10-09 04:27:43.777869'),
(392,	65,	'bot',	'For a Barangay Clearance, the processing fee is **₱50.00**.

Please note that fees can vary for other types of documents, and some certificates like the Certificate of Indigency are usually free for qualified residents. It''s best to specify which document you are referring to or inquire directly at the Barangay Office for the exact fee.',	NULL,	NULL,	'2025-10-09 04:27:48.742296'),
(393,	65,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-09 10:24:02.590933'),
(394,	65,	'bot',	'Yes, I am Ka-Lias, an AI assistant specifically designed to help residents of Barangay Lias, Marilao, Bulacan, with their inquiries. How can I assist you today?',	NULL,	NULL,	'2025-10-09 10:24:04.212128'),
(395,	65,	'user',	'I want to file a blotter',	NULL,	NULL,	'2025-10-09 10:24:09.896394'),
(396,	65,	'bot',	'To file a blotter, here''s the process:

*   **Purpose:** A blotter is an official record of an incident or complaint that occurred within Barangay Lias. This document serves as a formal account of what happened and can be used as supporting evidence if you need to pursue further action with the police or other authorities.
*   **Requirements:**
    *   A valid ID (e.g',	NULL,	NULL,	'2025-10-09 10:24:17.335471'),
(397,	65,	'user',	'I want to file a blotter',	NULL,	NULL,	'2025-10-09 10:24:31.791719'),
(398,	65,	'bot',	'To file a blotter, you should go to the Barangay Office. A blotter serves as an official record of an incident that occurred within the barangay''s jurisdiction.

Here''s what you need to do:
*   **Purpose:** To formally record an incident or complaint for official reference, investigation, or potential mediation.
*   **Requirements:**
    *   Valid ID (any government-issued ID)
    *   Complete details of the incident (what happened, when, where, who was involved)
*   **Where to approach:** Proceed to the Barangay Office and approach the Barangay Tanod or the Barangay Secretary.
*   **Fees:** Filing a blotter usually does not require any fee.
*   **Processing Time:** Blotter reports are typically processed on the same day.
*   **Next Steps:** The barangay will record the incident in their logbook. Depending on the nature of the incident, the barangay may initiate mediation (if applicable) or provide advice on further actions, such as reporting to the police if it''s a criminal matter.

Please prepare your valid ID and the details of the incident, then visit the Barangay Office for assistance.',	NULL,	NULL,	'2025-10-09 10:24:36.827948'),
(399,	65,	'user',	'are you AI?',	NULL,	NULL,	'2025-10-09 10:31:52.131688'),
(400,	65,	'bot',	'I''m sorry, I couldn''t find a specific answer to your question. 

Here are some things I can help you with:
• Document requests and requirements
• Barangay services and programs
• Office hours and contact information
• Registration and account questions
• Announcements and updates

Please try rephrasing your question or browse the FAQ categories below.',	NULL,	NULL,	'2025-10-09 10:31:52.211449'),
(401,	66,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-09 13:10:17.098592'),
(402,	66,	'bot',	'Yes, I am Ka-Lias, an AI assistant specifically designed to help residents of Barangay Lias, Marilao, Bulacan, with their inquiries about barangay services and procedures. How may I assist you today?',	NULL,	NULL,	'2025-10-09 13:10:19.224551'),
(403,	66,	'user',	'I want to konw how much is the fencing permit?',	NULL,	NULL,	'2025-10-09 13:10:32.856736'),
(404,	66,	'bot',	'The fencing permit is ₱75.00. Ito po ay para sa fence construction.

To request this document, you can log in to your account and go to the Documents section.',	NULL,	NULL,	'2025-10-09 13:10:35.714318'),
(484,	76,	'user',	'hi i''m lloyd.',	NULL,	NULL,	'2025-10-10 22:54:56.11511'),
(405,	66,	'user',	'How to do document request?',	NULL,	NULL,	'2025-10-09 13:11:10.22928'),
(406,	66,	'bot',	'You can request the following documents from Barangay Lias:

1. **Barangay Clearance** (₱50.00) - Required for employment and various transactions
2. **Certificate of Residency** (₱40.00) - For school enrollment and government transactions
3. **Certificate of Good Moral** (₱30.00) - Character reference certificate
4. **Certificate of Indigency - Medical** (Free) - For medical assistance
5. **Certificate of Indigency - Financial** (Free) - For financial assistance
6. **Business Permit Clearance** (₱100.00) - For small business operations
7. **Electrical Permit** (₱100.00) - For electrical installations
8. **Fence Permit** (₱75.00) - For fence construction
9. **Excavation Permit** (₱150.00) - For excavation activities

To request any document, please log in to your account and go to the Documents section.',	1,	NULL,	'2025-10-09 13:11:10.252439'),
(407,	66,	'user',	'give me instruction for the document request via smartlias?',	NULL,	NULL,	'2025-10-09 13:11:34.061108'),
(408,	66,	'bot',	'To request a document via SmartLias, you''ll need to follow these steps:

1.  **Log in** to your SmartLias account.
2.  Go to the **"Documents"** or **"Requests"** section.
3.  Click on **"Request Document."**
4.  **Select the specific document** you need from the list (e.g., Barangay Clearance, Certificate of Residency, etc.).
5.  **Fill in the purpose** of your request.
6.  **Upload any supporting documents** that might be required for your chosen certificate.
7.  Click **Submit.**

You will receive a notification when your document''s status changes, and you can track it in your account.',	NULL,	NULL,	'2025-10-09 13:11:37.913285'),
(409,	66,	'user',	'ok thanks',	NULL,	NULL,	'2025-10-09 13:11:49.440506'),
(410,	66,	'bot',	'You''re welcome! Glad I could help.

Is there anything else I can assist you with today regarding Barangay Lias?',	NULL,	NULL,	'2025-10-09 13:11:52.055807'),
(411,	66,	'user',	'no nothing all good',	NULL,	NULL,	'2025-10-09 13:12:00.664397'),
(412,	66,	'bot',	'Great to hear! If you have any questions or need assistance in the future, just let me know. I''m here to help our residents in Barangay Lias.',	NULL,	NULL,	'2025-10-09 13:12:02.860635'),
(413,	67,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-09 13:47:14.411771'),
(414,	67,	'bot',	'Opo, ako po si Ka-Lias, isang AI assistant na binuo upang tumulong sa mga residente ng Barangay Lias, Marilao, Bulacan. Paano po ako makakatulong sa inyo ngayon?',	NULL,	NULL,	'2025-10-09 13:47:16.224318'),
(415,	67,	'user',	'Dont use tagalog',	NULL,	NULL,	'2025-10-09 13:47:28.308273'),
(416,	67,	'bot',	'Understood! I will use English for my responses.

Please feel free to ask your questions about Barangay Lias, and I will do my best to assist you in English.',	NULL,	NULL,	'2025-10-09 13:47:31.077461'),
(417,	67,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-09 13:47:36.766794'),
(418,	67,	'bot',	'Yes, I am Ka-Lias, an AI assistant created to help residents of Barangay Lias, Marilao, Bulacan with their inquiries about barangay services and procedures.',	NULL,	NULL,	'2025-10-09 13:47:38.406444'),
(419,	67,	'user',	'Give me list of doucment requests list',	NULL,	NULL,	'2025-10-09 13:47:49.726714'),
(420,	67,	'bot',	'Here''s the list of document requests you can make from Barangay Lias:

1.  **Barangay Clearance** (₱50.00)
2.  **Certificate of Residency** (₱40.00)
3.  **Certificate of Good Moral** (₱30.00)
4.  **Certificate of Indigency - Medical** (Free)
5.  **Certificate of Indigency - Financial** (Free)
6.  **Business Permit Clearance** (₱100.00)
7.  **Electrical Permit** (₱100.00)
8.  **Fence Permit** (₱75.00)
9.  **Excavation Permit** (₱150.00)

To request any of these, please log in to your account and go to the Documents section.',	NULL,	NULL,	'2025-10-09 13:47:52.272296'),
(421,	67,	'user',	'Show me office hours',	NULL,	NULL,	'2025-10-09 13:47:59.403369'),
(422,	67,	'bot',	'**Barangay Lias Office Hours:**

📅 **Monday to Friday:** 8:00 AM - 5:00 PM
📅 **Saturday:** 8:00 AM - 12:00 PM
📅 **Sunday & Holidays:** Closed

**Lunch Break:** 12:00 PM - 1:00 PM

For urgent matters outside office hours, please contact the emergency hotline or reach out to barangay officials.',	5,	NULL,	'2025-10-09 13:47:59.434913'),
(423,	67,	'user',	'How much is fence permit fee?',	NULL,	NULL,	'2025-10-09 13:48:14.324801'),
(424,	67,	'bot',	'The fee for a Fence Permit is ₱75.00. This permit is required for fence construction.',	NULL,	NULL,	'2025-10-09 13:48:15.885131'),
(425,	67,	'user',	'How to file a blotter?',	NULL,	NULL,	'2025-10-09 13:48:38.168966'),
(426,	67,	'bot',	'To file a blotter or incident report in Barangay Lias, please follow these steps:

1.  **Where to go:** Proceed to the **Barangay Office**.
2.  **Who to approach:** Look for the **Barangay Tanod** or the **Barangay Secretary**. They are responsible for assisting with blotter reports.
3.  **Requirements:**
    *   Bring a **valid ID** (e.g., driver''s license, passport, SSS ID, PhilHealth ID).
    *   Prepare all the **details of the incident**, including what happened, when and where it occurred, who was involved, and any other relevant information.
4.  **Fees:** Filing a blotter report at the barangay is generally free of charge.

The Barangay Tanod or Secretary will help you document the incident accurately.',	NULL,	NULL,	'2025-10-09 13:48:43.064759'),
(427,	67,	'user',	'Who is the current Barangay Captain in Barangy Lias?',	NULL,	NULL,	'2025-10-09 13:51:03.566324'),
(428,	67,	'bot',	'Salamat sa iyong tanong!

Bilang isang AI assistant, wala po akong impormasyon tungkol sa kasalukuyang pangalan ng Barangay Captain ng Barangay Lias. Ang mga detalye po tungkol sa mga opisyales ay maaaring magbago at hindi po ito kasama sa aking kaalaman.

Para sa opisyal na impormasyon tungkol sa kasalukuyang Barangay Captain, pinakamainam po na direktang makipag-ugnayan sa Barangay Hall ng Barangay Lias. Narito po ang kanilang contact details:

📞 **Barangay Hall Landline:** (046) XXX-XXXX
📱 **Mobile/SMS:** 0947-XXX-XXXX
📧 **Email:** barangaylias@example.com
📍 **Visit:** Barangay Hall, Barangay Lias, Imus, Cavite

**Office Hours:**
• Monday-Friday: 8:00 AM - 5:00 PM
• Saturday: 8:00 AM - 12:00 PM',	NULL,	NULL,	'2025-10-09 13:51:06.874709'),
(429,	67,	'user',	'OK thanks',	NULL,	NULL,	'2025-10-09 13:51:25.123938'),
(430,	67,	'bot',	'You''re welcome! Feel free to ask if you have any more questions.',	NULL,	NULL,	'2025-10-09 13:51:26.292816'),
(431,	68,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-09 14:11:41.044653'),
(432,	68,	'bot',	'Yes, I am Ka-Lias, an AI assistant created to help residents of Barangay Lias, Marilao, Bulacan with their inquiries and provide useful information about barangay services.',	NULL,	NULL,	'2025-10-09 14:11:43.08993'),
(433,	68,	'user',	'What documents can I request?',	NULL,	NULL,	'2025-10-09 14:28:59.767803'),
(434,	68,	'bot',	'You can request the following documents from Barangay Lias:

1. **Barangay Clearance** (₱50.00) - Required for employment and various transactions
2. **Certificate of Residency** (₱40.00) - For school enrollment and government transactions
3. **Certificate of Good Moral** (₱30.00) - Character reference certificate
4. **Certificate of Indigency - Medical** (Free) - For medical assistance
5. **Certificate of Indigency - Financial** (Free) - For financial assistance
6. **Business Permit Clearance** (₱100.00) - For small business operations
7. **Electrical Permit** (₱100.00) - For electrical installations
8. **Fence Permit** (₱75.00) - For fence construction
9. **Excavation Permit** (₱150.00) - For excavation activities

To request any document, please log in to your account and go to the Documents section.',	1,	NULL,	'2025-10-09 14:28:59.80665'),
(435,	69,	'user',	'What documents can I request?',	NULL,	NULL,	'2025-10-09 14:41:04.661594'),
(481,	76,	'bot',	'Okay, I will communicate in English. How can I assist you today, kababayan?',	NULL,	NULL,	'2025-10-10 22:52:12.071249'),
(482,	76,	'user',	'Ah. Please help me calculate 1 + 1?',	NULL,	NULL,	'2025-10-10 22:52:30.900854'),
(485,	76,	'bot',	'Hi Lloyd! I am Ka-Lias, your helpful AI assistant for Barangay Lias. How may I assist you today?',	NULL,	NULL,	'2025-10-10 22:54:58.170395'),
(436,	69,	'bot',	'You can request the following documents from Barangay Lias:

1. **Barangay Clearance** (₱50.00) - Required for employment and various transactions
2. **Certificate of Residency** (₱40.00) - For school enrollment and government transactions
3. **Certificate of Good Moral** (₱30.00) - Character reference certificate
4. **Certificate of Indigency - Medical** (Free) - For medical assistance
5. **Certificate of Indigency - Financial** (Free) - For financial assistance
6. **Business Permit Clearance** (₱100.00) - For small business operations
7. **Electrical Permit** (₱100.00) - For electrical installations
8. **Fence Permit** (₱75.00) - For fence construction
9. **Excavation Permit** (₱150.00) - For excavation activities

To request any document, please log in to your account and go to the Documents section.',	1,	NULL,	'2025-10-09 14:41:04.71967'),
(437,	69,	'user',	'how much',	NULL,	NULL,	'2025-10-09 14:41:11.857402'),
(438,	69,	'bot',	'You can view barangay announcements in several ways:

**1. SmartLias Website (Public)**
• Visit the home page at http://smartlias.barangaylias.com
• Announcements are displayed on the main page
• No login required

**2. SmartLias Account (Residents)**
• Log in to your account
• Go to the "Announcements" section
• View all published announcements

**3. SMS Notifications**
• Important announcements are sent via SMS
• Make sure your mobile number is updated in your profile

**Types of Announcements:**
• General announcements
• Health programs
• Activities and events
• Assistance programs
• Advisories and alerts',	10,	NULL,	'2025-10-09 14:41:11.888564'),
(439,	69,	'user',	'What are the office hours?',	NULL,	NULL,	'2025-10-09 14:42:16.601098'),
(440,	69,	'bot',	'**Barangay Lias Office Hours:**

📅 **Monday to Friday:** 8:00 AM - 5:00 PM
📅 **Saturday:** 8:00 AM - 12:00 PM
📅 **Sunday & Holidays:** Closed

**Lunch Break:** 12:00 PM - 1:00 PM

For urgent matters outside office hours, please contact the emergency hotline or reach out to barangay officials.',	5,	NULL,	'2025-10-09 14:42:16.631716'),
(441,	69,	'user',	'What is smartlias',	NULL,	NULL,	'2025-10-09 14:42:20.462414'),
(442,	69,	'bot',	'SmartLias is the **official digital platform** of Barangay Lias, Imus, Cavite.

**Purpose:**
• Streamline barangay services and operations
• Provide easy access to barangay information
• Enable online document requests
• Facilitate communication between residents and officials

**Features:**
• 📄 Online document requests
• 📢 Real-time announcements and updates
• 📱 SMS notifications
• 👥 Resident profile management
• 💬 Chatbot assistance (FAQ support)

**Benefits:**
• Convenient 24/7 access
• Faster document processing
• Real-time updates
• Reduced need for physical visits
• Better communication

**Developed by:** Barangay Lias IT Team
**Launched:** 2025',	12,	NULL,	'2025-10-09 14:42:20.480779'),
(443,	70,	'user',	'What documents can I request?',	NULL,	NULL,	'2025-10-09 14:47:25.837931'),
(444,	70,	'bot',	'You can request the following documents from Barangay Lias:

1. **Barangay Clearance** (₱50.00) - Required for employment and various transactions
2. **Certificate of Residency** (₱40.00) - For school enrollment and government transactions
3. **Certificate of Good Moral** (₱30.00) - Character reference certificate
4. **Certificate of Indigency - Medical** (Free) - For medical assistance
5. **Certificate of Indigency - Financial** (Free) - For financial assistance
6. **Business Permit Clearance** (₱100.00) - For small business operations
7. **Electrical Permit** (₱100.00) - For electrical installations
8. **Fence Permit** (₱75.00) - For fence construction
9. **Excavation Permit** (₱150.00) - For excavation activities

To request any document, please log in to your account and go to the Documents section.',	1,	NULL,	'2025-10-09 14:47:25.877776'),
(445,	70,	'user',	'How do I request a barangay clearance?',	NULL,	NULL,	'2025-10-09 14:47:28.835013'),
(446,	70,	'bot',	'To request a Barangay Clearance:

1. **Log in** to your SmartLias account
2. Go to **"Documents"** or **"Requests"** section
3. Click **"Request Document"**
4. Select **"Barangay Clearance"** from the list
5. Fill in the **purpose** of your request
6. Upload any **supporting documents** (if required)
7. Click **Submit**

The processing fee is **₱50.00**. You will be notified when your document is ready for pickup at the Barangay Hall.

**Processing Time:** Usually 1-3 business days',	2,	NULL,	'2025-10-09 14:47:28.851542'),
(447,	70,	'user',	'How much?',	NULL,	NULL,	'2025-10-09 14:47:36.235924'),
(448,	70,	'bot',	'The cost depends on what specific service or document you are asking about.

For example:
*   **Certificate of Indigency** is usually free for qualified residents.
*   For other documents like a **Barangay Clearance** or services related to **business permit facilitation**, there might be corresponding fees. These fees can vary.

Could you please specify what document or service you are inquiring about so I can provide more accurate information? You can also visit the Barangay Office directly to inquire about the specific fees for your needs.',	NULL,	NULL,	'2025-10-09 14:47:43.548523'),
(449,	70,	'user',	'Business Permit',	NULL,	NULL,	'2025-10-09 14:47:51.399039'),
(450,	70,	'bot',	'You can request the following documents from Barangay Lias:

1. **Barangay Clearance** (₱50.00) - Required for employment and various transactions
2. **Certificate of Residency** (₱40.00) - For school enrollment and government transactions
3. **Certificate of Good Moral** (₱30.00) - Character reference certificate
4. **Certificate of Indigency - Medical** (Free) - For medical assistance
5. **Certificate of Indigency - Financial** (Free) - For financial assistance
6. **Business Permit Clearance** (₱100.00) - For small business operations
7. **Electrical Permit** (₱100.00) - For electrical installations
8. **Fence Permit** (₱75.00) - For fence construction
9. **Excavation Permit** (₱150.00) - For excavation activities

To request any document, please log in to your account and go to the Documents section.',	1,	NULL,	'2025-10-09 14:47:51.425253'),
(451,	70,	'user',	'What services does the barangay provide?',	NULL,	NULL,	'2025-10-09 14:47:57.938477'),
(452,	70,	'bot',	'Barangay Lias provides the following services:

📄 **Document Services**
• Barangay Clearance
• Certificates (Residency, Good Moral, Indigency)
• Permits (Business, Electrical, Fence, Excavation)

🏥 **Health Services**
• Free medical check-ups (Wednesdays)
• Vaccination programs
• Health education

🤝 **Assistance Programs**
• Financial assistance for indigent families
• Medical assistance
• PWD and senior citizen programs

📢 **Information Services**
• Announcements and advisories
• Event notifications via SMS

🔒 **Peace and Order**
• Barangay tanod services
• Mediation and dispute resolution',	7,	NULL,	'2025-10-09 14:47:57.954576'),
(453,	71,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-09 14:50:50.806708'),
(454,	71,	'bot',	'Hello! Yes, I am Ka-Lias, an AI assistant designed to help residents of Barangay Lias, Marilao, Bulacan with their inquiries and provide information about barangay services and procedures. How may I assist you today?',	NULL,	NULL,	'2025-10-09 14:50:52.775942'),
(455,	72,	'user',	'Ayuda?',	NULL,	NULL,	'2025-10-09 14:51:15.654945'),
(483,	76,	'bot',	'I''m sorry, I couldn''t find a specific answer to your question. 

Here are some things I can help you with:
• Document requests and requirements
• Barangay services and programs
• Office hours and contact information
• Registration and account questions
• Announcements and updates

Please try rephrasing your question or browse the FAQ categories below.',	NULL,	NULL,	'2025-10-10 22:52:42.251532'),
(486,	76,	'user',	'1+1?',	NULL,	NULL,	'2025-10-10 22:56:53.619857'),
(456,	72,	'bot',	'Ang "ayuda" po ay kadalasang tumutukoy sa mga programa ng tulong pinansyal o in-kind na ipinagkakaloob ng pamahalaan.

Para sa mga malalaking programa ng ayuda tulad ng Pantawid Pamilyang Pilipino Program (4Ps), ito po ay pinamamahalaan ng Department of Social Welfare and Development (DSWD) at ng Municipal Social Welfare and Development Office (MSWDO) sa Marilao. Ang barangay po ay hindi direktang namamahala sa distribusyon ng mga pambansang programa ng ayuda, subalit maaari po kaming magbigay ng mga supporting documents tulad ng Certificate of Indigency na maaaring kailanganin sa inyong aplikasyon.

Kung mayroon pong partikular na programa ng ayuda ang Barangay Lias o may anunsyo mula sa munisipyo, ito po ay ipinapaalam namin sa aming mga residente. Pinakamainam po na magtanong sa Barangay Office o sa MSWDO ng Marilao para sa pinakabagong impormasyon tungkol sa mga available na programa ng ayuda.',	NULL,	NULL,	'2025-10-09 14:51:21.839702'),
(457,	72,	'user',	'Kailan po ang next ayuda?',	NULL,	NULL,	'2025-10-09 14:51:36.525284'),
(458,	72,	'bot',	'Magandang araw po!

Ang iskedyul po ng susunod na ayuda ay hindi direktang itinakda ng barangay. Ang mga programa ng ayuda ay kadalasang galing sa pambansang pamahalaan (tulad ng DSWD) o sa lokal na pamahalaan ng Marilao.

Para po sa pinakatumpak na impormasyon tungkol sa susunod na ayuda, pinakamainam po na abangan ang mga opisyal na anunsyo mula sa DSWD, sa Municipal Social Welfare and Development Office (MSWDO) ng Marilao, o sa ating Barangay Office. Sila po ang nagbibigay ng impormasyon at nagpoproseso kapag may programa na po.',	NULL,	NULL,	'2025-10-09 14:51:42.530165'),
(459,	73,	'user',	'Kaylan po ang next na ayuda?',	NULL,	NULL,	'2025-10-09 14:59:05.073616'),
(460,	73,	'bot',	'I''m sorry, I couldn''t find a specific answer to your question. 

Here are some things I can help you with:
• Document requests and requirements
• Barangay services and programs
• Office hours and contact information
• Registration and account questions
• Announcements and updates

Please try rephrasing your question or browse the FAQ categories below.',	NULL,	NULL,	'2025-10-09 14:59:05.18835'),
(461,	73,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-09 14:59:11.844345'),
(462,	73,	'bot',	'I''m sorry, I couldn''t find a specific answer to your question. 

Here are some things I can help you with:
• Document requests and requirements
• Barangay services and programs
• Office hours and contact information
• Registration and account questions
• Announcements and updates

Please try rephrasing your question or browse the FAQ categories below.',	NULL,	NULL,	'2025-10-09 14:59:11.920983'),
(463,	74,	'user',	'Hello',	NULL,	NULL,	'2025-10-09 15:02:04.54456'),
(464,	74,	'bot',	'Hello! Welcome to Ka-Lias, your helpful AI assistant for Barangay Lias.

How can I assist you today? Please feel free to ask any questions you have about our barangay services, documents, or announcements.',	NULL,	NULL,	'2025-10-09 15:02:06.301932'),
(465,	74,	'user',	'How much?',	NULL,	NULL,	'2025-10-09 15:02:10.684959'),
(466,	74,	'bot',	'Hello! To help you better, could you please tell me what document or service you are asking about?

Here are some of the current fees for documents at Barangay Lias:

*   **Barangay Clearance:** ₱50.00
*   **Business Permit Clearance:** ₱100.00
*   **Certificate of Good Moral:** ₱30.00
*   **Certificate of Indigency (Financial):** FREE
*   **Certificate of Indigency (Medical):** FREE
*   **Certificate of Residency:** ₱40.00
*   **Electrical Permit:** ₱100.00
*   **Excavation Permit:** ₱150.00
*   **Fence Permit:** ₱75.00

If you are asking about something else, please let me know. You can also visit the Barangay Office for more details or other inquiries.',	NULL,	NULL,	'2025-10-09 15:02:14.67875'),
(467,	74,	'user',	'When is the next ayuda po?',	NULL,	NULL,	'2025-10-09 15:02:25.000857'),
(468,	74,	'bot',	'Ang impormasyon po tungkol sa susunod na ayuda ay kadalasang ina-announce ng DSWD o ng lokal na pamahalaan.

Para sa pinakabagong balita at iskedyul ng mga ayuda, pakitingnan po ang Announcements section sa SmartLIAS homepage, o sa inyong dashboard kung naka-login na kayo. Maaari rin po kayong dumiretso sa Barangay Office para sa opisyal na updates.',	NULL,	NULL,	'2025-10-09 15:02:29.830018'),
(469,	74,	'user',	'Okay, how much is fence permti?',	NULL,	NULL,	'2025-10-09 15:02:52.792044'),
(470,	74,	'bot',	'Okay, the fence permit is ₱75.00.',	NULL,	NULL,	'2025-10-09 15:02:54.574251'),
(471,	74,	'user',	'meron po ba tayong 4ps program?',	NULL,	NULL,	'2025-10-09 15:03:11.62024'),
(472,	74,	'bot',	'Kumusta po! Tungkol po sa 4Ps (Pantawid Pamilyang Pilipino Program), ito po ay isang pambansang programa na pinamamahalaan ng Department of Social Welfare and Development (DSWD). Hindi po direkta ang barangay ang nagpapatakbo ng programa o nagpoproseso ng aplikasyon para dito.

Para po sa mga aplikasyon at katanungan tungkol sa 4Ps, pinakamainam po na dumiretso sa Municipal Social Welfare and Development Office (MSWDO) ng Marilao o sa pinakamalapit na DSWD office. Sila po ang may kumpletong impormasyon at proseso sa pagtanggap ng mga benepisyaryo ng 4Ps.

Ang barangay po ay makakatulong sa inyo sa pagkuha ng mga supporting documents na maaaring hingin ng MSWDO o DSWD, tulad po ng Certificate of Indigency, kung kayo po ay kwalipikado.

Kung kailangan niyo po ng Certificate of Indigency, maaari po kayong pumunta sa aming Barangay Office. Libre po ito para sa kwalipikadong residente at kailangan po ng maikling interview/assessment. Magdala lang po kayo ng valid ID at patunay ng inyong residency.',	NULL,	NULL,	'2025-10-09 15:03:17.648636'),
(473,	74,	'user',	'OK thank you',	NULL,	NULL,	'2025-10-09 15:03:44.738998'),
(474,	74,	'bot',	'Walang anuman po! Kung may iba pa kayong katanungan, huwag mag-atubiling magtanong. Nandito po ako para tumulong.',	NULL,	NULL,	'2025-10-09 15:03:47.862456'),
(475,	75,	'user',	'What documents can I request?',	NULL,	NULL,	'2025-10-09 23:03:46.36944'),
(476,	75,	'bot',	'You can request the following documents from Barangay Lias:

1. **Barangay Clearance** (₱50.00) - Required for employment and various transactions
2. **Certificate of Residency** (₱40.00) - For school enrollment and government transactions
3. **Certificate of Good Moral** (₱30.00) - Character reference certificate
4. **Certificate of Indigency - Medical** (Free) - For medical assistance
5. **Certificate of Indigency - Financial** (Free) - For financial assistance
6. **Business Permit Clearance** (₱100.00) - For small business operations
7. **Electrical Permit** (₱100.00) - For electrical installations
8. **Fence Permit** (₱75.00) - For fence construction
9. **Excavation Permit** (₱150.00) - For excavation activities

To request any document, please log in to your account and go to the Documents section.',	1,	NULL,	'2025-10-09 23:03:46.424199'),
(477,	76,	'bot',	'🔒 **Privacy Notice & Data Protection**

Hi! I''m Ka-Lias, your AI assistant for Barangay Lias. Before we start, please read this important privacy notice:

**⚠️ DO NOT SHARE:**
• Your full name, address, or personal details
• Phone numbers, email addresses, or contact information  
• Birth dates, ID numbers, or government IDs
• Family member names or personal information
• Sensitive documents or private matters

**✅ I CAN HELP WITH:**
• General barangay services and procedures
• Document requirements and fees
• Office hours and contact information
• Government programs and announcements
• Public information and guidelines

**🛡️ Your Privacy:**
Our conversation is logged for service improvement, but personal information is automatically removed for your protection. For matters requiring personal details, please visit our office.

How can I help you with barangay services today?',	NULL,	NULL,	'2025-10-10 22:50:01.853403'),
(478,	76,	'user',	'Are you AI?',	NULL,	NULL,	'2025-10-10 22:51:57.804808'),
(479,	76,	'bot',	'Opo, ako po si Ka-Lias, isang AI assistant na binuo para tumulong sa mga residente ng Barangay Lias, Marilao, Bulacan. Narito po ako para magbigay ng impormasyon at gabay tungkol sa mga serbisyo ng barangay.',	NULL,	NULL,	'2025-10-10 22:51:59.621567'),
(480,	76,	'user',	'Please nglish',	NULL,	NULL,	'2025-10-10 22:52:04.792126'),
(487,	76,	'bot',	'As Ka-Lias, an AI assistant for Barangay Lias, I focus on providing information about barangay services and community matters. Your question "1+1?" is a mathematical query and is outside the scope of the services I provide.',	NULL,	NULL,	'2025-10-10 22:56:58.796515'),
(488,	77,	'bot',	'🔒 **Privacy Notice & Data Protection**

Hi! I''m Ka-Lias, your AI assistant for Barangay Lias. Before we start, please read this important privacy notice:

**⚠️ DO NOT SHARE:**
• Your full name, address, or personal details
• Phone numbers, email addresses, or contact information  
• Birth dates, ID numbers, or government IDs
• Family member names or personal information
• Sensitive documents or private matters

**✅ I CAN HELP WITH:**
• General barangay services and procedures
• Document requirements and fees
• Office hours and contact information
• Government programs and announcements
• Public information and guidelines

**🛡️ Your Privacy:**
Our conversation is logged for service improvement, but personal information is automatically removed for your protection. For matters requiring personal details, please visit our office.

How can I help you with barangay services today?',	NULL,	NULL,	'2025-10-10 23:01:48.373971'),
(489,	77,	'user',	'I dont have money, how do I request?',	NULL,	NULL,	'2025-10-10 23:29:21.751334'),
(490,	77,	'bot',	'I found information about available documents. Here are the documents you can request from Barangay Lias:',	NULL,	NULL,	'2025-10-10 23:29:32.975819'),
(491,	77,	'user',	'are you AI?',	NULL,	NULL,	'2025-10-10 23:29:37.940852'),
(492,	77,	'bot',	'Yes, I am Ka-Lias, an AI assistant for Barangay Lias, Marilao, Bulacan. I''m here to help you with general information and services about our barangay.',	NULL,	NULL,	'2025-10-10 23:29:39.846624'),
(493,	77,	'user',	'I dont have money, how do I request?',	NULL,	NULL,	'2025-10-10 23:30:16.898231'),
(494,	77,	'bot',	'Hello! I understand your concern about not having money for requests.

While some barangay documents and permits have a processing fee, like the Barangay Clearance (₱50.00), Electrical Permit (₱100.00), or Fence Permit (₱75.00), there are certain documents that are usually free for qualified residents, especially those facing financial difficulties.

One such document is the **Certificate of Indigency**. This certificate is typically issued to residents who are genuinely in need and can''t afford basic necessities. It is often free for qualified individuals.

To request any document or service, especially if you have concerns about fees, it''s best to:

1.  **Visit the Barangay Office:** Explain your situation and what document or service you need to the Barangay Secretary or a staff member.
2.  **Bring a valid ID:** This is usually required for any transaction.
3.  **Undergo Assessment:** For documents like the Certificate of Indigency, an interview or assessment may be conducted to determine your eligibility.

The barangay staff can guide you on the specific requirements and whether fees apply to your particular request, and if there are any available waivers or assistance based on your situation.',	NULL,	NULL,	'2025-10-10 23:30:24.28032'),
(495,	78,	'bot',	'🔒 **Privacy Notice & Data Protection**

Hi! I''m Ka-Lias, your AI assistant for Barangay Lias. Before we start, please read this important privacy notice:

**⚠️ DO NOT SHARE:**
• Your full name, address, or personal details
• Phone numbers, email addresses, or contact information  
• Birth dates, ID numbers, or government IDs
• Family member names or personal information
• Sensitive documents or private matters

**✅ I CAN HELP WITH:**
• General barangay services and procedures
• Document requirements and fees
• Office hours and contact information
• Government programs and announcements
• Public information and guidelines

**🛡️ Your Privacy:**
Our conversation is logged for service improvement, but personal information is automatically removed for your protection. For matters requiring personal details, please visit our office.

How can I help you with barangay services today?',	NULL,	NULL,	'2025-10-12 13:50:34.496106'),
(496,	78,	'user',	'Hello',	NULL,	NULL,	'2025-10-14 14:06:38.355326'),
(497,	78,	'bot',	'Hello! I am Ka-Lias, your helpful AI assistant for Barangay Lias. How can I assist you today?',	NULL,	NULL,	'2025-10-14 14:06:39.683472');

DROP TABLE IF EXISTS "document_catalog";
DROP SEQUENCE IF EXISTS document_catalog_id_seq;
CREATE SEQUENCE document_catalog_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 10 CACHE 1;

CREATE TABLE "public"."document_catalog" (
    "id" integer DEFAULT nextval('document_catalog_id_seq') NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" text,
    "filename" character varying(255),
    "fee" numeric(10,2) DEFAULT '0.00',
    "is_active" integer DEFAULT '1',
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_catalog_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."document_catalog" IS 'Master catalog of available document types with fees and requirements';

COMMENT ON COLUMN "public"."document_catalog"."id" IS 'Primary key - unique identifier for document types';

COMMENT ON COLUMN "public"."document_catalog"."title" IS 'Official document name: Barangay Clearance, Certificate of Indigency, etc.';

COMMENT ON COLUMN "public"."document_catalog"."description" IS 'Detailed description including requirements and processing info';

COMMENT ON COLUMN "public"."document_catalog"."filename" IS 'Template file name for document generation - optional';

COMMENT ON COLUMN "public"."document_catalog"."fee" IS 'Processing fee in Philippine Peso (₱) - 0.00 for free documents';

COMMENT ON COLUMN "public"."document_catalog"."is_active" IS '1=available for request, 0=temporarily disabled/unavailable';

COMMENT ON COLUMN "public"."document_catalog"."created_at" IS 'Document type creation timestamp';

COMMENT ON COLUMN "public"."document_catalog"."updated_at" IS 'Last modification timestamp for document type';

CREATE INDEX idx_document_catalog_active ON public.document_catalog USING btree (is_active);

CREATE INDEX idx_document_catalog_title ON public.document_catalog USING btree (title);

INSERT INTO "document_catalog" ("id", "title", "description", "filename", "fee", "is_active", "created_at", "updated_at") VALUES
(4,	'Barangay Clearance',	'Certificate indicating no pending cases or issues in the barangay. Required for employment and various transactions.',	'barangay_clearance_template.docx',	50.00,	1,	'2025-10-09 20:04:50.069736',	'2025-10-09 20:04:50.069736'),
(8,	'Certificate of Indigency (Financial)',	'Document certifying indigent status for financial assistance and social services programs.',	'indigency_financial_template.docx',	0.00,	1,	'2025-10-09 20:04:50.069736',	'2025-10-09 20:04:50.069736'),
(7,	'Certificate of Indigency (Medical)',	'Document certifying indigent status specifically for medical assistance and healthcare support programs.',	'indigency_medical_template.docx',	0.00,	1,	'2025-10-09 20:04:50.069736',	'2025-10-09 20:04:50.069736'),
(1,	'Electrical Permit',	'Permit required for electrical installations and repairs in residential or commercial properties.',	'electrical_permit_template.docx',	500.00,	1,	'2025-10-09 20:04:50.069736',	'2025-10-09 20:04:50.069736'),
(9,	'Business Permit Clearance',	'Barangay clearance required for small business operations and business permit applications.',	'business_permit_template.docx',	0.00,	1,	'2025-10-09 20:04:50.069736',	'2025-10-09 20:04:50.069736'),
(3,	'Excavation Permit',	'Permit for excavation activities including digging, construction foundations, and land development.',	'excavation_permit_template.docx',	100.00,	1,	'2025-10-09 20:04:50.069736',	'2025-10-09 20:04:50.069736'),
(2,	'Fence Permit',	'Authorization to construct fences around residential or commercial properties within barangay jurisdiction.',	'fence_permit_template.docx',	500.00,	0,	'2025-10-09 20:04:50.069736',	'2025-10-09 20:04:50.069736');

DROP TABLE IF EXISTS "document_requests";
DROP SEQUENCE IF EXISTS document_requests_id_seq;
CREATE SEQUENCE document_requests_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 49 CACHE 1;

CREATE TABLE "public"."document_requests" (
    "id" integer DEFAULT nextval('document_requests_id_seq') NOT NULL,
    "user_id" integer NOT NULL,
    "document_id" integer NOT NULL,
    "purpose" character varying(255),
    "remarks" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "processed_by" integer,
    "processed_at" timestamp,
    "notes" text,
    "status" integer NOT NULL,
    "details" jsonb DEFAULT '{}',
    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."document_requests" IS 'Resident document requests and applications for barangay certificates and clearances';

COMMENT ON COLUMN "public"."document_requests"."id" IS 'Primary key - unique identifier for document requests';

COMMENT ON COLUMN "public"."document_requests"."user_id" IS 'Links to residents table - who requested the document';

COMMENT ON COLUMN "public"."document_requests"."document_id" IS 'Links to document_catalog table - what document type was requested';

COMMENT ON COLUMN "public"."document_requests"."purpose" IS 'Free text - why the resident needs this document';

COMMENT ON COLUMN "public"."document_requests"."remarks" IS 'Internal staff/admin notes - processing details, rejection reasons, special instructions';

COMMENT ON COLUMN "public"."document_requests"."created_at" IS 'Request submission timestamp - when resident submitted request';

COMMENT ON COLUMN "public"."document_requests"."updated_at" IS 'Last status change timestamp - updated on any modifications';

COMMENT ON COLUMN "public"."document_requests"."processed_by" IS 'Which admin/staff user processed/completed the request';

COMMENT ON COLUMN "public"."document_requests"."processed_at" IS 'When the request was completed/processed';

COMMENT ON COLUMN "public"."document_requests"."notes" IS 'Additional information or special requests from the resident';

COMMENT ON COLUMN "public"."document_requests"."details" IS 'Document-specific additional fields as JSON (e.g., business_name, business_address, derogatory_info, etc.)';

CREATE INDEX idx_document_requests_document_id ON public.document_requests USING btree (document_id);

CREATE INDEX idx_document_requests_created_at ON public.document_requests USING btree (created_at);

CREATE INDEX idx_document_requests_processed_by ON public.document_requests USING btree (processed_by);

CREATE INDEX idx_document_requests_resident_id ON public.document_requests USING btree (user_id);

CREATE INDEX idx_document_requests_details ON public.document_requests USING gin (details);

INSERT INTO "document_requests" ("id", "user_id", "document_id", "purpose", "remarks", "created_at", "updated_at", "processed_by", "processed_at", "notes", "status", "details") VALUES
(43,	9,	4,	'Employment requirement',	NULL,	'2025-10-14 00:41:56.002304',	'2025-10-14 00:41:56.002304',	NULL,	NULL,	'Need by 3 days. ASAP',	0,	NULL),
(44,	9,	1,	'Electrical repair',	'I dont like this person. I want to reject it.',	'2025-10-14 00:43:22.082248',	'2025-10-14 00:48:24.145535',	6,	'2025-10-14 00:48:24.145535',	'I need to repair our electric for our apartment',	2,	NULL),
(45,	9,	1,	'Electrical repair',	'Reject 2nd request. Cause i stil ldont like the person',	'2025-10-14 00:49:33.553311',	'2025-10-14 00:55:05.816895',	6,	'2025-10-14 00:55:05.816895',	'2nd request',	2,	NULL),
(46,	9,	1,	'Home renovation',	'Status changed to completed after template processing',	'2025-10-14 00:55:47.214961',	'2025-10-14 00:59:52.116106',	6,	'2025-10-14 00:59:52.116106',	'I need this really. 3rd request now',	4,	NULL),
(48,	14,	7,	'Hospital bills',	'Status changed to processing after template processing',	'2025-10-14 01:12:58.602246',	'2025-10-14 01:13:36.764579',	6,	'2025-10-14 01:13:36.764579',	'I need medicine I dont have work Im poor',	1,	NULL),
(47,	9,	1,	'New electrical installation',	'Status changed to processing after template processing',	'2025-10-14 01:05:27.243566',	'2025-10-14 17:46:06.116912',	14,	'2025-10-14 17:46:06.116912',	NULL,	1,	NULL);

DROP TABLE IF EXISTS "document_requests_logs";
DROP SEQUENCE IF EXISTS document_request_logs_id_seq;
CREATE SEQUENCE document_request_logs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 70 CACHE 1;

CREATE TABLE "public"."document_requests_logs" (
    "id" integer DEFAULT nextval('document_request_logs_id_seq') NOT NULL,
    "request_id" integer NOT NULL,
    "action" character varying(50) NOT NULL,
    "old_status" integer,
    "new_status" integer,
    "action_by" integer NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_request_logs_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."document_requests_logs" IS 'Audit trail of all changes made to document requests for transparency and compliance';

COMMENT ON COLUMN "public"."document_requests_logs"."id" IS 'Primary key - unique identifier for log entries';

COMMENT ON COLUMN "public"."document_requests_logs"."request_id" IS 'Links to document_requests table - which request this log entry is for';

COMMENT ON COLUMN "public"."document_requests_logs"."action" IS 'Action performed: created, status_changed, assigned, completed, rejected, notes_added';

COMMENT ON COLUMN "public"."document_requests_logs"."old_status" IS 'Previous status before this action (NULL for creation)';

COMMENT ON COLUMN "public"."document_requests_logs"."new_status" IS 'New status after this action (NULL if no status change)';

COMMENT ON COLUMN "public"."document_requests_logs"."action_by" IS 'Which user performed this action (resident, staff, or admin)';

COMMENT ON COLUMN "public"."document_requests_logs"."created_at" IS 'When this action was performed';

CREATE INDEX idx_document_request_logs_request_id ON public.document_requests_logs USING btree (request_id);

CREATE INDEX idx_document_request_logs_action ON public.document_requests_logs USING btree (action);

CREATE INDEX idx_document_request_logs_created_at ON public.document_requests_logs USING btree (created_at);

CREATE INDEX idx_document_request_logs_action_by ON public.document_requests_logs USING btree (action_by);

INSERT INTO "document_requests_logs" ("id", "request_id", "action", "old_status", "new_status", "action_by", "created_at") VALUES
(56,	43,	'Request created by resident',	NULL,	0,	9,	'2025-10-14 00:41:56.012038'),
(57,	44,	'Request created by resident',	NULL,	0,	9,	'2025-10-14 00:43:22.090335'),
(58,	44,	'Request rejected',	0,	2,	6,	'2025-10-14 00:48:24.151332'),
(59,	45,	'Request created by resident',	NULL,	0,	9,	'2025-10-14 00:49:33.564667'),
(60,	45,	'Marked as processing',	0,	1,	6,	'2025-10-14 00:50:15.527468'),
(61,	45,	'Request rejected',	1,	2,	6,	'2025-10-14 00:55:05.826146'),
(62,	46,	'Request created by resident',	NULL,	0,	9,	'2025-10-14 00:55:47.223508'),
(63,	46,	'Marked as processing',	0,	1,	6,	'2025-10-14 00:56:14.183194'),
(64,	46,	'Marked as ready for pickup',	1,	3,	6,	'2025-10-14 00:58:07.934373'),
(65,	46,	'Marked as completed',	3,	4,	6,	'2025-10-14 00:59:52.125796'),
(66,	47,	'Request created by resident',	NULL,	0,	9,	'2025-10-14 01:05:27.256694'),
(67,	48,	'Request created by resident',	NULL,	0,	14,	'2025-10-14 01:12:58.608833'),
(68,	48,	'Marked as processing',	0,	1,	6,	'2025-10-14 01:13:36.771929'),
(69,	47,	'Marked as processing',	0,	1,	14,	'2025-10-14 17:46:06.126632');

DROP TABLE IF EXISTS "family_groups";
DROP SEQUENCE IF EXISTS family_groups_id_seq;
CREATE SEQUENCE family_groups_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 3 CACHE 1;

CREATE TABLE "public"."family_groups" (
    "id" integer DEFAULT nextval('family_groups_id_seq') NOT NULL,
    "family_name" character varying(100) NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_groups_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."family_groups" IS 'Family grouping table - groups residents into family units for tree display';

CREATE INDEX idx_family_groups_name ON public.family_groups USING btree (family_name);

INSERT INTO "family_groups" ("id", "family_name", "created_at", "updated_at") VALUES
(1,	'Macariola Family',	'2025-10-03 23:14:15.806254',	'2025-10-03 23:14:15.806254'),
(2,	'Ong Family',	'2025-10-03 23:14:15.806254',	'2025-10-03 23:14:15.806254');

DROP TABLE IF EXISTS "faq_categories";
DROP SEQUENCE IF EXISTS faq_categories_id_seq;
CREATE SEQUENCE faq_categories_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 7 CACHE 1;

CREATE TABLE "public"."faq_categories" (
    "id" integer DEFAULT nextval('faq_categories_id_seq') NOT NULL,
    "category_name" character varying(100) NOT NULL,
    "description" text,
    "icon" character varying(50),
    "display_order" integer DEFAULT '0',
    "is_active" integer DEFAULT '1',
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."faq_categories" IS 'FAQ categories for organizing questions';

CREATE UNIQUE INDEX faq_categories_category_name_key ON public.faq_categories USING btree (category_name);

CREATE INDEX idx_faq_categories_active ON public.faq_categories USING btree (is_active);

CREATE INDEX idx_faq_categories_display_order ON public.faq_categories USING btree (display_order);

INSERT INTO "faq_categories" ("id", "category_name", "description", "icon", "display_order", "is_active", "created_at", "updated_at") VALUES
(1,	'Documents',	'Questions about document requests and requirements',	'document',	1,	1,	'2025-10-08 12:14:47.79054',	'2025-10-08 12:14:47.79054'),
(2,	'Barangay Services',	'General information about barangay services',	'service',	2,	1,	'2025-10-08 12:14:47.79054',	'2025-10-08 12:14:47.79054'),
(3,	'Registration',	'Account registration and profile management',	'user',	3,	1,	'2025-10-08 12:14:47.79054',	'2025-10-08 12:14:47.79054'),
(4,	'Announcements',	'Information about barangay announcements and updates',	'megaphone',	4,	1,	'2025-10-08 12:14:47.79054',	'2025-10-08 12:14:47.79054'),
(5,	'Contact',	'How to reach barangay officials and offices',	'phone',	5,	1,	'2025-10-08 12:14:47.79054',	'2025-10-08 12:14:47.79054'),
(6,	'General',	'General questions and other inquiries',	'help',	6,	1,	'2025-10-08 12:14:47.79054',	'2025-10-08 12:14:47.79054');

DROP TABLE IF EXISTS "faqs";
DROP SEQUENCE IF EXISTS faqs_id_seq;
CREATE SEQUENCE faqs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 13 CACHE 1;

CREATE TABLE "public"."faqs" (
    "id" integer DEFAULT nextval('faqs_id_seq') NOT NULL,
    "category_id" integer,
    "question" text NOT NULL,
    "answer" text NOT NULL,
    "keywords" text,
    "view_count" integer DEFAULT '0',
    "helpful_count" integer DEFAULT '0',
    "not_helpful_count" integer DEFAULT '0',
    "is_active" integer DEFAULT '1',
    "display_order" integer DEFAULT '0',
    "created_by" integer,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."faqs" IS 'Frequently Asked Questions with keyword-based search';

COMMENT ON COLUMN "public"."faqs"."keywords" IS 'Keywords for matching user queries (comma-separated or JSON). Used for search and auto-matching.';

COMMENT ON COLUMN "public"."faqs"."view_count" IS 'Number of times this FAQ was viewed or matched';

COMMENT ON COLUMN "public"."faqs"."helpful_count" IS 'Number of times users marked this FAQ as helpful';

COMMENT ON COLUMN "public"."faqs"."not_helpful_count" IS 'Number of times users marked this FAQ as not helpful';

CREATE INDEX idx_faqs_category_id ON public.faqs USING btree (category_id);

CREATE INDEX idx_faqs_active ON public.faqs USING btree (is_active);

CREATE INDEX idx_faqs_keywords ON public.faqs USING gin (to_tsvector('english'::regconfig, keywords));

CREATE INDEX idx_faqs_question ON public.faqs USING gin (to_tsvector('english'::regconfig, question));

INSERT INTO "faqs" ("id", "category_id", "question", "answer", "keywords", "view_count", "helpful_count", "not_helpful_count", "is_active", "display_order", "created_by", "created_at", "updated_at") VALUES
(2,	1,	'How do I request a barangay clearance?',	'To request a Barangay Clearance:

1. **Log in** to your SmartLias account
2. Go to **"Documents"** or **"Requests"** section
3. Click **"Request Document"**
4. Select **"Barangay Clearance"** from the list
5. Fill in the **purpose** of your request
6. Upload any **supporting documents** (if required)
7. Click **Submit**

The processing fee is **₱50.00**. You will be notified when your document is ready for pickup at the Barangay Hall.

**Processing Time:** Usually 1-3 business days',	'barangay clearance, request, how to request, application, apply, requirements, process, steps',	12,	0,	0,	1,	2,	NULL,	'2025-10-08 12:14:47.792528',	'2025-10-09 14:47:28.844641'),
(10,	4,	'How can I view barangay announcements?',	'You can view barangay announcements in several ways:

**1. SmartLias Website (Public)**
• Visit the home page at http://smartlias.barangaylias.com
• Announcements are displayed on the main page
• No login required

**2. SmartLias Account (Residents)**
• Log in to your account
• Go to the "Announcements" section
• View all published announcements

**3. SMS Notifications**
• Important announcements are sent via SMS
• Make sure your mobile number is updated in your profile

**Types of Announcements:**
• General announcements
• Health programs
• Activities and events
• Assistance programs
• Advisories and alerts',	'announcements, view announcements, news, updates, notifications, what''s new, events',	1,	0,	0,	1,	1,	NULL,	'2025-10-08 12:14:47.8218',	'2025-10-09 14:41:11.881323'),
(4,	1,	'What are the requirements for Certificate of Indigency?',	'For **Certificate of Indigency** (Medical or Financial):

**Requirements:**
• Valid ID
• Proof of residency in Barangay Lias
• Supporting documents depending on purpose:
  - **Medical:** Medical certificate, hospital bills, or prescription
  - **Financial:** Proof of financial need

**Fee:** FREE

**How to apply:**
1. Log in to your account
2. Go to Documents section
3. Select "Certificate of Indigency (Medical)" or "Certificate of Indigency (Financial)"
4. Provide the purpose and attach supporting documents
5. Submit request

The barangay will verify your eligibility before approval.',	'indigency, certificate of indigency, medical, financial, requirements, free, assistance, poor, low income',	1,	0,	0,	1,	4,	NULL,	'2025-10-08 12:14:47.792528',	'2025-10-08 20:28:30.450488'),
(5,	2,	'What are the office hours of Barangay Lias?',	'**Barangay Lias Office Hours:**

📅 **Monday to Friday:** 8:00 AM - 5:00 PM
📅 **Saturday:** 8:00 AM - 12:00 PM
📅 **Sunday & Holidays:** Closed

**Lunch Break:** 12:00 PM - 1:00 PM

For urgent matters outside office hours, please contact the emergency hotline or reach out to barangay officials.',	'office hours, schedule, open, time, when open, operating hours, business hours',	17,	0,	0,	1,	1,	NULL,	'2025-10-08 12:14:47.819027',	'2025-10-09 14:42:16.628505'),
(8,	3,	'How do I register for a SmartLias account?',	'To register for a SmartLias account:

1. Go to the **Registration page**
2. Fill in your personal information:
   • Username (6-32 characters, lowercase, numbers, underscore)
   • Personal details (Name, birthdate, gender, etc.)
   • Contact information (mobile number, email)
   • Address information
3. Create your **6-digit PIN**
4. Submit your registration

**Important:**
• Your registration will be reviewed by barangay staff
• You will receive a notification once approved
• Keep your PIN secure and don''t share it with anyone

**Requirements:**
• Must be a resident of Barangay Lias
• Valid mobile number for SMS notifications',	'register, registration, sign up, create account, new account, how to register, join',	10,	0,	0,	1,	1,	NULL,	'2025-10-08 12:14:47.820225',	'2025-10-08 21:27:49.993027'),
(7,	2,	'What services does the barangay provide?',	'Barangay Lias provides the following services:

📄 **Document Services**
• Barangay Clearance
• Certificates (Residency, Good Moral, Indigency)
• Permits (Business, Electrical, Fence, Excavation)

🏥 **Health Services**
• Free medical check-ups (Wednesdays)
• Vaccination programs
• Health education

🤝 **Assistance Programs**
• Financial assistance for indigent families
• Medical assistance
• PWD and senior citizen programs

📢 **Information Services**
• Announcements and advisories
• Event notifications via SMS

🔒 **Peace and Order**
• Barangay tanod services
• Mediation and dispute resolution',	'services, what services, programs, assistance, help, available, offer, provide',	11,	0,	0,	1,	3,	NULL,	'2025-10-08 12:14:47.819027',	'2025-10-09 14:47:57.952152'),
(3,	1,	'How long does it take to process document requests?',	'Document processing times vary:

• **Regular requests:** 1-3 business days
• **Urgent requests:** Same day to next day (if approved by admin)
• **Indigency certificates:** Usually processed within 1-2 days

You will receive a notification when your document status changes. You can also check the status anytime in your account under the "Requests" or "Documents" section.

**Note:** Processing time may be longer during peak periods or holidays.',	'processing time, how long, duration, wait, when ready, how many days',	4,	0,	0,	1,	3,	NULL,	'2025-10-08 12:14:47.792528',	'2025-10-08 21:13:30.213406'),
(11,	4,	'Why am I not receiving SMS notifications?',	'If you''re not receiving SMS notifications, please check:

**1. Mobile Number**
• Verify your mobile number in your profile is correct
• Format: 09XXXXXXXXX (11 digits)
• Update it if necessary in Profile Settings

**2. Network Issues**
• Check if your phone has signal
• Try restarting your phone

**3. SMS Settings**
• Make sure SMS is not blocked on your phone
• Check if you have spam filters enabled

**4. Announcement Target**
• Not all announcements are sent via SMS
• SMS is sent only for important or targeted announcements

**Still having issues?**
Contact the barangay office to update your mobile number: (046) XXX-XXXX',	'sms, not receiving sms, no sms, notifications, text message, alerts, mobile number',	0,	0,	0,	1,	2,	NULL,	'2025-10-08 12:14:47.8218',	'2025-10-08 12:14:47.8218'),
(9,	3,	'I forgot my PIN. How can I reset it?',	'If you forgot your PIN:

**Option 1: Contact Barangay Office**
• Visit the Barangay Hall in person
• Bring a valid ID
• Staff will verify your identity and reset your PIN
• You will receive temporary credentials

**Option 2: Contact Admin via Phone**
• Call the barangay office: (046) XXX-XXXX
• Provide your username and verify your identity
• Admin will reset your PIN remotely

**Important:**
• Your PIN will be reset to a temporary PIN
• You will be required to change it on first login
• Keep your new PIN secure

**Note:** For security reasons, PIN reset cannot be done online without admin verification.',	'forgot pin, reset pin, lost pin, forgot password, reset password, cannot login, locked account',	1,	0,	0,	1,	2,	NULL,	'2025-10-08 12:14:47.820225',	'2025-10-08 12:23:51.301853'),
(12,	6,	'What is SmartLias?',	'SmartLias is the **official digital platform** of Barangay Lias, Imus, Cavite.

**Purpose:**
• Streamline barangay services and operations
• Provide easy access to barangay information
• Enable online document requests
• Facilitate communication between residents and officials

**Features:**
• 📄 Online document requests
• 📢 Real-time announcements and updates
• 📱 SMS notifications
• 👥 Resident profile management
• 💬 Chatbot assistance (FAQ support)

**Benefits:**
• Convenient 24/7 access
• Faster document processing
• Real-time updates
• Reduced need for physical visits
• Better communication

**Developed by:** Barangay Lias IT Team
**Launched:** 2025',	'smartlias, what is smartlias, about, system, platform, website, app',	4,	0,	0,	1,	1,	NULL,	'2025-10-08 12:14:47.823195',	'2025-10-09 14:42:20.477755'),
(6,	2,	'How can I contact barangay officials?',	'You can contact Barangay Lias officials through:

📞 **Barangay Hall Landline:** (046) XXX-XXXX
📱 **Mobile/SMS:** 0947-XXX-XXXX
📧 **Email:** barangaylias@example.com
📍 **Visit:** Barangay Hall, Barangay Lias, Imus, Cavite

**Office Hours:**
• Monday-Friday: 8:00 AM - 5:00 PM
• Saturday: 8:00 AM - 12:00 PM

For emergencies, please contact the emergency hotline: **911**',	'contact, phone number, email, address, location, reach, call, message, barangay officials',	5,	0,	0,	1,	2,	NULL,	'2025-10-08 12:14:47.819027',	'2025-10-09 01:27:18.865992'),
(1,	1,	'What documents can I request from the barangay?',	'You can request the following documents from Barangay Lias:

1. **Barangay Clearance** (₱50.00) - Required for employment and various transactions
2. **Certificate of Residency** (₱40.00) - For school enrollment and government transactions
3. **Certificate of Good Moral** (₱30.00) - Character reference certificate
4. **Certificate of Indigency - Medical** (Free) - For medical assistance
5. **Certificate of Indigency - Financial** (Free) - For financial assistance
6. **Business Permit Clearance** (₱100.00) - For small business operations
7. **Electrical Permit** (₱100.00) - For electrical installations
8. **Fence Permit** (₱75.00) - For fence construction
9. **Excavation Permit** (₱150.00) - For excavation activities

To request any document, please log in to your account and go to the Documents section.',	'document, request, available, barangay clearance, certificate, permit, requirements, what documents',	35,	0,	0,	1,	1,	NULL,	'2025-10-08 12:14:47.792528',	'2025-10-09 23:03:46.418902');

DROP TABLE IF EXISTS "residents";
DROP SEQUENCE IF EXISTS residents_id_seq;
CREATE SEQUENCE residents_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 25 CACHE 1;

CREATE TABLE "public"."residents" (
    "id" integer DEFAULT nextval('residents_id_seq') NOT NULL,
    "user_id" integer,
    "last_name" character varying(256) NOT NULL,
    "first_name" character varying(256) NOT NULL,
    "middle_name" character varying(256),
    "suffix" character varying(50),
    "birth_date" date,
    "gender" integer,
    "civil_status" character varying(50),
    "mobile_number" character varying(20),
    "email" character varying(256),
    "address" text,
    "purok" integer,
    "family_group_id" integer,
    "family_role" integer,
    "religion" character varying(50) DEFAULT 'Catholic',
    "occupation" character varying(256),
    "special_category_id" integer,
    "notes" text,
    "is_active" integer DEFAULT '1',
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "home_number" character varying(20),
    "street" integer,
    "created_by" integer,
    CONSTRAINT "residents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "residents_family_role_check" CHECK ((family_role = ANY (ARRAY[1, 2])))
) WITH (oids = false);

COMMENT ON COLUMN "public"."residents"."created_by" IS 'NULL=system_generated (registration), user_id=admin created';

CREATE UNIQUE INDEX residents_user_id_key ON public.residents USING btree (user_id);

CREATE INDEX idx_residents_user_id ON public.residents USING btree (user_id);

CREATE INDEX idx_residents_purok ON public.residents USING btree (purok);

CREATE INDEX idx_residents_family_group_id ON public.residents USING btree (family_group_id);

CREATE INDEX idx_residents_family_role ON public.residents USING btree (family_role);

CREATE INDEX idx_residents_last_name ON public.residents USING btree (last_name);

CREATE INDEX idx_residents_first_name ON public.residents USING btree (first_name);

CREATE INDEX idx_residents_gender ON public.residents USING btree (gender);

CREATE INDEX idx_residents_civil_status ON public.residents USING btree (civil_status);

CREATE INDEX idx_residents_special_category ON public.residents USING btree (special_category_id);

CREATE INDEX idx_residents_is_active ON public.residents USING btree (is_active);

CREATE INDEX idx_residents_full_name ON public.residents USING btree (first_name, last_name);

CREATE INDEX idx_residents_created_by ON public.residents USING btree (created_by);

INSERT INTO "residents" ("id", "user_id", "last_name", "first_name", "middle_name", "suffix", "birth_date", "gender", "civil_status", "mobile_number", "email", "address", "purok", "family_group_id", "family_role", "religion", "occupation", "special_category_id", "notes", "is_active", "created_at", "updated_at", "home_number", "street", "created_by") VALUES
(20,	27,	'Santos',	'Chester',	NULL,	NULL,	'2021-02-08',	1,	'Single',	NULL,	NULL,	'2h Brgy Lias, Marilao Bulacan',	2,	NULL,	NULL,	'PROTESTANT',	'SELF_EMPLOYED',	2,	NULL,	1,	'2025-10-09 14:09:20.531047',	'2025-10-09 14:09:49.606352',	NULL,	NULL,	NULL),
(1,	6,	'Kapitan',	'Juan',	'Dela Cruz',	NULL,	'1980-01-15',	1,	'Married',	NULL,	'admin.kapitan@smartlias.local',	'B1 L1 Burgos Street',	1,	NULL,	NULL,	'Catholic',	'Barangay Captain',	NULL,	NULL,	1,	'2025-10-03 23:39:10.868217',	'2025-10-03 23:39:10.868217',	NULL,	NULL,	NULL),
(7,	14,	'Mananasala',	'Ylena',	'Santos',	NULL,	'2024-08-04',	2,	'Single',	NULL,	NULL,	'2D VIDAL ST BRGY IBABA MALABON',	3,	NULL,	NULL,	'ROMAN_CATHOLIC',	'UNEMPLOYED',	NULL,	NULL,	1,	'2025-10-07 14:31:54.128029',	'2025-10-07 14:31:54.128029',	NULL,	NULL,	NULL),
(17,	24,	'Honda',	'Yas',	NULL,	NULL,	'2007-02-06',	2,	'Single',	NULL,	NULL,	'13 Vidal St. Brgy Ibaba, Navotas',	1,	NULL,	NULL,	'OTHERS',	'OTHERS',	3,	'To be deactivated',	1,	'2025-10-09 14:01:04.715691',	'2025-10-09 14:54:51.897752',	NULL,	NULL,	NULL),
(12,	19,	'Mancilla',	'Axel',	NULL,	NULL,	'1900-01-12',	1,	'Single',	NULL,	'test@test.com',	'2e Block4 Navotas City',	5,	NULL,	NULL,	NULL,	'RETIRED',	6,	NULL,	1,	'2025-10-07 23:50:52.038924',	'2025-10-09 16:55:43.620525',	NULL,	NULL,	NULL),
(16,	23,	'Lopez',	'Jake',	NULL,	NULL,	'1994-08-01',	NULL,	'Married',	NULL,	NULL,	'13 Vidal St. Brgy Ibaba, Malabon City',	2,	NULL,	NULL,	'ROMAN_CATHOLIC',	'OTHERS',	NULL,	NULL,	0,	'2025-10-09 13:57:07.759544',	'2025-10-10 23:33:38.410384',	NULL,	NULL,	NULL),
(11,	18,	'Koko',	'Koka',	NULL,	NULL,	'2025-10-05',	1,	'Single',	NULL,	NULL,	'2d Vidal St. Brgy Ibaba, Malabon City',	1,	NULL,	NULL,	'ROMAN_CATHOLIC',	'OTHERS',	NULL,	'',	0,	'2025-10-07 22:50:06.015224',	'2025-10-09 03:52:14.575783',	NULL,	NULL,	NULL),
(6,	13,	'Bernardo',	'Arrene',	'Santos',	NULL,	'2022-02-02',	2,	'Married',	'09067268602',	NULL,	'23K Gervacio St Brgy Lias, Marilao Bulacan',	7,	NULL,	NULL,	'ROMAN_CATHOLIC',	'RETIRED',	3,	NULL,	1,	'2025-10-05 23:41:57.848304',	'2025-10-05 23:41:57.848304',	NULL,	NULL,	NULL),
(13,	20,	'Santos',	'Maria',	NULL,	NULL,	'2001-09-09',	2,	'Separated',	NULL,	NULL,	'13 Vidal St. Brgy Ibaba, Marilao Bulacan',	1,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	1,	'2025-10-09 00:58:24.638875',	'2025-10-09 00:58:24.638875',	'82836449',	NULL,	NULL),
(2,	9,	'Manansala',	'Jacob',	'Santos',	NULL,	'2004-01-11',	1,	'Single',	'09294838765',	'mj@example.com',	'12 BLOCK ST. BRGY LIAS, MARILAO BULACAN',	3,	NULL,	NULL,	'OTHERS',	'OTHERS',	6,	NULL,	1,	'2025-10-04 03:49:19.864176',	'2025-10-04 03:49:19.864176',	NULL,	NULL,	NULL),
(19,	26,	'Eman',	'Agong',	NULL,	NULL,	'2025-09-29',	1,	'Single',	NULL,	NULL,	'2d Vidal Brgy Longos, Malabon',	3,	NULL,	NULL,	'PROTESTANT',	'EMPLOYED',	NULL,	NULL,	0,	'2025-10-09 14:04:15.633413',	'2025-10-14 17:47:09.92702',	NULL,	NULL,	NULL),
(22,	47,	'Santos',	'Euan',	NULL,	'3',	'2000-01-01',	1,	'Single',	'09294838765',	NULL,	'13 BLOCK 10 VIDAL ST. MALABON',	1,	NULL,	NULL,	'ROMAN_CATHOLIC',	'UNEMPLOYED',	NULL,	NULL,	0,	'2025-10-14 15:25:05.737829',	'2025-10-14 17:58:36.565368',	NULL,	NULL,	NULL),
(23,	48,	'Mendoza',	'Jonak',	NULL,	'3',	'2000-02-14',	1,	'Widowed',	'09268939406',	NULL,	'123 BLOCK ST. LIAS, MARILAO, BULACAN',	3,	NULL,	NULL,	'ROMAN_CATHOLIC',	'OTHERS',	NULL,	NULL,	0,	'2025-10-14 18:17:35.490833',	'2025-10-14 18:17:35.490833',	NULL,	NULL,	NULL),
(24,	49,	'Hontiveros',	'Risa',	NULL,	NULL,	'1988-09-30',	1,	'Widowed',	'09268939406',	NULL,	'123 BLOCK ST. LIAS, MARILAO, BULACAN',	1,	NULL,	NULL,	'ISLAM',	'RETIRED',	3,	NULL,	1,	'2025-10-14 18:22:11.598096',	'2025-10-14 18:32:44.90874',	NULL,	NULL,	NULL),
(21,	46,	'TIANGCO',	'JOHN REY',	'SOLOMON',	'2',	'1996-09-01',	1,	'Married',	'09267878373',	NULL,	'123 BLOCK ST. LIAS, MARILAO, BULACAN',	3,	NULL,	NULL,	'IGLESIA_NI_CRISTO',	'RETIRED',	NULL,	NULL,	1,	'2025-10-14 14:14:40.456375',	'2025-10-14 18:34:41.09056',	NULL,	NULL,	NULL),
(14,	21,	'Santos',	'Enchong',	NULL,	NULL,	'2025-09-29',	1,	'Married',	NULL,	NULL,	'25k Holdong Brgy Lias, Navotas City',	1,	NULL,	NULL,	'ROMAN_CATHOLIC',	'UNEMPLOYED',	2,	'',	1,	'2025-10-09 13:14:52.30367',	'2025-10-09 13:32:25.852364',	NULL,	NULL,	NULL),
(15,	22,	'Aguinaldo',	'Jays',	NULL,	NULL,	'2021-01-03',	NULL,	'Single',	NULL,	NULL,	'7H Ibaba St Purok 1 Marilao, Bulacan',	2,	NULL,	NULL,	'PROTESTANT',	'OTHERS',	NULL,	NULL,	1,	'2025-10-09 13:39:15.504404',	'2025-10-09 13:39:15.504404',	NULL,	NULL,	NULL),
(3,	10,	'Manansala',	'John Lloyd',	'Santos',	NULL,	'1998-08-21',	1,	'Single',	'09268939406',	'08.soled.press@icloud.com',	'13 Vidal St. Brgy Ibaba, Malabon City',	1,	NULL,	NULL,	NULL,	NULL,	2,	'asd',	1,	'2025-10-04 04:01:26.109413',	'2025-10-09 11:07:49.55436',	NULL,	NULL,	NULL),
(18,	25,	'Maque',	'Jas',	NULL,	NULL,	'2022-03-10',	2,	'Widowed',	NULL,	NULL,	'13 Vidal St. Brgy Ibaba, Malabon City',	2,	NULL,	NULL,	'ROMAN_CATHOLIC',	'OTHERS',	NULL,	NULL,	1,	'2025-10-09 14:02:20.604574',	'2025-10-09 14:02:20.604574',	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS "special_categories";
DROP SEQUENCE IF EXISTS special_categories_id_seq;
CREATE SEQUENCE special_categories_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 16 CACHE 1;

CREATE TABLE "public"."special_categories" (
    "id" integer DEFAULT nextval('special_categories_id_seq') NOT NULL,
    "category_code" character varying(50) NOT NULL,
    "category_name" character varying(100) NOT NULL,
    "description" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "special_categories_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."special_categories" IS 'Lookup table for special resident categories (government programs, roles, etc.)';

CREATE UNIQUE INDEX special_categories_category_code_key ON public.special_categories USING btree (category_code);

CREATE INDEX idx_special_categories_code ON public.special_categories USING btree (category_code);

INSERT INTO "special_categories" ("id", "category_code", "category_name", "description", "created_at", "updated_at") VALUES
(3,	'SOLO_PARENT',	'Solo Parent',	'Single parents raising children alone',	'2025-10-03 23:14:15.805248',	'2025-10-03 23:14:15.805248'),
(6,	'INDIGENT',	'Indigent',	'Residents classified as indigent for social services',	'2025-10-06 17:51:07.045482',	'2025-10-06 17:51:07.045482'),
(2,	'PWD',	'PWD',	'Residents with physical, mental, intellectual, or sensory disabilities',	'2025-10-03 23:14:15.805248',	'2025-10-03 23:14:15.805248');

DROP TABLE IF EXISTS "users";
DROP SEQUENCE IF EXISTS users_id_seq;
CREATE SEQUENCE users_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 50 CACHE 1;

CREATE TABLE "public"."users" (
    "id" integer DEFAULT nextval('users_id_seq') NOT NULL,
    "username" character varying(256) NOT NULL,
    "password" character varying(256) NOT NULL,
    "role" integer DEFAULT '3',
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "is_password_changed" integer DEFAULT '0',
    "failed_login_attempts" integer DEFAULT '0',
    "locked_until" timestamp,
    "last_login" timestamp,
    "last_failed_login" timestamp,
    "is_active" integer DEFAULT '0',
    "attachment_image" character varying(512),
    "approved_by" integer,
    "approved_at" timestamp,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

COMMENT ON TABLE "public"."users" IS 'Authentication and registration table - contains login credentials and basic account info';

COMMENT ON COLUMN "public"."users"."role" IS '1=Admin, 2=Staff, 3=Resident (default for resident registration)';

COMMENT ON COLUMN "public"."users"."is_active" IS '0=pending approval, 1=approved and active, 2=rejected, 3=suspended';

COMMENT ON COLUMN "public"."users"."attachment_image" IS 'File path to resident ID document - format: <user_id>_access_<random8>.jpg';

COMMENT ON COLUMN "public"."users"."approved_by" IS 'Admin user ID who approved/rejected the account - NULL if pending';

COMMENT ON COLUMN "public"."users"."approved_at" IS 'Timestamp when account was approved/rejected - NULL if pending';

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);

CREATE INDEX idx_users_username ON public.users USING btree (username);

CREATE INDEX idx_users_role ON public.users USING btree (role);

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);

CREATE INDEX idx_users_approved_by ON public.users USING btree (approved_by);

INSERT INTO "users" ("id", "username", "password", "role", "created_at", "updated_at", "is_password_changed", "failed_login_attempts", "locked_until", "last_login", "last_failed_login", "is_active", "attachment_image", "approved_by", "approved_at") VALUES
(1,	'seed.admin',	'$2a$12$Yy4q25XA7XypnDLE.3rAu.OZ8030fKLHdTbgiZ.K0upvmxyjrVVsS',	3,	'2025-10-05 16:40:07.191133',	'2025-10-14 16:41:58.215264',	1,	0,	NULL,	'2025-10-07 06:36:28.603',	'2025-10-07 06:35:58.305',	1,	NULL,	NULL,	'2025-10-14 02:04:49.982271'),
(17,	'lyod.lyod',	'$2a$12$j7Lchaa0dZXRSqWo1cyjT..hWHAlI4uXlvTzxAZiicEBzzc8eCVOe',	3,	'2025-10-07 15:39:41.40974',	'2025-10-14 16:42:01.084463',	1,	0,	NULL,	'2025-10-07 07:41:46.44',	'2025-10-07 07:41:43.405',	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(19,	'axel.mancilla',	'$2a$12$6XV2WQo9tib.1WNHmB5oQuALxW/xIYQjTK3IftRY6csTSs3mT8mWG',	3,	'2025-10-07 23:50:52.027868',	'2025-10-14 16:42:02.555907',	0,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(15,	'asd.asd',	'$2a$12$djdGG88VGnPcH5Ag5djn0Oy8jSrLps1R.obf4e0RoeYtyjszfFq9S',	3,	'2025-10-07 14:45:42.487863',	'2025-10-14 17:05:38.628266',	0,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(18,	'koka.koko',	'$2a$12$OdfAuMenHkHCmxL49Aij8eJsG3/O6DiTCbnqwmrwuWJYx84cMShx.',	3,	'2025-10-07 22:50:06.003683',	'2025-10-14 17:10:37.944173',	1,	1,	NULL,	'2025-10-13 12:53:16.17',	'2025-10-14 09:10:37.94',	0,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(22,	'jays.aguinaldo',	'$2a$12$WbYBoLfppPu2PdcnrBrbOe.cPjAuHtMe0QbjoFk9O2cOI0vAg2lqu',	3,	'2025-10-09 13:39:15.481153',	'2025-10-14 17:12:42.602326',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(6,	'admin.kapitan',	'$2a$12$Yy4q25XA7XypnDLE.3rAu.OZ8030fKLHdTbgiZ.K0upvmxyjrVVsS',	1,	'2025-10-03 23:36:48.863255',	'2025-10-14 18:06:46.896327',	1,	0,	NULL,	'2025-10-14 10:06:46.891',	'2025-10-14 09:10:45.217',	1,	NULL,	NULL,	'2025-10-14 02:04:49.982271'),
(20,	'maria.santos',	'$2a$12$uDzersqwW7AyF0yO7vOIQuH2VuQ5yRt9sTtaMcPdJFvrvfzMNKBZC',	3,	'2025-10-09 00:58:24.622747',	'2025-10-09 00:58:24.622747',	0,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(13,	'arrene.bernardo',	'$2a$12$KHoMSF7tefmmOqVXo6/Tf..1n/ZnQlAeBahoHUlc8SY0rfAUru64e',	3,	'2025-10-05 23:41:57.836941',	'2025-10-05 23:41:57.836941',	0,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(16,	'john.doe',	'$2a$12$1Vo.8Z7NuoanPhGRXxoVv.v8aCjY0enU1KfVbKP0er6TmC3nLLuwq',	3,	'2025-10-07 15:37:29.776458',	'2025-10-07 15:37:29.776458',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(48,	'jonak.mendoza',	'$2a$12$NSq3y7ZzTLjRaSlcvuxB7e9SXQ463Z90ul5qtGZ9Y6rCPIar0AEOW',	3,	'2025-10-14 18:17:35.48009',	'2025-10-14 18:17:35.48009',	1,	0,	NULL,	NULL,	NULL,	0,	'temp_1760437055144_1e8b1963.jpg',	NULL,	NULL),
(14,	'ylena.mananasala',	'$2a$12$O5mbrN49SWdNwXiNcBnWz.5R7A6oWGEEkZCFGZ2cDoGgqpirdEbWO',	2,	'2025-10-07 14:31:54.116046',	'2025-10-14 18:22:52.308219',	1,	0,	NULL,	'2025-10-14 10:22:52.305',	'2025-10-14 09:20:47.186',	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(10,	'lloyd.manansala',	'$2a$12$kGn15D269TiansyKwinPYOZ/cmIfFL8UCbpKtjF1OqcOVIwt39Qve',	3,	'2025-10-04 04:01:26.103034',	'2025-10-07 15:56:52.48005',	1,	0,	NULL,	'2025-10-07 07:56:52.476',	'2025-10-07 06:17:39.497',	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(9,	'jacob.manansala',	'$2a$12$93C2Moqrf4Dv9mxmu4Bp2.ddunYCH5r6J9IEOAP8dDCTCNyVceVDC',	3,	'2025-10-04 03:49:19.855388',	'2025-10-14 00:32:51.91201',	1,	0,	NULL,	'2025-10-13 16:32:51.905',	'2025-10-13 14:56:43.634',	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(21,	'chong.santos',	'$2a$12$0DMQtqsCw/ufvlELpOQ5XuaDgVI3Xd41QgW0ck7yO68W71oLrHxJG',	3,	'2025-10-09 13:14:52.288469',	'2025-10-09 13:15:02.072741',	1,	0,	NULL,	'2025-10-09 05:15:02.072',	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(23,	'jake.jake',	'$2a$12$3JSjt0bCNI4gswJHDFPeiecPCFkoYM/Bykv8jGlAlXAqzlDztdIf2',	3,	'2025-10-09 13:57:07.750873',	'2025-10-09 13:57:07.750873',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(24,	'yas.honda',	'$2a$12$bsgubnwqAceotPU1TJGhfeoCnJVClpugWYtOlbghLUtbg9HROH2IC',	3,	'2025-10-09 14:01:04.699489',	'2025-10-09 14:01:04.699489',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(25,	'juan.delapena',	'$2a$12$iwFXLvJpmugd8TgsL/Hv..qT4km8n5o3rsXshmBZ4cesIn/bAAVCG',	3,	'2025-10-09 14:02:20.588541',	'2025-10-09 14:02:20.588541',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(27,	'korko.koko',	'$2a$12$aeOS7UH9bilEFCKv1..c8u4.X8isNpFaEMe/bHetbEv4QEkPch/P2',	3,	'2025-10-09 14:09:20.515935',	'2025-10-09 14:09:20.515935',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(26,	'agong.123',	'$2a$12$rc2XMOAYyMf9vAqA52jDluUzRm5ZO2kBi1GCpaTFCaEqCoDc9Wrru',	3,	'2025-10-09 14:04:15.623307',	'2025-10-14 17:12:44.661705',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	'2025-10-14 02:04:49.989386'),
(47,	'euan.santos',	'$2a$12$Ya.EKw2FnpL1YrcDN/jSy.3zuW8Tau.2zcquXxO.eGurwJGXMLUXy',	3,	'2025-10-14 15:25:05.720396',	'2025-10-14 17:58:36.551652',	1,	0,	NULL,	NULL,	NULL,	0,	'temp_1760426705379_b70beaa2.png',	NULL,	NULL),
(49,	'risa.hontiveros',	'$2a$12$5YyUPf.gLqDvXczWhf/hKe5wZA1187056ZfwXITwp9Y7iauCf3lCm',	3,	'2025-10-14 18:22:11.589318',	'2025-10-14 18:32:44.899826',	1,	0,	NULL,	NULL,	NULL,	1,	'temp_1760437331259_93dafbab.png',	NULL,	NULL),
(46,	'rey.tiangco',	'$2a$12$BcBbwz2T6OVCx2mVqVsJq.baCebwRAwLxe7V.o6WWgPbbGJNouaA6',	3,	'2025-10-14 14:14:40.445598',	'2025-10-14 18:34:41.084668',	1,	0,	NULL,	NULL,	NULL,	1,	NULL,	NULL,	NULL);

ALTER TABLE ONLY "public"."announcement_sms_logs" ADD CONSTRAINT "announcement_sms_logs_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."announcements" ADD CONSTRAINT "announcements_published_by_fkey" FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."audit_logs" ADD CONSTRAINT "audit_logs_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."chat_messages" ADD CONSTRAINT "chat_messages_faq_id_fkey" FOREIGN KEY (faq_id) REFERENCES faqs(id) ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."document_requests" ADD CONSTRAINT "document_requests_document_id_fkey" FOREIGN KEY (document_id) REFERENCES document_catalog(id) ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."document_requests" ADD CONSTRAINT "document_requests_processed_by_fkey" FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."document_requests" ADD CONSTRAINT "document_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."document_requests_logs" ADD CONSTRAINT "document_request_logs_action_by_fkey" FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."document_requests_logs" ADD CONSTRAINT "document_request_logs_request_id_fkey" FOREIGN KEY (request_id) REFERENCES document_requests(id) ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."faqs" ADD CONSTRAINT "faqs_category_id_fkey" FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."faqs" ADD CONSTRAINT "faqs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_family_group_id_fkey" FOREIGN KEY (family_group_id) REFERENCES family_groups(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_special_category_id_fkey" FOREIGN KEY (special_category_id) REFERENCES special_categories(id) ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."residents" ADD CONSTRAINT "residents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT DEFERRABLE;

-- 2025-10-14 11:13:12 UTC
