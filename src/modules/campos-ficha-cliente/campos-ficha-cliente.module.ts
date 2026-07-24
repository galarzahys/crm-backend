import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampoFichaCliente } from './campo-ficha-cliente.entity';
import { CamposFichaClienteController } from './campos-ficha-cliente.controller';
import { CamposFichaClienteService } from './campos-ficha-cliente.service';

@Module({
  imports: [TypeOrmModule.forFeature([CampoFichaCliente])],
  controllers: [CamposFichaClienteController],
  providers: [CamposFichaClienteService],
  exports: [CamposFichaClienteService],
})
export class CamposFichaClienteModule {}
