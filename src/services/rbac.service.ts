import { prisma } from '../lib/prisma';




// Update src/services/rbac.service.ts
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from '../lib/cache';

export async function getUserPermissions(
  userId: string
): Promise<Set<string>> {
  const cacheKey = `permissions:${userId}`;

  // 1. Check cache
  const cached = await cacheGet<string[]>(cacheKey);
  if (cached) {
    return new Set(cached);
  }

  // 2. Cache miss — load from database
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.name);
    }
  }

  // 3. Store in cache
  await cacheSet(cacheKey, [...permissions], CACHE_TTL.PERMISSIONS);

  return permissions;
}


//WORK ON THISSSSSSSSSSSSS
// Simpler permissions fetch with stampede protection
// export async function getUserPermissions(
//   userId: string
// ): Promise<Set<string>> {
//   const permissions = await cacheGetOrSet(
//     `permissions:${userId}`,
//     CACHE_TTL.PERMISSIONS,
//     async () => {
//       // ... the database query ...
//       return [...permissions]; // Return as array for serialization
//     }
//   );

//   return new Set(permissions);
// }






// export async function getUserPermissions(
//   userId: string
// ): Promise<Set<string>> {


// // Cached
//   const userRoles = await prisma.userRole.findMany({
//     where: { userId },
//     include: {
//       role: {
//         include: {
//           permissions: {
//             include: { permission: true },
//           },
//         },
//       },
//     },
//   });

//   const permissions = new Set<string>();
//   for (const ur of userRoles) {
//     for (const rp of ur.role.permissions) {
//       permissions.add(rp.permission.name);
//     }
//   }

//   return permissions;
// }
