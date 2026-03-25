-- SCRIPT 05: REFACTORIZACIÓN A PROCEDIMIENTOS ALMACENADOS Y VISTAS PARA EL PANEL ADMIN
USE SaaSERP_DB;
GO

-- =========================================================
-- 1. PROCEDIMIENTOS DE CATÁLOGO (NEGOCIOS)
-- =========================================================

-- Obtener Todos los Negocios (Para el Súper Admin)
IF OBJECT_ID('[Core].[usp_Negocios_ObtenerTodos]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Negocios_ObtenerTodos];
GO
CREATE PROCEDURE [Core].[usp_Negocios_ObtenerTodos]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, TelefonoWhatsApp, Activo, FechaRegistro, SistemaAsignado, CapacidadMaxima, DuracionMinutosCita, UsaMesas, HoraApertura, HoraCierre,
           AccesoWeb, AccesoMovil, ModuloHistorial, ModuloWhatsApp, ModuloReportes, MercadoPagoAccessToken
    FROM Core.Negocios;
END
GO

-- Obtener Negocio Por Teléfono o Sistema Asignado (MIGRACIÓN DEL CÓDIGO INLINE C#)
IF OBJECT_ID('[Core].[usp_Negocios_ObtenerConfiguracionPorWhatsapp]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Negocios_ObtenerConfiguracionPorWhatsapp];
GO
CREATE PROCEDURE [Core].[usp_Negocios_ObtenerConfiguracionPorWhatsapp]
    @InstanciaOTelefono NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, TelefonoWhatsApp, Activo, FechaRegistro, SistemaAsignado, CapacidadMaxima, DuracionMinutosCita, UsaMesas, HoraApertura, HoraCierre,
           AccesoWeb, AccesoMovil, ModuloHistorial, ModuloWhatsApp, ModuloReportes, MercadoPagoAccessToken
    FROM Core.Negocios
    WHERE Activo = 1 
    AND (
        SistemaAsignado = @InstanciaOTelefono 
        OR TelefonoWhatsApp = @InstanciaOTelefono
        OR REPLACE(REPLACE(Nombre, ' ', '_'), 'í', 'i') = @InstanciaOTelefono
        OR REPLACE(Nombre, ' ', '_') = @InstanciaOTelefono
    );
END
GO

IF OBJECT_ID('[Core].[usp_Negocios_ObtenerConfiguracionPorId]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Negocios_ObtenerConfiguracionPorId];
GO
CREATE PROCEDURE [Core].[usp_Negocios_ObtenerConfiguracionPorId]
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, TelefonoWhatsApp, Activo, FechaRegistro, SistemaAsignado, CapacidadMaxima, DuracionMinutosCita, UsaMesas, HoraApertura, HoraCierre,
           AccesoWeb, AccesoMovil, ModuloHistorial, ModuloWhatsApp, ModuloReportes, MercadoPagoAccessToken
    FROM Core.Negocios
    WHERE Activo = 1 AND Id = @Id;
END
GO

-- =========================================================
-- 2. PROCEDIMIENTOS DE CATÁLOGO (SERVICIOS)
-- =========================================================

IF OBJECT_ID('[Core].[usp_Servicios_ObtenerPorNegocio]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Servicios_ObtenerPorNegocio];
GO
CREATE PROCEDURE [Core].[usp_Servicios_ObtenerPorNegocio]
    @NegocioId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NegocioId, Nombre, DuracionMinutos, Precio, Activo 
    FROM Core.Servicios 
    WHERE NegocioId = @NegocioId; -- Retorna todos, activos o inactivos, para el Panel Admin
END
GO

IF OBJECT_ID('[Core].[usp_Servicios_ObtenerActivosPorNegocio]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Servicios_ObtenerActivosPorNegocio];
GO
CREATE PROCEDURE [Core].[usp_Servicios_ObtenerActivosPorNegocio]
    @NegocioId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NegocioId, Nombre, DuracionMinutos, Precio, Activo 
    FROM Core.Servicios 
    WHERE NegocioId = @NegocioId AND Activo = 1; -- Retorna solo activos para la IA
END
GO

-- =========================================================
-- 3. PROCEDIMIENTOS DE CATÁLOGO (RECURSOS)
-- =========================================================

IF OBJECT_ID('[Core].[usp_Recursos_ObtenerPorNegocio]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Recursos_ObtenerPorNegocio];
GO
CREATE PROCEDURE [Core].[usp_Recursos_ObtenerPorNegocio]
    @NegocioId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NegocioId, Nombre, Tipo, Activo 
    FROM Core.Recursos 
    WHERE NegocioId = @NegocioId;
END
GO

IF OBJECT_ID('[Core].[usp_Recursos_ObtenerActivosPorNegocio]', 'P') IS NOT NULL DROP PROCEDURE [Core].[usp_Recursos_ObtenerActivosPorNegocio];
GO
CREATE PROCEDURE [Core].[usp_Recursos_ObtenerActivosPorNegocio]
    @NegocioId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NegocioId, Nombre, Tipo, Activo 
    FROM Core.Recursos 
    WHERE NegocioId = @NegocioId AND Activo = 1;
END
GO

-- =========================================================
-- 4. VISTAS DE REPORTES BÁSICOS
-- =========================================================

IF SCHEMA_ID('Reportes') IS NULL
BEGIN
    EXEC('CREATE SCHEMA Reportes');
END
GO

IF OBJECT_ID('[Reportes].[vw_KpiComandasActivas]', 'V') IS NOT NULL DROP VIEW [Reportes].[vw_KpiComandasActivas];
GO
CREATE VIEW [Reportes].[vw_KpiComandasActivas]
AS
SELECT 
    c.NegocioId,
    n.Nombre AS Negocio,
    COUNT(c.Id) AS TotalOrdenesActivas,
    SUM(c.Total) AS DineroEnCurso
FROM Operacion.Comandas c
INNER JOIN Core.Negocios n ON c.NegocioId = n.Id
WHERE c.Estado NOT IN ('Pagada', 'Cancelada')
GROUP BY c.NegocioId, n.Nombre;
GO

IF OBJECT_ID('[Reportes].[vw_KpiEstadiasActivas]', 'V') IS NOT NULL DROP VIEW [Reportes].[vw_KpiEstadiasActivas];
GO
CREATE VIEW [Reportes].[vw_KpiEstadiasActivas]
AS
SELECT 
    e.NegocioId,
    n.Nombre AS Negocio,
    COUNT(e.Id) AS VehiculosAdentro,
    SUM(DATEDIFF(MINUTE, e.FechaHoraEntrada, GETDATE())) AS MinutosTotalesEstacionados
FROM Operacion.Estadias e
INNER JOIN Core.Negocios n ON e.NegocioId = n.Id
WHERE e.Estado = 'En Curso'
GROUP BY e.NegocioId, n.Nombre;
GO
