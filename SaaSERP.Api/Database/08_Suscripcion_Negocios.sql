-- =====================================================================
-- 08_Suscripcion_Negocios.sql
-- Agrega FechaVencimientoSuscripcion a Core.Negocios
-- sqlcmd -S 134.209.214.44,1433 -U sa -P 'pass' -d SaaSERP_DB -i 08_Suscripcion_Negocios.sql -C
-- =====================================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='Core' AND TABLE_NAME='Negocios' AND COLUMN_NAME='FechaVencimientoSuscripcion'
)
    ALTER TABLE Core.Negocios
        ADD FechaVencimientoSuscripcion DATETIME2 NOT NULL
            DEFAULT DATEADD(DAY, 30, GETUTCDATE());
GO

-- Los negocios existentes inician con 30 días desde hoy
UPDATE Core.Negocios
SET FechaVencimientoSuscripcion = DATEADD(DAY, 30, GETUTCDATE())
WHERE FechaVencimientoSuscripcion IS NULL
   OR FechaVencimientoSuscripcion < GETUTCDATE();
GO

PRINT 'Migracion 08_Suscripcion_Negocios completada exitosamente.';
GO
