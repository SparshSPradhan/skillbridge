import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { AuthenticatedRequest } from '../types';

export async function getInstitutionSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const institutionId = req.params.id;
    const cacheKey = `institution:summary:${institutionId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const institution = await prisma.user.findUnique({
      where: { id: institutionId, role: 'INSTITUTION' },
    });
    if (!institution) return res.status(404).json({ error: 'Institution not found' });

    const batches = await prisma.batch.findMany({
      where: { institutionId },
      include: {
        trainers: { include: { trainer: { select: { id: true, name: true } } } },
        students: { select: { studentId: true } },
        sessions: {
          include: { attendance: { select: { status: true, studentId: true } } },
        },
      },
    });

    const batchSummaries = batches.map((batch) => {
      const totalSessions = batch.sessions.length;
      const totalStudents = batch.students.length;

      let totalPresent = 0;
      let totalPossible = 0;

      batch.sessions.forEach((session) => {
        totalPossible += totalStudents;
        totalPresent += session.attendance.filter(
          (a) => a.status === 'PRESENT' || a.status === 'LATE'
        ).length;
      });

      return {
        batchId: batch.id,
        batchName: batch.name,
        totalSessions,
        totalStudents,
        trainers: batch.trainers.map((bt) => bt.trainer),
        attendanceRate:
          totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0,
      };
    });

    const result = {
      institutionId,
      institutionName: institution.name,
      totalBatches: batches.length,
      batchSummaries,
    };

    await cache.set(cacheKey, result, 120);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProgrammeSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const cacheKey = 'programme:summary';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const institutions = await prisma.user.findMany({
      where: { role: 'INSTITUTION' },
      select: { id: true, name: true, email: true },
    });

    const institutionSummaries = await Promise.all(
      institutions.map(async (inst) => {
        const batches = await prisma.batch.findMany({
          where: { institutionId: inst.id },
          include: {
            students: { select: { studentId: true } },
            sessions: {
              include: { attendance: { select: { status: true } } },
            },
          },
        });

        let totalPresent = 0;
        let totalPossible = 0;

        batches.forEach((batch) => {
          const studentCount = batch.students.length;
          batch.sessions.forEach((session) => {
            totalPossible += studentCount;
            totalPresent += session.attendance.filter(
              (a) => a.status === 'PRESENT' || a.status === 'LATE'
            ).length;
          });
        });

        return {
          institutionId: inst.id,
          institutionName: inst.name,
          totalBatches: batches.length,
          totalSessions: batches.reduce((sum, b) => sum + b.sessions.length, 0),
          totalStudents: batches.reduce((sum, b) => sum + b.students.length, 0),
          attendanceRate:
            totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0,
        };
      })
    );

    // Programme-wide aggregates
    const totalSessions = institutionSummaries.reduce((s, i) => s + i.totalSessions, 0);
    const totalStudents = institutionSummaries.reduce((s, i) => s + i.totalStudents, 0);
    const avgAttendanceRate =
      institutionSummaries.length > 0
        ? Math.round(
            institutionSummaries.reduce((s, i) => s + i.attendanceRate, 0) /
              institutionSummaries.length
          )
        : 0;

    const result = {
      totalInstitutions: institutions.length,
      totalSessions,
      totalStudents,
      avgAttendanceRate,
      institutions: institutionSummaries,
    };

    await cache.set(cacheKey, result, 120);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}