-- AlterTable
CREATE SEQUENCE leave_id_seq;
ALTER TABLE "leave" ALTER COLUMN "id" SET DEFAULT nextval('leave_id_seq');
ALTER SEQUENCE leave_id_seq OWNED BY "leave"."id";

-- AlterTable
CREATE SEQUENCE public_holiday_id_seq;
ALTER TABLE "public_holiday" ALTER COLUMN "id" SET DEFAULT nextval('public_holiday_id_seq');
ALTER SEQUENCE public_holiday_id_seq OWNED BY "public_holiday"."id";
