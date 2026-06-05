import { gql } from "@apollo/client";

export const ADMIN_GET_USERS = gql`
  query AdminUsers {
    adminUsers {
      id
      username
      email
      role
      status
    }
  }
`;

export const ADMIN_GET_POSTS = gql`
  query AdminPosts {
    adminPosts {
      id
      userId
      caption
      visibility
      createdAt
    }
  }
`;

export const ADMIN_GET_JOBS = gql`
  query Jobs {
    jobs {
      id
      title
      companyName
      location
      createdAt
    }
  }
`;

export const ADMIN_SUSPEND_USER = gql`
  mutation SuspendUser($userId: ID!, $status: String!) {
    updateUserStatus(userId: $userId, status: $status) {
      id
      status
    }
  }
`;

export const ADMIN_DELETE_POST = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId)
  }
`;

export const ADMIN_DELETE_JOB = gql`
  mutation DeleteJob($jobId: ID!) {
    deleteJob(jobId: $jobId)
  }
`;