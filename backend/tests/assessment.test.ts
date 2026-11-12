import { describe, test, expect, beforeAll } from "bun:test";

const API_URL = "http://localhost:3001/api";

let pmToken = "";
let uiuxToken = "";
let frontendToken = "";
let backendToken = "";
let client1Token = "";
let client2Token = "";

let alphaProjectId = "";
let betaProjectId = "";
let taskAId = "";
let taskBId = "";
let taskCId = "";
let taskDId = "";

async function login(email: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const data: any = await res.json();
  return data.token;
}

beforeAll(async () => {
  pmToken = await login("pm@nodewave.com");
  uiuxToken = await login("uiux@nodewave.com");
  frontendToken = await login("frontend@nodewave.com");
  backendToken = await login("backend@nodewave.com");
  client1Token = await login("client1@nodewave.com");
  client2Token = await login("client2@nodewave.com");

  // Get project alpha & beta IDs
  const res = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${pmToken}` },
  });
  const json: any = await res.json();
  const alpha = json.data.find((p: any) => p.name === "Project Alpha");
  const beta = json.data.find((p: any) => p.name === "Project Beta");
  alphaProjectId = alpha.id;
  betaProjectId = beta.id;

  // Get tasks for Alpha
  const tasksRes = await fetch(`${API_URL}/projects/${alphaProjectId}/tasks`, {
    headers: { Authorization: `Bearer ${pmToken}` },
  });
  const tasksJson: any = await tasksRes.json();
  taskAId = tasksJson.data.find((t: any) => t.title === "UI Design Mockup")?.id;
  taskBId = tasksJson.data.find((t: any) => t.title === "Backend API Integration")?.id;
  taskCId = tasksJson.data.find((t: any) => t.title === "Frontend Slicing")?.id;
  taskDId = tasksJson.data.find((t: any) => t.title === "QA Testing")?.id;
});

describe("1. Role-Based Access & State-Based Permissions", () => {
  test("Internal team sees only projects assigned to them", async () => {
    // UI/UX is member of Alpha only, NOT Beta
    const res = await fetch(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${uiuxToken}` },
    });
    const json: any = await res.json();
    const hasAlpha = json.data.some((p: any) => p.id === alphaProjectId);
    const hasBeta = json.data.some((p: any) => p.id === betaProjectId);
    expect(hasAlpha).toBe(true);
    expect(hasBeta).toBe(false);
  });

  test("Internal team cannot edit task description/title, only status/attachments", async () => {
    // Get task detail for version
    const taskRes = await fetch(`${API_URL}/tasks/${taskAId}`, {
      headers: { Authorization: `Bearer ${frontendToken}` },
    });
    const taskData = ((await taskRes.json()) as any).data;

    // Try editing description
    const res = await fetch(`${API_URL}/tasks/${taskAId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${frontendToken}`,
      },
      body: JSON.stringify({
        description: "Hacked by frontend engineer",
        version: taskData.version,
      }),
    });
    expect(res.status).toBe(403);
  });

  test("PM cannot move task from IN_PROGRESS to DONE", async () => {
    // Create a new task assigned to frontend
    const meRes = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${frontendToken}` } });
    const meData: any = await meRes.json();

    const createRes = await fetch(`${API_URL}/projects/${alphaProjectId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({
        title: "Test In Progress to Done Guard",
        status: "IN_PROGRESS",
        assigneeId: meData.data.id,
      }),
    });
    const task = ((await createRes.json()) as any).data;

    // PM attempts to mark it as DONE
    const updateRes = await fetch(`${API_URL}/tasks/${task.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({
        status: "DONE",
        version: task.version,
      }),
    });
    expect(updateRes.status).toBe(403);
  });
});

describe("2. Dependencies & Blocked Validation", () => {
  test("Task with unfinished prerequisites cannot move to IN_PROGRESS (API rejects)", async () => {
    // Task C depends on A and B. Let's make Task A not DONE (e.g. IN_PROGRESS) to test blocking
    const taskCRes = await fetch(`${API_URL}/tasks/${taskCId}`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });
    const taskC = ((await taskCRes.json()) as any).data;

    // Create a task that depends on a non-DONE task
    const createPrereq = await fetch(`${API_URL}/projects/${alphaProjectId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({
        title: "Prereq Incomplete",
        status: "TODO",
      }),
    });
    const prereq = ((await createPrereq.json()) as any).data;

    const createBlocked = await fetch(`${API_URL}/projects/${alphaProjectId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({
        title: "Blocked Task",
        status: "TODO",
      }),
    });
    const blocked = ((await createBlocked.json()) as any).data;

    // Add dependency
    await fetch(`${API_URL}/tasks/${blocked.id}/dependencies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({ prerequisiteTaskId: prereq.id }),
    });

    // Attempt to move blocked task to IN_PROGRESS
    const moveRes = await fetch(`${API_URL}/tasks/${blocked.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({
        status: "IN_PROGRESS",
        version: blocked.version + 1, // incremented when auto-blocked
      }),
    });
    expect(moveRes.status).toBe(403);
  });

  test("Circular dependencies are rejected", async () => {
    // Task C depends on A. If we try to make A depend on C, it must be rejected!
    const res = await fetch(`${API_URL}/tasks/${taskAId}/dependencies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({ prerequisiteTaskId: taskCId }),
    });
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.error).toContain("circular");
  });
});

describe("3. Concurrency & Optimistic Locking", () => {
  test("Stale version update results in 409 Conflict", async () => {
    const taskRes = await fetch(`${API_URL}/tasks/${taskAId}`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });
    const task = ((await taskRes.json()) as any).data;

    // User 1 updates with current version
    const res1 = await fetch(`${API_URL}/tasks/${taskAId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({
        title: "Updated Title By User 1",
        version: task.version,
      }),
    });
    expect(res1.status).toBe(200);

    // User 2 tries to update with OLD (stale) version
    const res2 = await fetch(`${API_URL}/tasks/${taskAId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pmToken}`,
      },
      body: JSON.stringify({
        title: "Updated Title By User 2",
        version: task.version, // stale version!
      }),
    });
    expect(res2.status).toBe(409);
  });
});

describe("4. Client Guest Isolation & Data Masking", () => {
  test("Client Guest sees only their own project's aggregate metrics", async () => {
    // Client 1 only sees Project Alpha
    const res = await fetch(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    const json: any = await res.json();
    expect(json.data.length).toBe(1);
    expect(json.data[0].id).toBe(alphaProjectId);

    // Project detail returns aggregate metrics
    const projRes = await fetch(`${API_URL}/projects/${alphaProjectId}`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    const projJson: any = await projRes.json();
    expect(projJson.data.metrics).toBeDefined();
    expect(projJson.data.metrics.totalTasks).toBeGreaterThanOrEqual(1);
  });

  test("Client Guest API responses contain NO internal names, avatars, departments, or internal comments", async () => {
    const res = await fetch(`${API_URL}/projects/${alphaProjectId}/tasks`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    const json: any = await res.json();
    for (const task of json.data) {
      expect(task.clientVisible).toBe(true);
      expect(task.assignee).toBeUndefined();
      expect(task.creator).toBeUndefined();
      expect(task.comments).toBeUndefined();
    }
  });
});

describe("5. Standup Summary", () => {
  test("Standup endpoint returns summary of yesterday's changes", async () => {
    const res = await fetch(`${API_URL}/projects/${alphaProjectId}/standup`, {
      headers: { Authorization: `Bearer ${pmToken}` },
    });
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data.departmentActivities).toBeDefined();
  });
});

