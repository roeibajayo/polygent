using Microsoft.EntityFrameworkCore;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Hubs;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;

namespace Polygent.Api;

public static class HostExtensions
{
    public static void UsePolygent(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PolygentContext>();
        db.Database.Migrate();

        // Stop all working sessions on application start
        var sessionManagement = scope.ServiceProvider.GetRequiredService<ISessionManagement>();
        sessionManagement.StopAllWorkingSessionsAsync(CancellationToken.None).Wait();

        app.MapEndpoints<IMarker>();
        app.MapHub<PolygentHub>("/hub");

        // spa
        app.UseStaticFiles();
        app.MapFallbackToFile("index.html");
    }
}
