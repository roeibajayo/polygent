using Polygent.EndpointsInfrastructure;

namespace Polygent.Endpoints;

internal sealed class PingEndpoint : IGetEndpoint
{
    public string Route => "/api/ping";
    
    public Delegate Execute => static () =>
    {
        return Results.Ok("pong");
    };
}