-- SCRIPT 07: INTEGRACIONES DELIVERY (RAPPI, UBER EATS, DIDI)
USE SaaSERP_DB;
GO

-- 1. Credenciales por negocio y plataforma
IF OBJECT_ID('Core.DeliveryCredenciales', 'U') IS NULL
BEGIN
    CREATE TABLE Core.DeliveryCredenciales (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NegocioId INT NOT NULL,
        Plataforma NVARCHAR(20) NOT NULL, -- 'RAPPI' | 'UBEREATS' | 'DIDI'
        ClientId NVARCHAR(200) NOT NULL,
        ClientSecret NVARCHAR(500) NOT NULL,
        WebhookSecret NVARCHAR(500) NULL,  -- Para validar firmas HMAC (Rappi)
        StoreId NVARCHAR(200) NULL,        -- ID de la tienda en Rappi/Uber
        PaisCode NVARCHAR(10) NULL,        -- 'MX', 'CO', etc. (Rappi usa dominios por país)
        Activo BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_DC_Negocio FOREIGN KEY (NegocioId) REFERENCES Core.Negocios(Id)
    );
END
GO

-- 2. Mapeo de SKUs externos al catálogo interno
IF OBJECT_ID('Core.SkuTerceros', 'U') IS NULL
BEGIN
    CREATE TABLE Core.SkuTerceros (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NegocioId INT NOT NULL,
        Plataforma NVARCHAR(20) NOT NULL,
        SkuExterno NVARCHAR(200) NOT NULL,  -- ID del producto en Rappi/Uber
        ServicioId INT NOT NULL,            -- FK a Core.Servicios
        CONSTRAINT FK_SK_Negocio FOREIGN KEY (NegocioId) REFERENCES Core.Negocios(Id),
        CONSTRAINT FK_SK_Servicio FOREIGN KEY (ServicioId) REFERENCES Core.Servicios(Id)
    );
END
GO
