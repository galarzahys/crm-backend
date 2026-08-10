import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialesModule } from '../materiales/materiales.module';
import { ArticulosController } from './articulos.controller';
import { ArticulosService } from './articulos.service';
import { Articulo, ArticuloAtributo, ArticuloComponente, ArticuloSubarticulo } from './entities/articulo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Articulo, ArticuloAtributo, ArticuloComponente, ArticuloSubarticulo]), MaterialesModule],
  controllers: [ArticulosController],
  providers: [ArticulosService],
  exports: [ArticulosService],
})
export class ArticulosModule {}
