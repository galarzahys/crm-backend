import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { AtributosModule } from './modules/atributos/atributos.module';
import { ArticulosModule } from './modules/articulos/articulos.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VendedoresModule } from './modules/vendedores/vendedores.module';
import { ListasPrecioModule } from './modules/listas-precio/listas-precio.module';
import { PresupuestosModule } from './modules/presupuestos/presupuestos.module';
import { CamposFichaClienteModule } from './modules/campos-ficha-cliente/campos-ficha-cliente.module';
import { MaterialesModule } from './modules/materiales/materiales.module';
import { ImagenesModule } from './modules/imagenes/imagenes.module';
import { CategoriasMaterialModule } from './modules/categorias-material/categorias-material.module';
import { ManoDeObraModule } from './modules/mano-de-obra/mano-de-obra.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    CategoriasModule,
    AtributosModule,
    ArticulosModule,
    ClientesModule,
    VendedoresModule,
    ListasPrecioModule,
    PresupuestosModule,
    CamposFichaClienteModule,
    MaterialesModule,
    ImagenesModule,
    VendedoresModule,
    ListasPrecioModule,
    PresupuestosModule,
    CamposFichaClienteModule,
    MaterialesModule,
    CategoriasMaterialModule,
    ManoDeObraModule,
  ],
})
export class AppModule {}
