import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListaPrecio, PrecioArticulo, PrecioArticuloHistorial } from './entities/lista-precio.entity';
import { ListasPrecioController } from './listas-precio.controller';
import { ListasPrecioService } from './listas-precio.service';
import { PreciosArticuloService } from './precios-articulo.service';

@Module({
  imports: [TypeOrmModule.forFeature([ListaPrecio, PrecioArticulo, PrecioArticuloHistorial])],
  controllers: [ListasPrecioController],
  providers: [ListasPrecioService, PreciosArticuloService],
  exports: [ListasPrecioService, PreciosArticuloService],
})
export class ListasPrecioModule {}
