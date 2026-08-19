import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManoDeObraModule } from '../mano-de-obra/mano-de-obra.module';
import { MaterialesModule } from '../materiales/materiales.module';
import { ArticulosController } from './articulos.controller';
import { ArticulosService } from './articulos.service';
import {
  Articulo,
  ArticuloAtributo,
  ArticuloComponente,
  ArticuloManoDeObra,
  ArticuloSubarticulo,
} from './entities/articulo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Articulo, ArticuloAtributo, ArticuloComponente, ArticuloManoDeObra, ArticuloSubarticulo]),
    MaterialesModule,
    ManoDeObraModule,
  ],
  controllers: [ArticulosController],
  providers: [ArticulosService],
  exports: [ArticulosService],
})
export class ArticulosModule {}
