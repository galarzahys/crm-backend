import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecursoCosto, RecursoCostoHistorial } from './recurso-costo.entity';
import { RecursoCostoService } from './recurso-costo.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecursoCosto, RecursoCostoHistorial])],
  providers: [RecursoCostoService],
  exports: [RecursoCostoService],
})
export class CostosRecursosModule {}
