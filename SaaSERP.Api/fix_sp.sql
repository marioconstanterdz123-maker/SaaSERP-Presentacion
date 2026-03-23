USE SaaSERP_DB;
GO

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

    -- Pre-Calcular Total leyendo los precios reales de la BD para evitar Fraude de la IA
    SELECT @TotalCalculado = SUM(d.Cantidad * s.Precio)
    FROM @Detalles d
    INNER JOIN Core.Servicios s ON d.ServicioId = s.Id AND s.NegocioId = @NegocioId;

    -- Insertar Cabecera
    INSERT INTO Operacion.Comandas (NegocioId, TelefonoCliente, NombreCliente, TipoAtencion, IdentificadorMesa, Total, Estado)
    VALUES (@NegocioId, @Telefono, @NombreCliente, @TipoAtencion, @IdentificadorMesa, ISNULL(@TotalCalculado, 0), 'Recibida');
    
    SET @ComandaId = SCOPE_IDENTITY();

    -- Insertar Detalles calculando sus subtotales reales (Fix de plural/singular y nombres de columna)
    INSERT INTO Operacion.DetalleComanda (ComandaId, ServicioId, Cantidad, Subtotal, NotasOpcionales)
    SELECT @ComandaId, d.ServicioId, d.Cantidad, (d.Cantidad * s.Precio), d.Notas
    FROM @Detalles d
    INNER JOIN Core.Servicios s ON d.ServicioId = s.Id AND s.NegocioId = @NegocioId;

    SELECT @ComandaId AS ComandaId, ISNULL(@TotalCalculado, 0) AS TotalCobrar;
END
GO
