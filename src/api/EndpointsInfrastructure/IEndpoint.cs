namespace Polygent.Api.EndpointsInfrastructure;

public interface IEndpoint
{
    string Route { get; }
    Delegate Execute { get; }
}
