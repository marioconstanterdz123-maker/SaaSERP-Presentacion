USE SaaSERP_DB;
GO
ALTER PROCEDURE [Operacion].[usp_Comandas_Crear]
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

    SELECT @TotalCalculado = ISNULL(SUM(d.Cantidad * s.Precio), 0)
    FROM @Detalles d
    INNER JOIN Core.Servicios s ON d.ServicioId = s.Id AND s.NegocioId = @NegocioId;

    INSERT INTO Operacion.Comandas (NegocioId, TelefonoCliente, NombreCliente, TipoAtencion, IdentificadorMesa, Total, Estado, FechaCreacion)
    OUTPUT INSERTED.Id INTO @InsertedIds
    VALUES (@NegocioId, @Telefono, @NombreCliente, @TipoAtencion, ISNULL(@IdentificadorMesa, ''), @TotalCalculado, 'Recibida', GETDATE());
    
    SELECT @ComandaId = Id FROM @InsertedIds;

    INSERT INTO Operacion.DetalleComandas (ComandaId, ServicioId, Cantidad, Subtotal, Notas)
    SELECT @ComandaId, d.ServicioId, d.Cantidad, (d.Cantidad * s.Precio), ISNULL(d.Notas, '')
    FROM @Detalles d
    INNER JOIN Core.Servicios s ON d.ServicioId = s.Id AND s.NegocioId = @NegocioId;

    SELECT @ComandaId AS ComandaId, ISNULL(@TotalCalculado, 0) AS TotalCobrar;
END
GO
