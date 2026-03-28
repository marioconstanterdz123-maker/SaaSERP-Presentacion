using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Data
{
    public class SaaSContext : DbContext
    {
        public SaaSContext(DbContextOptions<SaaSContext> options) : base(options) { }

        // ── Core ─────────────────────────────────────────────────────────────
        public DbSet<Negocio> Negocios { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Servicio> Servicios { get; set; }
        public DbSet<TarifaEstadia> TarifasEstadia { get; set; }
        public DbSet<DeliveryCredencial> DeliveryCredenciales { get; set; }
        public DbSet<SkuTercero> SkuTerceros { get; set; }

        // ── Operacion ─────────────────────────────────────────────────────────
        public DbSet<Cita> Citas { get; set; }
        public DbSet<TicketParqueadero> Tickets { get; set; }
        public DbSet<Comanda> Comandas { get; set; }
        public DbSet<DetalleComanda> DetallesComanda { get; set; }

        // ── Módulo Tattoo Studio ──────────────────────────────────────────────
        public DbSet<Trabajador> Trabajadores { get; set; }
        public DbSet<HorarioTrabajador> HorariosTrabajadores { get; set; }
        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<ClienteCRM> ClientesCRM { get; set; }
        public DbSet<ReglaBonificacion> ReglasBonificacion { get; set; }

        // ── KPI Views ─────────────────────────────────────────────────────────
        public DbSet<KpiComandaActiva> KpiComandasActivas { get; set; }
        public DbSet<KpiEstadiaActiva> KpiEstadiasActivas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── Core ──────────────────────────────────────────────────────────
            modelBuilder.Entity<Negocio>().ToTable("Negocios", schema: "Core");
            modelBuilder.Entity<Usuario>().ToTable("Usuarios", schema: "Core");
            modelBuilder.Entity<Servicio>().ToTable("Servicios", schema: "Core");
            modelBuilder.Entity<TarifaEstadia>().ToTable("TarifaEstadia", schema: "Core");
            modelBuilder.Entity<DeliveryCredencial>().ToTable("DeliveryCredenciales", schema: "Core");
            modelBuilder.Entity<SkuTercero>(entity =>
            {
                entity.ToTable("SkuTerceros", schema: "Core");
                entity.HasOne(s => s.Servicio).WithMany().HasForeignKey(s => s.ServicioId).IsRequired(false);
                entity.HasOne(s => s.Negocio).WithMany().HasForeignKey(s => s.NegocioId);
            });

            // ── Operacion ─────────────────────────────────────────────────────
            modelBuilder.Entity<Cita>().ToTable("Citas", schema: "Operacion");
            modelBuilder.Entity<TicketParqueadero>().ToTable("Tickets", schema: "Operacion");
            modelBuilder.Entity<Comanda>().ToTable("Comandas", schema: "Operacion");
            modelBuilder.Entity<DetalleComanda>(entity =>
            {
                entity.ToTable("DetalleComanda", schema: "Operacion");
                entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)");
            });

            // ── Tattoo Studio ─────────────────────────────────────────────────
            modelBuilder.Entity<Trabajador>().ToTable("Trabajadores", schema: "Studio");
            modelBuilder.Entity<HorarioTrabajador>().ToTable("HorariosTrabajadores", schema: "Studio");
            modelBuilder.Entity<ChatSession>(entity =>
            {
                entity.ToTable("ChatSessions", schema: "Studio");
                entity.HasIndex(e => new { e.NegocioId, e.NumeroCliente }).IsUnique();
            });
            modelBuilder.Entity<ClienteCRM>(entity =>
            {
                entity.ToTable("ClientesCRM", schema: "Studio");
                entity.HasIndex(e => new { e.NegocioId, e.Telefono }).IsUnique();
                entity.Property(e => e.DescuentoActivo).HasColumnType("decimal(5,2)");
            });
            modelBuilder.Entity<ReglaBonificacion>(entity =>
            {
                entity.ToTable("ReglasBonificacion", schema: "Studio");
                entity.Property(e => e.Descuento).HasColumnType("decimal(5,2)");
            });

            // ── KPI Views ─────────────────────────────────────────────────────
            modelBuilder.Entity<KpiComandaActiva>().HasNoKey().ToView("vw_KpiComandasActivas", "Reportes");
            modelBuilder.Entity<KpiEstadiaActiva>().HasNoKey().ToView("vw_KpiEstadiasActivas", "Reportes");
        }
    }
}