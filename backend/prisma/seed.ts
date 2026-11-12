import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.taskAuditLog.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create users
  const pm = await prisma.user.create({
    data: {
      email: "pm@nodewave.com",
      password: hashedPassword,
      name: "Project Manager",
      role: "PM",
      department: null,
    },
  });

  const uiux = await prisma.user.create({
    data: {
      email: "uiux@nodewave.com",
      password: hashedPassword,
      name: "UI/UX Designer",
      role: "INTERNAL_TEAM",
      department: "UI_UX",
    },
  });

  const frontend = await prisma.user.create({
    data: {
      email: "frontend@nodewave.com",
      password: hashedPassword,
      name: "Frontend Developer",
      role: "INTERNAL_TEAM",
      department: "FRONTEND",
    },
  });

  const backend = await prisma.user.create({
    data: {
      email: "backend@nodewave.com",
      password: hashedPassword,
      name: "Backend Developer",
      role: "INTERNAL_TEAM",
      department: "BACKEND",
    },
  });

  const client1 = await prisma.user.create({
    data: {
      email: "client1@nodewave.com",
      password: hashedPassword,
      name: "Client One",
      role: "CLIENT_GUEST",
      department: null,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: "client2@nodewave.com",
      password: hashedPassword,
      name: "Client Two",
      role: "CLIENT_GUEST",
      department: null,
    },
  });

  console.log("✅ Users created");

  // Create projects
  const alpha = await prisma.project.create({
    data: {
      name: "Project Alpha",
      description: "Main product development project with full team",
      status: "ACTIVE",
    },
  });

  const beta = await prisma.project.create({
    data: {
      name: "Project Beta",
      description: "Backend microservice project",
      status: "ACTIVE",
    },
  });

  console.log("✅ Projects created");

  // Project Alpha members: PM, UI/UX, Frontend, Backend, Client1
  await prisma.projectMember.createMany({
    data: [
      { userId: pm.id, projectId: alpha.id, role: "OWNER" },
      { userId: uiux.id, projectId: alpha.id, role: "MEMBER" },
      { userId: frontend.id, projectId: alpha.id, role: "MEMBER" },
      { userId: backend.id, projectId: alpha.id, role: "MEMBER" },
      { userId: client1.id, projectId: alpha.id, role: "VIEWER" },
    ],
  });

  // Project Beta members: PM, Backend, Client2
  await prisma.projectMember.createMany({
    data: [
      { userId: pm.id, projectId: beta.id, role: "OWNER" },
      { userId: backend.id, projectId: beta.id, role: "MEMBER" },
      { userId: client2.id, projectId: beta.id, role: "VIEWER" },
    ],
  });

  console.log("✅ Project members assigned");

  // Tasks for Project Alpha
  const taskA = await prisma.task.create({
    data: {
      title: "UI Design Mockup",
      description: "Create wireframes and high-fidelity mockups for the main dashboard",
      status: "DONE",
      priority: "HIGH",
      projectId: alpha.id,
      assigneeId: uiux.id,
      creatorId: pm.id,
      department: "UI_UX",
      clientVisible: true,
      version: 3,
    },
  });

  const taskB = await prisma.task.create({
    data: {
      title: "Backend API Integration",
      description: "Build REST API endpoints for user management and authentication",
      status: "DONE",
      priority: "HIGH",
      projectId: alpha.id,
      assigneeId: backend.id,
      creatorId: pm.id,
      department: "BACKEND",
      clientVisible: false,
      version: 4,
    },
  });

  const taskC = await prisma.task.create({
    data: {
      title: "Frontend Slicing",
      description: "Convert approved UI mockups into responsive React components",
      status: "TODO",
      priority: "MEDIUM",
      projectId: alpha.id,
      assigneeId: frontend.id,
      creatorId: pm.id,
      department: "FRONTEND",
      clientVisible: true,
      version: 1,
    },
  });

  const taskD = await prisma.task.create({
    data: {
      title: "QA Testing",
      description: "Run integration and end-to-end tests on all completed features",
      status: "TODO",
      priority: "MEDIUM",
      projectId: alpha.id,
      assigneeId: backend.id,
      creatorId: pm.id,
      department: "BACKEND",
      clientVisible: false,
      version: 1,
    },
  });

  const taskE = await prisma.task.create({
    data: {
      title: "User Authentication Flow",
      description: "Implement login, register, and password reset pages",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: alpha.id,
      assigneeId: frontend.id,
      creatorId: pm.id,
      department: "FRONTEND",
      clientVisible: true,
      version: 2,
    },
  });

  const taskF = await prisma.task.create({
    data: {
      title: "Database Schema Design",
      description: "Design and implement the database schema for the application",
      status: "DONE",
      priority: "URGENT",
      projectId: alpha.id,
      assigneeId: backend.id,
      creatorId: pm.id,
      department: "BACKEND",
      clientVisible: false,
      version: 5,
    },
  });

  const taskG = await prisma.task.create({
    data: {
      title: "Design System Components",
      description: "Create reusable UI component library",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: alpha.id,
      assigneeId: uiux.id,
      creatorId: pm.id,
      department: "UI_UX",
      clientVisible: true,
      version: 2,
    },
  });

  const taskH = await prisma.task.create({
    data: {
      title: "API Documentation",
      description: "Write comprehensive API documentation using Swagger/OpenAPI",
      status: "TODO",
      priority: "LOW",
      projectId: alpha.id,
      assigneeId: backend.id,
      creatorId: pm.id,
      department: "BACKEND",
      clientVisible: false,
      version: 1,
    },
  });

  console.log("✅ Tasks created for Project Alpha");

  // Tasks for Project Beta
  const taskBeta1 = await prisma.task.create({
    data: {
      title: "Microservice Architecture",
      description: "Design the microservice architecture for the backend",
      status: "DONE",
      priority: "URGENT",
      projectId: beta.id,
      assigneeId: backend.id,
      creatorId: pm.id,
      department: "BACKEND",
      clientVisible: true,
      version: 3,
    },
  });

  const taskBeta2 = await prisma.task.create({
    data: {
      title: "API Gateway Setup",
      description: "Configure API gateway with rate limiting and load balancing",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: beta.id,
      assigneeId: backend.id,
      creatorId: pm.id,
      department: "BACKEND",
      clientVisible: true,
      version: 2,
    },
  });

  console.log("✅ Tasks created for Project Beta");

  // Dependencies: Task C depends on A and B
  await prisma.taskDependency.create({
    data: { dependentTaskId: taskC.id, prerequisiteTaskId: taskA.id },
  });
  await prisma.taskDependency.create({
    data: { dependentTaskId: taskC.id, prerequisiteTaskId: taskB.id },
  });

  // Task D depends on C (chain)
  await prisma.taskDependency.create({
    data: { dependentTaskId: taskD.id, prerequisiteTaskId: taskC.id },
  });

  // Beta: taskBeta2 depends on taskBeta1
  await prisma.taskDependency.create({
    data: { dependentTaskId: taskBeta2.id, prerequisiteTaskId: taskBeta1.id },
  });

  console.log("✅ Task dependencies created");

  // Comments
  await prisma.comment.createMany({
    data: [
      { content: "Mockups look great! Approved for development.", taskId: taskA.id, userId: pm.id },
      { content: "Updated the color scheme based on client feedback.", taskId: taskA.id, userId: uiux.id },
      { content: "API endpoints are ready for integration testing.", taskId: taskB.id, userId: backend.id },
      { content: "Please add rate limiting to the auth endpoints.", taskId: taskB.id, userId: pm.id },
      { content: "Starting the frontend implementation now.", taskId: taskC.id, userId: frontend.id },
      { content: "Architecture document has been reviewed and approved.", taskId: taskBeta1.id, userId: pm.id },
    ],
  });

  console.log("✅ Comments created");

  // Attachments
  await prisma.attachment.createMany({
    data: [
      {
        fileName: "dashboard-mockup-v2.fig",
        fileUrl: "/uploads/dashboard-mockup-v2.fig",
        fileSize: 2048576,
        mimeType: "application/octet-stream",
        taskId: taskA.id,
        userId: uiux.id,
      },
      {
        fileName: "api-spec.yaml",
        fileUrl: "/uploads/api-spec.yaml",
        fileSize: 15360,
        mimeType: "text/yaml",
        taskId: taskB.id,
        userId: backend.id,
      },
      {
        fileName: "architecture-diagram.png",
        fileUrl: "/uploads/architecture-diagram.png",
        fileSize: 512000,
        mimeType: "image/png",
        taskId: taskBeta1.id,
        userId: backend.id,
      },
    ],
  });

  console.log("✅ Attachments created");

  // Audit Trail entries
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.taskAuditLog.createMany({
    data: [
      // Task A audit trail
      {
        taskId: taskA.id,
        userId: pm.id,
        action: "CREATE",
        field: "task",
        newValue: JSON.stringify({ title: "UI Design Mockup", status: "TODO" }),
        createdAt: new Date(yesterday.getTime() - 7200000),
      },
      {
        taskId: taskA.id,
        userId: uiux.id,
        action: "STATUS_CHANGE",
        field: "status",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
        createdAt: new Date(yesterday.getTime() - 3600000),
      },
      {
        taskId: taskA.id,
        userId: uiux.id,
        action: "STATUS_CHANGE",
        field: "status",
        oldValue: "IN_PROGRESS",
        newValue: "DONE",
        createdAt: new Date(yesterday.getTime()),
      },
      // Task B audit trail
      {
        taskId: taskB.id,
        userId: pm.id,
        action: "CREATE",
        field: "task",
        newValue: JSON.stringify({ title: "Backend API Integration", status: "TODO" }),
        createdAt: new Date(yesterday.getTime() - 7200000),
      },
      {
        taskId: taskB.id,
        userId: backend.id,
        action: "STATUS_CHANGE",
        field: "status",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
        createdAt: new Date(yesterday.getTime() - 5400000),
      },
      {
        taskId: taskB.id,
        userId: backend.id,
        action: "STATUS_CHANGE",
        field: "status",
        oldValue: "IN_PROGRESS",
        newValue: "DONE",
        createdAt: new Date(yesterday.getTime() - 1800000),
      },
      // Task E audit trail
      {
        taskId: taskE.id,
        userId: pm.id,
        action: "CREATE",
        field: "task",
        newValue: JSON.stringify({ title: "User Authentication Flow", status: "TODO" }),
        createdAt: new Date(yesterday.getTime() - 3600000),
      },
      {
        taskId: taskE.id,
        userId: frontend.id,
        action: "STATUS_CHANGE",
        field: "status",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
        createdAt: new Date(yesterday.getTime()),
      },
      // Task F audit trail
      {
        taskId: taskF.id,
        userId: pm.id,
        action: "CREATE",
        field: "task",
        newValue: JSON.stringify({ title: "Database Schema Design", status: "TODO" }),
        createdAt: new Date(yesterday.getTime() - 7200000),
      },
      {
        taskId: taskF.id,
        userId: backend.id,
        action: "UPDATE",
        field: "priority",
        oldValue: "HIGH",
        newValue: "URGENT",
        createdAt: new Date(yesterday.getTime() - 5400000),
      },
      {
        taskId: taskF.id,
        userId: backend.id,
        action: "STATUS_CHANGE",
        field: "status",
        oldValue: "TODO",
        newValue: "DONE",
        createdAt: new Date(yesterday.getTime() - 3600000),
      },
      // Beta task audit
      {
        taskId: taskBeta1.id,
        userId: pm.id,
        action: "CREATE",
        field: "task",
        newValue: JSON.stringify({ title: "Microservice Architecture", status: "TODO" }),
        createdAt: new Date(yesterday.getTime() - 7200000),
      },
      {
        taskId: taskBeta1.id,
        userId: backend.id,
        action: "STATUS_CHANGE",
        field: "status",
        oldValue: "TODO",
        newValue: "DONE",
        createdAt: new Date(yesterday.getTime()),
      },
    ],
  });

  console.log("✅ Audit trail entries created");
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
