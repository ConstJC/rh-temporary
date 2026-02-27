/**
 * Soft delete convention: never use prisma.model.delete().
 * Always use prisma.model.update({ where, data: { deletedAt: new Date(), isActive: false } })
 * where the model has deletedAt and/or isActive.
 * This helper documents the pattern; each service applies it per model.
 */

export const SOFT_DELETE = {
  deletedAt: () => new Date(),
  isActive: false,
} as const;
