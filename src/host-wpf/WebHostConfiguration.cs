namespace WebHostWPF;

public class WebHostConfiguration
{
    public string SiteUrl { get; set; } = "https://localhost:6457";
    public int HealthCheckRetries { get; set; } = 30;
    public int HealthCheckIntervalMs { get; set; } = 2000;
}