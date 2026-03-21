-- SCRIPT 02: CATÁLOGOS DINÁMICOS (SERVICIOS Y RECURSOS)
-- Ejecutar en SQL Server Management Studio

USE SaaSERP_DB;
GO

-- 1. Tabla de Servicios
IF OBJECT_ID('Core.Servicios', 'U') IS NULL
BEGIN
    CREATE TABLE Core.Servicios (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NegocioId INT NOT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        DuracionMinutos INT NOT NULL DEFAULT 30,
        Precio DECIMAL(18,2) NOT NULL DEFAULT 0,
        Activo BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_Servicios_Negocios FOREIGN KEY (NegocioId) REFERENCES Core.Negocios(Id)
    );
END
GO

-- 2. Tabla de Recursos
IF OBJECT_ID('Core.Recursos', 'U') IS NULL
BEGIN
    CREATE TABLE Core.Recursos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NegocioId INT NOT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        Tipo NVARCHAR(50) NOT NULL DEFAULT 'Empleado', -- Empleado, Espacio, Activo
        Activo BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_Recursos_Negocios FOREIGN KEY (NegocioId) REFERENCES Core.Negocios(Id)
    );
END
GO

-- 3. Actualizar Citas para soportar Servicio y Recurso
IF COL_LENGTH('Operacion.Citas', 'ServicioId') IS NULL
BEGIN
    ALTER TABLE Operacion.Citas ADD ServicioId INT NULL;
    ALTER TABLE Operacion.Citas ADD CONSTRAINT FK_Citas_Servicios FOREIGN KEY (ServicioId) REFERENCES Core.Servicios(Id);
END
GO

IF COL_LENGTH('Operacion.Citas', 'RecursoId') IS NULL
BEGIN
    ALTER TABLE Operacion.Citas ADD RecursoId INT NULL;
    ALTER TABLE Operacion.Citas ADD CONSTRAINT FK_Citas_Recursos FOREIGN KEY (RecursoId) REFERENCES Core.Recursos(Id);
END
GO

-- 4. Modificar SP de Registro de Cita
IF OBJECT_ID('[Operacion].[usp_Citas_Registrar]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Citas_Registrar];
GO
CREATE PROCEDURE [Operacion].[usp_Citas_Registrar]
    @NegocioId INT,
    @TelefonoCliente VARCHAR(20),
    @NombreCliente NVARCHAR(100),
    @FechaHoraInicio DATETIME,
    @FechaHoraFin DATETIME,
    @Estado VARCHAR(50),
    @ServicioId INT = NULL,
    @RecursoId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Operacion.Citas (NegocioId, TelefonoCliente, NombreCliente, FechaHoraInicio, FechaHoraFin, Estado, ServicioId, RecursoId)
    OUTPUT INSERTED.Id
    VALUES (@NegocioId, @TelefonoCliente, @NombreCliente, @FechaHoraInicio, @FechaHoraFin, @Estado, @ServicioId, @RecursoId);
END
GO

-- 5. Modificar SP de Validación de Disponibilidad para checar si el Recurso específico está ocupado
IF OBJECT_ID('[Operacion].[usp_Citas_ValidarDisponibilidad]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Citas_ValidarDisponibilidad];
GO
CREATE PROCEDURE [Operacion].[usp_Citas_ValidarDisponibilidad]
    @NegocioId INT,
    @FechaHoraInicio DATETIME,
    @FechaHoraFin DATETIME,
    @RecursoId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CapacidadMaxima INT;
    SELECT @CapacidadMaxima = ISNULL(CapacidadMaxima, 1) FROM Core.Negocios WHERE Id = @NegocioId;

    DECLARE @TurnosOcupados INT;

    -- Si se pide un Recurso específico, solo verificamos ESE recurso (Capacidad 1 por defecto por recurso)
    IF @RecursoId IS NOT NULL
    BEGIN
        SELECT @TurnosOcupados = COUNT(1) 
        FROM Operacion.Citas 
        WHERE NegocioId = @NegocioId 
          AND RecursoId = @RecursoId
          AND Estado <> 'Cancelada'
          AND FechaHoraInicio < @FechaHoraFin 
          AND FechaHoraFin > @FechaHoraInicio;

        -- Un recurso no se puede dobletear
        IF @TurnosOcupados = 0 
            SELECT 1 AS Disponible;
        ELSE 
            SELECT 0 AS Disponible;
            
        RETURN;
    END

    -- Si no pide recurso, check general
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
        SELECT 1 AS Disponible;
    ELSE
        SELECT 0 AS Disponible;

END
GO

