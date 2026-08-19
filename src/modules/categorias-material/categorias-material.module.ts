import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaMaterial } from './categoria-material.entity';
import { CategoriasMaterialController } from './categorias-material.controller';
import { CategoriasMaterialService } from './categorias-material.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaMaterial])],
  controllers: [CategoriasMaterialController],
  providers: [CategoriasMaterialService],
  exports: [CategoriasMaterialService],
})
export class CategoriasMaterialModule {}
