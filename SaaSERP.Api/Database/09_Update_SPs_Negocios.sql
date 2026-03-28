-- =====================================================================
-- 09_Update_SPs_Negocios.sql
-- Actualiza los Stored Procedures de Negocios para incluir todas las columnas nuevas
-- Esto restaura el rendimiento del plan de ejecucion en cache del SQL Server
-- y elimina la exposicion directa de SQL en la aplicacion.
--
-- sqlcmd -S 134.209.214.44,1433 -U sa -P 'pass' -d SaaSERP_DB -i 09_Update_SPs_Negocios.sql -C -t 60
-- =====================================================================

-- ── 1. SP de lectura: devuelve TODOS los campos, filtra eliminados ------------------------
CREATE OR ALTER PROCEDURE [Core].[usp_Negocios_ObtenerTodos]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  Id, Nombre, TelefonoWhatsApp, Activo, FechaRegistro,
            SistemaAsignado, CapacidadMaxima, DuracionMinutosCita,
            UsaMesas, HoraApertura, HoraCierre, InstanciaWhatsApp,
            -- Feature Flags
            AccesoWeb, AccesoMovil, ModuloHistorial,
            ModuloWhatsApp, ModuloWhatsAppIA, ModuloCRM, ModuloReportes,
            MercadoPagoAccessToken, TiempoSilencioMinutos,
            -- Soft Delete
            EliminadoLogico, FechaEliminacion,
            -- Suscripcion
            FechaVencimientoSuscripcion
    FROM [Core].[Negocios]
    WHERE EliminadoLogico = 0
    ORDER BY Id;
END
GO

-- ── 2. SP de actualizacion: recibe TODOS los campos con parametros tipados ----------------
CREATE OR ALTER PROCEDURE [Core].[usp_Negocios_Actualizar]
    @Id                     INT,
    @Nombre                 NVARCHAR(100),
    @TelefonoWhatsApp       NVARCHAR(20)    = NULL,
    @SistemaAsignado        NVARCHAR(50),
    @CapacidadMaxima        INT             = 0,
    @DuracionMinutosCita    INT             = 60,
    @UsaMesas               BIT             = 0,
    @HoraApertura           TIME            = '00:00:00',
    @HoraCierre             TIME            = '00:00:00',
    @Activo                 BIT             = 1,
    @AccesoWeb              BIT             = 1,
    @AccesoMovil            BIT             = 0,
    @ModuloHistorial        BIT             = 1,
    @ModuloWhatsApp         BIT             = 0,
    @ModuloWhatsAppIA       BIT             = 0,
    @ModuloCRM              BIT             = 0,
    @ModuloReportes         BIT             = 1,
    @MercadoPagoAccessToken NVARCHAR(255)   = NULL,
    @TiempoSilencioMinutos  INT             = 60
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [Core].[Negocios]
    SET Nombre                    = @Nombre,
        TelefonoWhatsApp          = @TelefonoWhatsApp,
        SistemaAsignado           = @SistemaAsignado,
        CapacidadMaxima           = @CapacidadMaxima,
        DuracionMinutosCita       = @DuracionMinutosCita,
        UsaMesas                  = @UsaMesas,
        HoraApertura              = @HoraApertura,
        HoraCierre                = @HoraCierre,
        Activo                    = @Activo,
        AccesoWeb                 = @AccesoWeb,
        AccesoMovil               = @AccesoMovil,
        ModuloHistorial           = @ModuloHistorial,
        ModuloWhatsApp            = @ModuloWhatsApp,
        ModuloWhatsAppIA          = @ModuloWhatsAppIA,
        ModuloCRM                 = @ModuloCRM,
        ModuloReportes            = @ModuloReportes,
        MercadoPagoAccessToken    = @MercadoPagoAccessToken,
        TiempoSilencioMinutos     = @TiempoSilencioMinutos
    WHERE Id = @Id;

    SELECT @@ROWCOUNT AS FilasAfectadas;
END
GO

PRINT 'Migracion 09_Update_SPs_Negocios completada exitosamente.';
GO
