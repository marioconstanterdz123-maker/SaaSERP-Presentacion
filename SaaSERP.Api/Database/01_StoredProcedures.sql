-- SCRIPT DE PROCEDIMIENTOS ALMACENADOS PARA SaaSERP-Victoria (SQL Server 2014 Compatible)
-- Ejecutar en SQL Server Management Studio

--=============================================
-- 1. CITAS: Validar Disponibilidad
--=============================================
IF OBJECT_ID('[Operacion].[usp_Citas_ValidarDisponibilidad]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Citas_ValidarDisponibilidad];
GO
CREATE PROCEDURE [Operacion].[usp_Citas_ValidarDisponibilidad]
    @NegocioId INT,
    @FechaHoraInicio DATETIME,
    @FechaHoraFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CapacidadMaxima INT;
    SELECT @CapacidadMaxima = ISNULL(CapacidadMaxima, 1) FROM Core.Negocios WHERE Id = @NegocioId;

    DECLARE @TurnosOcupados INT;

    IF @FechaHoraInicio = @FechaHoraFin
    BEGIN
        SELECT @TurnosOcupados = COUNT(1) 
        FROM Operacion.Citas 
        WHERE NegocioId = @NegocioId 
          AND Estado <> 'Cancelada'
          AND FechaHoraInicio <= @FechaHoraInicio 
          AND (FechaHoraFin > @FechaHoraInicio OR FechaHoraFin = @FechaHoraInicio);
    END
    ELSE
    BEGIN
        SELECT @TurnosOcupados = COUNT(1) 
        FROM Operacion.Citas 
        WHERE NegocioId = @NegocioId 
          AND Estado <> 'Cancelada'
          AND FechaHoraInicio < @FechaHoraFin 
          AND FechaHoraFin > @FechaHoraInicio;
    END

    IF @TurnosOcupados < @CapacidadMaxima
        SELECT 1 AS Disponible; /* True */
    ELSE
        SELECT 0 AS Disponible; /* False */

END
GO

--=============================================
-- 2. CITAS: Registrar
--=============================================
IF OBJECT_ID('[Operacion].[usp_Citas_Registrar]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Citas_Registrar];
GO
CREATE PROCEDURE [Operacion].[usp_Citas_Registrar]
    @NegocioId INT,
    @TelefonoCliente VARCHAR(20),
    @NombreCliente NVARCHAR(100),
    @FechaHoraInicio DATETIME,
    @FechaHoraFin DATETIME,
    @Estado VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Operacion.Citas (NegocioId, TelefonoCliente, NombreCliente, FechaHoraInicio, FechaHoraFin, Estado)
    OUTPUT INSERTED.Id
    VALUES (@NegocioId, @TelefonoCliente, @NombreCliente, @FechaHoraInicio, @FechaHoraFin, @Estado);
END
GO

--=============================================
-- 3. CITAS: Obtener Por Telefono
--=============================================
IF OBJECT_ID('[Operacion].[usp_Citas_ObtenerPorTelefono]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Citas_ObtenerPorTelefono];
GO
CREATE PROCEDURE [Operacion].[usp_Citas_ObtenerPorTelefono]
    @NegocioId INT,
    @TelefonoCliente VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Operacion.Citas 
    WHERE NegocioId = @NegocioId 
      AND TelefonoCliente = @TelefonoCliente 
      AND Estado IN ('Pendiente', 'Confirmada')
    ORDER BY FechaHoraInicio ASC;
END
GO

--=============================================
-- 4. CITAS: Cancelar
--=============================================
IF OBJECT_ID('[Operacion].[usp_Citas_Cancelar]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Citas_Cancelar];
GO
CREATE PROCEDURE [Operacion].[usp_Citas_Cancelar]
    @CitaId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Operacion.Citas 
    SET Estado = 'Cancelada' 
    WHERE Id = @CitaId;
    
    SELECT @@ROWCOUNT AS FilasAfectadas;
END
GO

--=============================================
-- 5. CITAS: Reprogramar
--=============================================
IF OBJECT_ID('[Operacion].[usp_Citas_Reprogramar]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Citas_Reprogramar];
GO
CREATE PROCEDURE [Operacion].[usp_Citas_Reprogramar]
    @CitaId INT,
    @NuevaFechaInicio DATETIME,
    @NuevaFechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Operacion.Citas 
    SET FechaHoraInicio = @NuevaFechaInicio, 
        FechaHoraFin = @NuevaFechaFin,
        Estado = 'Pendiente'
    WHERE Id = @CitaId;

    SELECT @@ROWCOUNT AS FilasAfectadas;
END
GO

--=============================================
-- 6. HISTORIAL CHAT: Guardar
--=============================================
IF OBJECT_ID('[Operacion].[usp_HistorialChat_Guardar]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_HistorialChat_Guardar];
GO
CREATE PROCEDURE [Operacion].[usp_HistorialChat_Guardar]
    @Telefono VARCHAR(20),
    @Rol VARCHAR(20),
    @Contenido NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Operacion.HistorialChat (TelefonoCliente, Rol, Contenido)
    VALUES (@Telefono, @Rol, @Contenido);
END
GO

--=============================================
-- 7. HISTORIAL CHAT: Obtener
--=============================================
IF OBJECT_ID('[Operacion].[usp_HistorialChat_Obtener]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_HistorialChat_Obtener];
GO
CREATE PROCEDURE [Operacion].[usp_HistorialChat_Obtener]
    @Telefono VARCHAR(20),
    @Limite INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    -- Devuelve los @Limite más recientes cronológicamente
    SELECT * FROM (
        SELECT TOP (@Limite) * 
        FROM Operacion.HistorialChat 
        WHERE TelefonoCliente = @Telefono
        ORDER BY Id DESC
    ) AS T
    ORDER BY Id ASC;
END
GO

--=============================================
-- 8. HISTORIAL CHAT: Limpiar
--=============================================
IF OBJECT_ID('[Operacion].[usp_HistorialChat_Limpiar]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_HistorialChat_Limpiar];
GO
CREATE PROCEDURE [Operacion].[usp_HistorialChat_Limpiar]
    @Telefono VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Operacion.HistorialChat WHERE TelefonoCliente = @Telefono;
END
GO
