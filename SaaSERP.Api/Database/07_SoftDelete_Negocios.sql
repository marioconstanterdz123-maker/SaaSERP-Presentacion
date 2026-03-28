-- =====================================================================
-- 07_SoftDelete_Negocios.sql
-- Agrega columnas de borrado lógico a Core.Negocios
-- sqlcmd -S 134.209.214.44,1433 -U sa -P 'pass' -d SaaSERP_DB -i 07_SoftDelete_Negocios.sql -C
-- =====================================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='Core' AND TABLE_NAME='Negocios' AND COLUMN_NAME='EliminadoLogico'
)
    ALTER TABLE Core.Negocios ADD EliminadoLogico BIT NOT NULL DEFAULT 0;
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='Core' AND TABLE_NAME='Negocios' AND COLUMN_NAME='FechaEliminacion'
)
    ALTER TABLE Core.Negocios ADD FechaEliminacion DATETIME2 NULL;
GO

PRINT 'Migracion 07_SoftDelete_Negocios completada exitosamente.';
GO
