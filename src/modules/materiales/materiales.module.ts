import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material, MaterialCosto, MaterialCostoHistorial } from './material.entity';
import { MaterialesController } from './materiales.controller';
import { MaterialesService } from './materiales.service';

@Module({
  imports: [TypeOrmModule.forFeature([Material, MaterialCosto, MaterialCostoHistorial])],
  controllers: [MaterialesController],
  providers: [MaterialesService],
  exports: [MaterialesService],
})
export class MaterialesModule {}
