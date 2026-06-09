import { gql } from "@apollo/client";

/* ── AUTH ── */
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id username email }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { id username email }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id username email profilePic
      followerCount followingCount role status
    }
  }
`;

/* ── FEED / POSTS ── */
export const FEED_QUERY = gql`
  query Feed($input: FeedInput) {
    feed(input: $input) {
      id caption videoUrl thumbnailUrl
      createdAt visibility likeCount commentCount
      userId
    }
  }
`;

export const USER_POSTS_QUERY = gql`
  query UserPosts($userId: ID!, $input: FeedInput) {
    userPosts(userId: $userId, input: $input) {
      id caption videoUrl thumbnailUrl
      createdAt visibility likeCount commentCount
    }
  }
`;

export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id caption visibility createdAt likeCount commentCount
    }
  }
`;

export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId)
  }
`;

export const LIKE_POST_MUTATION = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) { postId liked likeCount }
  }
`;

export const UNLIKE_POST_MUTATION = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) { postId liked likeCount }
  }
`;

/* ── COMMENTS ── */
export const POST_COMMENTS_QUERY = gql`
  query PostComments($postId: ID!) {
    postComments(postId: $postId) {
      id content userId createdAt
    }
  }
`;

export const COMMENT_REPLIES_QUERY = gql`
  query CommentReplies($parentId: ID!) {
    commentReplies(parentId: $parentId) {
      id content userId createdAt
    }
  }
`;

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) { id content createdAt parentId }
  }
`;

/* ── USERS / FOLLOW ── */
export const SEARCH_USERS_QUERY = gql`
  query SearchUsers($query: String!, $limit: Int) {
    searchUsers(query: $query, limit: $limit) {
      id username followerCount profilePic
    }
  }
`;

export const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id username email profilePic
      followerCount followingCount role status
    }
  }
`;

export const FOLLOW_MUTATION = gql`
  mutation Follow($followingId: ID!) {
    followUser(followingId: $followingId)
  }
`;

export const UNFOLLOW_MUTATION = gql`
  mutation Unfollow($followingId: ID!) {
    unfollowUser(followingId: $followingId)
  }
`;

export const IS_FOLLOWING_QUERY = gql`
  query IsFollowing($targetId: ID!) {
    isFollowing(targetId: $targetId)
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { id username profilePic }
  }
`;

export const UPDATE_DETAIL_MUTATION = gql`
  mutation UpdateDetail($input: UpdateUserDetailInput!) {
    updateUserDetail(input: $input) { userId techStack experience cv }
  }
`;

/* ── JOBS ── */
export const JOBS_QUERY = gql`
  query Jobs($filter: JobFilterInput) {
    jobs(filter: $filter) {
      id title companyName location
      experienceRequired createdAt jobType package
    }
  }
`;

export const JOB_DETAIL_QUERY = gql`
  query Job($id: ID!) {
    job(id: $id) {
      id title companyName location
      experienceRequired createdAt jobType package
      description requirements
    }
  }
`;

export const CREATE_JOB_MUTATION = gql`
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) { id title jobType package }
  }
`;

export const DELETE_JOB_MUTATION = gql`
  mutation DeleteJob($jobId: ID!) {
    deleteJob(jobId: $jobId)
  }
`;

/* ── MESSAGES ── */
export const CONVERSATIONS_QUERY = gql`
  query Conversations {
    conversations {
      id
      conversationType
      unreadCount
      lastMessagePreview
      participants {
        username
        profilePic
      }
    }
  }
`;

export const MESSAGES_QUERY = gql`
  query Messages($input: MessagesInput!) {
    messages(input: $input) {
      id
      senderId
      content
      isDeleted
      createdAt
      messageType
      mediaUrl
    }
  }
`;

export const CREATE_CONVERSATION_MUTATION = gql`
  mutation CreateConversation($input: CreateConversationInput!) {
    createConversation(input: $input) {
      id
      conversationType
      participants {
        username
        profilePic
      }
    }
  }
`;

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      senderId
      content
      isDeleted
      createdAt
      messageType
      mediaUrl
    }
  }
`;

export const MARK_READ_MUTATION = gql`
  mutation MarkRead($conversationId: ID!) {
    markAsRead(conversationId: $conversationId)
  }
`;

export const MESSAGE_RECEIVED_SUBSCRIPTION = gql`
  subscription MessageReceived($conversationId: ID!) {
    messageReceived(conversationId: $conversationId) {
      id
      senderId
      content
      isDeleted
      messageType
      mediaUrl
      createdAt
    }
  }
`;

/* ── ADMIN ── */
export const ADMIN_USERS_QUERY = gql`
  query AdminUsers {
    adminUsers {
      id username email role status createdAt followerCount
    }
  }
`;

export const ADMIN_POSTS_QUERY = gql`
  query AdminPosts {
    adminPosts {
      id userId caption visibility createdAt likeCount commentCount
    }
  }
`;

export const SUSPEND_USER_MUTATION = gql`
  mutation SuspendUser($userId: ID!, $status: String!) {
    updateUserStatus(userId: $userId, status: $status) { id status }
  }
`;