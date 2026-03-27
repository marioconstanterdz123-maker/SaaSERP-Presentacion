-- SCRIPT 04: MÓDULO DE CONSUMOS Y COMANDAS
USE SaaSERP_DB;
GO

-- 1. DROP TABLAS EXISTENTES PARA EMPEZAR LIMPIO
IF OBJECT_ID('Operacion.DetalleComandas', 'U') IS NOT NULL
    DROP TABLE Operacion.DetalleComandas;
GO

IF OBJECT_ID('Operacion.Comandas', 'U') IS NOT NULL
    DROP TABLE Operacion.Comandas;
GO

-- 2. Tabla de Comandas (Cabecera)
CREATE TABLE Operacion.Comandas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NegocioId INT NOT NULL,
    TelefonoCliente NVARCHAR(20) NOT NULL,
    NombreCliente NVARCHAR(100) NOT NULL,
    TipoAtencion NVARCHAR(50) NOT NULL DEFAULT 'Mostrador', -- Mostrador, Mesa, Llevar
    IdentificadorMesa NVARCHAR(50) NULL,
    Total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    Estado NVARCHAR(50) NOT NULL DEFAULT 'Recibida', -- Recibida, Preparando, Lista, Pagada, Cancelada
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Comandas_Negocios FOREIGN KEY (NegocioId) REFERENCES Core.Negocios(Id)
);
GO

-- 3. Tabla de Detalles
CREATE TABLE Operacion.DetalleComandas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ComandaId INT NOT NULL,
        ServicioId INT NOT NULL, -- Refiere a Core.Servicios (Que actúa como catálogo universal de productos/servicios)
        Cantidad INT NOT NULL DEFAULT 1,
        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Notas NVARCHAR(250) NULL,
        CONSTRAINT FK_Detalle_Comanda FOREIGN KEY (ComandaId) REFERENCES Operacion.Comandas(Id),
        CONSTRAINT FK_Detalle_Servicio FOREIGN KEY (ServicioId) REFERENCES Core.Servicios(Id)
    );
END
GO

-- 3. Tipo Tabla (UDT) para mandar JSON / Arrays desde C#
IF TYPE_ID('Operacion.udt_DetalleComanda') IS NULL
BEGIN
    CREATE TYPE Operacion.udt_DetalleComanda AS TABLE
    (
        ServicioId INT,
        Cantidad INT,
        Notas NVARCHAR(250)
    );
END
GO

-- 4. SP Crear Comanda Múltiple
IF OBJECT_ID('[Operacion].[usp_Comandas_Crear]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Comandas_Crear];
GO
CREATE PROCEDURE [Operacion].[usp_Comandas_Crear]
    @NegocioId INT,
    @Telefono VARCHAR(20),
    @NombreCliente NVARCHAR(100),
    @TipoAtencion NVARCHAR(50),
    @IdentificadorMesa NVARCHAR(50),
    @Detalles Operacion.udt_DetalleComanda READONLY
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ComandaId INT;
    DECLARE @TotalCalculado DECIMAL(18,2) = 0;
    DECLARE @InsertedIds TABLE (Id INT);

    -- Pre-Calcular Total leyendo los precios reales de la BD para evitar Fraude de la IA
    SELECT @TotalCalculado = ISNULL(SUM(d.Cantidad * s.Precio), 0)
    FROM @Detalles d
    INNER JOIN Core.Servicios s ON d.ServicioId = s.Id AND s.NegocioId = @NegocioId;

    -- Insertar Cabecera. FechaCreacion es NOT NULL sin DEFAULT, se pasa explícito.
    INSERT INTO Operacion.Comandas (NegocioId, TelefonoCliente, NombreCliente, TipoAtencion, IdentificadorMesa, Total, Estado, FechaCreacion)
    OUTPUT INSERTED.Id INTO @InsertedIds
    VALUES (@NegocioId, @Telefono, @NombreCliente, @TipoAtencion, ISNULL(@IdentificadorMesa, ''), @TotalCalculado, 'Recibida', GETDATE());
    
    SELECT @ComandaId = Id FROM @InsertedIds;

    -- Insertar Detalles calculando sus subtotales reales
    INSERT INTO Operacion.DetalleComandas (ComandaId, ServicioId, Cantidad, Subtotal, Notas)
    SELECT @ComandaId, d.ServicioId, d.Cantidad, (d.Cantidad * s.Precio), ISNULL(d.Notas, '')
    FROM @Detalles d
    INNER JOIN Core.Servicios s ON d.ServicioId = s.Id AND s.NegocioId = @NegocioId;

    SELECT @ComandaId AS ComandaId, ISNULL(@TotalCalculado, 0) AS TotalCobrar;
END
GO

-- 5. SP Consultar Estado
IF OBJECT_ID('[Operacion].[usp_Comandas_ConsultarEstado]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Comandas_ConsultarEstado];
GO
CREATE PROCEDURE [Operacion].[usp_Comandas_ConsultarEstado]
    @NegocioId INT,
    @Telefono VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    -- Devuelve la comanda más reciente activa de este cliente
    SELECT TOP 1 * FROM Operacion.Comandas 
    WHERE NegocioId = @NegocioId AND TelefonoCliente = @Telefono AND Estado NOT IN ('Pagada', 'Cancelada')
    ORDER BY Id DESC;
END
GO
