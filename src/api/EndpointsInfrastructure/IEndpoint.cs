namespace Polygent.EndpointsInfrastructure;

public interface IEndpoint
{
    string Route { get; }
    Delegate Execute { get; }
}
