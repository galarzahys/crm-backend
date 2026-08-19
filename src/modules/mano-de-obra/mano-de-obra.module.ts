import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostosRecursosModule } from '../costos-recursos/costos-recursos.module';
import { ManoDeObraController } from './mano-de-obra.controller';
import { ManoDeObraService } from './mano-de-obra.service';
import { ManoDeObra } from './mano-de-obra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ManoDeObra]), CostosRecursosModule],
  controllers: [ManoDeObraController],
  providers: [ManoDeObraService],
  exports: [ManoDeObraService],
})
export class ManoDeObraModule {}
