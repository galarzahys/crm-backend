/** Misma forma que `ResultadoPaginado<T>` del frontend. */
export interface ResultadoPaginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  tamanio: number;
}
