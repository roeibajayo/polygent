namespace Polygent.Api.EndpointsInfrastructure;

public static class Register
{
    public static void MapEndpoints<TMarker>(this WebApplication app)
    {
        // GET

        var getEndpoints = typeof(TMarker).Assembly
            .GetTypes()
            .Where(t => t.IsClass && t.GetInterfaces().Contains(typeof(IGetEndpoint)))
            .ToArray();

        foreach (var getEndpoint in getEndpoints)
        {
            var endpoint = Activator.CreateInstance(getEndpoint) as IGetEndpoint;
            var route = app.MapGet(endpoint.Route, endpoint.Execute).WithName("GET:" + endpoint.Route);
        }

        // POST

        var postEndpoints = typeof(TMarker).Assembly
            .GetTypes()
            .Where(t => t.IsClass && t.GetInterfaces().Contains(typeof(IPostEndpoint)))
            .ToArray();

        foreach (var postEndpoint in postEndpoints)
        {
            var endpoint = Activator.CreateInstance(postEndpoint) as IPostEndpoint;
            var route = app.MapPost(endpoint!.Route, endpoint.Execute).WithName("POST:" + endpoint.Route);
        }

        // PUT

        var putEndpoints = typeof(TMarker).Assembly
            .GetTypes()
            .Where(t => t.IsClass && t.GetInterfaces().Contains(typeof(IPutEndpoint)))
            .ToArray();

        foreach (var putEndpoint in putEndpoints)
        {
            var endpoint = Activator.CreateInstance(putEndpoint) as IPutEndpoint;
            var route = app.MapPut(endpoint!.Route, endpoint.Execute).WithName("PUT:" + endpoint.Route);
        }

        // DELETE

        var deleteEndpoints = typeof(TMarker).Assembly
            .GetTypes()
            .Where(t => t.IsClass && t.GetInterfaces().Contains(typeof(IDeleteEndpoint)))
            .ToArray();

        foreach (var deleteEndpoint in deleteEndpoints)
        {
            var endpoint = Activator.CreateInstance(deleteEndpoint) as IDeleteEndpoint;
            var route = app.MapDelete(endpoint!.Route, endpoint.Execute).WithName("DELETE:" + endpoint.Route);
        }
    }
}
