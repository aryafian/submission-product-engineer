import { prisma } from "../../lib/prisma";
import { hashPassword, comparePassword, signToken } from "../../lib/auth";
import { AppError } from "../../utils/errors";

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
  department?: string | null;
}) {
  const existing = await prisma.user.findFirst({
    where: { email: data.email, deletedAt: null },
  });
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      name: data.name,
      role: data.role || "INTERNAL_TEAM",
      department: data.department || null,
    },
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    },
    token,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    },
    token,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      avatar: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return user;
}
