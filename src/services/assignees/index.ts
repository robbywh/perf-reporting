import { prisma } from "@/services/db";

interface Assignee {
  id: number;
  username: string;
  email: string;
  profilePicture?: string | null;
}

interface TaskAssignee {
  id: string;
  assignees?: Assignee[];
}

export async function linkAssigneesToTask(task: TaskAssignee) {
  if (!task.assignees || task.assignees.length === 0) return;

  for (const assignee of task.assignees) {
    try {
      // Check if the assignee is an engineer (exists in the engineer table)
      const existingEngineer = await prisma.engineer.findUnique({
        where: { id: assignee.id },
      });

      if (!existingEngineer) {
        console.log(`Skipping ${assignee.username} - Not an engineer.`);
        continue; // Skip non-engineers
      }

      // Insert into task_assignee table to link the assignee (engineer) with the task
      const taskEngineer = {
        taskId: task.id,
        engineerId: existingEngineer.id,
      };
      await prisma.taskAssignee.upsert({
        where: {
          taskId_engineerId: taskEngineer,
        },
        update: {}, // No need to update anything
        create: taskEngineer,
      });

      console.log(`Engineer ${assignee.username} linked to task ${task.id}.`);
    } catch (error) {
      console.error(
        `Error linking engineer ${assignee.username} to task ${task.id}:`,
        error
      );
    }
  }
}
