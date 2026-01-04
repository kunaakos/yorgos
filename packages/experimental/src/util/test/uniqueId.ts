export const mockUniqueId = (customLabel?: string) => {
    let mockMsgIdIndex = 1
    return () => `${customLabel || 'MOCK_ACTOR_ID'}_${mockMsgIdIndex++}`
}
