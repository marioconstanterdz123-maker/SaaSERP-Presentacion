using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Data
{
    public class SaaSContext : DbContext
    {
        public SaaSContext(DbContextOptions<SaaSContext> options) : base(options) { }

        public DbSet<Negocio> Negocios { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Servicio> Servicios { get; set; }
        public DbSet<Cita> Citas { get; set; }
        public DbSet<TicketParqueadero> Tickets { get; set; }
        public DbSet<Comanda> Comandas { get; set; }
        public DbSet<DetalleComanda> DetallesComanda { get; set; }
        public DbSet<TarifaEstadia> TarifasEstadia { get; set; }
        public DbSet<DeliveryCredencial> DeliveryCredenciales { get; set; }
        public DbSet<SkuTercero> SkuTerceros { get; set; }

        public DbSet<KpiComandaActiva> KpiComandasActivas { get; set; }
        public DbSet<KpiEstadiaActiva> KpiEstadiasActivas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==========================================
            // DEFINICIÓN DE ESQUEMAS (SCHEMAS)
            // ==========================================
            // Módulo Core
            modelBuilder.Entity<Negocio>().ToTable("Negocios", schema: "Core");
            modelBuilder.Entity<Usuario>().ToTable("Usuarios", schema: "Core");
            modelBuilder.Entity<Servicio>().ToTable("Servicios", schema: "Core");
            modelBuilder.Entity<TarifaEstadia>().ToTable("TarifaEstadia", schema: "Core");
            modelBuilder.Entity<DeliveryCredencial>().ToTable("DeliveryCredenciales", schema: "Core");
            modelBuilder.Entity<SkuTercero>(entity =>
            {
                entity.ToTable("SkuTerceros", schema: "Core");
                entity.HasOne(s => s.Servicio)
                      .WithMany()
                      .HasForeignKey(s => s.ServicioId)
                      .IsRequired(false);
                entity.HasOne(s => s.Negocio)
                      .WithMany()
                      .HasForeignKey(s => s.NegocioId);
            });

            // Módulo Operativo
            modelBuilder.Entity<Cita>().ToTable("Citas", schema: "Operacion");
            modelBuilder.Entity<TicketParqueadero>().ToTable("Tickets", schema: "Operacion");
            modelBuilder.Entity<Comanda>().ToTable("Comandas", schema: "Operacion");
            
            // Map DetalleComanda explicitly
            modelBuilder.Entity<DetalleComanda>(entity =>
            {
                entity.ToTable("DetalleComanda", schema: "Operacion");
                entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)");
            });

            // Vistas SQL (KPIs)
            modelBuilder.Entity<KpiComandaActiva>().HasNoKey().ToView("vw_KpiComandasActivas", "Reportes");
            modelBuilder.Entity<KpiEstadiaActiva>().HasNoKey().ToView("vw_KpiEstadiasActivas", "Reportes");
        }
    }
}