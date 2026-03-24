-- SCRIPT 06: PROCEDIMIENTOS ALMACENADOS CRUD PARA SÚPER ADMIN
USE SaaSERP_DB;
GO

-- ==========================================
-- CRUD: NEGOCIOS
-- ==========================================
IF OBJECT_ID('[Core].[usp_Negocios_Crear]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Negocios_Crear];
GO
CREATE PROCEDURE [Core].[usp_Negocios_Crear]
    @Nombre NVARCHAR(100),
    @TelefonoWhatsApp NVARCHAR(20),
    @SistemaAsignado NVARCHAR(50),
    @CapacidadMaxima INT,
    @DuracionMinutosCita INT,
    @UsaMesas BIT,
    @HoraApertura TIME = '09:00',
    @HoraCierre TIME = '18:00'
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Core.Negocios (Nombre, TelefonoWhatsApp, SistemaAsignado, CapacidadMaxima, DuracionMinutosCita, UsaMesas, HoraApertura, HoraCierre, Activo, FechaRegistro)
    OUTPUT INSERTED.Id
    VALUES (@Nombre, @TelefonoWhatsApp, @SistemaAsignado, @CapacidadMaxima, @DuracionMinutosCita, @UsaMesas, @HoraApertura, @HoraCierre, 1, GETDATE());
END
GO

IF OBJECT_ID('[Core].[usp_Negocios_Actualizar]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Negocios_Actualizar];
GO
CREATE PROCEDURE [Core].[usp_Negocios_Actualizar]
    @Id INT,
    @Nombre NVARCHAR(100),
    @TelefonoWhatsApp NVARCHAR(20),
    @SistemaAsignado NVARCHAR(50),
    @CapacidadMaxima INT,
    @DuracionMinutosCita INT,
    @UsaMesas BIT,
    @HoraApertura TIME,
    @HoraCierre TIME,
    @Activo BIT,
    @AccesoWeb BIT = 1,
    @AccesoMovil BIT = 0,
    @ModuloHistorial BIT = 1,
    @ModuloWhatsApp BIT = 0,
    @ModuloReportes BIT = 1,
    @MercadoPagoAccessToken NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Core.Negocios
    SET Nombre = @Nombre,
        TelefonoWhatsApp = @TelefonoWhatsApp,
        SistemaAsignado = @SistemaAsignado,
        CapacidadMaxima = @CapacidadMaxima,
        DuracionMinutosCita = @DuracionMinutosCita,
        UsaMesas = @UsaMesas,
        HoraApertura = @HoraApertura,
        HoraCierre = @HoraCierre,
        Activo = @Activo,
        AccesoWeb = @AccesoWeb,
        AccesoMovil = @AccesoMovil,
        ModuloHistorial = @ModuloHistorial,
        ModuloWhatsApp = @ModuloWhatsApp,
        ModuloReportes = @ModuloReportes,
        MercadoPagoAccessToken = @MercadoPagoAccessToken
    WHERE Id = @Id;

    SELECT @@ROWCOUNT;
END
GO

-- ==========================================
-- CRUD: SERVICIOS
-- ==========================================
IF OBJECT_ID('[Core].[usp_Servicios_Crear]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Servicios_Crear];
GO
CREATE PROCEDURE [Core].[usp_Servicios_Crear]
    @NegocioId INT,
    @Nombre NVARCHAR(100),
    @DuracionMinutos INT,
    @Precio DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Core.Servicios (NegocioId, Nombre, DuracionMinutos, Precio, Activo)
    OUTPUT INSERTED.Id
    VALUES (@NegocioId, @Nombre, @DuracionMinutos, @Precio, 1);
END
GO

IF OBJECT_ID('[Core].[usp_Servicios_Actualizar]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Servicios_Actualizar];
GO
CREATE PROCEDURE [Core].[usp_Servicios_Actualizar]
    @Id INT,
    @NegocioId INT,
    @Nombre NVARCHAR(100),
    @DuracionMinutos INT,
    @Precio DECIMAL(18,2),
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Core.Servicios
    SET Nombre = @Nombre,
        DuracionMinutos = @DuracionMinutos,
        Precio = @Precio,
        Activo = @Activo
    WHERE Id = @Id AND NegocioId = @NegocioId;

    SELECT @@ROWCOUNT;
END
GO

-- ==========================================
-- CRUD: RECURSOS
-- ==========================================
IF OBJECT_ID('[Core].[usp_Recursos_Crear]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Recursos_Crear];
GO
CREATE PROCEDURE [Core].[usp_Recursos_Crear]
    @NegocioId INT,
    @Nombre NVARCHAR(100),
    @Tipo NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Core.Recursos (NegocioId, Nombre, Tipo, Activo)
    OUTPUT INSERTED.Id
    VALUES (@NegocioId, @Nombre, @Tipo, 1);
END
GO

IF OBJECT_ID('[Core].[usp_Recursos_Actualizar]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Recursos_Actualizar];
GO
CREATE PROCEDURE [Core].[usp_Recursos_Actualizar]
    @Id INT,
    @NegocioId INT,
    @Nombre NVARCHAR(100),
    @Tipo NVARCHAR(50),
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Core.Recursos
    SET Nombre = @Nombre,
        Tipo = @Tipo,
        Activo = @Activo
    WHERE Id = @Id AND NegocioId = @NegocioId;

    SELECT @@ROWCOUNT;
END
GO
