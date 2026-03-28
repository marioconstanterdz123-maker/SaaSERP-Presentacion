-- =====================================================================
-- 05_Tattoo_Studio_Modules.sql
-- Módulos avanzados para estudio de tatuajes con IA WhatsApp
-- Syntax: SQL Server (T-SQL)
-- Ejecutar con: sqlcmd -S localhost -U sa -P 'pass' -i este_archivo.sql
-- =====================================================================

-- Schema Studio
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Studio')
    EXEC('CREATE SCHEMA Studio');
GO

-- ── Trabajadores ──────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='Studio' AND t.name='Trabajadores')
CREATE TABLE Studio.Trabajadores (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    NegocioId           INT NOT NULL,
    Nombre              NVARCHAR(100) NOT NULL,
    Telefono            NVARCHAR(20) NULL,
    Email               NVARCHAR(150) NULL,
    InstanciaWhatsApp   NVARCHAR(100) NULL,
    ApiKeyEvolution     NVARCHAR(200) NULL,
    Activo              BIT NOT NULL DEFAULT 1
);
GO

-- ── Horarios Trabajadores ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='Studio' AND t.name='HorariosTrabajadores')
CREATE TABLE Studio.HorariosTrabajadores (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TrabajadorId    INT NOT NULL REFERENCES Studio.Trabajadores(Id) ON DELETE CASCADE,
    DiaSemana       INT NOT NULL,  -- 0=Dom, 1=Lun ... 6=Sab
    HoraInicio      TIME NOT NULL,
    HoraFin         TIME NOT NULL
);
GO

-- ── Chat Sessions (WhatsApp Silencio / Handoff) ───────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='Studio' AND t.name='ChatSessions')
CREATE TABLE Studio.ChatSessions (
    Id                              INT IDENTITY(1,1) PRIMARY KEY,
    NegocioId                       INT NOT NULL,
    TrabajadorId                    INT NULL REFERENCES Studio.Trabajadores(Id) ON DELETE SET NULL,
    NumeroCliente                   NVARCHAR(30) NOT NULL,
    NombreCliente                   NVARCHAR(100) NULL,
    ModoSilencio                    BIT NOT NULL DEFAULT 0,
    EsperandoConfirmacionHandoff    BIT NOT NULL DEFAULT 0,
    UltimoMensaje                   DATETIME NOT NULL DEFAULT GETUTCDATE(),
    SilencioActivadoEn              DATETIME NULL,
    WhisperEnviado                  BIT NOT NULL DEFAULT 0,
    CONSTRAINT UQ_ChatSession_Negocio_Numero UNIQUE (NegocioId, NumeroCliente)
);
GO

-- ── CRM Clientes ──────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='Studio' AND t.name='ClientesCRM')
CREATE TABLE Studio.ClientesCRM (
    Id                      INT IDENTITY(1,1) PRIMARY KEY,
    NegocioId               INT NOT NULL,
    Telefono                NVARCHAR(30) NOT NULL,
    NombreDetectado         NVARCHAR(100) NULL,
    PrimerContacto          DATETIME NOT NULL DEFAULT GETUTCDATE(),
    UltimaInteraccion       DATETIME NOT NULL DEFAULT GETUTCDATE(),
    TotalCitasCompletadas   INT NOT NULL DEFAULT 0,
    NivelLealtad            NVARCHAR(50) NULL,
    DescuentoActivo         DECIMAL(5,2) NOT NULL DEFAULT 0,
    CONSTRAINT UQ_CRM_Negocio_Telefono UNIQUE (NegocioId, Telefono)
);
GO

-- ── Reglas de Bonificación ────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id=s.schema_id WHERE s.name='Studio' AND t.name='ReglasBonificacion')
CREATE TABLE Studio.ReglasBonificacion (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    NegocioId       INT NOT NULL,
    Nombre          NVARCHAR(100) NOT NULL,
    CitasRequeridas INT NOT NULL,
    VentanaMeses    INT NOT NULL,
    NivelNombre     NVARCHAR(50) NOT NULL,
    Descuento       DECIMAL(5,2) NOT NULL DEFAULT 0,
    Activa          BIT NOT NULL DEFAULT 1
);
GO

-- ── Columnas nuevas en tablas existentes ──────────────────────────────
-- TrabajadorId en Citas
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='Operacion' AND TABLE_NAME='Citas' AND COLUMN_NAME='TrabajadorId'
)
    ALTER TABLE Operacion.Citas ADD TrabajadorId INT NULL;
GO

-- TiempoSilencioMinutos en Negocios
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='Core' AND TABLE_NAME='Negocios' AND COLUMN_NAME='TiempoSilencioMinutos'
)
    ALTER TABLE Core.Negocios ADD TiempoSilencioMinutos INT NOT NULL DEFAULT 60;
GO

PRINT 'Migracion 05_Tattoo_Studio_Modules completada exitosamente.';
GO
