-- SCRIPT 03: MÓDULO ESTADÍAS Y PARQUEADEROS
USE SaaSERP_DB;
GO

-- 1. Tabla de Tarifas
IF OBJECT_ID('Core.TarifaEstadia', 'U') IS NULL
BEGIN
    CREATE TABLE Core.TarifaEstadia (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NegocioId INT NOT NULL,
        
        CostoPrimeraFraccion DECIMAL(18,2) NOT NULL DEFAULT 20.00,
        MinutosPrimeraFraccion INT NOT NULL DEFAULT 60,
        CostoFraccionAdicional DECIMAL(18,2) NOT NULL DEFAULT 5.00,
        MinutosFraccionAdicional INT NOT NULL DEFAULT 15,
        MinutosToleranciaEntrada INT NOT NULL DEFAULT 10,
        MinutosToleranciaFraccion INT NOT NULL DEFAULT 5,
        BoletoPerdido DECIMAL(18,2) NOT NULL DEFAULT 150.00,
        
        HeaderTicket NVARCHAR(200) NOT NULL DEFAULT 'PARQUEADERO',
        FooterTicket NVARCHAR(200) NOT NULL DEFAULT 'Gracias por su visita.',

        CONSTRAINT FK_Tarifa_Negocio FOREIGN KEY (NegocioId) REFERENCES Core.Negocios(Id)
    );
END
GO

-- Insertar tarifa por defecto al Negocio de Barberia por si la quieren usar (O a todos los negocios existentes)
INSERT INTO Core.TarifaEstadia (NegocioId)
SELECT Id FROM Core.Negocios WHERE Id NOT IN (SELECT NegocioId FROM Core.TarifaEstadia);
GO

-- 2. Tabla de Estadías (Registro vivo)
IF OBJECT_ID('Operacion.Estadias', 'U') IS NULL
BEGIN
    CREATE TABLE Operacion.Estadias (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NegocioId INT NOT NULL,
        PlacaOIdentificador NVARCHAR(50) NOT NULL,
        FechaHoraEntrada DATETIME NOT NULL,
        FechaHoraSalida DATETIME NULL,
        MontoTotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Estado NVARCHAR(50) NOT NULL DEFAULT 'En Curso', -- En Curso, Pagado
        Notas NVARCHAR(500) NULL,
        CONSTRAINT FK_Estadia_Negocio FOREIGN KEY (NegocioId) REFERENCES Core.Negocios(Id)
    );
END
GO

-- 3. Procedimiento para Registrar Entrada
IF OBJECT_ID('[Operacion].[usp_Estadias_RegistrarEntrada]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Estadias_RegistrarEntrada];
GO
CREATE PROCEDURE [Operacion].[usp_Estadias_RegistrarEntrada]
    @NegocioId INT,
    @Placa NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar si ya hay una entrada sin salida para esa placa en este negocio
    IF EXISTS (SELECT 1 FROM Operacion.Estadias WHERE NegocioId = @NegocioId AND PlacaOIdentificador = @Placa AND Estado = 'En Curso')
    BEGIN
        SELECT -1 AS Id; -- Significa "Ya está adentro"
        RETURN;
    END

    INSERT INTO Operacion.Estadias (NegocioId, PlacaOIdentificador, FechaHoraEntrada, Estado)
    OUTPUT INSERTED.Id
    VALUES (@NegocioId, @Placa, GETDATE(), 'En Curso');
END
GO

-- 4. Procedimiento para Calcular Cobro Matemático y Leer Ticket
IF OBJECT_ID('[Operacion].[usp_Estadias_CalcularSalida]', 'P') IS NOT NULL
    DROP PROCEDURE [Operacion].[usp_Estadias_CalcularSalida];
GO
CREATE PROCEDURE [Operacion].[usp_Estadias_CalcularSalida]
    @NegocioId INT,
    @Placa NVARCHAR(50),
    @SoloCalcular BIT = 1 -- 1 Para solo calcular decirle a la IA o pantalla, 0 para cerrar y marcar Pagado
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EstadiaId INT;
    DECLARE @Entrada DATETIME;
    DECLARE @MinutosTranscurridos INT;
    DECLARE @MontoCobro DECIMAL(18,2) = 0;

    -- Buscar ticket vivo
    SELECT TOP 1 @EstadiaId = Id, @Entrada = FechaHoraEntrada 
    FROM Operacion.Estadias 
    WHERE NegocioId = @NegocioId AND PlacaOIdentificador = @Placa AND Estado = 'En Curso'
    ORDER BY Id DESC;

    IF @EstadiaId IS NULL
    BEGIN
        -- Error, no encontrado
        SELECT -1 AS EstadiaId, 0 AS MontoTotal, -1 AS MinutosTranscurridos, 'No se encontró vehículo' AS Detalle;
        RETURN;
    END

    -- Matemáticas
    DECLARE @Ahora DATETIME = GETDATE();
    SET @MinutosTranscurridos = DATEDIFF(MINUTE, @Entrada, @Ahora);

    -- Traer Tarifa
    DECLARE @CostoPrimera DECIMAL(18,2), @MinutosPrimera INT;
    DECLARE @CostoFraccion DECIMAL(18,2), @MinutosFraccion INT;
    DECLARE @TolEntrada INT, @TolFraccion INT;

    SELECT TOP 1 
        @CostoPrimera = CostoPrimeraFraccion,
        @MinutosPrimera = MinutosPrimeraFraccion,
        @CostoFraccion = CostoFraccionAdicional,
        @MinutosFraccion = MinutosFraccionAdicional,
        @TolEntrada = MinutosToleranciaEntrada,
        @TolFraccion = MinutosToleranciaFraccion
    FROM Core.TarifaEstadia WHERE NegocioId = @NegocioId;

    -- Si no hay tarifa configurada (no deberia), falla suave
    IF @CostoPrimera IS NULL SET @CostoPrimera = 0;

    -- Lógica de cálculo en SQL para proteger la fórmula de manipulaciones en C# u otro lenguaje
    IF @MinutosTranscurridos <= @TolEntrada
    BEGIN
        SET @MontoCobro = 0; -- Salio de inmediato
    END
    ELSE IF @MinutosTranscurridos <= (@MinutosPrimera + @TolFraccion)
    BEGIN
        SET @MontoCobro = @CostoPrimera; -- Cubrio la primera fraccion
    END
    ELSE
    BEGIN
        -- Empezamos con la primera fraccion
        SET @MontoCobro = @CostoPrimera;
        -- Minutos excedentes despues de la primera hora
        DECLARE @Excedente INT = @MinutosTranscurridos - @MinutosPrimera;
        
        -- Si hay fracciones de ej. 15 mins (y descontamos la tolerancia para la division)
        -- Tolerancia a favor del cliente: si te pasas 4 mins, no te cobra, pero a partir de 5 te cobra el bloque completo
        DECLARE @ExcedenteCobrar INT = 0;
        IF @Excedente > @TolFraccion
        BEGIN
            -- Restamos la tolerancia al excedente general o lo consideramos por cada bloque. 
            -- Lo normal es: Si la fraccion es 15, y te pasas 16, son 2 bloques. 
            -- Math = CEILING((Excedente - Tolerancia) / Fraccion)
            -- Pero en SQL int division trunca. Usamos flotantes para Ceiling.
            
            DECLARE @Bloques DECIMAL(18,4) = CAST(@Excedente AS DECIMAL) / CAST(@MinutosFraccion AS DECIMAL);
            DECLARE @BloquesEnteros INT = FLOOR(@Bloques);
            DECLARE @ResiduoMinutos INT = @Excedente % @MinutosFraccion;

            SET @ExcedenteCobrar = @BloquesEnteros;
            -- Si el residuo es mayor que la tolerancia, facturamos otro bloque
            IF @ResiduoMinutos > @TolFraccion
            BEGIN
                SET @ExcedenteCobrar = @ExcedenteCobrar + 1;
            END
            ELSE IF @ResiduoMinutos > 0 AND @BloquesEnteros = 0
            BEGIN
                 -- Casos donde se pasó pero menos que la fraccion, y el residuo es mayor o igual a algo? No, la condición anterior lo cubre. 
                 -- Wait, si el excedente total es 4, residuo 4, es <= tolerancia, no se factura bloque extra y bloques enteros es 0, así que ExcedenteCobrar = 0.
                 -- Si el excedente es 6 (fraccion 15, tol 5), residuo 6 > 5. BloquesEnteros = 0. ExcedenteCobrar = 1. Funciona perfecto.
                 -- No requiere ELSE.
                 SET @ExcedenteCobrar = @ExcedenteCobrar;
            END
        END

        SET @MontoCobro = @CostoPrimera + (@ExcedenteCobrar * @CostoFraccion);
    END

    -- Si es para cerrar
    IF @SoloCalcular = 0
    BEGIN
        UPDATE Operacion.Estadias 
        SET FechaHoraSalida = @Ahora, MontoTotal = @MontoCobro, Estado = 'Pagado'
        WHERE Id = @EstadiaId;
    END

    -- Retornar resultado
    SELECT @EstadiaId AS EstadiaId, @MontoCobro AS MontoTotal, @MinutosTranscurridos AS MinutosTranscurridos, 'Cálculo exitoso' AS Detalle;
END
GO
