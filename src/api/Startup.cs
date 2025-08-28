namespace Polygent.Api;

public static class Startup
{
    public static WebApplication Build(string[]? args = null)
    {
        args ??= [];

        var isDev = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

        var builder = WebApplication.CreateBuilder(args);
        builder.Configuration
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
            .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables();
        builder.WebHost.ConfigureKestrel((p) => p.AddServerHeader = false);
        builder.Services.AddPolygent(builder.Configuration);

        // Configure services
        var app = builder.Build();

        if (!isDev)
        {
            app.UseHsts();
        }
        else
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseHttpsRedirection();
        app.UsePolygent();

        return app;
    }
}