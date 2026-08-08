import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface RegisterPatientInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dob?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

async function issueTokenPair(userId: string, role: Role) {
  const tokenRow = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: "pending",
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  const refreshToken = signRefreshToken({ userId, tokenId: tokenRow.id });
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.refreshToken.update({ where: { id: tokenRow.id }, data: { tokenHash } });

  const accessToken = signAccessToken({ userId, role });
  return { accessToken, refreshToken };
}

function serializeUser(user: {
  id: string;
  email: string;
  role: Role;
  patient?: { id: string; fullName: string } | null;
  doctor?: { id: string; fullName: string; specialty: string } | null;
  hospitalAdmin?: { id: string; fullName: string; hospitalId: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.patient ?? user.doctor ?? user.hospitalAdmin ?? null,
  };
}

export async function registerPatient(input: RegisterPatientInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: Role.PATIENT,
      patient: {
        create: {
          fullName: input.fullName,
          phone: input.phone,
          dob: input.dob ? new Date(input.dob) : undefined,
          gender: input.gender,
        },
      },
    },
    include: { patient: true },
  });

  const tokens = await issueTokenPair(user.id, user.role);
  return { user: serializeUser(user), ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { patient: true, doctor: true, hospitalAdmin: true },
  });
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const tokens = await issueTokenPair(user.id, user.role);
  return { user: serializeUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const tokenRow = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
  if (!tokenRow || tokenRow.revoked || tokenRow.userId !== payload.userId || tokenRow.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  const matches = await bcrypt.compare(refreshToken, tokenRow.tokenHash);
  if (!matches) throw ApiError.unauthorized("Refresh token is no longer valid");

  await prisma.refreshToken.update({ where: { id: tokenRow.id }, data: { revoked: true } });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { patient: true, doctor: true, hospitalAdmin: true },
  });
  if (!user || !user.isActive) throw ApiError.unauthorized("Account not found or inactive");

  const tokens = await issueTokenPair(user.id, user.role);
  return { user: serializeUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId, userId: payload.userId },
      data: { revoked: true },
    });
  } catch {
    // token already invalid/expired — nothing to revoke, treat logout as successful
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: true, doctor: true, hospitalAdmin: true },
  });
  if (!user) throw ApiError.notFound("User not found");
  return serializeUser(user);
}
