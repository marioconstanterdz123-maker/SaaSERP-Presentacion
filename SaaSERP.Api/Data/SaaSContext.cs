using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Data
{
    public class SaaSContext : DbContext
    {
        public SaaSContext(DbContextOptions<SaaSContext> options) : base(options) { }

        public DbSet<Negocio> Negocios { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Cita> Citas { get; set; }
        public DbSet<TicketParqueadero> Tickets { get; set; }
        public DbSet<Comanda> Comandas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==========================================
            // DEFINICIÓN DE ESQUEMAS (SCHEMAS)
            // ==========================================
            // Módulo Core
            modelBuilder.Entity<Negocio>().ToTable("Negocios", schema: "Core");
            modelBuilder.Entity<Usuario>().ToTable("Usuarios", schema: "Core");

            // Módulo Operativo
            modelBuilder.Entity<Cita>().ToTable("Citas", schema: "Operacion");
            modelBuilder.Entity<TicketParqueadero>().ToTable("Tickets", schema: "Operacion");
            modelBuilder.Entity<Comanda>().ToTable("Comandas", schema: "Operacion");
        }
    }
}