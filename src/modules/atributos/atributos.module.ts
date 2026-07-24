import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtributosController } from './atributos.controller';
import { AtributosService } from './atributos.service';
import { Atributo, AtributoOpcion } from './entities/atributo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Atributo, AtributoOpcion])],
  controllers: [AtributosController],
  providers: [AtributosService],
  exports: [AtributosService],
})
export class AtributosModule {}
