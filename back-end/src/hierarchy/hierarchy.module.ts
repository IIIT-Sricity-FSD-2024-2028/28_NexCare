import { Module } from '@nestjs/common';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';

/**
 * Hierarchy Module
 *
 * Self-contained on purpose — it reads the JSON stores directly and imports no
 * other feature module, so any module can depend on it for scoping without
 * risking a circular import.
 */
@Module({
  controllers: [HierarchyController],
  providers: [HierarchyService],
  exports: [HierarchyService],
})
export class HierarchyModule {}
