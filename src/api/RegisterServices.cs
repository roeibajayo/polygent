using Microsoft.EntityFrameworkCore;
using Polygent.Logic;
using Polygent.Logic.Context;
using Polygent.Logic.Services;
using RoeiBajayo.Infrastructure;

namespace Polygent.Api;

public static class RegisterServices
{
    public static void AddPolygent(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ILogger>(services => services.GetRequiredService<ILogger<IMarker>>());
        services.AddInfrastructureServices<IMarker>();
        services.AddInfrastructureServices<ILogicMarker>();

        var dbPath = Path.Combine(StorageService.StoragePath, "polygent.db");
        services.AddDbContext<PolygentContext>(options =>
            options.UseSqlite("Data Source=" + dbPath, b => b.MigrationsAssembly("Polygent.Api")));

        services.AddHttpContextAccessor();
        services.AddSignalR();
    }
}
