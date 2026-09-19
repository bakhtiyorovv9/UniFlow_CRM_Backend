-- AlterTable
ALTER TABLE "ExamResult" ADD COLUMN     "answer_file" TEXT,
ADD COLUMN     "answer_text" TEXT,
ADD COLUMN     "submitted_at" TIMESTAMP(3);
