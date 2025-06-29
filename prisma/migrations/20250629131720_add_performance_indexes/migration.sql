-- CreateIndex
CREATE INDEX "task_sprint_id_idx" ON "task"("sprint_id");

-- CreateIndex
CREATE INDEX "task_sprint_id_status_id_idx" ON "task"("sprint_id", "status_id");

-- CreateIndex
CREATE INDEX "task_assignee_engineer_id_sprint_id_idx" ON "task_assignee"("engineer_id", "sprint_id");

-- CreateIndex
CREATE INDEX "task_assignee_sprint_id_idx" ON "task_assignee"("sprint_id");

-- CreateIndex
CREATE INDEX "task_tag_task_id_sprint_id_idx" ON "task_tag"("task_id", "sprint_id");

-- CreateIndex
CREATE INDEX "task_tag_sprint_id_idx" ON "task_tag"("sprint_id");
