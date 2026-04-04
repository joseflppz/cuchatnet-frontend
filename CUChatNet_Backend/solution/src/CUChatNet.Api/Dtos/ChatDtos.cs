namespace CUChatNet.Api.Dtos;

public record CreateDirectChatRequest(long CurrentUserId, long ContactUserId);
public record CreateGroupChatRequest(long CurrentUserId, string GroupName, string? GroupPhoto, string? GroupDescription, List<long> MemberIds);

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
