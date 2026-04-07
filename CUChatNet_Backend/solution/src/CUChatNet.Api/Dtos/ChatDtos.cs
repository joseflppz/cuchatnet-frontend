namespace CUChatNet.Api.Dtos;

public record CreateDirectChatRequest(long CurrentUserId, long ContactUserId);
public class CreateGroupChatRequest
{
    public long CurrentUserId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? GroupPhoto { get; set; }
    public string? GroupDescription { get; set; }
    public List<long> MemberIds { get; set; } = new List<long>();
}

public record ChatListItemDto(
    long Id,
    long ParticipantId,
    string ParticipantName,
    string? ParticipantPhoto,
    string? ParticipantDescription,
    string? ParticipantStatus,
    string LastMessage,
    DateTime? LastMessageTime,
    int Unread,
    bool Pinned,
    bool Archived,
    bool IsGroup,
    bool Silenced
);

public record GroupMemberDto(long Id, string Name, string Role);

public record GroupDetailDto(
    long Id,
    string Name,
    string? Photo,
    string? Description,
    string? Rules,
    DateTime CreatedAt,
    long CreatorId,
    string SendMessagesPermission,
    string EditInfoPermission,
    List<GroupMemberDto> Members
);

public record UpdateGroupRequest(
    string Name,
    string? Photo,
    string? Description,
    string? Rules,
    string SendMessagesPermission,
    string EditInfoPermission
);
