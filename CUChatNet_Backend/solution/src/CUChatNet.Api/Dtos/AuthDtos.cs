namespace CUChatNet.Api.Dtos;

public record SendVerificationRequest(string Phone);
public record CheckVerificationRequest(string Phone, string Code);

public record SetupProfileRequest(
    string Phone,
    string Name,
    string? Description,
    string? PhotoUrl,
    string Status = "available"
);

public record VerifyResponse(
    bool Success,
    string Message,
    bool UserExists = false,
    object? User = null,
    string? DevelopmentCode = null
);

public record AuthUserDto(
    long Id,
    string Phone,
    string Name,
    string? Photo,
    string? Description,
    string Status,
    DateTime CreatedAt,
    bool Active
);
