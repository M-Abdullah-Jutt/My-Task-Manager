-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "relatedInvitationId" TEXT,
ADD COLUMN     "relatedTaskId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'OTHER';
