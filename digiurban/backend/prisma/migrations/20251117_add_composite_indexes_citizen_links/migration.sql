-- CreateIndex
CREATE INDEX "protocol_citizen_links_linkedCitizenId_isVerified_idx" ON "protocol_citizen_links"("linkedCitizenId", "isVerified");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_protocolId_isVerified_idx" ON "protocol_citizen_links"("protocolId", "isVerified");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_isVerified_verifiedAt_idx" ON "protocol_citizen_links"("isVerified", "verifiedAt");
