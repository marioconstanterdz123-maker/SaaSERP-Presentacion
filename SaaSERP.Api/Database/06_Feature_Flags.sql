-- =====================================================================
-- 06_Feature_Flags.sql
-- Agrega flags ModuloWhatsAppIA y ModuloCRM a Core.Negocios
-- Ejecutar con: sqlcmd -S 134.209.214.44,1433 -U sa -P 'pass' -d SaaSERP_DB -i 06_Feature_Flags.sql -C
-- =====================================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='Core' AND TABLE_NAME='Negocios' AND COLUMN_NAME='ModuloWhatsAppIA'
)
    ALTER TABLE Core.Negocios ADD ModuloWhatsAppIA BIT NOT NULL DEFAULT 0;
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='Core' AND TABLE_NAME='Negocios' AND COLUMN_NAME='ModuloCRM'
)
    ALTER TABLE Core.Negocios ADD ModuloCRM BIT NOT NULL DEFAULT 0;
GO

PRINT 'Migracion 06_Feature_Flags completada exitosamente.';
GO
