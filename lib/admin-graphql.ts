import { gql } from "@apollo/client";

// ── Queries ───────────────────────────────────────────────────

/**
 * Fetch all users (admin-only resolver needed in Rust backend).
 * Add to user.rs QueryRoot:
 *   async fn admin_users(&self, ctx: &Context<'_>) -> Result<Vec<User>> { ... }
 */
export const ADMIN_GET_USERS = gql`
    query AdminGetUsers {
        adminUsers {
            id
            username
            email
            role
            status
            followerCount
            followingCount
            createdAt
        }
    }
`;

/**
 * Fetch all posts (admin view — ignores visibility).
 * Add to post.rs QueryRoot:
 *   async fn admin_posts(&self, ctx: &Context<'_>) -> Result<Vec<Post>> { ... }
 */
export const ADMIN_GET_POSTS = gql`
    query AdminGetPosts {
        adminPosts {
            id
            userId
            caption
            visibility
            createdAt
        }
    }
`;

/**
 * Fetch all jobs.
 * Reuses existing jobs query — no backend change needed.
 */
export const ADMIN_GET_JOBS = gql`
    query AdminGetJobs {
        jobs {
            id
            title
            companyName
            location
            createdAt
        }
    }
`;

// ── Mutations ─────────────────────────────────────────────────

/**
 * Suspend or reinstate a user.
 * Add to user.rs MutationRoot:
 *   async fn admin_set_user_status(
 *       &self, ctx: &Context<'_>, user_id: Uuid, status: String
 *   ) -> Result<bool> { ... }
 */
export const ADMIN_SUSPEND_USER = gql`
    mutation AdminSuspendUser($userId: UUID!, $status: String!) {
        adminSetUserStatus(userId: $userId, status: $status)
    }
`;

/**
 * Delete any post (admin override — no ownership check).
 * Modify deletePost in post.rs to skip user_id check when role == "admin".
 * OR add a separate adminDeletePost resolver.
 */
export const ADMIN_DELETE_POST = gql`
    mutation AdminDeletePost($postId: UUID!) {
        deletePost(postId: $postId)
    }
`;

/**
 * Delete any job.
 * Reuses existing deleteJob — already requires JWT, add role check in Rust.
 */
export const ADMIN_DELETE_JOB = gql`
    mutation AdminDeleteJob($jobId: UUID!) {
        deleteJob(jobId: $jobId)
    }
`;