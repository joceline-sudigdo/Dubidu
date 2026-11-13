-- CreateIndex
CREATE INDEX "CommunityPost_status_createdAt_idx" ON "CommunityPost"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_purpose_referenceId_idx" ON "Payment"("purpose", "referenceId");

-- CreateIndex
CREATE INDEX "PostComment_postId_createdAt_idx" ON "PostComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_targetUserId_status_idx" ON "Review"("targetUserId", "status");

-- CreateIndex
CREATE INDEX "SessionReport_childId_idx" ON "SessionReport"("childId");

-- CreateIndex
CREATE INDEX "Subscription_userId_active_endsAt_idx" ON "Subscription"("userId", "active", "endsAt");

-- CreateIndex
CREATE INDEX "TeacherProfile_verificationStatus_idx" ON "TeacherProfile"("verificationStatus");
