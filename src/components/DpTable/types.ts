/**
 * Definición de una columna de la tabla (estilo Angular tableDef).
 */
export interface DpTableDefColumn {
  /** Texto del encabezado */
  header: string;
  /** Clave de la propiedad en el objeto fila */
  column: string;
  /** Orden de la columna (menor = más a la izquierda) */
  order: number;
  /** Si la columna se muestra */
  display: boolean;
  /** Si la columna participa en el filtro global */
  filter?: boolean;
}

/**
 * Filas deben tener un id para selección.
 */
export interface DpTableRow {
  id: string;
}

/**
 * API expuesta por DpTable mediante ref (estilo Angular ViewChild).
 */
export interface DpTableRef<T extends DpTableRow> {
  /** Establece los datos de la tabla */
  setDatasource(data: T[]): void;
  /** Limpia los datos */
  clearDatasource(): void;
  /** Indica si la tabla está en estado de carga */
  setLoading(loading: boolean): void;
  /** Devuelve las filas seleccionadas */
  getSelectedRows(): T[];
  /** Limpia la selección */
  clearSelectedRows(): void;
}
