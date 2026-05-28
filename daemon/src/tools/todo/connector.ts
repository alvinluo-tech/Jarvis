import { getRepositories } from "../../db/factory.js";
import { registerTool } from "../registry.js";
import {
  createTaskSchema,
  queryTasksSchema,
  updateTaskSchema,
  deleteTaskSchema,
} from "./schema.js";

export function registerTodoTools(): void {
  // createTask
  registerTool(
    {
      type: "function",
      function: {
        name: "createTask",
        description: "创建新任务。可指定标题、优先级(1-5, 1最高)、截止日期、标签。",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "任务标题" },
            priority: { type: "number", description: "优先级 1-5", enum: [1, 2, 3, 4, 5] },
            dueDate: { type: "string", description: "截止日期 YYYY-MM-DD" },
            tags: { type: "array", items: { type: "string" }, description: "标签列表" },
            description: { type: "string", description: "任务描述" },
          },
          required: ["title"],
        },
      },
    },
    async (args) => {
      const input = createTaskSchema.parse(args);
      const task = await getRepositories().tasks.create(input);
      return { task };
    },
  );

  // getTodayTasks
  registerTool(
    {
      type: "function",
      function: {
        name: "getTodayTasks",
        description: "获取今日待办任务（今日到期 + 高优先级未完成任务）。",
        parameters: { type: "object", properties: {} },
      },
    },
    async () => {
      const tasks = await getRepositories().tasks.getTodayTasks();
      return { tasks, count: tasks.length };
    },
  );

  // queryTasks
  registerTool(
    {
      type: "function",
      function: {
        name: "queryTasks",
        description: "按条件查询任务。可按状态、优先级、标签、日期范围筛选。",
        parameters: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["pending", "in_progress", "done"] },
            priority: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
            dueDateFrom: { type: "string" },
            dueDateTo: { type: "string" },
          },
        },
      },
    },
    async (args) => {
      const input = queryTasksSchema.parse(args);
      const tasks = await getRepositories().tasks.query(input);
      return { tasks, count: tasks.length };
    },
  );

  // updateTask
  registerTool(
    {
      type: "function",
      function: {
        name: "updateTask",
        description: "更新任务属性。可修改标题、优先级、状态、截止日期、标签。",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "任务 ID" },
            title: { type: "string" },
            priority: { type: "number" },
            status: { type: "string", enum: ["pending", "in_progress", "done"] },
            dueDate: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["taskId"],
        },
      },
    },
    async (args) => {
      const input = updateTaskSchema.parse(args);
      const task = await getRepositories().tasks.update(input.taskId, input);
      return { task };
    },
  );

  // deleteTask
  registerTool(
    {
      type: "function",
      function: {
        name: "deleteTask",
        description: "软删除任务（标记为 deleted 状态）。",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "任务 ID" },
          },
          required: ["taskId"],
        },
      },
    },
    async (args) => {
      const input = deleteTaskSchema.parse(args);
      await getRepositories().tasks.delete(input.taskId);
      return { success: true };
    },
  );
}
