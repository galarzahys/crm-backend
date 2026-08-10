import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { SolicitarSubidaImagenDto } from './imagenes.dto';

const PREFIJO_CLAVE = 'articulos/';

/**
 * Genera URLs prefirmadas de subida a S3 y borra objetos del bucket.
 *
 * No recibe `accessKeyId`/`secretAccessKey` en ningún lado a propósito: el
 * SDK de AWS los toma solo del rol de IAM adjunto a la instancia EC2 (o de
 * tu `aws configure` local si probás esto en tu máquina). Ver README para
 * el detalle del rol necesario.
 */
@Injectable()
export class ImagenesService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') ?? 'sa-east-1';
    this.bucket = this.configService.get<string>('S3_BUCKET_NAME') ?? 'crm-traful';
    this.s3 = new S3Client({ region: this.region });
  }

  async solicitarUrlSubida(dto: SolicitarSubidaImagenDto): Promise<{ key: string; urlSubida: string; urlVisualizacion: string }> {
    const extension = this.extraerExtension(dto.nombreArchivo);
    const key = `${PREFIJO_CLAVE}${Date.now()}-${randomUUID()}.${extension}`;

    const comando = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.tipoArchivo,
    });

    // 5 minutos de vigencia: alcanza de sobra para que el navegador suba el
    // archivo apenas se lo pide; no tiene sentido dejarla vigente más tiempo.
    const urlSubida = await getSignedUrl(this.s3, comando, { expiresIn: 300 });
    const urlVisualizacion = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { key, urlSubida, urlVisualizacion };
  }

  async eliminar(key: string): Promise<void> {
    if (!key || !key.startsWith(PREFIJO_CLAVE)) {
      throw new BadRequestException('Clave de imagen inválida.');
    }
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private extraerExtension(nombreArchivo: string): string {
    const cruda = nombreArchivo.split('.').pop() ?? 'jpg';
    const limpia = cruda.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 5);
    return limpia || 'jpg';
  }
}
