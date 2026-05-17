using System.Text.Json.Serialization;

namespace KSeF.Backend.Models.Common;

public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }

    [JsonPropertyName("data")]
    public T? Data { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("error")]
    public object? Error { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(object error, string? message = null) =>
        new() { Success = false, Error = error, Message = message };
}

public static class ApiResponse
{
    public static ApiResponse<object?> Ok(string? message = null) =>
        new() { Success = true, Message = message };

    public static ApiResponse<object?> Fail(object error, string? message = null) =>
        new() { Success = false, Error = error, Message = message };
}
