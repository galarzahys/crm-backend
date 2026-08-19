import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasMaterialModule } from '../categorias-material/categorias-material.module';
import { CostosRecursosModule } from '../costos-recursos/costos-recursos.module';
import { Material } from './material.entity';
import { MaterialesController } from './materiales.controller';
import { MaterialesService } from './materiales.service';

@Module({
  imports: [TypeOrmModule.forFeature([Material]), CostosRecursosModule, CategoriasMaterialModule],
  controllers: [MaterialesController],
  providers: [MaterialesService],
  exports: [MaterialesService],
})
export class MaterialesModule {}
